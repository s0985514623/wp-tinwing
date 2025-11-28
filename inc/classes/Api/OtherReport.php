<?php
/**
 * OtherReport Api Register
 */

declare (strict_types = 1);

namespace J7\WpTinwing\Api;

use J7\WpUtils\Classes\WP;
use J7\WpTinwing\Utils\Base;
use J7\WpTinwing\Plugin;
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
                'endpoint'            => 'report_by_agent',
                'method'              => 'get',
                'permission_callback' => '__return_true', // TODO 應該是特定會員才能看
            ],
            [
                'endpoint'            => 'report_by_principal_and_class',
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
                'numberposts'            => -1,
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
                'numberposts'            => -1,
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
     * 找出還沒收到錢的insurer = receipt.is_paid = false
     *
     * @param \WP_REST_Request $request Request.
     * @return \WP_REST_Response
     */
    public function get_insurer_ageing_report_callback($request)
    {
        $params = $request->get_query_params() ?? [];
        $params = WP::sanitize_text_field_deep($params, false);
        // 查詢 Custom Post Type 'receipts' 的文章
        $args = [
            'post_type'      => ['receipts'],                                                      // 自定義文章類型名稱
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
        //加入排除條件,is_paid = 0
        $args['meta_query'][] = [
            'key'     => 'is_paid',
            'compare' => '=',
            'value'   => '0',
        ];
        // error_log(print_r($args, true));
        //主查詢
        $query = new \WP_Query($args);

        //取得insurer 資料
        $insurer_map = [];
        if ($query->have_posts()) {
            $insurer_data = get_posts([
                'post_type'              => 'insurers',
                'update_post_meta_cache' => true,
                'fields'                 => 'all',
                'numberposts'            => -1,
            ]);
            foreach ($insurer_data as $insurer) {
                $insurer_map[$insurer->ID] = $insurer;
            }
        }
        //取得debit_note ids資料
        $debit_note_ids = [];
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $debit_note_ids[] = get_post_meta(get_the_ID(), 'debit_note_id', true);
            }
        }
        $debit_note_ids = array_values(array_unique($debit_note_ids));
        //取得debit_note 資料
        $debit_note_map = [];
        if ($debit_note_ids) {
            $debit_note_data = get_posts([
                'post_type'              => 'debit_notes',
                'post__in'               => $debit_note_ids,
                'update_post_meta_cache' => true,
                'fields'                 => 'all',
                'numberposts'            => -1,
            ]);
            foreach ($debit_note_data as $debit_note) {
                $debit_note_map[$debit_note->ID] = $debit_note;
            }
        }
        //取得credit_note ids資料
        $credit_note_ids = [];
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $credit_note_ids[] = get_post_meta(get_the_ID(), 'created_from_credit_note_id', true);
            }
        }
        $credit_note_ids = array_values(array_unique($credit_note_ids));
        //取得credit_note 資料
        $credit_note_map = [];
        if ($credit_note_ids) {
            $credit_note_data = get_posts([
                'post_type'              => 'credit_notes',
                'post__in'               => $credit_note_ids,
                'update_post_meta_cache' => true,
                'fields'                 => 'all',
                'numberposts'            => -1,
            ]);
            foreach ($credit_note_data as $credit_note) {
                $credit_note_map[$credit_note->ID] = $credit_note;
            }
        }
        //取得renewal ids資料
        $renewal_ids = [];
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $renewal_ids[] = get_post_meta(get_the_ID(), 'created_from_renewal_id', true);
            }
        }
        $renewal_ids = array_values(array_unique($renewal_ids));
        //取得renewal 資料
        $renewal_map = [];
        if ($renewal_ids) {
            $renewal_data = get_posts([
                'post_type'              => 'renewals',
                'post__in'               => $renewal_ids,
                'update_post_meta_cache' => true,
                'fields'                 => 'all',
                'numberposts'            => -1,
            ]);
            foreach ($renewal_data as $renewal) {
                $renewal_map[$renewal->ID] = $renewal;
            }
        }
        // 整合資料
        $posts_data = [];
        if ($query->have_posts()) {
            $total_insurer_payment = 0;
            while ($query->have_posts()) {
                $query->the_post();
                $debit_note  = $debit_note_map[get_post_meta(get_the_ID(), 'debit_note_id', true)];
                $credit_note = $credit_note_map[get_post_meta(get_the_ID(), 'created_from_credit_note_id', true)];
                $renewal     = $renewal_map[get_post_meta(get_the_ID(), 'created_from_renewal_id', true)];
                $the_note    = $credit_note ?? $renewal ?? $debit_note;
                $insurer     = $insurer_map[get_post_meta($the_note->ID, 'insurer_id', true)];
                //如果沒有insurer,則跳過
                if (! $insurer) {
                    continue;
                }
                $insurer_id      = $insurer ? $insurer->ID : '';
                $insurer_payment = $this->get_insurer_payment($the_note, $insurer);
                if ($credit_note) {
                    $insurer_payment = -$insurer_payment;
                }
                $total_insurer_payment += $insurer_payment;
                // error_log('get_the_ID():'.get_the_ID());
                // error_log('insurer_payment:'.$insurer_payment);
                //如果$posts_data[$insurer_id]存在,則累加'120Days & Over'與'Current Balance'
                if (isset($posts_data[$insurer_id])) {
                    $posts_data[$insurer_id]['120Days & Over'] += $insurer_payment;
                    $posts_data[$insurer_id]['Current Balance'] += $insurer_payment;
                } else {
                    $posts_data[$insurer_id] = [
                        'A/C No'          => $insurer ? get_post_meta($insurer->ID, 'insurer_number', true) : '',
                        'Type'            => '',
                        'Creditor Name'   => $insurer ? $insurer->post_title : '',
                        '120Days & Over'  => $insurer_payment,
                        '90Days & Over'   => '',
                        '60Days & Over'   => '',
                        '30Days & Over'   => '',
                        'Current Balance' => $insurer_payment,
                    ];
                }
            }
            $posts_data[] = [
                'A/C No'          => '',
                'Type'            => '',
                'Creditor Name'   => 'Total',
                '120Days & Over'  => $total_insurer_payment,
                '90Days & Over'   => '',
                '60Days & Over'   => '',
                '30Days & Over'   => '',
                'Current Balance' => $total_insurer_payment,
            ];
            $posts_data = array_values($posts_data);
            foreach ($posts_data as $key => $value) {
                $posts_data[$key]['120Days & Over']  = number_format($value['120Days & Over'], 2, '.', ',');
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
     * report_by_agent callback
     *
     * @param \WP_REST_Request $request Request.
     * @return \WP_REST_Response
     */
    public function get_report_by_agent_callback($request)
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
        //加入agent_id條件
        if (isset($params['agent_id'])) {
            $args['meta_query'][] = [
                'key'     => 'agent_id',
                'value'   => $params['agent_id'],
                'compare' => '=',
            ];
        }
        //加入payment_status條件
        if (isset($params['payment_status']) && $params['payment_status'] == 'unpaid') {
            //加入排除條件,receipt_id不存在或為空
            $args['meta_query'][] = [
                'key'     => 'receipt_id',
                'value'   => '',
                'compare' => 'NOT EXISTS',
            ];
        } elseif (isset($params['payment_status']) && $params['payment_status'] == 'paid') {
            //加入條件,receipt_id存在
            $args['meta_query'][] = [
                'key'     => 'receipt_id',
                'compare' => 'EXISTS',
            ];
        }

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
                'numberposts'            => -1,
            ]);
            foreach ($agent_data as $agent) {
                $agent_map[$agent->ID] = $agent;
            }
        }
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
                'numberposts'            => -1,
            ]);
            foreach ($client_data as $client) {
                $client_map[$client->ID] = $client;
            }
        }
        //取得receipt ids資料
        $receipt_ids = [];
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $receipt_ids[] = get_post_meta(get_the_ID(), 'receipt_id', true);
            }
        }
        $receipt_ids = array_values(array_unique($receipt_ids));
        //取得receipt 資料
        $receipt_map = [];
        if ($receipt_ids) {
            $receipt_data = get_posts([
                'post_type'              => 'receipts',
                'post__in'               => $receipt_ids,
                'update_post_meta_cache' => true,
                'fields'                 => 'all',
                'numberposts'            => -1,
            ]);
            foreach ($receipt_data as $receipt) {
                $receipt_map[$receipt->ID] = $receipt;
            }
        }
        // 整合資料
        $posts_data = [];
        if ($query->have_posts()) {
            $total_premium = 0;
            while ($query->have_posts()) {
                $query->the_post();
                $agent        = $agent_map[get_post_meta(get_the_ID(), 'agent_id', true)];
                $client       = $client_map[get_post_meta(get_the_ID(), 'client_id', true)];
                $receipt      = $receipt_map[get_post_meta(get_the_ID(), 'receipt_id', true)];
                $display_name = get_post_meta($client->ID, 'display_name', true);
                $agent_id     = $agent ? $agent->ID : '';
                $client_id    = $client ? $client->ID : '';
                $post_type    = get_post_type(get_the_ID());
                $premium      = (float) (get_post_meta(get_the_ID(), 'premium', true) ?: 0);
                $total_premium += $premium;
                $posts_data[] = [
                    'Date'         => get_post_meta(get_the_ID(), 'date', true) ? \date_i18n('d/m/y', get_post_meta(get_the_ID(), 'date', true)) : 'N/A',
                    'Note No'      => get_the_title(),
                    'Post type'    => $post_type === 'debit_notes' ? 'DN' : 'CN',
                    'Client Name'  => $client ? get_post_meta($client->ID, $display_name, true) ?? '' : '',
                    'Premium'      => $premium,
                    'Agent Code'   => $agent ? get_post_meta($agent->ID, 'agent_number', true) ?? '' : '',
                    'Receipt No'   => $receipt ? $receipt->post_title : '',
                    'Payment Date' => $receipt ? \date_i18n('d/m/y', get_post_meta($receipt->ID, 'payment_date', true)) : '',
                ];
            }
            $posts_data[] = [
                'Date'         => '',
                'Note No'      => '',
                'Post type'    => '',
                'Client Name'  => 'Total',
                'Premium'      => $total_premium,
                'Agent Code'   => '',
                'Receipt No'   => '',
                'Payment Date' => '',
            ];
            foreach ($posts_data as $key => $value) {
                $posts_data[$key]['Premium'] = number_format($value['Premium'], 2, '.', ',');
            }
            wp_reset_postdata();
        }
        $response = new \WP_REST_Response($posts_data);
        $total    = $query->found_posts !== 0 ? $query->found_posts + 1 : $query->found_posts;
        // Set pagination in header.
        $response->header('X-WP-Total', $total);
        // $response->header( 'X-WP-TotalPages', $total_pages );

        return $response;
    }
    /**
     * report_by_principal_and_class callback
     *
     * @param \WP_REST_Request $request Request.
     * @return \WP_REST_Response
     */
    public function get_report_by_principal_and_class_callback($request)
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
        //加入insurer_id條件
        if (isset($params['insurer_id'])) {
            $args['meta_query'][] = [
                'key'     => 'insurer_id',
                'value'   => $params['insurer_id'],
                'compare' => '=',
            ];
        }
        // error_log(print_r($args, true));
        //主查詢
        $query = new \WP_Query($args);

        //取得insurer 資料
        if ($query->have_posts()) {
            $insurer_data = get_post($params['insurer_id']);
        }
        // 取得Terms id
        $terms_ids = [];
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $terms_ids[] = get_post_meta(get_the_ID(), 'term_id', true);
            }
        }
        $terms_ids = array_values(array_unique($terms_ids));
        // 取得Terms 資料
        $terms_map = [];
        if ($terms_ids) {
            $terms_data = get_posts([
                'post_type'              => 'terms',
                'post__in'               => $terms_ids,
                'update_post_meta_cache' => true,
                'fields'                 => 'all',
                'numberposts'            => -1,
            ]);
            foreach ($terms_data as $term) {
                $terms_map[$term->ID] = $term;
            }
        }
        // 整合資料
        $posts_data = [];
        if ($query->have_posts()) {
                $all_premium = 0;
                $all_gross_premium = 0;
                $all_ECI_value = 0;
                $all_insurer_payment = 0;
                $all_total_premium = 0;
            while ($query->have_posts()) {
                $query->the_post();
                $the_note = $query->post;
                $term = $terms_map[get_post_meta(get_the_ID(), 'term_id', true)];
                $term_id = $term ? $term->ID : '';
                $premium =  'MOTOR'!=$term->post_title ?(float)get_post_meta(get_the_ID(), 'premium', true) : 0;
                $gross_premium = 'MOTOR'==$term->post_title ? (float)$this->get_gross_premium($the_note) : 0;
                $total_premium = (float)$this->get_total_premium($the_note);
                $insurer_payment = (float)$this->get_insurer_payment($the_note, $insurer_data);
                $ECI = maybe_unserialize(get_post_meta(get_the_ID(), 'extra_field', true));
                $ECI_value = $ECI['label']=='ECI' ?(float)$premium * (float)$ECI['value']/100 : 0;
                if($the_note->post_type == 'credit_notes'){
                    $premium = -$premium;
                    $gross_premium = -$gross_premium;
                    $total_premium = -$total_premium;
                    $insurer_payment = -$insurer_payment;
                }
                $all_premium += $premium;
                $all_gross_premium += $gross_premium;
                $all_ECI_value += $ECI_value;
                $all_insurer_payment += $insurer_payment;
                $all_total_premium += $total_premium;
                // 以term_id為key
                if (isset($posts_data[$term_id])) {
                    if('MOTOR'==$term->post_title){
                        $posts_data[$term_id]['Gross Prem. Motor'] += $gross_premium;
                        $posts_data[$term_id]['2% ECI'] += $ECI_value;
                        $posts_data[$term_id]['Clients Net'] += $total_premium;
                        $posts_data[$term_id]['Principal'] += $insurer_payment;
                        $posts_data[$term_id]['Net Prem'] += $total_premium;
                        $posts_data[$term_id]["Broker's Override"] += $total_premium - $insurer_payment;
                        $posts_data[$term_id]['Trans'] += 1;
                    }
                    else{
                        $posts_data[$term_id]['Gross Prem'] += $premium;
                        $posts_data[$term_id]['2% ECI'] += $ECI_value;
                        $posts_data[$term_id]['Clients Net'] += $total_premium;
                        $posts_data[$term_id]['Principal'] += $insurer_payment;
                        $posts_data[$term_id]['Net Prem'] += $total_premium;
                        $posts_data[$term_id]["Broker's Override"] += $total_premium - $insurer_payment;
                        $posts_data[$term_id]['Trans'] += 1;
                    }
                    // $posts_data[$term_id]['Gross Prem'] += $premium;
                    
                } else {
                    $posts_data[$term_id] = [
                        'Insurer Name' => $insurer_data ? $insurer_data->post_title : '',
                        'Class' => $term ? $term->post_title : '',
                        'Gross Prem' => $premium,
                        'Gross Prem. Motor' => $gross_premium,
                        '2% ECI' => $ECI_value,
                        'Clients Net' => $total_premium,
                        'Principal' => $insurer_payment,
                        'Net Prem'=> $total_premium,
                        'Brokerage'=>0,
                        'Sub-Broke'=>0,
                        "Broker's Override"=>$total_premium - $insurer_payment,
                        'Trans'=>1
                    ];
                }
            }
            $posts_data[] = [
                'Insurer Name' => '',
                'Class'            => 'Total',
                'Gross Prem'   => $all_premium,
                'Gross Prem. Motor' =>  $all_gross_premium,
                '2% ECI' => $all_ECI_value,
                'Clients Net' => $all_total_premium,
                'Principal' => $all_insurer_payment,
                'Net Prem' => $all_total_premium,
                'Brokerage' => 0,
                'Sub-Broke' => 0,
                "Broker's Override" => $all_total_premium - $all_insurer_payment,
                'Trans' => $query->found_posts,
            ];
            $posts_data = array_values($posts_data);
            foreach ($posts_data as $key => $value) {
                $posts_data[$key]['Gross Prem'] = number_format($value['Gross Prem'], 2, '.', ',');
                $posts_data[$key]['Gross Prem. Motor'] = number_format($value['Gross Prem. Motor'], 2, '.', ',');
                $posts_data[$key]['2% ECI'] = number_format($value['2% ECI'], 2, '.', ',');
                $posts_data[$key]['Clients Net'] = number_format($value['Clients Net'], 2, '.', ',');
                $posts_data[$key]['Principal'] = number_format($value['Principal'], 2, '.', ',');
                $posts_data[$key]['Net Prem'] = number_format($value['Net Prem'], 2, '.', ',');
                $posts_data[$key]['Brokerage'] = number_format($value['Brokerage'], 2, '.', ',');
                $posts_data[$key]['Sub-Broke'] = number_format($value['Sub-Broke'], 2, '.', ',');
                $posts_data[$key]["Broker's Override"] = number_format($value["Broker's Override"], 2, '.', ',');
                $posts_data[$key]['Trans'] = number_format($value['Trans'], 2, '.', ',');
            }
        }
        $response = new \WP_REST_Response($posts_data);
        $total    = count($posts_data);
        // Set pagination in header.
        $response->header('X-WP-Total', $total);
        // $response->header( 'X-WP-TotalPages', $total_pages );

        return $response;
    }
    /**
     * get_insurer_payment Utils function
     *
     * @param $the_note
     * @param $insurer
     * @return float
     */
    public function get_insurer_payment($the_note, $insurer)
    {
        $insurer_fee_percent = floatval($the_note->insurer_fee_percent) ?? floatval($insurer->payment_rate) ?? 0;
        $premium             = floatval($the_note->premium) ?? 0;
        $motor_attr          = maybe_unserialize(get_post_meta($the_note->ID, 'motor_attr', true));
        $gross_premium       = $this->get_gross_premium($the_note);
        
        // 對稱處理，避免負數被系統性往上推
        $gross_premium       = round($gross_premium + 1e-10, 2,PHP_ROUND_HALF_UP);
        $template            = $the_note->template ?? '';
        if ($template == 'motor') {
            $mib               = floatval($motor_attr['mib']??0) ?? 0;
            $mib_value         = round($gross_premium * ($mib / 100), 2,PHP_ROUND_HALF_UP);
            $extra_field       = maybe_unserialize(get_post_meta($the_note->ID, 'extra_field', true));
            $extra_field_value = $premium * (floatval($extra_field['value']??0) / 100);
            $insurer_payment   = $mib_value + $extra_field_value + round($insurer_fee_percent * $gross_premium / 100+1e-10, 2,PHP_ROUND_HALF_UP);
        } else {
            $levy              = get_post_meta($the_note->ID, 'levy', true);
            $levy_value        = round($gross_premium * (floatval($levy??0) / 100), 2,PHP_ROUND_HALF_UP);
            $extra_field       = maybe_unserialize(get_post_meta($the_note->ID, 'extra_field', true));
            $extra_field_value = $premium * (floatval($extra_field['value']??0) / 100);
            $insurer_payment   = $levy_value + $extra_field_value + round($insurer_fee_percent * $gross_premium / 100+1e-10, 2,PHP_ROUND_HALF_UP);
        }
        return $insurer_payment;
    }
    /**
     * get_gross_premium Utils function
     *
     * @param $the_note
     * @return float
     */
    public function get_gross_premium($the_note)
    {
        $premium = floatval(get_post_meta($the_note->ID, 'premium', true)) ?? 0;
        $motor_attr = maybe_unserialize(get_post_meta($the_note->ID, 'motor_attr', true));
        $ls = floatval($motor_attr['ls']??0) ?? 0;
        $ncb = floatval($motor_attr['ncb']??0) ?? 0;
        $gross_premium = $premium * (1 + $ls / 100) * (1 + $ncb / 100);
        return round($gross_premium, 2,PHP_ROUND_HALF_UP);
    }
    /**
     * get_total_premium Utils function
     *
     * @param $the_note
     * @return float
     */
    public function get_total_premium($the_note)
    {   
        $template = get_post_meta($the_note->ID, 'template', true);
        if ($template == 'motor') {
            $gross_premium = $this->get_gross_premium($the_note);
            $motor_attr = maybe_unserialize(get_post_meta($the_note->ID, 'motor_attr', true));
            $mib = floatval($motor_attr['mib']??0);
            $less = floatval(get_post_meta($the_note->ID, 'less', true));
            $extra_field = maybe_unserialize(get_post_meta($the_note->ID, 'extra_field', true));
            $extra_field_value = floatval($extra_field['value']??0);
            $total_premium = $gross_premium * (1 + ($mib + $extra_field_value) / 100) + $less + 1e-10;
        } else {
            $premium = floatval(get_post_meta($the_note->ID, 'premium', true));
            $levy = floatval(get_post_meta($the_note->ID, 'levy', true));
            $less = floatval(get_post_meta($the_note->ID, 'less', true));
            $extra_field = maybe_unserialize(get_post_meta($the_note->ID, 'extra_field', true));
            $extra_field_value = floatval($extra_field['value']??0);
            $total_premium = $premium * (1 + ($levy + $extra_field_value) / 100) + $less + 1e-10;
        }
        return round($total_premium, 2,PHP_ROUND_HALF_UP);
    }
}
