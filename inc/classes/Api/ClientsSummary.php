<?php
/**
 * ClientsSummary Api Register
 */

declare(strict_types=1);

namespace J7\WpTinwing\Api;

use J7\WpTinwing\Plugin;
use J7\WpUtils\Classes\WP;
use J7\WpTinwing\Admin\PostType;
use J7\WpTinwing\Utils\Base;

/**
 * Class Entry
 */
final class ClientsSummary {
	use \J7\WpUtils\Traits\SingletonTrait;
	use \J7\WpUtils\Traits\ApiRegisterTrait;

	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_action( 'rest_api_init', [ $this, 'register_api_clients_summary' ] );
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
				'endpoint'            => 'clients_summary',
				'method'              => 'get',
				'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
			],
			
		];
	}

	/**
	 * Register products API
	 *
	 * @return void
	 */
	public function register_api_clients_summary(): void {
		$this->register_apis(
			apis: $this->get_apis(),
			namespace: Plugin::$kebab,
			default_permission_callback: fn() => \current_user_can( 'manage_options' ),
		);
	}
	/**
	 * Get clients_summary callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_clients_summary_callback( $request ) { // phpcs:ignore
		$params = $request->get_query_params() ?? [];
		$params = WP::sanitize_text_field_deep( $params, false );

		// 查詢 Custom Post Type 'debit_notes' , 'credit_notes' ,'renewals' 的文章
		$args = [
			'post_type'      => ['debit_notes', 'credit_notes', 'renewals'],   // 自定義文章類型名稱
			'posts_per_page' => isset($params['posts_per_page'])?$params['posts_per_page']:-1,       // 每頁顯示文章數量
			'paged'          => isset($params['page'])?$params['page']:1,       // 當前頁碼
			'orderby'        => isset($params['orderby'])?$params['orderby']:'id',   // 排序方式
			'order'          => isset($params['order'])?$params['order']:'desc',    // 排序順序（DESC: 新到舊，ASC: 舊到新）
		];
		// 如果有meta_query 參數，則加入查詢條件
		if (isset($params['meta_query'])) {
			$meta_query         = Base::sanitize_meta_query($params['meta_query']);
			$args['meta_query'] = $meta_query;
		}
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
		// 如果有id參數，則加入查詢條件(取得多筆文章)
		if (isset($params['id'])) {
			$args['post__in'] = $params['id'];
		}
		$query      = new \WP_Query($args);
		$posts_data = [];
		if ($query->have_posts()) {
			while ($query->have_posts()) {
				$query->the_post();

				// 獲取文章的所有 meta 資料
				$all_meta = get_post_meta(get_the_ID(), '', true);
				$all_meta = Base::sanitize_post_meta_array($all_meta);

				//取得文章的post_type
				$post_type = get_post_type();

				$posts_data[] = [
					'id'         => get_the_ID(),
					'created_at' => strtotime(get_the_date('Y-m-d')),
					'date'       => strtotime(get_the_date('Y-m-d')),
					'note_no'    => html_entity_decode(get_the_title()),
					'post_type'  => $post_type,
				];
				// 取得最後一個索引 (即剛剛推入的那個項目)
				$last_index = count($posts_data) - 1;
				// 整理 meta 資料
				foreach (PostType\Quotations::instance()->get_meta() as $key => $value) {
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
		$response = new \WP_REST_Response(  $posts_data  );

		// Set pagination in header.
		$response->header( 'X-WP-Total', $query->found_posts );
		// $response->header( 'X-WP-TotalPages', $total_pages );

		return $response;
	}
	
}
