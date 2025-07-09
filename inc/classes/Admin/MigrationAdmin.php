<?php
/**
 * Migration Admin 遷移管理工具
 */

declare(strict_types=1);

namespace J7\WpTinwing\Admin;

/**
 * Migration Admin 遷移管理工具
 */
final class MigrationAdmin {
	use \J7\WpUtils\Traits\SingletonTrait;

	/**
	 * 建構子
	 */
	public function __construct() {
		// 添加管理員選單
		\add_action('admin_menu', [$this, 'add_admin_menu']);
		
		// 處理管理員操作
		\add_action('admin_post_wp_tinwing_migration', [$this, 'handle_admin_action']);
	}

	/**
	 * 添加管理員選單
	 */
	public function add_admin_menu(): void {
		add_management_page(
			'WP Tinwing Migration',
			'WP Tinwing Migration',
			'manage_options',
			'wp-tinwing-migration',
			[$this, 'admin_page']
		);
	}

	/**
	 * 管理員頁面
	 */
	public function admin_page(): void {
		$migration = Migration::instance();
		$stats = $migration->get_migration_stats();
		
		// 檢查是否有個別記錄時間戳需要清理
		$individual_timestamps_count = $this->count_individual_timestamps();
		
		?>
		<div class="wrap">
			<h1>WP Tinwing Migration 管理</h1>
			
			<div class="card">
				<h2>遷移狀態</h2>
				<table class="widefat">
					<tr>
						<th>遷移狀態</th>
						<td><?php echo $stats['is_executed'] ? '✅ 已執行' : '❌ 未執行'; ?></td>
					</tr>
					<?php if (!empty($stats['migration_time'])): ?>
					<tr>
						<th>遷移執行時間</th>
						<td><?php echo $this->format_migration_time($stats['migration_time']); ?></td>
					</tr>
					<tr>
						<th>執行耗時</th>
						<td><?php echo $stats['migration_duration'] ?? 0; ?> 秒</td>
					</tr>
					<?php endif; ?>
					<tr>
						<th>總 Receipt 數量</th>
						<td><?php echo $stats['total_receipts']; ?></td>
					</tr>
					<tr>
						<th>已更新 Debit Notes 數量</th>
						<td><?php echo $stats['updated_debit_notes']; ?></td>
					</tr>
					<tr>
						<th>已更新 Credit Notes 數量</th>
						<td><?php echo $stats['updated_credit_notes']; ?></td>
					</tr>
					<tr>
						<th>已更新 Renewals 數量</th>
						<td><?php echo $stats['updated_renewals']; ?></td>
					</tr>
				</table>
			</div>

			<div class="card">
				<h2>操作</h2>
				<form method="post" action="<?php echo admin_url('admin-post.php'); ?>">
					<?php wp_nonce_field('wp_tinwing_migration_action', 'wp_tinwing_migration_nonce'); ?>
					<input type="hidden" name="action" value="wp_tinwing_migration">
					
					<p>
						<input type="submit" name="manual_execute" class="button button-primary" 
							   value="手動執行遷移" 
							   onclick="return confirm('確定要執行遷移嗎？這將會更新所有相關記錄。');">
					</p>
					
					<p>
						<input type="submit" name="get_stats" class="button" 
							   value="刷新統計">
					</p>
					
					<?php if ($stats['is_executed']): ?>
					<p>
						<input type="submit" name="show_migration_log" class="button" 
							   value="查看遷移日誌">
					</p>
					<?php if ($individual_timestamps_count > 0): ?>
					<p>
						<input type="submit" name="clean_individual_timestamps" class="button" 
							   value="清理個別記錄時間戳 (<?php echo $individual_timestamps_count; ?> 個)"
							   onclick="return confirm('確定要清理個別記錄的時間戳嗎？這將刪除所有 receipt_id_migration_time 欄位。');">
					</p>
					<?php endif; ?>
					<?php endif; ?>
				</form>
			</div>

			<div class="card">
				<h2>遷移說明</h2>
				<p>此遷移會為現有的 debit notes、credit notes 和 renewals 添加 receipt_id 字段，用於反向關聯到對應的 receipt。</p>
				<ul>
					<li>根據 receipt 的 debit_note_id 字段，更新對應的 debit note</li>
					<li>根據 receipt 的 created_from_credit_note_id 字段，更新對應的 credit note</li>
					<li>根據 receipt 的 created_from_renewal_id 字段，更新對應的 renewal</li>
				</ul>
				<p><strong>注意：</strong>遷移只會執行一次，除非手動重新執行。</p>
				<p><strong>時間記錄：</strong>系統會記錄遷移的執行時間和耗時。</p>
			</div>

			<?php if ($stats['is_executed'] && !empty($stats['migration_time'])): ?>
			<div class="card">
				<h2>遷移詳情</h2>
				<p>遷移已於 <strong><?php echo $this->format_migration_time($stats['migration_time']); ?></strong> 執行完成，耗時 <strong><?php echo $stats['migration_duration'] ?? 0; ?> 秒</strong>。</p>
				<p>更新統計：</p>
				<ul>
					<li>Debit Notes: <?php echo $stats['updated_debit_notes']; ?> 個</li>
					<li>Credit Notes: <?php echo $stats['updated_credit_notes']; ?> 個</li>
					<li>Renewals: <?php echo $stats['updated_renewals']; ?> 個</li>
				</ul>
			</div>
			<?php elseif ($stats['is_executed'] && empty($stats['migration_time'])): ?>
			<div class="card">
				<h2>遷移詳情</h2>
				<p>遷移已執行，但缺少詳細時間信息。</p>
				<p>更新統計：</p>
				<ul>
					<li>Debit Notes: <?php echo $stats['updated_debit_notes']; ?> 個</li>
					<li>Credit Notes: <?php echo $stats['updated_credit_notes']; ?> 個</li>
					<li>Renewals: <?php echo $stats['updated_renewals']; ?> 個</li>
				</ul>
			</div>
			<?php endif; ?>

			<?php if (isset($_GET['show_log']) && $_GET['show_log'] === '1'): ?>
			<div class="card">
				<h2>遷移日誌</h2>
				<div style="background: #f0f0f0; padding: 10px; font-family: monospace; max-height: 400px; overflow-y: auto;">
					<?php 
					$log_entries = $this->get_migration_log_entries();
					if (!empty($log_entries)): ?>
						<?php foreach ($log_entries as $entry): ?>
							<div><?php echo esc_html($entry); ?></div>
						<?php endforeach; ?>
					<?php else: ?>
						<p>無法讀取遷移日誌。</p>
					<?php endif; ?>
				</div>
				<p><a href="<?php echo admin_url('tools.php?page=wp-tinwing-migration'); ?>">返回</a></p>
			</div>
			<?php endif; ?>

			<?php if (isset($_GET['message'])): ?>
				<div class="notice notice-success is-dismissible">
					<p><?php echo esc_html($_GET['message']); ?></p>
				</div>
			<?php endif; ?>

			<?php if (isset($_GET['error'])): ?>
				<div class="notice notice-error is-dismissible">
					<p><?php echo esc_html($_GET['error']); ?></p>
				</div>
			<?php endif; ?>
		</div>
		<?php
	}

