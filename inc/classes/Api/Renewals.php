<?php
/**
 * Renewals Api Register
 */

declare(strict_types=1);

namespace J7\WpTinwing\Api;

use J7\WpTinwing\Plugin;
use J7\WpUtils\Classes\WP;
use J7\WpTinwing\Admin\PostType;

/**
 * Class Entry
 */
final class Renewals {
	use \J7\WpUtils\Traits\SingletonTrait;
	use \J7\WpUtils\Traits\ApiRegisterTrait;

	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_action( 'rest_api_init', [ $this, 'register_api_renewals' ] );
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
				'endpoint'            => 'renewals',
				'method'              => 'get',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'renewals',
				'method'              => 'post',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'renewals/(?P<id>\d+)',
				'method'              => 'post',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'renewals/(?P<id>\d+)',
				'method'              => 'get',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'renewals/(?P<id>\d+)',
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
	public function register_api_renewals(): void {
		$this->register_apis(
			apis: $this->get_apis(),
			namespace: Plugin::$kebab,
			default_permission_callback: fn() => \current_user_can( 'manage_options' ),
		);
	}
	/**
	 * Get renewals callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_renewals_callback( $request ) { // phpcs:ignore
		$params = $request->get_query_params() ?? [];
		$params = WP::sanitize_text_field_deep( $params, false );
		// 查詢 Custom Post Type 'book' 的文章
		$args = [
			'post_type'      => 'renewals',   // 自定義文章類型名稱
			'posts_per_page' => $params['posts_per_page'],       // 每頁顯示文章數量
			'orderby'        => $params['orderby'],   // 排序方式
			'order'          => $params['order'],    // 排序順序（DESC: 新到舊，ASC: 舊到新）
			'meta_query'     => $params['meta_query'],
		];
		ob_start();
		var_dump($args);
		\J7\WpUtils\Classes\log::info('' . ob_get_clean());
		// 如果有date參數，則加入查詢條件
		if (isset($params['date'])) {
			$args['date_query'] = [
				[
					'after'     => date( 'Y-m-d', \intval($params['date'][0])),
					'before'    => date( 'Y-m-d', \intval($params['date'][1])),
					'inclusive' => true,
				],
			];
		}

		$query      = new \WP_Query($args);
		$posts_data = [];
		if ($query->have_posts()) {
			while ($query->have_posts()) {
				$query->the_post();

				// 獲取文章的所有 meta 資料
				$all_meta = get_post_meta(get_the_ID());
				// TODO 還有優化空間如以下POST 方法
				$posts_data[] = [
					'id'                       => get_the_ID(),
					'created_at'               => strtotime(get_the_date('Y-m-d')),
					'date'                     => strtotime(get_the_date('Y-m-d')),
					'note_no'                  => get_the_title(),
					'template'                 => $all_meta['template'][0]??\null,
					'term_id'                  => intval($all_meta['term_id'][0])??\null,
					'agent_id'                 => intval($all_meta['agent_id'][0])??\null,
					'client_id'                => intval($all_meta['client_id'][0])??\null,
					'insurer_id'               => intval($all_meta['insurer_id'][0])??\null,
					'policy_no'                => $all_meta['policy_no'][0]??\null,
					'name_of_insured'          => $all_meta['name_of_insured'][0]??\null,
					'sum_insured'              => $all_meta['sum_insured'][0]??\null,
					'period_of_insurance_from' => $all_meta['period_of_insurance_from'][0]??\null,
					'period_of_insurance_to'   => $all_meta['period_of_insurance_to'][0]??\null,
					'insured_premises'         => $all_meta['insured_premises'][0]??\null,
					'motor_attr'               => $all_meta['motor_attr'][0]?json_decode($all_meta['motor_attr'][0]):\null,
					'premium'                  => intval($all_meta['premium'][0])??\null,
					'less'                     => floatval($all_meta['less'][0])??\null,
					'levy'                     => floatval($all_meta['levy'][0])??\null,
					'agent_fee'                => $all_meta['agent_fee'][0]??\null,
					'insurer_fee_percent'      => $all_meta['insurer_fee_percent'][0]??\null,
					'short_terms_content'      => $all_meta['short_terms_content'][0]??\null,
					'particulars'              => $all_meta['particulars'][0]??\null,
					'motor_engine_no'          => $all_meta['motor_engine_no'][0]??\null,
					'chassi'                   => $all_meta['chassi'][0]??\null,
					'remark'                   => $all_meta['remark'][0]??\null,
					'extra_field'              => $all_meta['extra_field'][0]?json_decode($all_meta['extra_field'][0]):\null,
					'extra_field2'             => $all_meta['extra_field2'][0]?json_decode($all_meta['extra_field2'][0]):\null,
					'is_archived'              => filter_var($all_meta['is_archived'][0], FILTER_VALIDATE_BOOLEAN)??\false,
					'package_content'          => $all_meta['package_content'][0]??\null,
					'debit_note_id'            => $all_meta['debit_note_id'][0]??\null,
					'created_from_renewal_id'  => $all_meta['created_from_renewal_id'][0]??\null,
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
	 * Create renewals callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_renewals_callback( $request ) { // phpcs:ignore
		$params = $request->get_json_params() ?? [];
		$params = WP::sanitize_text_field_deep( $params, false );
		// 創建文章
		$post_id = wp_insert_post(
			[
				'post_type'    => 'renewals', // 自定義文章類型名稱
				'post_title'   => $params['note_no'], // 文章標題
				'post_content' => '', // 文章內容
				'post_status'  => 'publish', // 文章狀態
			]
		);
		if ( is_wp_error( $post_id ) ) {
			return new \WP_Error( 'error_creating_post', 'Unable to create post', [ 'status' => 500 ] );
		}
		// 更新文章的 meta 資料
		foreach (PostType\Renewals::instance()->get_meta() as $key => $value) {
			if (isset($params[ $key ])) {
				update_post_meta($post_id, $key, $params[ $key ]);
			}
		}
		$response = new \WP_REST_Response(  $post_id  );
		return $response;
	}
	/**
	 * Update renewals callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_renewals_with_id_callback( $request ) { // phpcs:ignore
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
		foreach (PostType\Renewals::instance()->get_meta() as $key => $value) {
			if (isset($params[ $key ])) {
				update_post_meta($post_id, $key, $params[ $key ]);
			}
		}
		$response = new \WP_REST_Response(  $post_id  );
		return $response;
	}
	/**
	 * Get renewals by id callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_renewals_with_id_callback( $request ) { // phpcs:ignore
		$post_id = $request->get_param('id');
		// $post = get_post($post_id);
		$args  = [
			'post_type' => 'renewals',  // 指定自定义文章类型
			'p'         => $post_id,               // 文章 ID
		];
		$query = new \WP_Query( $args );
		if ( $query->have_posts() ) {
			while ( $query->have_posts() ) {
				$query->the_post();
				$all_meta = get_post_meta($post_id);
				$response = new \WP_REST_Response(
					[
						'id'                       => $post_id,
						'created_at'               => strtotime(get_the_date('Y-m-d', $post_id)),
						'date'                     => strtotime(get_the_date('Y-m-d', $post_id)),
						'note_no'                  => get_the_title($post_id),
						'template'                 => $all_meta['template'][0]??\null,
						'term_id'                  => intval($all_meta['term_id'][0])??\null,
						'agent_id'                 => intval($all_meta['agent_id'][0])??\null,
						'client_id'                => intval($all_meta['client_id'][0])??\null,
						'insurer_id'               => intval($all_meta['insurer_id'][0])??\null,
						'policy_no'                => $all_meta['policy_no'][0]??\null,
						'name_of_insured'          => $all_meta['name_of_insured'][0]??\null,
						'sum_insured'              => $all_meta['sum_insured'][0]??\null,
						'period_of_insurance_from' => $all_meta['period_of_insurance_from'][0]??\null,
						'period_of_insurance_to'   => $all_meta['period_of_insurance_to'][0]??\null,
						'insured_premises'         => $all_meta['insured_premises'][0]??\null,
						'motor_attr'               => $all_meta['motor_attr'][0]?json_decode($all_meta['motor_attr'][0]):\null,
						'premium'                  => intval($all_meta['premium'][0])??\null,
						'less'                     => floatval($all_meta['less'][0])??\null,
						'levy'                     => floatval($all_meta['levy'][0])??\null,
						'agent_fee'                => $all_meta['agent_fee'][0]??\null,
						'insurer_fee_percent'      => $all_meta['insurer_fee_percent'][0]??\null,
						'short_terms_content'      => $all_meta['short_terms_content'][0]??\null,
						'particulars'              => $all_meta['particulars'][0]??\null,
						'motor_engine_no'          => $all_meta['motor_engine_no'][0]??\null,
						'chassi'                   => $all_meta['chassi'][0]??\null,
						'remark'                   => $all_meta['remark'][0]??\null,
						'extra_field'              => $all_meta['extra_field'][0]?json_decode($all_meta['extra_field'][0]):\null,
						'extra_field2'             => $all_meta['extra_field2'][0]?json_decode($all_meta['extra_field2'][0]):\null,
						'is_archived'              => filter_var($all_meta['is_archived'][0], FILTER_VALIDATE_BOOLEAN)??\false,
						'package_content'          => $all_meta['package_content'][0]??\null,
						'debit_note_id'            => $all_meta['debit_note_id'][0]??\null,
						'created_from_renewal_id'  => $all_meta['created_from_renewal_id'][0]??\null,
					]
				);
				return $response;
			}
			wp_reset_postdata();
		} else {
			return new \WP_Error( 'error_post_not_found', 'Post not found', [ 'status' => 404 ] );
		}
		// // 獲取文章的所有 meta 資料
		// $all_meta = get_post_meta($post_id);
		// // TODO 還有優化空間如以上POST 方法
		// $response = new \WP_REST_Response(
		// [
		// 'id'                       => $post_id,
		// 'created_at'               => strtotime(get_the_date('Y-m-d', $post_id)),
		// 'date'                     => strtotime(get_the_date('Y-m-d', $post_id)),
		// 'note_no'                  => get_the_title($post_id),
		// 'template'                 => $all_meta['template'][0]??\null,
		// 'term_id'                  => intval($all_meta['term_id'][0])??\null,
		// 'agent_id'                 => intval($all_meta['agent_id'][0])??\null,
		// 'client_id'                => intval($all_meta['client_id'][0])??\null,
		// 'insurer_id'               => intval($all_meta['insurer_id'][0])??\null,
		// 'policy_no'                => $all_meta['policy_no'][0]??\null,
		// 'name_of_insured'          => $all_meta['name_of_insured'][0]??\null,
		// 'sum_insured'              => $all_meta['sum_insured'][0]??\null,
		// 'period_of_insurance_from' => $all_meta['period_of_insurance_from'][0]??\null,
		// 'period_of_insurance_to'   => $all_meta['period_of_insurance_to'][0]??\null,
		// 'insured_premises'         => $all_meta['insured_premises'][0]??\null,
		// 'motor_attr'               => $all_meta['motor_attr'][0]?json_decode($all_meta['motor_attr'][0]):\null,
		// 'premium'                  => intval($all_meta['premium'][0])??\null,
		// 'less'                     => floatval($all_meta['less'][0])??\null,
		// 'levy'                     => floatval($all_meta['levy'][0])??\null,
		// 'agent_fee'                => $all_meta['agent_fee'][0]??\null,
		// 'insurer_fee_percent'      => $all_meta['insurer_fee_percent'][0]??\null,
		// 'short_terms_content'      => $all_meta['short_terms_content'][0]??\null,
		// 'particulars'              => $all_meta['particulars'][0]??\null,
		// 'motor_engine_no'          => $all_meta['motor_engine_no'][0]??\null,
		// 'chassi'                   => $all_meta['chassi'][0]??\null,
		// 'remark'                   => $all_meta['remark'][0]??\null,
		// 'extra_field'              => $all_meta['extra_field'][0]?json_decode($all_meta['extra_field'][0]):\null,
		// 'extra_field2'             => $all_meta['extra_field2'][0]?json_decode($all_meta['extra_field2'][0]):\null,
		// 'is_archived'              => filter_var($all_meta['is_archived'][0], FILTER_VALIDATE_BOOLEAN)??\false,
		// 'package_content'          => $all_meta['package_content'][0]??\null,
		// 'debit_note_id'            => $all_meta['debit_note_id'][0]??\null,
		// 'created_from_renewal_id'  => $all_meta['created_from_renewal_id'][0]??\null,
		// ]
		// );
		// return $response;
	}
	/**
	 * Delete renewals by id callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function delete_renewals_with_id_callback( $request ) { // phpcs:ignore
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
