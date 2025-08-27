<?php
/**
 * OtherReport Api Register
 */

declare (strict_types = 1);

namespace J7\WpTinwing\Api;
use J7\WpTinwing\Plugin;
use J7\WpUtils\Classes\WP;
use J7\WpTinwing\Utils\Base;
/**
 * Class Entry
 */
final class OtherReport
{
    use \J7\WpUtils\Traits\SingletonTrait;
    use \J7\WpUtils\Traits\ApiRegisterTrait;

    /**
     * Constructor.
     */
    public function __construct()
    {
        \add_action('rest_api_init', [$this, 'register_api_other_reports']);
    }

    /**
     * Get APIs
     *
     * @return array
     * - endpoint: string
     * - method: 'get' | 'post' | 'patch' | 'delete'
     * - permission_callback : callable
     */
    protected function get_apis()
    {
        return [
            [
                'endpoint'            => 'client_ageing_report',
                'method'              => 'get',
                'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
            ],
            [
                'endpoint'            => 'insurer_ageing_report',
                'method'              => 'get',
                'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
            ],
            [
                'endpoint'            => 'report_by_agent_outstanding',
                'method'              => 'get',
                'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
            ],
            [
                'endpoint'            => 'report_by_agent_paid',
                'method'              => 'get',
                'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
            ],
            [
                'endpoint'            => 'analysis_by_principal_and_class',
                'method'              => 'get',
                'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
            ],
            [
                'endpoint'            => 'profit_and_loss_analysis',
                'method'              => 'get',
                'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
            ],
            [
                'endpoint'            => 'trial_balance',
                'method'              => 'get',
                'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
            ],
            [
                'endpoint'            => 'balance_sheet',
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
    public function register_api_other_reports(): void
    {
        $this->register_apis(
            apis: $this->get_apis(),
            namespace :Plugin::$kebab,
            default_permission_callback: fn() => \current_user_can('manage_options'),
        );

    }
    /**
     * Get clients_summary callback
     *
     * @param \WP_REST_Request $request Request.
     * @return \WP_REST_Response
     */
    public function get_client_ageing_report_callback($request)
    { // phpcs:ignore

        $params = $request->get_query_params() ?? [];
        $params = WP::sanitize_text_field_deep($params, false);
        // error_log(print_r($params, true));
        // 查詢 Custom Post Type 'debit_notes' 和 'credit_notes' 的文章
        $args = [
            'post_type'      => ['debit_notes', 'credit_notes'],                                   // 自定義文章類型名稱
            'posts_per_page' => isset($params['posts_per_page']) ? $params['posts_per_page'] : -1, // 每頁顯示文章數量
            'paged'          => isset($params['page']) ? $params['page'] : 1,                      // 當前頁碼
            'orderby'        => isset($params['orderby']) ? $params['orderby'] : 'id',             // 排序方式
            'order'          => isset($params['order']) ? $params['order'] : 'desc',               // 排序順序（DESC: 新到舊，ASC: 舊到新）
        ];
        // 如果有meta_query 參數，則加入查詢條件
        if (isset($params['meta_query'])) {
            $meta_query         = Base::sanitize_meta_query($params['meta_query']);
            $args['meta_query'] = $meta_query;
        }
        //加入排除條件,receipt_id不存在或為空
        $args['meta_query'][] = [
            'key'     => 'receipt_id',
            'value'   => '',
            'compare' => 'NOT EXISTS',
        ];
        // error_log(print_r($args, true));
        //主查詢
        $query = new \WP_Query($args);

        //取得client ids資料
        $client_ids = [];
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $client_ids[] = get_post_meta(get_the_ID(), 'client_id', true);
            }
        }
        $client_ids = array_values(array_unique($client_ids));
        //取得client 資料
        $client_map = [];
        if ($client_ids) {
            $client_data = get_posts([
                'post_type'              => 'clients',
                'post__in'               => $client_ids,
                'update_post_meta_cache' => true,
                'fields'                 => 'all',
            ]);
            foreach ($client_data as $client) {
                $client_map[$client->ID] = $client;
            }
        }
        //取得agent ids資料
        $agent_ids = [];
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $agent_ids[] = get_post_meta(get_the_ID(), 'agent_id', true);
            }
        }
        $agent_ids = array_values(array_unique($agent_ids));
        //取得agent 資料
        $agent_map = [];
        if ($agent_ids) {
            $agent_data = get_posts([
                'post_type'              => 'agents',
                'post__in'               => $agent_ids,
                'update_post_meta_cache' => true,
                'fields'                 => 'all',
            ]);
            foreach ($agent_data as $agent) {
                $agent_map[$agent->ID] = $agent;
            }
        }

