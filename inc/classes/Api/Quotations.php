<?php
/**
 * Quotations Api Register
 */

declare(strict_types=1);

namespace J7\WpTinwing\Api;

use J7\WpTinwing\Plugin;
use J7\WpUtils\Classes\WP;

/**
 * Class Entry
 */
final class Quotations {
	use \J7\WpUtils\Traits\SingletonTrait;
	use \J7\WpUtils\Traits\ApiRegisterTrait;

	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_action( 'rest_api_init', [ $this, 'register_api_quotations' ] );
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
				'endpoint'            => 'quotations',
				'method'              => 'get',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'quotations',
				'method'              => 'post',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'quotations/(?P<id>\d+)',
				'method'              => 'post',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'quotations/(?P<id>\d+)',
				'method'              => 'get',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			[
				'endpoint'            => 'quotations/(?P<id>\d+)',
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
	public function register_api_quotations(): void {
		// ob_start();
		// var_dump(Plugin::$kebab);
		// \J7\WpUtils\Classes\log::info('' . ob_get_clean());
		$this->register_apis(
			apis: $this->get_apis(),
			namespace: Plugin::$kebab,
			default_permission_callback: fn() => \current_user_can( 'manage_options' ),
		);
	}
	/**
	 * Get quotations callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_quotations_callback( $request ) { // phpcs:ignore
		$params = $request->get_query_params() ?? [];
		$params = WP::sanitize_text_field_deep( $params, false );
		// 查詢 Custom Post Type 'book' 的文章
		$args       = [
			'post_type'      => 'quotations',   // 自定義文章類型名稱
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
					'id'                    => get_the_ID(),
					'created_at'            => strtotime(get_the_date('Y-m-d')),
					'data'                  => strtotime(get_the_date('Y-m-d')),
					'noteNo'                => get_the_title(),
					'template'              => $all_meta['template'][0]??\null,
					'termId'                => intval($all_meta['term_id'][0])??\null,
					'clientId'              => intval($all_meta['client_id'][0])??\null,
					'insurerId'             => intval($all_meta['insurer_id'][0])??\null,
					'policyNo'              => $all_meta['policy_no'][0]??\null,
					'nameOfInsured'         => $all_meta['name_of_insured'][0]??\null,
					'sumInsured'            => $all_meta['sum_insured'][0]??\null,
					'periodOfInsuranceFrom' => $all_meta['period_of_insurance_from'][0]??\null,
					'periodOfInsuranceTo'   => $all_meta['period_of_insurance_to'][0]??\null,
					'insuredPremises'       => $all_meta['insured_premises'][0]??\null,
					'motorAttr'             => $all_meta['motor_attr'][0]?Maybe_unserialize($all_meta['motor_attr'][0]):\null,
					'premium'               => intval($all_meta['premium'][0])??\null,
					'less'                  => floatval($all_meta['less'][0])??\null,
					'levy'                  => floatval($all_meta['levy'][0])??\null,
					'agentFee'              => $all_meta['agent_fee'][0]??\null,
					'insurerFeePercent'     => $all_meta['insurer_fee_percent'][0]??\null,
					'shortTermsContent'     => $all_meta['short_terms_content'][0]??\null,
					'particulars'           => $all_meta['particulars'][0]??\null,
					'motorEngineNo'         => $all_meta['motor_engine_no'][0]??\null,
					'chassi'                => $all_meta['chassi'][0]??\null,
					'remark'                => $all_meta['remark'][0]??\null,
					'extraField'            => $all_meta['extra_field'][0]?Maybe_unserialize($all_meta['extra_field'][0]):\null,
					'extraField2'           => $all_meta['extra_field2'][0]?Maybe_unserialize($all_meta['extra_field2'][0]):\null,
					'isArchived'            => filter_var($all_meta['is_archived'][0], FILTER_VALIDATE_BOOLEAN)??\null,
					'packageContent'        => $all_meta['package_content'][0]??\null,
				];
			}
			wp_reset_postdata();
		}
		$response = new \WP_REST_Response(  $posts_data  );

		// set pagination in header
		// $response->header( 'X-WP-Total', $total );
		// $response->header( 'X-WP-TotalPages', $total_pages );

		return $response;
	}
	/**
	 * Create quotations callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_quotations_callback( $request ) { // phpcs:ignore
		$params = $request->get_json_params() ?? [];
		$params = WP::sanitize_text_field_deep( $params, false );
		// 創建文章
		$post_id = wp_insert_post(
			[
				'post_type'    => 'quotations', // 自定義文章類型名稱
				'post_title'   => $params['noteNo'], // 文章標題
				'post_content' => '', // 文章內容
				'post_status'  => 'publish', // 文章狀態
			]
		);
		if ( is_wp_error( $post_id ) ) {
			return new \WP_Error( 'error_creating_post', 'Unable to create post', [ 'status' => 500 ] );
		}
		// 更新文章的 meta 資料
		update_post_meta($post_id, 'template', $params['template']);
		update_post_meta($post_id, 'term_id', $params['termId']);
		update_post_meta($post_id, 'client_id', $params['clientId']);
		update_post_meta($post_id, 'insurer_id', $params['insurerId']);
		update_post_meta($post_id, 'policy_no', $params['policyNo']);
		update_post_meta($post_id, 'name_of_insured', $params['nameOfInsured']);
		update_post_meta($post_id, 'sum_insured', $params['sumInsured']);
		update_post_meta($post_id, 'period_of_insurance_from', $params['periodOfInsuranceFrom']);
		update_post_meta($post_id, 'period_of_insurance_to', $params['periodOfInsuranceTo']);
		update_post_meta($post_id, 'insured_premises', $params['insuredPremises']);
		update_post_meta($post_id, 'motor_attr', serialize($params['motorAttr']));
		update_post_meta($post_id, 'premium', $params['premium']);
		update_post_meta($post_id, 'less', $params['less']);
		update_post_meta($post_id, 'levy', $params['levy']);
		update_post_meta($post_id, 'agent_fee', $params['agentFee']);
		update_post_meta($post_id, 'insurer_fee_percent', $params['insurerFeePercent']);
		update_post_meta($post_id, 'short_terms_content', $params['shortTermsContent']);
		update_post_meta($post_id, 'particulars', $params['particulars']);
		update_post_meta($post_id, 'motor_engine_no', $params['motorEngineNo']);
		update_post_meta($post_id, 'chassi', $params['chassi']);
		update_post_meta($post_id, 'remark', $params['remark']);
		update_post_meta($post_id, 'extra_field', serialize($params['extraField']));
		update_post_meta($post_id, 'extra_field2', serialize($params['extraField2']));
		update_post_meta($post_id, 'is_archived', $params['isArchived']);
		update_post_meta($post_id, 'package_content', $params['packageContent']);
		$response = new \WP_REST_Response(  $post_id  );
		return $response;
	}
	/**
	 * Update quotations callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_quotations_with_id_callback( $request ) { // phpcs:ignore
		$params  = $request->get_json_params() ?? [];
		$params  = WP::sanitize_text_field_deep( $params, false );
		$post_id = $request->get_param('id');
		// 更新文章
		$post_id = wp_update_post(
			[
				'ID'           => $post_id,
				'post_title'   => $params['noteNo'], // 文章標題
				'post_content' => '', // 文章內容
				'post_status'  => 'publish', // 文章狀態
			]
		);
		if ( is_wp_error( $post_id ) ) {
			return new \WP_Error( 'error_creating_post', 'Unable to create post', [ 'status' => 500 ] );
		}
		// 更新文章的 meta 資料
		update_post_meta($post_id, 'template', $params['template']);
		update_post_meta($post_id, 'term_id', $params['termId']);
		update_post_meta($post_id, 'client_id', $params['clientId']);
		update_post_meta($post_id, 'insurer_id', $params['insurerId']);
		update_post_meta($post_id, 'policy_no', $params['policyNo']);
		update_post_meta($post_id, 'name_of_insured', $params['nameOfInsured']);
		update_post_meta($post_id, 'sum_insured', $params['sumInsured']);
		update_post_meta($post_id, 'period_of_insurance_from', $params['periodOfInsuranceFrom']);
		update_post_meta($post_id, 'period_of_insurance_to', $params['periodOfInsuranceTo']);
		update_post_meta($post_id, 'insured_premises', $params['insuredPremises']);
		update_post_meta($post_id, 'motor_attr', serialize($params['motorAttr']));
		update_post_meta($post_id, 'premium', $params['premium']);
		update_post_meta($post_id, 'less', $params['less']);
		update_post_meta($post_id, 'levy', $params['levy']);
		update_post_meta($post_id, 'agent_fee', $params['agentFee']);
		update_post_meta($post_id, 'insurer_fee_percent', $params['insurerFeePercent']);
		update_post_meta($post_id, 'short_terms_content', $params['shortTermsContent']);
		update_post_meta($post_id, 'particulars', $params['particulars']);
		update_post_meta($post_id, 'motor_engine_no', $params['motorEngineNo']);
		update_post_meta($post_id, 'chassi', $params['chassi']);
		update_post_meta($post_id, 'remark', $params['remark']);
		update_post_meta($post_id, 'extra_field', serialize($params['extraField']));
		update_post_meta($post_id, 'extra_field2', serialize($params['extraField2']));
		update_post_meta($post_id, 'is_archived', $params['isArchived']);
		update_post_meta($post_id, 'package_content', $params['packageContent']);
		$response = new \WP_REST_Response(  $post_id  );
		return $response;
	}
	/**
	 * Get quotations by id callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_quotations_with_id_callback( $request ) { // phpcs:ignore
		$post_id = $request->get_param('id');
		$post    = get_post($post_id);
		if ( ! $post ) {
			return new \WP_Error( 'error_post_not_found', 'Post not found', [ 'status' => 404 ] );
		}
		// 獲取文章的所有 meta 資料
		$all_meta = get_post_meta($post_id);

		$response = new \WP_REST_Response(
			[
				'id'                    => $post_id,
				'created_at'            => strtotime(get_the_date('Y-m-d', $post_id)),
				'data'                  => strtotime(get_the_date('Y-m-d', $post_id)),
				'noteNo'                => get_the_title($post_id),
				'template'              => $all_meta['template'][0]??\null,
				'termId'                => intval($all_meta['term_id'][0])??\null,
				'clientId'              => intval($all_meta['client_id'][0])??\null,
				'insurerId'             => intval($all_meta['insurer_id'][0])??\null,
				'policyNo'              => $all_meta['policy_no'][0]??\null,
				'nameOfInsured'         => $all_meta['name_of_insured'][0]??\null,
				'sumInsured'            => $all_meta['sum_insured'][0]??\null,
				'periodOfInsuranceFrom' => $all_meta['period_of_insurance_from'][0]??\null,
				'periodOfInsuranceTo'   => $all_meta['period_of_insurance_to'][0]??\null,
				'insuredPremises'       => $all_meta['insured_premises'][0]??\null,
				'motorAttr'             => $all_meta['motor_attr'][0]?Maybe_unserialize($all_meta['motor_attr'][0]):\null,
				'premium'               => intval($all_meta['premium'][0])??\null,
				'less'                  => floatval($all_meta['less'][0])??\null,
				'levy'                  => floatval($all_meta['levy'][0])??\null,
				'agentFee'              => $all_meta['agent_fee'][0]??\null,
				'insurerFeePercent'     => $all_meta['insurer_fee_percent'][0]??\null,
				'shortTermsContent'     => $all_meta['short_terms_content'][0]??\null,
				'particulars'           => $all_meta['particulars'][0]??\null,
				'motorEngineNo'         => $all_meta['motor_engine_no'][0]??\null,
				'chassi'                => $all_meta['chassi'][0]??\null,
				'remark'                => $all_meta['remark'][0]??\null,
				'extraField'            => $all_meta['extra_field'][0]?Maybe_unserialize($all_meta['extra_field'][0]):\null,
				'extraField2'           => $all_meta['extra_field2'][0]?Maybe_unserialize($all_meta['extra_field2'][0]):\null,
				'isArchived'            => filter_var($all_meta['is_archived'][0], FILTER_VALIDATE_BOOLEAN)??\null,
				'packageContent'        => $all_meta['package_content'][0]??\null,
			]
		);
		return $response;
	}
	/**
	 * Delete quotations by id callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function delete_quotations_with_id_callback( $request ) { // phpcs:ignore
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
