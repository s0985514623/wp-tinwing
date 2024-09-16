<?php
/**
 * Agents Api Register
 */

declare(strict_types=1);

namespace J7\WpTinwing\Api;

use J7\WpTinwing\Plugin;
use J7\WpUtils\Classes\WP;

/**
 * Class Entry
 */
final class Agents {
	use \J7\WpUtils\Traits\SingletonTrait;
	use \J7\WpUtils\Traits\ApiRegisterTrait;

	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_action( 'rest_api_init', [ $this, 'register_api_agents' ] );
	}

	/**
	 * Get APIs
	 *
	 * @return array<int, array{endpoint:string, method:string, permission_callback?:callable}>
	 * - endpoint: string
	 * - method: 'get' | 'post' | 'patch' | 'delete'
	 * - permission_callback : callable
	 */
	protected function get_apis() {
		return [
			[
				'endpoint'            => 'agents',
				'method'              => 'get',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'agents',
				'method'              => 'post',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'agents/(?P<id>\d+)',
				'method'              => 'post',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'agents/(?P<id>\d+)',
				'method'              => 'get',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'agents/(?P<id>\d+)',
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
	public function register_api_agents(): void {
		$this->register_apis(
			apis: $this->get_apis(),
			namespace: Plugin::$kebab,
			default_permission_callback: fn() => \current_user_can( 'manage_options' ),
		);
	}
	/**
	 * Get agents callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 * @phpstan-ignore-next-line
	 */
	public function get_agents_callback( $request ) { // phpcs:ignore
		$params = $request->get_query_params() ?? []; // @phpstan-ignore-line
		$params = WP::sanitize_text_field_deep( $params, false );
		// 查詢 Custom Post Type 'book' 的文章

		/**
		 * @var array{posts_per_page?:string,orderby:string,order:string,meta_query:array<mixed>  } $params
		 */
		$args       = [
			'post_type'      => 'agents',   // 自定義文章類型名稱
			'posts_per_page' => $params['posts_per_page'] ?? 10, // 每頁顯示文章數量
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
				$all_meta     = get_post_meta(get_the_ID());
				$posts_data[] = [
					'id'          => get_the_ID(),
					'created_at'  => strtotime(get_the_date('Y-m-d')),
					'name'        => get_the_title(),
					'contact1'    => $all_meta['contact1'][0]??\null,
					'tel1'        => $all_meta['tel1'][0]??\null,
					'contact2'    => $all_meta['contact2'][0]??\null,
					'tel2'        => $all_meta['tel2'][0]??\null,
					'agentNumber' => $all_meta['agent_number'][0]??\null,
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
	 * Create agents callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_agents_callback( $request ) { // phpcs:ignore
		$params = $request->get_json_params() ?? [];
		$params = WP::sanitize_text_field_deep( $params, false );
		// 創建文章
		$post_id = wp_insert_post(
			[
				'post_type'    => 'agents', // 自定義文章類型名稱
				'post_title'   => $params['name'], // 文章標題
				'post_content' => '', // 文章內容
				'post_status'  => 'publish', // 文章狀態
			]
		);
		if ( is_wp_error( $post_id ) ) {
			return new \WP_Error( 'error_creating_post', 'Unable to create post', [ 'status' => 500 ] );
		}
		// 更新文章的 meta 資料
		update_post_meta($post_id, 'contact1', $params['contact1']);
		update_post_meta($post_id, 'tel1', $params['tel1']);
		update_post_meta($post_id, 'contact2', $params['contact2']);
		update_post_meta($post_id, 'tel2', $params['tel2']);
		update_post_meta($post_id, 'agent_number', $params['agentNumber']);
		$response = new \WP_REST_Response(  $post_id  );
		return $response;
	}
	/**
	 * Update agents callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_agents_with_id_callback( $request ) { // phpcs:ignore
		$params  = $request->get_json_params() ?? [];
		$params  = WP::sanitize_text_field_deep( $params, false );
		$post_id = $request->get_param('id');
		// 更新文章
		$post_id = wp_update_post(
			[
				'ID'           => $post_id,
				'post_title'   => $params['name'], // 文章標題
				'post_content' => '', // 文章內容
				'post_status'  => 'publish', // 文章狀態
			]
		);
		if ( is_wp_error( $post_id ) ) {
			return new \WP_Error( 'error_creating_post', 'Unable to create post', [ 'status' => 500 ] );
		}
		// 更新文章的 meta 資料
		update_post_meta($post_id, 'contact1', $params['contact1']);
		update_post_meta($post_id, 'tel1', $params['tel1']);
		update_post_meta($post_id, 'contact2', $params['contact2']);
		update_post_meta($post_id, 'tel2', $params['tel2']);
		update_post_meta($post_id, 'agent_number', $params['agentNumber']);
		$response = new \WP_REST_Response(  $post_id  );
		return $response;
	}
	/**
	 * Get agents by id callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_agents_with_id_callback( $request ) { // phpcs:ignore
		$post_id = $request->get_param('id');
		$post    = get_post($post_id);
		if ( ! $post ) {
			return new \WP_Error( 'error_post_not_found', 'Post not found', [ 'status' => 404 ] );
		}
		// 獲取文章的所有 meta 資料
		$all_meta = get_post_meta($post_id);

		$response = new \WP_REST_Response(
			[
				'id'          => $post_id,
				'created_at'  => strtotime(get_the_date('Y-m-d', $post_id)),
				'name'        => get_the_title($post_id),
				'contact1'    => $all_meta['contact1'][0]??\null,
				'tel1'        => $all_meta['tel1'][0]??\null,
				'contact2'    => $all_meta['contact2'][0]??\null,
				'tel2'        => $all_meta['tel2'][0]??\null,
				'agentNumber' => $all_meta['agent_number'][0]??\null,
			]
		);
		return $response;
	}
	/**
	 * Delete agents by id callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function delete_agents_with_id_callback( $request ) { // phpcs:ignore
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