        // 整合資料
        $posts_data = [];
        if ($query->have_posts()) {
            $total_premium = 0;
            while ($query->have_posts()) {
                $query->the_post();
                $client       = $client_map[get_post_meta(get_the_ID(), 'client_id', true)];
                $agent        = $agent_map[get_post_meta(get_the_ID(), 'agent_id', true)];
                $display_name = get_post_meta($client->ID, 'display_name', true);
                $phone_keys   = ['mobile1', 'mobile2', 'tel2', 'tel3'];
                $phone        = '';
                foreach ($phone_keys as $key) {
                    $val = get_post_meta($client->ID, $key, true);
                    if (! empty($val)) {
                        $phone = $val;
                        break; // 找到第一個非空就結束
                    }
                }
                $premium = (float) (get_post_meta(get_the_ID(), 'premium', true) ?: 0);
                $total_premium += $premium;
                $posts_data[] = [
                    // 'id'              => get_the_ID(),
                    'Client Code'     => $client ? $client->post_title : '',
                    'Client Name'     => $client ? get_post_meta($client->ID, $display_name, true) ?? '' : '',
                    '120Days & Over'  => number_format($premium, 2, '.', ',') ?? '',
                    '90Days & Over'   => '',
                    '60Days & Over'   => '',
                    '30Days & Over'   => '',
                    'Current Balance' => number_format($premium, 2, '.', ',') ?? '',
                    'Advance Pay'     => '',
                    'Agent'           => $agent ? get_post_meta($agent->ID, 'agent_number', true) ?? '' : '',
                    'Phone'           => $phone,
                ];
            }
            $posts_data[] = [
                // 'id'=>'',
                'Client Code'     => '',
                'Client Name'     => 'Total',
                '120Days & Over'  => number_format($total_premium, 2, '.', ','),
                '90Days & Over'   => '',
                '60Days & Over'   => '',
                '30Days & Over'   => '',
                'Current Balance' => number_format($total_premium, 2, '.', ','),
                'Advance Pay'     => '',
                'Agent'           => '',
                'Phone'           => '',
            ];
            wp_reset_postdata();
        }
        // error_log(print_r($posts_data, true));
        $response = new \WP_REST_Response($posts_data);
        $total    = $query->found_posts !== 0 ? $query->found_posts + 1 : $query->found_posts;
        // Set pagination in header.
        $response->header('X-WP-Total', $total);
        // $response->header( 'X-WP-TotalPages', $total_pages );

