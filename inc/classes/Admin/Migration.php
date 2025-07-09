<?php
/**
 * Migration 遷移類
 */

declare(strict_types=1);

namespace J7\WpTinwing\Admin;

/**
 * Migration 遷移類
 */
final class Migration {
	use \J7\WpUtils\Traits\SingletonTrait;

	/**
	 * 遷移選項名稱
	 */
	private const MIGRATION_OPTION_NAME = 'wp_tinwing_migration_receipt_id_executed';
	
	/**
	 * 遷移時間選項名稱
	 */
	private const MIGRATION_TIME_OPTION_NAME = 'wp_tinwing_migration_receipt_id_time';
	
	/**
	 * 遷移執行時間選項名稱
	 */
	private const MIGRATION_DURATION_OPTION_NAME = 'wp_tinwing_migration_receipt_id_duration';

	/**
	 * 建構子
	 */
	public function __construct() {
		// 在插件啟動時檢查並執行遷移
		\add_action('init', [$this, 'check_and_execute_migration']);
	}

	/**
	 * 檢查並執行遷移
	 */
	public function check_and_execute_migration(): void {
		// 檢查是否已經執行過
		if ($this->is_migration_executed()) {
			return;
		}

		// 執行遷移
		$duration = $this->execute_receipt_id_migration();
		
		// 標記為已執行
		$this->mark_migration_as_executed($duration);
	}

	/**
	 * 檢查遷移是否已執行
	 */
	private function is_migration_executed(): bool {
		return (bool) get_option(self::MIGRATION_OPTION_NAME, false);
	}

	/**
	 * 獲取遷移執行時間
	 */
	private function get_migration_time(): ?string {
		$time = get_option(self::MIGRATION_TIME_OPTION_NAME, null);
		return !empty($time) ? $time : null;
	}

	/**
	 * 獲取遷移執行耗時
	 */
	private function get_migration_duration(): float {
		$duration = get_option(self::MIGRATION_DURATION_OPTION_NAME, 0);
		return is_numeric($duration) ? (float) $duration : 0.0;
	}

	/**
	 * 標記遷移為已執行
	 */
	private function mark_migration_as_executed(float $duration = 0): void {
		$current_time = current_time('mysql');
		
		// 確保時間格式正確
		if (empty($current_time) || strtotime($current_time) === false) {
			$current_time = gmdate('Y-m-d H:i:s');
		}
		
		update_option(self::MIGRATION_OPTION_NAME, true);
		update_option(self::MIGRATION_TIME_OPTION_NAME, $current_time);
		update_option(self::MIGRATION_DURATION_OPTION_NAME, max(0, $duration));
		
		error_log("WP Tinwing Migration: 遷移已標記為完成 - 時間: {$current_time}, 耗時: {$duration} 秒");
	}

	/**
	 * 執行receipt_id遷移
	 */
	private function execute_receipt_id_migration(): float {
		$start_time = microtime(true);
		error_log('WP Tinwing Migration: 開始執行 receipt_id 遷移 - ' . current_time('mysql'));
		
		// 首先在各個post type的meta中添加receipt_id字段
		$this->add_receipt_id_to_meta_definitions();
		
		// 然後更新現有記錄
		$this->update_existing_records_with_receipt_id();
		
		$end_time = microtime(true);
		$execution_time = round($end_time - $start_time, 2);
		error_log('WP Tinwing Migration: 完成 receipt_id 遷移 - ' . current_time('mysql') . ' (耗時: ' . $execution_time . ' 秒)');
		
		return $execution_time;
	}

	/**
	 * 在meta定義中添加receipt_id字段
	 */
	private function add_receipt_id_to_meta_definitions(): void {
		// 這些修改會在下一次類初始化時生效
		// 實際的meta定義修改需要直接修改相關的PostType類
		
		// 清理可能存在的個別記錄時間戳
		$this->clean_individual_timestamps();
	}

