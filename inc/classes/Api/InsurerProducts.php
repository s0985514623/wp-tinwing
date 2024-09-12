<?php
/**
 * InsurerProducts Api Register
 */

declare(strict_types=1);

namespace J7\WpTinwing\Api;

use J7\WpTinwing\Plugin;
use J7\WpUtils\Classes\WP;
use J7\WpTinwing\Admin\PostType;

/**
 * Class Entry
 */
final class InsurerProducts {
	use \J7\WpUtils\Traits\SingletonTrait;
	use \J7\WpUtils\Traits\ApiRegisterTrait;

	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_action( 'rest_api_init', [ $this, 'register_api_insurer_products' ] );
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
				'endpoint'            => 'insurer_products',
				'method'              => 'get',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'insurer_products',
				'method'              => 'post',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'insurer_products/(?P<id>\d+)',
				'method'              => 'post',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'insurer_products/(?P<id>\d+)',
				'method'              => 'get',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'insurer_products/(?P<id>\d+)',
				'method'              => 'delete',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
		];
	}

	/**
	 * Register products API
	 *
	 * @return void
	 */
	public function register_api_insurer_products(): void {
		$this->register_apis(
			apis: $this->get_apis(),
			namespace: Plugin::$kebab,
			default_permission_callback: fn() => \current_user_can( 'manage_options' ),
		);
	}
	/**
	 * Get insurer_products callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_insurer_products_callback( $request ) { // phpcs:ignore
		$params = $request->get_query_params() ?? [];
		$params = WP::sanitize_text_field_deep( $params, false );
		// 查詢 Custom Post Type 'book' 的文章
		$args       = [
			'post_type'      => 'insurer_products',   // 自定義文章類型名稱
			'posts_per_page' => $params['posts_per_page'],       // 每頁顯示文章數量
			'orderby'        => $params['orderby'],   // 排序方式
			'order'          => $params['order'],    // 排序順序（DESC: 新到舊，ASC: 舊到新）
			'meta_query'     => $params['meta_query'], // meta 查詢
		];
		$query      = new \WP_Query($args);
		$posts_data = [];
		if ($query->have_posts()) {
			while ($query->have_posts()) {
				$query->the_post();

				// 獲取文章的所有 meta 資料
				$all_meta = get_post_meta(get_the_ID());
				// TODO 還有優化空間如以下POST 方法
				$posts_data[] = [
					'id'                      => get_the_ID(),
					'created_at'              => strtotime(get_the_date('Y-m-d')),
					'name'                    => get_the_title(),
					'term_id'                 => intval($all_meta['term_id'][0])??\null,
					'insurance_amount'        => intval($all_meta['insurance_amount'][0])??\null,
					'policy_no'               => $all_meta['policy_no'][0]??\null,
					'insurer_products_number' => $all_meta['insurer_products_number'][0]??\null,
					'remark'                  => $all_meta['remark'][0]??\null,
					'insurer_id'              => intval($all_meta['insurer_id'][0])??\null,
				];
			}
			wp_reset_postdata();
		}
		$response = new \WP_REST_Response(  $posts_data  );

		// Set pagination in header.
		// $response->header( 'X-WP-Total', $total );
		// $response->header( 'X-WP-TotalPages', $total_pages );

		return $response;
	}
	/**
	 * Create insurer_products callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_insurer_products_callback( $request ) { // phpcs:ignore
		$params = $request->get_json_params() ?? [];
		$params = WP::sanitize_text_field_deep( $params, false );
		// 創建文章
		$post_id = wp_insert_post(
			[
				'post_type'    => 'insurer_products', // 自定義文章類型名稱
				'post_title'   => $params['note_no'], // 文章標題
				'post_content' => '', // 文章內容
				'post_status'  => 'publish', // 文章狀態
			]
		);
		if ( is_wp_error( $post_id ) ) {
			return new \WP_Error( 'error_creating_post', 'Unable to create post', [ 'status' => 500 ] );
		}
		// 更新文章的 meta 資料
		foreach (PostType\InsurerProducts::instance()->get_meta() as $key => $value) {
			if (isset($params[ $key ])) {
				update_post_meta($post_id, $key, $params[ $key ]);
			}
		}
		$response = new \WP_REST_Response(  $post_id  );
		return $response;
	}
	/**
	 * Update insurer_products callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_insurer_products_with_id_callback( $request ) { // phpcs:ignore
		$params     = $request->get_json_params() ?? [];
		$params     = WP::sanitize_text_field_deep( $params, false );
		$post_id    = $request->get_param('id');
		$post_title = isset($params['note_no'])?$params['note_no']:\get_the_title($post_id);
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
		foreach (PostType\InsurerProducts::instance()->get_meta() as $key => $value) {
			if (isset($params[ $key ])) {
				update_post_meta($post_id, $key, $params[ $key ]);
			}
		}
		$response = new \WP_REST_Response(  $post_id  );
		return $response;
	}
	/**
	 * Get insurer_products by id callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_insurer_products_with_id_callback( $request ) { // phpcs:ignore
		$post_id = $request->get_param('id');
		$post    = get_post($post_id);
		if ( ! $post ) {
			return new \WP_Error( 'error_post_not_found', 'Post not found', [ 'status' => 404 ] );
		}
		// 獲取文章的所有 meta 資料
		$all_meta = get_post_meta($post_id);
		// TODO 還有優化空間如以上POST 方法
		$response = new \WP_REST_Response(
			[
				'id'                      => get_the_ID(),
				'created_at'              => strtotime(get_the_date('Y-m-d')),
				'name'                    => get_the_title(),
				'term_id'                 => intval($all_meta['term_id'][0])??\null,
				'insurance_amount'        => intval($all_meta['insurance_amount'][0])??\null,
				'policy_no'               => $all_meta['policy_no'][0]??\null,
				'insurer_products_number' => $all_meta['insurer_products_number'][0]??\null,
				'remark'                  => $all_meta['remark'][0]??\null,
				'insurer_id'              => intval($all_meta['insurer_id'][0])??\null,
			]
		);
		return $response;
	}
	/**
	 * Delete insurer_products by id callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function delete_insurer_products_with_id_callback( $request ) { // phpcs:ignore
		$post_id = $request->get_param('id');
		// 刪除文章
		$result = wp_delete_post($post_id, true);
		if ( ! $result ) {
			return new \WP_Error( 'error_post_not_found', 'Post not found', [ 'status' => 404 ] );
		}
		$response = new \WP_REST_Response(  $result  );
		return $response;
	}
}