	/**
	 * 處理管理員操作
	 */
	public function handle_admin_action(): void {
		// 檢查權限
		if (!current_user_can('manage_options')) {
			wp_die('權限不足');
		}

		// 檢查 nonce
		if (!wp_verify_nonce($_POST['wp_tinwing_migration_nonce'], 'wp_tinwing_migration_action')) {
			wp_die('安全驗證失敗');
		}

		$migration = Migration::instance();
		$redirect_url = admin_url('tools.php?page=wp-tinwing-migration');

		try {
			if (isset($_POST['manual_execute'])) {
				// 手動執行遷移
				$migration->manual_execute_migration();
				$redirect_url = add_query_arg('message', '遷移已成功執行', $redirect_url);
			} elseif (isset($_POST['get_stats'])) {
				// 刷新統計
				$redirect_url = add_query_arg('message', '統計已刷新', $redirect_url);
			} elseif (isset($_POST['show_migration_log'])) {
				// 查看遷移日誌
				$redirect_url = add_query_arg('show_log', '1', $redirect_url);
			} elseif (isset($_POST['clean_individual_timestamps'])) {
				// 清理個別記錄時間戳
				$this->clean_individual_timestamps();
				$redirect_url = add_query_arg('message', '個別記錄時間戳已清理', $redirect_url);
			}
		} catch (\Exception $e) {
			$redirect_url = add_query_arg('error', '執行失敗：' . $e->getMessage(), $redirect_url);
		}

		wp_redirect($redirect_url);
		exit;
	}

	/**
	 * 獲取遷移日誌條目
	 */
	private function get_migration_log_entries(): array {
		$log_entries = [];
		
		// 嘗試從 WordPress 錯誤日誌中讀取遷移相關的日誌
		$log_file = ini_get('error_log');
		if (empty($log_file)) {
			$log_file = WP_CONTENT_DIR . '/debug.log';
		}
		
		if (file_exists($log_file) && is_readable($log_file)) {
			$log_content = file_get_contents($log_file);
			$lines = explode("\n", $log_content);
			
			// 過濾出包含 "WP Tinwing Migration" 的日誌行
			foreach ($lines as $line) {
				if (strpos($line, 'WP Tinwing Migration') !== false) {
					$log_entries[] = $line;
				}
			}
			
			// 只保留最近的100條日誌
			$log_entries = array_slice($log_entries, -100);
		}
		
		return $log_entries;
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
			error_log("WP Tinwing Migration: 管理員手動清理了 {$deleted_count} 個個別記錄的時間戳");
		}
	}

	/**
	 * 計算個別記錄時間戳的數量
	 */
	private function count_individual_timestamps(): int {
		global $wpdb;
		
		$count = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_key = %s",
				'receipt_id_migration_time'
			)
		);
		
		return (int) $count;
	}

	/**
	 * 安全地格式化遷移時間
	 */
	private function format_migration_time(?string $time): string {
		if (empty($time)) {
			return '未知時間';
		}
		
		$timestamp = strtotime($time);
		if ($timestamp === false) {
			return '無效時間格式';
		}
		
		return date('Y-m-d H:i:s', $timestamp);
	}
} 