        return $response;
    }
    /**
     * Get insurer_ageing_report callback
     *
     * @param \WP_REST_Request $request Request.
     * @return \WP_REST_Response
     */
    public function get_insurer_ageing_report_callback($request)
    {
        $params = $request->get_query_params() ?? [];
        $params = WP::sanitize_text_field_deep($params, false);
        // error_log(print_r($params, true));
        // 查詢 Custom Post Type 'debit_notes' 和 'credit_notes' 的文章
        $args = [
            'post_type'      => ['debit_notes', 'credit_notes'],                                   // 自定義文章類型名稱
            'posts_per_page' => isset($params['posts_per_page']) ? $params['posts_per_page'] : -1, // 每頁顯示文章數量
            'paged'          => isset($params['page']) ? $params['page'] : 1,                      // 當前頁碼
            'orderby'        => isset($params['orderby']) ? $params['orderby'] : 'id',             // 排序方式
            'order'          => isset($params['order']) ? $params['order'] : 'desc',               // 排序順序（DESC: 新到舊，ASC: 舊到新）
        ];
        // 如果有meta_query 參數，則加入查詢條件
        if (isset($params['meta_query'])) {
            $meta_query         = Base::sanitize_meta_query($params['meta_query']);
            $args['meta_query'] = $meta_query;
        }
        //加入排除條件,receipt_id不存在或為空
        $args['meta_query'][] = [
            'key'     => 'receipt_id',
            'value'   => '',
            'compare' => 'NOT EXISTS',
        ];
        // error_log(print_r($args, true));
        //主查詢
        $query = new \WP_Query($args);
        //取得insurer ids資料
        $insurer_ids = [];
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $insurer_ids[] = get_post_meta(get_the_ID(), 'insurer_id', true);
            }
        }
        $insurer_ids = array_values(array_unique($insurer_ids));
        //取得insurer 資料
        $insurer_map = [];
        if ($insurer_ids) {
            $insurer_data = get_posts([
                'post_type'              => 'insurers',
                'post__in'               => $insurer_ids,
                'update_post_meta_cache' => true,
                'fields'                 => 'all',
            ]);
            foreach ($insurer_data as $insurer) {
                $insurer_map[$insurer->ID] = $insurer;
            }
        }
        // 整合資料
        $posts_data = [];
        if ($query->have_posts()) {
            $total_premium = 0;
            while ($query->have_posts()) {
                $query->the_post();
                $insurer    = $insurer_map[get_post_meta(get_the_ID(), 'insurer_id', true)];
                //如果沒有insurer,則跳過
                if (!$insurer) {
                    continue;
                }
                $insurer_id = $insurer ? $insurer->ID : '';
                $premium    = (float) (get_post_meta(get_the_ID(), 'premium', true) ?: 0);
                $total_premium += $premium;
                //如果$posts_data[$insurer_id]存在,則累加'120Days & Over'與'Current Balance'
                if (isset($posts_data[$insurer_id])) {
                    $posts_data[$insurer_id]['120Days & Over'] += $premium;
                    $posts_data[$insurer_id]['Current Balance'] += $premium;
                } else {
                    $posts_data[$insurer_id] = [
                        'A/C No'          => $insurer ? get_post_meta($insurer->ID, 'insurer_number', true) : '',
                        'Type'            => '',
                        'Creditor Name'   => $insurer ? $insurer->post_title : '',
                        '120Days & Over'  => $premium,
                        '90Days & Over'   => '',
                        '60Days & Over'   => '',
                        '30Days & Over'   => '',
                        'Current Balance' => $premium,
                    ];
                }
            }
            $posts_data[] = [
                'A/C No'          => '',
                'Type'            => '',
                'Creditor Name'   => 'Total',
                '120Days & Over'  => $total_premium,
                '90Days & Over'   => '',
                '60Days & Over'   => '',
                '30Days & Over'   => '',
                'Current Balance' => $total_premium,
            ];
            $posts_data = array_values($posts_data);
            foreach ($posts_data as $key => $value) {
                $posts_data[$key]['120Days & Over'] = number_format($value['120Days & Over'], 2, '.', ',');
                $posts_data[$key]['Current Balance'] = number_format($value['Current Balance'], 2, '.', ',');
            }
            wp_reset_postdata();
        }

        $response = new \WP_REST_Response($posts_data);
        $total    = count($posts_data);
        // Set pagination in header.
        $response->header('X-WP-Total', $total);
        // $response->header( 'X-WP-TotalPages', $total_pages );

        return $response;
    }
    /**
     * report_by_agent_outstanding callback
     *
     * @param \WP_REST_Request $request Request.
     * @return \WP_REST_Response
     */
    public function get_report_by_agent_outstanding_callback($request)
    {
        $params = $request->get_query_params() ?? [];
        $params = WP::sanitize_text_field_deep($params, false);
        // error_log(print_r($params, true));
        // 查詢 Custom Post Type 'debit_notes' 和 'credit_notes' 的文章
        $args = [
            'post_type'      => ['debit_notes', 'credit_notes'],                                   // 自定義文章類型名稱
            'posts_per_page' => isset($params['posts_per_page']) ? $params['posts_per_page'] : -1, // 每頁顯示文章數量
            'paged'          => isset($params['page']) ? $params['page'] : 1,                      // 當前頁碼
            'orderby'        => isset($params['orderby']) ? $params['orderby'] : 'id',             // 排序方式
            'order'          => isset($params['order']) ? $params['order'] : 'desc',               // 排序順序（DESC: 新到舊，ASC: 舊到新）
        ];
        // 如果有meta_query 參數，則加入查詢條件
        if (isset($params['meta_query'])) {
            $meta_query         = Base::sanitize_meta_query($params['meta_query']);
            $args['meta_query'] = $meta_query;
        }
        //加入排除條件,receipt_id不存在或為空
        $args['meta_query'][] = [
            'key'     => 'receipt_id',
            'value'   => '',
            'compare' => 'NOT EXISTS',
        ];
        // error_log(print_r($args, true));
        //主查詢
        $query = new \WP_Query($args);

        //取得agent ids資料
        $agent_ids = [];
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $agent_ids[] = get_post_meta(get_the_ID(), 'agent_id', true);
            }
        }
        $agent_ids = array_values(array_unique($agent_ids));
        //取得agent 資料
        $agent_map = [];
        if ($agent_ids) {
            $agent_data = get_posts([
                'post_type'              => 'agents',
                'post__in'               => $agent_ids,
                'update_post_meta_cache' => true,
                'fields'                 => 'all',
            ]);
            foreach ($agent_data as $agent) {
                $agent_map[$agent->ID] = $agent;
            }
        }
        // 整合資料
        $posts_data = [];
        if ($query->have_posts()) {
            $total_premium = 0;
            while ($query->have_posts()) {
                $query->the_post();
                $agent    = $agent_map[get_post_meta(get_the_ID(), 'agent_id', true)];
                $agent_id = $agent ? $agent->ID : '';
                $premium  = (float) (get_post_meta(get_the_ID(), 'premium', true) ?: 0);
                $total_premium += $premium;
                $posts_data[$agent_id][] = [
                    'Agent'       => $agent ? get_post_meta($agent->ID, 'agent_number', true) ?? '' : '',
                    'Outstanding' => number_format($premium, 2, '.', ','),
                ];
            }
        }
    }
}
