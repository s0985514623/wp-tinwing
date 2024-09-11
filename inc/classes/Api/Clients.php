<?php
/**
 * Clients Api Register
 */

declare(strict_types=1);

namespace J7\WpTinwing\Api;

use J7\WpTinwing\Plugin;
use J7\WpUtils\Classes\WP;

/**
 * Class Entry
 */
final class Clients {
	use \J7\WpUtils\Traits\SingletonTrait;
	use \J7\WpUtils\Traits\ApiRegisterTrait;

	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_action( 'rest_api_init', [ $this, 'register_api_clients' ] );
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
				'endpoint'            => 'clients',
				'method'              => 'get',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'clients',
				'method'              => 'post',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'clients/(?P<id>\d+)',
				'method'              => 'post',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'clients/(?P<id>\d+)',
				'method'              => 'get',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'clients/(?P<id>\d+)',
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
	public function register_api_clients(): void {
		$this->register_apis(
			apis: $this->get_apis(),
			namespace: Plugin::$kebab,
			default_permission_callback: fn() => \current_user_can( 'manage_options' ),
		);
	}
	/**
	 * Get clients callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_clients_callback( $request ) { // phpcs:ignore
		$params = $request->get_query_params() ?? [];
		$params = WP::sanitize_text_field_deep( $params, false );
		// 查詢 Custom Post Type 'book' 的文章
		$args       = [
			'post_type'      => 'clients',   // 自定義文章類型名稱
			'posts_per_page' => $params['posts_per_page'],       // 每頁顯示文章數量
			'orderby'        => $params['orderby'],   // 排序方式
			'order'          => $params['order'],    // 排序順序（DESC: 新到舊，ASC: 舊到新）
		];
		$query      = new \WP_Query($args);
		$posts_data = [];
		if ($query->have_posts()) {
			while ($query->have_posts()) {
				$query->the_post();

				// 獲取文章的所有 meta 資料
				$all_meta     = get_post_meta(get_the_ID());
				$posts_data[] = [
					'id'            => get_the_ID(),
					'created_at'    => strtotime(get_the_date('Y-m-d')),
					'clientNumber'  => get_the_title(),
					'nameZh'        => $all_meta['name_zh'][0]??\null,
					'nameEn'        => $all_meta['name_en'][0]??\null,
					'company'       => $all_meta['company'][0]??\null,
					'officeGenLine' => $all_meta['office_gen_line'][0]??\null,
					'directLine'    => $all_meta['direct_line'][0]??\null,
					'mobile1'       => $all_meta['mobile1'][0]??\null,
					'mobile2'       => $all_meta['mobile2'][0]??\null,
					'contact2'      => $all_meta['contact2'][0]??\null,
					'tel2'          => $all_meta['tel2'][0]??\null,
					'contact3'      => $all_meta['contact3'][0]??\null,
					'tel3'          => $all_meta['tel3'][0]??\null,
					'remark'        => $all_meta['remark'][0]??\null,
					'agentId'       => $all_meta['agent_id'][0]??\null,
					'displayName'   => $all_meta['display_name'][0]??\null,
					'addressArr'    => $all_meta['address_arr'][0]?maybe_unserialize($all_meta['address_arr'][0]):\null,
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
	 * Create clients callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_clients_callback( $request ) { // phpcs:ignore
		$params = $request->get_json_params() ?? [];
		$params = WP::sanitize_text_field_deep( $params, false );
		// 創建文章
		$post_id = wp_insert_post(
			[
				'post_type'    => 'clients', // 自定義文章類型名稱
				'post_title'   => $params['clientNumber'], // 文章標題
				'post_content' => '', // 文章內容
				'post_status'  => 'publish', // 文章狀態
			]
		);
		if ( is_wp_error( $post_id ) ) {
			return new \WP_Error( 'error_creating_post', 'Unable to create post', [ 'status' => 500 ] );
		}
		// 更新文章的 meta 資料
		update_post_meta($post_id, 'name_zh', $params['nameZh']);
		update_post_meta($post_id, 'name_en', $params['nameEn']);
		update_post_meta($post_id, 'company', $params['company']);
		update_post_meta($post_id, 'office_gen_line', $params['officeGenLine']);
		update_post_meta($post_id, 'direct_line', $params['directLine']);
		update_post_meta($post_id, 'mobile1', $params['mobile1']);
		update_post_meta($post_id, 'mobile2', $params['mobile2']);
		update_post_meta($post_id, 'contact2', $params['contact2']);
		update_post_meta($post_id, 'tel2', $params['tel2']);
		update_post_meta($post_id, 'contact3', $params['contact3']);
		update_post_meta($post_id, 'tel3', $params['tel3']);
		update_post_meta($post_id, 'remark', $params['remark']);
		update_post_meta($post_id, 'agent_id', $params['agentId']);
		update_post_meta($post_id, 'display_name', $params['displayName']);
		update_post_meta($post_id, 'address_arr', $params['addressArr']);
		$response = new \WP_REST_Response(  $post_id  );
		return $response;
	}
	/**
	 * Update clients callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_clients_with_id_callback( $request ) { // phpcs:ignore
		$params  = $request->get_json_params() ?? [];
		$params  = WP::sanitize_text_field_deep( $params, false );
		$post_id = $request->get_param('id');

		// 更新文章
		$post_id = wp_update_post(
			[
				'ID'           => $post_id,
				'post_title'   => $params['clientNumber'], // 文章標題
				'post_content' => '', // 文章內容
				'post_status'  => 'publish', // 文章狀態
			]
		);
		if ( is_wp_error( $post_id ) ) {
			return new \WP_Error( 'error_creating_post', 'Unable to create post', [ 'status' => 500 ] );
		}
		// 更新文章的 meta 資料
		update_post_meta($post_id, 'name_zh', $params['nameZh']);
		update_post_meta($post_id, 'name_en', $params['nameEn']);
		update_post_meta($post_id, 'company', $params['company']);
		update_post_meta($post_id, 'office_gen_line', $params['officeGenLine']);
		update_post_meta($post_id, 'direct_line', $params['directLine']);
		update_post_meta($post_id, 'mobile1', $params['mobile1']);
		update_post_meta($post_id, 'mobile2', $params['mobile2']);
		update_post_meta($post_id, 'contact2', $params['contact2']);
		update_post_meta($post_id, 'tel2', $params['tel2']);
		update_post_meta($post_id, 'contact3', $params['contact3']);
		update_post_meta($post_id, 'tel3', $params['tel3']);
		update_post_meta($post_id, 'remark', $params['remark']);
		update_post_meta($post_id, 'agent_id', $params['agentId']);
		update_post_meta($post_id, 'display_name', $params['displayName']);
		update_post_meta($post_id, 'address_arr', $params['addressArr']);
		$response = new \WP_REST_Response(  $post_id  );
		return $response;
	}
	/**
	 * Get clients by id callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_clients_with_id_callback( $request ) { // phpcs:ignore
		$post_id = $request->get_param('id');
		$post    = get_post($post_id);
		if ( ! $post ) {
			return new \WP_Error( 'error_post_not_found', 'Post not found', [ 'status' => 404 ] );
		}
		// 獲取文章的所有 meta 資料
		$all_meta = get_post_meta($post_id);

		$response = new \WP_REST_Response(
			[
				'id'            => $post_id,
				'created_at'    => strtotime(get_the_date('Y-m-d', $post_id)),
				'clientNumber'  => get_the_title($post_id),
				'nameZh'        => $all_meta['name_zh'][0]??\null,
				'nameEn'        => $all_meta['name_en'][0]??\null,
				'company'       => $all_meta['company'][0]??\null,
				'officeGenLine' => $all_meta['office_gen_line'][0]??\null,
				'directLine'    => $all_meta['direct_line'][0]??\null,
				'mobile1'       => $all_meta['mobile1'][0]??\null,
				'mobile2'       => $all_meta['mobile2'][0]??\null,
				'contact2'      => $all_meta['contact2'][0]??\null,
				'tel2'          => $all_meta['tel2'][0]??\null,
				'contact3'      => $all_meta['contact3'][0]??\null,
				'tel3'          => $all_meta['tel3'][0]??\null,
				'remark'        => $all_meta['remark'][0]??\null,
				'agentId'       => $all_meta['agent_id'][0]??\null,
				'displayName'   => $all_meta['display_name'][0]??\null,
				'addressArr'    => $all_meta['address_arr'][0]?\maybe_unserialize($all_meta['address_arr'][0]):\null,
			]
		);
		return $response;
	}
	/**
	 * Delete clients by id callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function delete_clients_with_id_callback( $request ) { // phpcs:ignore
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
