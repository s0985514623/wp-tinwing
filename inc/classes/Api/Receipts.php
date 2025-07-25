<?php
/**
 * Receipts Api Register
 */

declare(strict_types=1);

namespace J7\WpTinwing\Api;

use J7\WpTinwing\Plugin;
use J7\WpUtils\Classes\WP;
use J7\WpTinwing\Admin\PostType;
use J7\WpTinwing\Utils\Base;
// use J7\WpUtils\Classes\Log;

/**
 * Class Entry
 */
final class Receipts {
	use \J7\WpUtils\Traits\SingletonTrait;
	use \J7\WpUtils\Traits\ApiRegisterTrait;

	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_action( 'rest_api_init', [ $this, 'register_api_receipts' ] );
	}

	/**
	 * Get APIs
	 *
	 * @return array
	 * - endpoint: string
	 * - method: 'get' | 'post' | 'patch' | 'delete'
	 * - permission_callback : callable
	 */
	protected function get_apis() {
		return [
			[
				'endpoint'            => 'receipts',
				'method'              => 'get',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'receipts',
				'method'              => 'post',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'receipts/(?P<id>\d+)',
				'method'              => 'post',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'receipts/(?P<id>\d+)',
				'method'              => 'get',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'receipts/(?P<id>\d+)',
				'method'              => 'delete',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'receipts_bulk_edit',
				'method'              => 'post',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
		];
	}

	/**
	 * Register products API
	 *
	 * @return void
	 */
	public function register_api_receipts(): void {
		$this->register_apis(
			apis: $this->get_apis(),
			namespace: Plugin::$kebab,
			default_permission_callback: fn() => \current_user_can( 'manage_options' ),
		);
	}
	/**
	 * Get receipts callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_receipts_callback( $request ) { // phpcs:ignore
		$params = $request->get_query_params() ?? [];
		$params = WP::sanitize_text_field_deep( $params, false );
		// 查詢 Custom Post Type 'receipts' 的文章
		$args = [
			'post_type'      => 'receipts',   // 自定義文章類型名稱
			'posts_per_page' => isset($params['posts_per_page'])?$params['posts_per_page']:-1,       // 每頁顯示文章數量
			'paged'          => isset($params['page'])?$params['page']:1,       // 當前頁碼
			'orderby'        => isset($params['orderby'])?$params['orderby']:'id',   // 排序方式
			'order'          => isset($params['order'])?$params['order']:'desc',    // 排序順序（DESC: 新到舊，ASC: 舊到新）
		];
		// 如果有meta_key 參數，則加入查詢條件
		if (isset($params['meta_key'])) {
			$args['meta_key'] = $params['meta_key'];
		}
		// 如果有meta_query 參數，則加入查詢條件
		if (isset($params['meta_query'])) {
			$meta_query         = Base::sanitize_meta_query($params['meta_query']);
			$args['meta_query'] = $meta_query;
		}
		// 如果有date參數，則加入查詢條件
		if (isset($params['date'])) {
			// 加入時區設定

			// 獲取 WordPress 設定的時區
			$wp_timezone = wp_timezone(); // 取得 WP 設定的時區 (PHP DateTimeZone 物件)
			// 解析傳入的 GMT 日期時間
			$after_datetime = new \DateTime('@'.$params['date'][0]);
			// 轉換為 WordPress 設定的時區
			$after_datetime->setTimezone($wp_timezone);
			// 格式化為 WP_Query 可用的格式
			$after_datetime_string = $after_datetime->format('Y-m-d');
			// 解析傳入的 GMT 日期時間
			$before_datetime = new \DateTime('@'.$params['date'][1]);
			// 轉換為 WordPress 設定的時區
			$before_datetime->setTimezone($wp_timezone);
			// 格式化為 WP_Query 可用的格式
			$before_datetime_string = $before_datetime->format('Y-m-d');

			$args['date_query'] = [
				[
					'after'     =>$after_datetime_string,
					'before'    => $before_datetime_string,
					'inclusive' => true,
				],
			];
		}
		// 如果有id參數，則加入查詢條件(取得多筆文章)
		if (isset($params['id'])) {
			$args['post__in'] = $params['id'];
		}
		// error_log(print_r($args, true));
		$query      = new \WP_Query($args);
		$posts_data = [];
		if ($query->have_posts()) {
			while ($query->have_posts()) {
				$query->the_post();

				// 獲取文章的所有 meta 資料
				$all_meta = get_post_meta(get_the_ID(), '', true);
				$all_meta = Base::sanitize_post_meta_array($all_meta);

				$posts_data[] = [
					'id'         => get_the_ID(),
					'created_at' => strtotime(get_the_date('Y-m-d')),
					'receipt_no' => html_entity_decode(get_the_title()),
				];
				// 取得最後一個索引 (即剛剛推入的那個項目)
				$last_index = count($posts_data) - 1;
				// 整理 meta 資料
				foreach (PostType\Receipts::instance()->get_meta() as $key => $value) {
					if (isset($all_meta[ $key ])) {
						if ('integer'==$value['meta_type']) {
							$posts_data[ $last_index ][ $key ] = intval($all_meta[ $key ]);

						} elseif ('boolean'==$value['meta_type']) {
							$posts_data[ $last_index ][ $key ] = filter_var($all_meta[ $key ], FILTER_VALIDATE_BOOLEAN);

						} elseif ('object'==$value['meta_type']) {
							$posts_data[ $last_index ][ $key ] = \maybe_unserialize($all_meta[ $key ]);
						} else {
							$posts_data[ $last_index ][ $key ] = $all_meta[ $key ];
						}
					}
				}
			}
			wp_reset_postdata();
		}
		// Log::debug(print_r($posts_data, true));
		$response = new \WP_REST_Response(  $posts_data  );

		// Set pagination in header.
		$response->header( 'X-WP-Total', $query->found_posts );
		// $response->header( 'X-WP-TotalPages', $total_pages );

		return $response;
	}
	/**
	 * Create receipts callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_receipts_callback( $request ) { // phpcs:ignore
		$params         = $request->get_json_params() ?? [];
		$params         = WP::sanitize_text_field_deep( $params, false );

		// 檢查 post_title 是否重複
		if (isset($params['receipt_no']) && !empty($params['receipt_no'])) {
			$existing_query = new \WP_Query([
				'post_type' => 'receipts',
				'title' => $params['receipt_no'],
				'posts_per_page' => 1,
				'fields' => 'ids'
			]);
			if ($existing_query->found_posts > 0) {
				return new \WP_Error( 
					'duplicate_note_no', 
					'號碼重複不能使用', 
					[ 'status' => 400 ] 
				);
			}
		}

		$is_credit_note =$params['created_from_credit_note_id'];
		// 檢查是否為空的receipts
		$is_empty = empty($params['debit_note_id'])&&empty($params['created_from_renewal_id']);
		// 如果為空，則同步創建一個新的debit_note=>這邊是為了先創建receipts時，沒有debit_note_id，但是後續會有debit_note_id的情況，但是避開為credit_note的情況
		if ($is_empty && !$is_credit_note) {
			$debit_note_id = wp_insert_post(
				[
					'post_type'    => 'debit_notes', // 自定義文章類型名稱
					'post_title'   => $params['receipt_no'], // 文章標題
					'post_content' => '', // 文章內容
					'post_status'  => 'publish', // 文章狀態
				]
			);
			if ( is_wp_error( $debit_note_id ) ) {
				return new \WP_Error( 'error_creating_post_debit_notes', 'Unable to create post', [ 'status' => 500 ] );
			}
			update_post_meta($debit_note_id, 'is_archived', $params['is_archived']);
			update_post_meta($debit_note_id, 'premium', $params['premium']);
			// 預設時間範圍為創建當下+1年
			update_post_meta($debit_note_id, 'period_of_insurance_from', strtotime('now'));
			update_post_meta($debit_note_id, 'period_of_insurance_to', strtotime('+1 year'));

			$params['debit_note_id'] = $debit_note_id;
		}
		// 創建文章
		$post_id = wp_insert_post(
			[
				'post_type'    => 'receipts', // 自定義文章類型名稱
				'post_title'   => $params['receipt_no'], // 文章標題
				'post_content' => '', // 文章內容
				'post_status'  => 'publish', // 文章狀態
			]
		);
		if ( is_wp_error( $post_id ) ) {
			return new \WP_Error( 'error_creating_post', 'Unable to create post', [ 'status' => 500 ] );
		}
		//創建成功後根據debit_note_id或renewal_id更新debit_note 或renewal的receipt_id 或credit_note的receipt_id
		if($params['debit_note_id']&& empty($params['created_from_renewal_id'])){
			update_post_meta($params['debit_note_id'], 'receipt_id', $post_id);
		}
		if($params['created_from_renewal_id']){
			update_post_meta($params['created_from_renewal_id'], 'receipt_id', $post_id);
		}
		if($params['created_from_credit_note_id']){
			update_post_meta($params['created_from_credit_note_id'], 'receipt_id', $post_id);
		}
		// 更新文章的 meta 資料
		foreach (PostType\Receipts::instance()->get_meta() as $key => $value) {
			if (isset($params[ $key ])) {
				update_post_meta($post_id, $key, $params[ $key ]);
			}
		}
		$response = new \WP_REST_Response(  $post_id  );
		return $response;
	}
	/**
	 * Update receipts callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_receipts_with_id_callback( $request ) { // phpcs:ignore
		$params     = $request->get_json_params() ?? [];
		$params     = WP::sanitize_text_field_deep( $params, false );
		$post_id    = $request->get_param('id');
		$post_title = isset($params['receipt_no'])?$params['receipt_no']:\get_the_title($post_id);

		// 檢查 post_title 是否重複（排除當前正在更新的文章）
		if (isset($params['receipt_no']) && !empty($params['receipt_no'])) {
			$existing_query = new \WP_Query([
				'post_type' => 'receipts',
				'title' => $params['receipt_no'],
				'posts_per_page' => 1,
				'fields' => 'ids',
				'post__not_in' => [$post_id]
			]);
			if ($existing_query->found_posts > 0) {
				return new \WP_Error( 
					'duplicate_note_no', 
					'號碼重複不能使用', 
					[ 'status' => 400 ] 
				);
			}
		}
		// 更新文章
		$post_id = wp_update_post(
			[
				'ID'           => $post_id,
				'post_title'   => $post_title, // 文章標題
				'post_content' => '', // 文章內容
				'post_status'  => 'publish', // 文章狀態
			]
		);
		if ( is_wp_error( $post_id ) ) {
			return new \WP_Error( 'error_creating_post', 'Unable to create post', [ 'status' => 500 ] );
		}
		// 更新文章的 meta 資料
		foreach (PostType\Receipts::instance()->get_meta() as $key => $value) {
			if (isset($params[ $key ])) {
				update_post_meta($post_id, $key, $params[ $key ]);
			}
		}
		$response = new \WP_REST_Response(  $post_id  );
		return $response;
	}
	/**
	 * Get receipts by id callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_receipts_with_id_callback( $request ) { // phpcs:ignore
		$post_id = $request->get_param('id');
		// $post    = get_post($post_id);
		$args  = [
			'post_type' => 'receipts',  // 指定自定义文章类型
			// 'p'         => $post_id, // 文章 ID
			'post__in'  => [ $post_id ], // 文章 ID
		];
		$query = new \WP_Query( $args );
		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				// 獲取文章的所有 meta 資料
				$all_meta      = get_post_meta($post_id, '', true);
				$all_meta      = Base::sanitize_post_meta_array($all_meta);
				$response_data = [
					'id'         => get_the_ID(),
					'created_at' => strtotime(get_the_date('Y-m-d')),
					'receipt_no' => html_entity_decode(get_the_title()),
				];
				// 整理 meta 資料
				foreach (PostType\Receipts::instance()->get_meta() as $key => $value) {
					if (isset($all_meta[ $key ])) {
						if ('integer'==$value['meta_type']) {
							$response_data[ $key ] = intval($all_meta[ $key ]);

						} elseif ('boolean'==$value['meta_type']) {
							$response_data[ $key ] = filter_var($all_meta[ $key ], FILTER_VALIDATE_BOOLEAN);

						} elseif ('object'==$value['meta_type']) {
							$response_data[ $key ] = \maybe_unserialize($all_meta[ $key ]);
						} else {
							$response_data[ $key ] = $all_meta[ $key ];
						}
					}
				}
				$response = new \WP_REST_Response(
					$response_data
				);
				return $response;
			}
			wp_reset_postdata();
		} else {
			return new \WP_Error( 'error_post_not_found', 'Post not found', [ 'status' => 404 ] );
		}
	}
	/**
	 * Delete receipts by id callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function delete_receipts_with_id_callback( $request ) { // phpcs:ignore
		$post_id = $request->get_param('id');
		// 刪除文章
		$result = wp_delete_post($post_id, true);
		if ( ! $result ) {
			return new \WP_Error( 'error_post_not_found', 'Post not found', [ 'status' => 404 ] );
		}
		$response = new \WP_REST_Response(  $result  );
		return $response;
	}
	/**
	 * Receipts Bulk Edit callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_receipts_bulk_edit_callback( $request ) { // phpcs:ignore
		$params = $request->get_json_params() ?? [];
		$params = WP::sanitize_text_field_deep( $params, false, [ 'is_paid' ] );

		// 更新文章
		$post_ids = $params['ids'];
		foreach ($post_ids as $post_id) {
			// 判斷是否具有該文章
			if (!get_post($post_id)) {
				return new \WP_Error( 'error_post_not_found', 'Post not found', [ 'status' => 404 ] );
			}

			// 更新文章的 meta 資料
			foreach (PostType\Receipts::instance()->get_meta() as $key => $value) {
				if (isset($params[ $key ])) {
					update_post_meta($post_id, $key, $params[ $key ]);
				}
			}
		}
		$response = new \WP_REST_Response(  $post_ids  );
		return $response;
	}
}