	/**
	 * 清理個別記錄的時間戳
	 */
	private function clean_individual_timestamps(): void {
		global $wpdb;
		
		// 清理所有post類型中的receipt_id_migration_time meta
		$deleted_count = $wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->postmeta} WHERE meta_key = %s",
				'receipt_id_migration_time'
			)
		);
		
		if ($deleted_count > 0) {
			error_log("WP Tinwing Migration: 清理了 {$deleted_count} 個個別記錄的時間戳");
		}
	}

	/**
	 * 更新現有記錄，添加receipt_id
	 */
	private function update_existing_records_with_receipt_id(): void {
		// 獲取所有receipts
		$receipts = get_posts([
			'post_type' => 'receipts',
			'posts_per_page' => -1,
			'post_status' => 'any',
		]);

		$total_receipts = count($receipts);
		$processed_count = 0;
		
		error_log("WP Tinwing Migration: 開始處理 {$total_receipts} 個 receipts");

		foreach ($receipts as $receipt) {
			$receipt_id = $receipt->ID;
			$processed_count++;
			
			// 處理debit_note_id關聯
			$debit_note_id = intval(get_post_meta($receipt_id, 'debit_note_id', true));
			if ($debit_note_id) {
				$this->update_record_with_receipt_id('debit_notes', $debit_note_id, $receipt_id);
			}
			
			// 處理credit_note關聯
			$credit_note_id = intval(get_post_meta($receipt_id, 'created_from_credit_note_id', true));
			if ($credit_note_id) {
				$this->update_record_with_receipt_id('credit_notes', $credit_note_id, $receipt_id);
			}
			
			// 處理renewal關聯
			$renewal_id = intval(get_post_meta($receipt_id, 'created_from_renewal_id', true));
			if ($renewal_id) {
				$this->update_record_with_receipt_id('renewals', $renewal_id, $receipt_id);
			}
			
			// 每處理100個記錄記錄一次進度
			if ($processed_count % 100 === 0 || $processed_count === $total_receipts) {
				error_log("WP Tinwing Migration: 已處理 {$processed_count}/{$total_receipts} 個 receipts");
			}
		}
		
		error_log("WP Tinwing Migration: 完成處理所有 receipts");
	}

	/**
	 * 更新特定記錄的receipt_id
	 */
	private function update_record_with_receipt_id(string $post_type, int $post_id, int $receipt_id): void {
		// 檢查記錄是否存在
		$post = get_post($post_id);
		if (!$post || $post->post_type !== $post_type) {
			error_log("WP Tinwing Migration: 跳過不存在的記錄 {$post_type} ID {$post_id}");
			return;
		}

		// 更新receipt_id meta
		update_post_meta($post_id, 'receipt_id', $receipt_id);
		
		// 記錄日誌
		error_log("WP Tinwing Migration: 更新 {$post_type} ID {$post_id} 的 receipt_id 為 {$receipt_id}");
	}

	/**
	 * 手動執行遷移（用於測試或重新執行）
	 */
	public function manual_execute_migration(): void {
		// 重置執行狀態
		delete_option(self::MIGRATION_OPTION_NAME);
		delete_option(self::MIGRATION_TIME_OPTION_NAME);
		delete_option(self::MIGRATION_DURATION_OPTION_NAME);
		
		// 執行遷移
		$this->check_and_execute_migration();
	}

	/**
	 * 獲取遷移統計信息
	 */
	public function get_migration_stats(): array {
		$stats = [
			'is_executed' => $this->is_migration_executed(),
			'migration_time' => $this->get_migration_time() ?: null,
			'migration_duration' => $this->get_migration_duration() ?: 0,
			'total_receipts' => 0,
			'updated_debit_notes' => 0,
			'updated_credit_notes' => 0,
			'updated_renewals' => 0,
		];

		// 統計總數
		$stats['total_receipts'] = wp_count_posts('receipts')->publish ?? 0;
		
		// 統計已更新的記錄
		global $wpdb;
		
		$stats['updated_debit_notes'] = $wpdb->get_var(
			"SELECT COUNT(*) FROM {$wpdb->postmeta} pm 
			 INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID 
			 WHERE pm.meta_key = 'receipt_id' AND p.post_type = 'debit_notes'"
		);
		
		$stats['updated_credit_notes'] = $wpdb->get_var(
			"SELECT COUNT(*) FROM {$wpdb->postmeta} pm 
			 INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID 
			 WHERE pm.meta_key = 'receipt_id' AND p.post_type = 'credit_notes'"
		);
		
		$stats['updated_renewals'] = $wpdb->get_var(
			"SELECT COUNT(*) FROM {$wpdb->postmeta} pm 
			 INNER JOIN {$wpdb->posts} p ON pm.post_id = p.ID 
			 WHERE pm.meta_key = 'receipt_id' AND p.post_type = 'renewals'"
		);

		return $stats;
	}
} 