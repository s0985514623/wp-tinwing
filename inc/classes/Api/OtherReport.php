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
            $total_120_days = 0;
            $total_90_days = 0;
            $total_60_days = 0;
            $total_30_days = 0;
            
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
                
                // 計算日期差異 (考慮WordPress時區)
                $post_date = get_post_meta(get_the_ID(), 'date', true);
                $wp_timezone = wp_timezone(); // 取得 WP 設定的時區
                $current_date = current_time('timestamp'); // 使用WordPress時區的當前時間戳
                $days_diff = 0;
                
                if ($post_date) {
                    // 將post_date轉換為WordPress時區的日期
                    $post_datetime = new \DateTime('@' . $post_date);
                    $post_datetime->setTimezone($wp_timezone);
                    
                    // 將當前時間轉換為WordPress時區的日期
                    $current_datetime = new \DateTime('@' . $current_date);
                    $current_datetime->setTimezone($wp_timezone);
                    
                    // 計算天數差異
                    $post_date_only = $post_datetime->format('Y-m-d');
                    $current_date_only = $current_datetime->format('Y-m-d');
                    
                    $post_date_obj = new \DateTime($post_date_only, $wp_timezone);
                    $current_date_obj = new \DateTime($current_date_only, $wp_timezone);
                    
                    $interval = $current_date_obj->diff($post_date_obj);
                    $days_diff = $interval->days;
                }
                
                // 根據日期差異分配到對應的區間
                $days_120_over = '';
                $days_90_over = '';
                $days_60_over = '';
                $days_30_over = '';
                
                if ($days_diff >= 120) {
                    $days_120_over = number_format($premium, 2, '.', ',');
                    $total_120_days += $premium;
                } elseif ($days_diff >= 90) {
                    $days_90_over = number_format($premium, 2, '.', ',');
                    $total_90_days += $premium;
                } elseif ($days_diff >= 60) {
                    $days_60_over = number_format($premium, 2, '.', ',');
                    $total_60_days += $premium;
                } elseif ($days_diff >= 30) {
                    $days_30_over = number_format($premium, 2, '.', ',');
                    $total_30_days += $premium;
                }
                
                $posts_data[] = [
                    // 'id'              => get_the_ID(),
                    'Client Code'     => $client ? $client->post_title : '',
                    'Client Name'     => $client ? get_post_meta($client->ID, $display_name, true) ?? '' : '',
                    '120Days & Over'  => $days_120_over,
                    '90Days & Over'   => $days_90_over,
                    '60Days & Over'   => $days_60_over,
                    '30Days & Over'   => $days_30_over,
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
                '120Days & Over'  => $total_120_days > 0 ? number_format($total_120_days, 2, '.', ',') : '',
                '90Days & Over'   => $total_90_days > 0 ? number_format($total_90_days, 2, '.', ',') : '',
                '60Days & Over'   => $total_60_days > 0 ? number_format($total_60_days, 2, '.', ',') : '',
                '30Days & Over'   => $total_30_days > 0 ? number_format($total_30_days, 2, '.', ',') : '',
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
            $total_120_days = 0;
            $total_90_days = 0;
            $total_60_days = 0;
            $total_30_days = 0;
            
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
                
                // 計算日期差異 (考慮WordPress時區)
                $note_date = get_post_meta($the_note->ID, 'date', true);
                $wp_timezone = wp_timezone(); // 取得 WP 設定的時區
                $current_date = current_time('timestamp'); // 使用WordPress時區的當前時間戳
                $days_diff = 0;
                
                if ($note_date) {
                    // 將note_date轉換為WordPress時區的日期
                    $note_datetime = new \DateTime('@' . $note_date);
                    $note_datetime->setTimezone($wp_timezone);
                    
                    // 將當前時間轉換為WordPress時區的日期
                    $current_datetime = new \DateTime('@' . $current_date);
                    $current_datetime->setTimezone($wp_timezone);
                    
                    // 計算天數差異
                    $note_date_only = $note_datetime->format('Y-m-d');
                    $current_date_only = $current_datetime->format('Y-m-d');
                    
                    $note_date_obj = new \DateTime($note_date_only, $wp_timezone);
                    $current_date_obj = new \DateTime($current_date_only, $wp_timezone);
                    
                    $interval = $current_date_obj->diff($note_date_obj);
                    $days_diff = $interval->days;
                }
                
                // 根據日期差異分配到對應的區間
                $days_120_payment = 0;
                $days_90_payment = 0;
                $days_60_payment = 0;
                $days_30_payment = 0;
                
                if ($days_diff >= 120) {
                    $days_120_payment = $insurer_payment;
                    $total_120_days += $insurer_payment;
                } elseif ($days_diff >= 90) {
                    $days_90_payment = $insurer_payment;
                    $total_90_days += $insurer_payment;
                } elseif ($days_diff >= 60) {
                    $days_60_payment = $insurer_payment;
                    $total_60_days += $insurer_payment;
                } elseif ($days_diff >= 30) {
                    $days_30_payment = $insurer_payment;
                    $total_30_days += $insurer_payment;
                }
                
                // error_log('get_the_ID():'.get_the_ID());
                // error_log('insurer_payment:'.$insurer_payment);
                //如果$posts_data[$insurer_id]存在,則累加各區間與'Current Balance'
                if (isset($posts_data[$insurer_id])) {
                    $posts_data[$insurer_id]['120Days & Over'] += $days_120_payment;
                    $posts_data[$insurer_id]['90Days & Over'] += $days_90_payment;
                    $posts_data[$insurer_id]['60Days & Over'] += $days_60_payment;
                    $posts_data[$insurer_id]['30Days & Over'] += $days_30_payment;
                    $posts_data[$insurer_id]['Current Balance'] += $insurer_payment;
                } else {
                    $posts_data[$insurer_id] = [
                        'A/C No'          => $insurer ? get_post_meta($insurer->ID, 'insurer_number', true) : '',
                        'Type'            => '',
                        'Creditor Name'   => $insurer ? $insurer->post_title : '',
                        '120Days & Over'  => $days_120_payment,
                        '90Days & Over'   => $days_90_payment,
                        '60Days & Over'   => $days_60_payment,
                        '30Days & Over'   => $days_30_payment,
                        'Current Balance' => $insurer_payment,
                    ];
                }
            }
            $posts_data[] = [
                'A/C No'          => '',
                'Type'            => '',
                'Creditor Name'   => 'Total',
                '120Days & Over'  => $total_120_days,
                '90Days & Over'   => $total_90_days,
                '60Days & Over'   => $total_60_days,
                '30Days & Over'   => $total_30_days,
                'Current Balance' => $total_insurer_payment,
            ];
            $posts_data = array_values($posts_data);
            foreach ($posts_data as $key => $value) {
                $posts_data[$key]['120Days & Over']  = $value['120Days & Over'] != 0 ? number_format($value['120Days & Over'], 2, '.', ',') : '';
                $posts_data[$key]['90Days & Over']   = $value['90Days & Over'] != 0 ? number_format($value['90Days & Over'], 2, '.', ',') : '';
                $posts_data[$key]['60Days & Over']   = $value['60Days & Over'] != 0 ? number_format($value['60Days & Over'], 2, '.', ',') : '';
                $posts_data[$key]['30Days & Over']   = $value['30Days & Over'] != 0 ? number_format($value['30Days & Over'], 2, '.', ',') : '';
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
            $extra_field_value = round($premium * (floatval($extra_field['value']??0) / 100), 2, PHP_ROUND_HALF_UP);
            $insurer_payment   = $mib_value + $extra_field_value + round($insurer_fee_percent * $gross_premium / 100+1e-10, 2,PHP_ROUND_HALF_UP);
        } else {
            $levy              = get_post_meta($the_note->ID, 'levy', true);
            $levy_value        = round($gross_premium * (floatval($levy??0) / 100), 2,PHP_ROUND_HALF_UP);
            $extra_field       = maybe_unserialize(get_post_meta($the_note->ID, 'extra_field', true));
            $extra_field_value = round($premium * (floatval($extra_field['value']??0) / 100), 2, PHP_ROUND_HALF_UP);
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

    /**
     * 計算 Account Receivable 的 This Period Debit（期間內所開的 Debit Note 總金額）
     *
     * @param string|null $start_date 開始日期
     * @param string|null $end_date 結束日期
     * @param \DateTimeZone $wp_timezone WordPress 時區
     * @return float
     */
    private function calculate_account_receivable_debit($start_date, $end_date, $wp_timezone)
    {
        $total_debit = 0;
        
        if (!$start_date || !$end_date) {
            return $total_debit;
        }
        
        // 查詢期間內的 Debit Notes
        $start_datetime = new \DateTime($start_date . ' 00:00:00', $wp_timezone);
        $end_datetime = new \DateTime($end_date . ' 23:59:59', $wp_timezone);
        $start_timestamp = $start_datetime->getTimestamp();
        $end_timestamp = $end_datetime->getTimestamp();
        
        $debit_notes_args = [
            'post_type' => 'debit_notes',
            'posts_per_page' => -1,
            'meta_query' => [
                [
                    'key' => 'date',
                    'value' => [$start_timestamp, $end_timestamp],
                    'compare' => 'BETWEEN',
                    'type' => 'NUMERIC'
                ]
            ]
        ];
        
        $debit_notes_query = new \WP_Query($debit_notes_args);
        if ($debit_notes_query->have_posts()) {
            while ($debit_notes_query->have_posts()) {
                $debit_notes_query->the_post();
                $the_note = $debit_notes_query->post;
                $total_premium = $this->get_total_premium($the_note);
                $total_debit += $total_premium;
            }
        }
        wp_reset_postdata();
        
        return round($total_debit, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * Get profit and loss analysis callback
     *
     * @param \WP_REST_Request $request Request.
     * @return \WP_REST_Response
     */
    public function get_profit_and_loss_analysis_callback($request)
    { // phpcs:ignore
        $params = $request->get_query_params() ?? [];
        $params = WP::sanitize_text_field_deep($params, false);

        // 取得日期參數，考慮 WordPress 時區
        $wp_timezone = wp_timezone();
        $current_wp_time = new \DateTime('now', $wp_timezone);
        
        // 檢查是否有提供日期參數
        $has_date_params = isset($params['start_date']) || isset($params['end_date']);
        
        if ($has_date_params) {
            // 如果有提供日期參數，使用提供的值或預設值
            $start_date = isset($params['start_date']) ? $params['start_date'] : $current_wp_time->format('Y-m-01'); // 預設當月第一天
            $end_date = isset($params['end_date']) ? $params['end_date'] : $current_wp_time->format('Y-m-d'); // 預設今天
        } else {
            // 如果沒有提供任何日期參數，設為 null，表示不限制日期
            $start_date = null;
            $end_date = null;
        }
        
        // 計算年初至今的日期範圍
        if ($end_date) {
            $end_date_obj = new \DateTime($end_date, $wp_timezone);
            $year_start = $end_date_obj->format('Y-01-01'); // 當年第一天
        } else {
            // 如果沒有結束日期，使用當前時間來計算年初
            $year_start = $current_wp_time->format('Y-01-01');
            $end_date = $current_wp_time->format('Y-m-d'); // 用於顯示標題
            $end_date_obj = $current_wp_time;
        }
        
        // 格式化報表標題日期
        $report_date = $end_date_obj->format('d') . '/' . $end_date_obj->format('m') . '/' . $end_date_obj->format('y');
        
        // 計算 Income 部分 - Receipt 總金額
        $current_period_income = $this->calculate_receipt_total($start_date, $end_date);
        $year_to_date_income = $this->calculate_receipt_total($year_start, $end_date);
        
        // 計算 LESS 部分 - Insurer Payment 金額
        $current_period_insurer_payment = $this->calculate_insurer_payment_total($start_date, $end_date);
        $year_to_date_insurer_payment = $this->calculate_insurer_payment_total($year_start, $end_date);
        
        // 計算 Other Earning 部分 - Other Earning – Rebate 類別
        $current_period_other_earning = $this->calculate_other_earning_total($start_date, $end_date);
        $year_to_date_other_earning = $this->calculate_other_earning_total($year_start, $end_date);
        
        // 計算 Gross Profit (Income - LESS + Other Earning)
        $current_period_gross_profit = $current_period_income - $current_period_insurer_payment + $current_period_other_earning;
        $year_to_date_gross_profit = $year_to_date_income - $year_to_date_insurer_payment + $year_to_date_other_earning;
        
        // 計算 Admin & General Expenses 分類
        $current_period_admin_expenses = $this->calculate_admin_expenses_by_category($start_date, $end_date);
        $year_to_date_admin_expenses = $this->calculate_admin_expenses_by_category($year_start, $end_date);
        
        // 計算 Total Expenses
        $current_period_total_expenses = array_sum($current_period_admin_expenses);
        $year_to_date_total_expenses = array_sum($year_to_date_admin_expenses);

        // 準備真實資料 - Profit and Loss Statement 報表
        // 先建立基本結構，稍後動態插入 Admin & General Expenses
        $data = [
            // 標題行
            [
                'Account' => 'Profit and Loss Statement',
                'Current_Period' => '',
                'Year_to_Date' => '',
                'Category' => 'HEADER'
            ],
            [
                'Account' => 'As at ' . $report_date,
                'Current_Period' => '',
                'Year_to_Date' => '',
                'Category' => 'HEADER'
            ],
            [
                'Account' => '',
                'Current_Period' => 'Current Period',
                'Year_to_Date' => 'Year to Date',
                'Category' => 'HEADER'
            ],
            
            // 空行
            [
                'Account' => '',
                'Current_Period' => '',
                'Year_to_Date' => '',
                'Category' => 'EMPTY'
            ],
            
            // Income 部分
            [
                'Account' => 'Income:',
                'Current_Period' => '',
                'Year_to_Date' => '',
                'Category' => 'SECTION'
            ],
            [
                'Account' => 'Premium Received',
                'Current_Period' => $current_period_income,
                'Year_to_Date' => $year_to_date_income,
                'Category' => 'INCOME'
            ],
            [
                'Account' => 'Total Income',
                'Current_Period' => $current_period_income,
                'Year_to_Date' => $year_to_date_income,
                'Category' => 'TOTAL'
            ],
            
            // 空行
            [
                'Account' => '',
                'Current_Period' => '',
                'Year_to_Date' => '',
                'Category' => 'EMPTY'
            ],
            
            // LESS 部分
            [
                'Account' => 'LESS:',
                'Current_Period' => '',
                'Year_to_Date' => '',
                'Category' => 'SECTION'
            ],
            [
                'Account' => 'Premium Paid - General',
                'Current_Period' => $current_period_insurer_payment,
                'Year_to_Date' => $year_to_date_insurer_payment,
                'Category' => 'EXPENSE'
            ],
            [
                'Account' => '',
                'Current_Period' => $current_period_insurer_payment,
                'Year_to_Date' => $year_to_date_insurer_payment,
                'Category' => 'SUBTOTAL'
            ],
            
            // 空行
            [
                'Account' => '',
                'Current_Period' => '',
                'Year_to_Date' => '',
                'Category' => 'EMPTY'
            ],
            
            // Other Earning 部分
            [
                'Account' => 'Other Earning :',
                'Current_Period' => '',
                'Year_to_Date' => '',
                'Category' => 'SECTION'
            ],
            [
                'Account' => 'Rebate Received',
                'Current_Period' => $current_period_other_earning,
                'Year_to_Date' => $year_to_date_other_earning,
                'Category' => 'INCOME'
            ],
            [
                'Account' => '',
                'Current_Period' => $current_period_other_earning,
                'Year_to_Date' => $year_to_date_other_earning,
                'Category' => 'SUBTOTAL'
            ],
            
            // 空行
            [
                'Account' => '',
                'Current_Period' => '',
                'Year_to_Date' => '',
                'Category' => 'EMPTY'
            ],
            
            // Gross Profit
            [
                'Account' => 'Gross Profit :',
                'Current_Period' => $current_period_gross_profit,
                'Year_to_Date' => $year_to_date_gross_profit,
                'Category' => 'TOTAL'
            ],
            
            // 空行
            [
                'Account' => '',
                'Current_Period' => '',
                'Year_to_Date' => '',
                'Category' => 'EMPTY'
            ],
            
            // Admin & General Expenses 部分
            [
                'Account' => 'Admin & General Expenses',
                'Current_Period' => '',
                'Year_to_Date' => '',
                'Category' => 'SECTION'
            ]
        ];
        
        // 動態添加 Admin & General Expenses 項目
        foreach ($current_period_admin_expenses as $category_name => $current_amount) {
            $year_amount = isset($year_to_date_admin_expenses[$category_name]) ? $year_to_date_admin_expenses[$category_name] : 0;
            
            $data[] = [
                'Account' => $category_name,
                'Current_Period' => $current_amount,
                'Year_to_Date' => $year_amount,
                'Category' => 'EXPENSE'
            ];
        }
        
        // 添加 Total Expenses 和最終結果
        $additional_data = [
            [
                'Account' => 'Total Expenses:',
                'Current_Period' => $current_period_total_expenses,
                'Year_to_Date' => $year_to_date_total_expenses,
                'Category' => 'TOTAL'
            ],
            
            // 空行
            [
                'Account' => '',
                'Current_Period' => '',
                'Year_to_Date' => '',
                'Category' => 'EMPTY'
            ],
            
            // Net Profit
            [
                'Account' => 'NET PROFIT FOR THE YEAR',
                'Current_Period' => $current_period_gross_profit - $current_period_total_expenses,
                'Year_to_Date' => $year_to_date_gross_profit - $year_to_date_total_expenses,
                'Category' => 'FINAL_TOTAL'
            ]
        ];
        $data = array_merge($data, $additional_data);

        $response = new \WP_REST_Response([
            'data' => $data,
            'total' => count($data),
            'success' => true
        ], 200);
        
        // 設定 JSON 編碼選項，避免斜線轉義
        $response->set_headers(['Content-Type' => 'application/json; charset=utf-8']);
        
        return $response;
    }

    /**
     * 計算 Receipt 總金額
     *
     * @param string|null $start_date
     * @param string|null $end_date
     * @return float
     */
    private function calculate_receipt_total($start_date, $end_date)
    {
        // 查詢 receipts 文章類型
        $args = [
            'post_type' => 'receipts',
            'posts_per_page' => -1
        ];
        
        // 只有在提供日期參數時才添加日期篩選
        if ($start_date && $end_date) {
            // 取得 WordPress 時區
            $wp_timezone = wp_timezone();
            
            // 建立開始和結束日期時間物件
            $start_datetime = new \DateTime($start_date . ' 00:00:00', $wp_timezone);
            $end_datetime = new \DateTime($end_date . ' 23:59:59', $wp_timezone);
            
            // 轉換為 UTC 時間戳記以進行資料庫查詢
            $start_timestamp = $start_datetime->getTimestamp();
            $end_timestamp = $end_datetime->getTimestamp();
            
            $args['meta_query'] = [
                'relation' => 'AND',
                [
                    'key' => 'date',
                    'value' => [$start_timestamp, $end_timestamp],
                    'compare' => 'BETWEEN',
                    'type' => 'NUMERIC'
                ]
            ];
        }

        $query = new \WP_Query($args);
        $total = 0;

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $amount = floatval(get_post_meta(get_the_ID(), 'premium', true));
                $total += $amount;
            }
        }
        wp_reset_postdata();

        return round($total, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * 計算指定 expense_class post_name 的 Expenses 總金額
     *
     * @param string|null $start_date
     * @param string|null $end_date
     * @param string $term_post_name expense_class 的 post_name（例如 'insurer-payment-msig'）
     * @return float
     */
    private function calculate_expenses_total_by_term_post_name($start_date, $end_date, $term_post_name)
    {
        // 查詢 expenses 文章類型
        $args = [
            'post_type' => 'expenses',
            'posts_per_page' => -1
        ];
        
        // 只有在提供日期參數時才添加日期篩選
        if ($start_date && $end_date) {
            // 取得 WordPress 時區
            $wp_timezone = wp_timezone();
            
            // 建立開始和結束日期時間物件
            $start_datetime = new \DateTime($start_date . ' 00:00:00', $wp_timezone);
            $end_datetime = new \DateTime($end_date . ' 23:59:59', $wp_timezone);
            
            // 轉換為 UTC 時間戳記以進行資料庫查詢
            $start_timestamp = $start_datetime->getTimestamp();
            $end_timestamp = $end_datetime->getTimestamp();

            $args['meta_query'] = [
                'relation' => 'AND',
                [
                    'key' => 'date',
                    'value' => [$start_timestamp, $end_timestamp],
                    'compare' => 'BETWEEN',
                    'type' => 'NUMERIC'
                ]
            ];
        }

        $query = new \WP_Query($args);
        $total = 0;

        if ($query->have_posts()) {
            // 先收集所有的 term_id 和對應的金額
            $term_ids = [];
            $expenses_data = [];
            
            while ($query->have_posts()) {
                $query->the_post();
                $term_id = get_post_meta(get_the_ID(), 'term_id', true);
                $amount = floatval(get_post_meta(get_the_ID(), 'amount', true));
                
                if ($term_id) {
                    $term_ids[] = $term_id;
                    $expenses_data[] = [
                        'term_id' => $term_id,
                        'amount' => $amount
                    ];
                }
            }
            wp_reset_postdata();
            
            // 一次性取得所有相關的 terms
            if (!empty($term_ids)) {
                $terms_args = [
                    'post_type' => 'terms',
                    'post__in' => array_unique($term_ids),
                    'posts_per_page' => -1,
                    'meta_query' => [
                        [
                            'key' => 'taxonomy',
                            'value' => 'expense_class',
                            'compare' => '='
                        ]
                    ]
                ];
                
                $terms_query = new \WP_Query($terms_args);
                $terms_map = [];
                
                if ($terms_query->have_posts()) {
                    while ($terms_query->have_posts()) {
                        $terms_query->the_post();
                        $terms_map[get_the_ID()] = get_post_field('post_name', get_the_ID());
                    }
                    wp_reset_postdata();
                }
                
                // 計算總金額：只計算指定的 post_name
                foreach ($expenses_data as $expense) {
                    $term_id = $expense['term_id'];
                    $amount = $expense['amount'];
                    
                    if (isset($terms_map[$term_id])) {
                        $post_name = $terms_map[$term_id];
                        
                        // 檢查是否為目標 post_name
                        if ($post_name === $term_post_name) {
                            $total += $amount;
                        }
                    }
                }
            }
        }

        return round($total, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * 計算指定 term 的 post_title 的 Expenses 總金額
     *
     * @param string|null $start_date
     * @param string|null $end_date
     * @param string $term_title expense_class 的 post_title（例如 'Salary – LCC'）
     * @return float
     */
    private function calculate_expenses_total_by_term_title($start_date, $end_date, $term_title)
    {
        $args = [
            'post_type' => 'expenses',
            'posts_per_page' => -1
        ];

        if ($start_date && $end_date) {
            $wp_timezone = wp_timezone();
            $start_datetime = new \DateTime($start_date . ' 00:00:00', $wp_timezone);
            $end_datetime = new \DateTime($end_date . ' 23:59:59', $wp_timezone);
            $start_timestamp = $start_datetime->getTimestamp();
            $end_timestamp = $end_datetime->getTimestamp();

            $args['meta_query'] = [
                'relation' => 'AND',
                [
                    'key' => 'date',
                    'value' => [$start_timestamp, $end_timestamp],
                    'compare' => 'BETWEEN',
                    'type' => 'NUMERIC'
                ]
            ];
        }

        $query = new \WP_Query($args);
        $total = 0;

        if ($query->have_posts()) {
            $term_ids = [];
            $expenses_data = [];

            while ($query->have_posts()) {
                $query->the_post();
                $term_id = get_post_meta(get_the_ID(), 'term_id', true);
                $amount = floatval(get_post_meta(get_the_ID(), 'amount', true));

                if ($term_id) {
                    $term_ids[] = $term_id;
                    $expenses_data[] = [
                        'term_id' => $term_id,
                        'amount' => $amount
                    ];
                }
            }
            wp_reset_postdata();

            if (!empty($term_ids)) {
                $terms_args = [
                    'post_type' => 'terms',
                    'post__in' => array_unique($term_ids),
                    'posts_per_page' => -1,
                    'meta_query' => [
                        [
                            'key' => 'taxonomy',
                            'value' => 'expense_class',
                            'compare' => '='
                        ]
                    ]
                ];

                $terms_query = new \WP_Query($terms_args);
                $terms_map = [];

                if ($terms_query->have_posts()) {
                    while ($terms_query->have_posts()) {
                        $terms_query->the_post();
                        $terms_map[get_the_ID()] = html_entity_decode(get_the_title(), ENT_QUOTES, 'UTF-8');
                    }
                    wp_reset_postdata();
                }

                foreach ($expenses_data as $expense) {
                    $term_id = $expense['term_id'];
                    $amount = $expense['amount'];

                    if (isset($terms_map[$term_id])) {
                        $current_term_title = $terms_map[$term_id];

                        if ($current_term_title === $term_title) {
                            $total += $amount;
                        }
                    }
                }
            }
        }

        return round($total, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * 計算指定銀行的 Receipt 總金額（以 receipts.premium 為準）
     *
     * @param string|null $start_date
     * @param string|null $end_date
     * @param string $bank_name
     * @return float
     */
    private function calculate_receipt_total_by_bank($start_date, $end_date, $bank_name)
    {
        // 查詢 receipts 文章類型
        $args = [
            'post_type' => 'receipts',
            'posts_per_page' => -1,
            'meta_query' => [
                'relation' => 'AND',
                [
                    'key' => 'payment_receiver_account',
                    'value' => $bank_name,
                    'compare' => '=',
                ],
            ],
        ];

        // 只有在提供日期參數時才添加日期篩選
        if ($start_date && $end_date) {
            $wp_timezone = wp_timezone();
            $start_datetime = new \DateTime($start_date . ' 00:00:00', $wp_timezone);
            $end_datetime = new \DateTime($end_date . ' 23:59:59', $wp_timezone);
            $start_timestamp = $start_datetime->getTimestamp();
            $end_timestamp = $end_datetime->getTimestamp();

            $args['meta_query'][] = [
                'key' => 'date',
                'value' => [$start_timestamp, $end_timestamp],
                'compare' => 'BETWEEN',
                'type' => 'NUMERIC',
            ];
        }

        $query = new \WP_Query($args);
        $total = 0;

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $amount = floatval(get_post_meta(get_the_ID(), 'premium', true));
                $total += $amount;
            }
        }
        wp_reset_postdata();

        return round($total, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * 計算指定銀行的 Adjust Balance 總金額（expenses.amount 且 is_adjust_balance=1）
     *
     * @param string|null $start_date
     * @param string|null $end_date
     * @param string $bank_name
     * @return float
     */
    private function calculate_adjust_balance_total_by_bank($start_date, $end_date, $bank_name)
    {
        $args = [
            'post_type' => 'expenses',
            'posts_per_page' => -1,
            'meta_query' => [
                'relation' => 'AND',
                [
                    'key' => 'is_adjust_balance',
                    'value' => 1,
                    'compare' => '=',
                    'type' => 'NUMERIC',
                ],
                [
                    'key' => 'payment_receiver_account',
                    'value' => $bank_name,
                    'compare' => '=',
                ],
            ],
        ];

        if ($start_date && $end_date) {
            $wp_timezone = wp_timezone();
            $start_datetime = new \DateTime($start_date . ' 00:00:00', $wp_timezone);
            $end_datetime = new \DateTime($end_date . ' 23:59:59', $wp_timezone);
            $start_timestamp = $start_datetime->getTimestamp();
            $end_timestamp = $end_datetime->getTimestamp();

            $args['meta_query'][] = [
                'key' => 'date',
                'value' => [$start_timestamp, $end_timestamp],
                'compare' => 'BETWEEN',
                'type' => 'NUMERIC',
            ];
        }

        $query = new \WP_Query($args);
        $total = 0;

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $amount = floatval(get_post_meta(get_the_ID(), 'amount', true));
                $total += $amount;
            }
        }
        wp_reset_postdata();

        return round($total, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * 計算所有 Adjust Balance 的總金額（expenses.amount 且 is_adjust_balance=1，不限定銀行）
     *
     * @param string|null $start_date
     * @param string|null $end_date
     * @return float
     */
    private function calculate_adjust_balance_total($start_date, $end_date)
    {
        $args = [
            'post_type' => 'expenses',
            'posts_per_page' => -1,
            'meta_query' => [
                [
                    'key' => 'is_adjust_balance',
                    'value' => 1,
                    'compare' => '=',
                    'type' => 'NUMERIC',
                ],
            ],
        ];

        if ($start_date && $end_date) {
            $wp_timezone = wp_timezone();
            $start_datetime = new \DateTime($start_date . ' 00:00:00', $wp_timezone);
            $end_datetime = new \DateTime($end_date . ' 23:59:59', $wp_timezone);
            $start_timestamp = $start_datetime->getTimestamp();
            $end_timestamp = $end_datetime->getTimestamp();

            $args['meta_query'][] = [
                'key' => 'date',
                'value' => [$start_timestamp, $end_timestamp],
                'compare' => 'BETWEEN',
                'type' => 'NUMERIC',
            ];
        }

        $query = new \WP_Query($args);
        $total = 0;

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $amount = floatval(get_post_meta(get_the_ID(), 'amount', true));
                $total += $amount;
            }
        }
        wp_reset_postdata();

        return round($total, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * 計算指定銀行的 Expenses 總金額（expenses.amount 且排除 Adjust Balance）
     *
     * @param string|null $start_date
     * @param string|null $end_date
     * @param string $bank_name
     * @return float
     */
    private function calculate_expenses_total_by_bank($start_date, $end_date, $bank_name)
    {
        $args = [
            'post_type' => 'expenses',
            'posts_per_page' => -1,
            'meta_query' => [
                'relation' => 'AND',
                [
                    'key' => 'payment_receiver_account',
                    'value' => $bank_name,
                    'compare' => '=',
                ],
                // 排除 Adjust Balance（相容舊資料：is_adjust_balance 不存在也算一般 Expenses）
                [
                    'relation' => 'OR',
                    [
                        'key' => 'is_adjust_balance',
                        'compare' => 'NOT EXISTS',
                    ],
                    [
                        'key' => 'is_adjust_balance',
                        'value' => 1,
                        'compare' => '!=',
                        'type' => 'NUMERIC',
                    ],
                ],
            ],
        ];

        if ($start_date && $end_date) {
            $wp_timezone = wp_timezone();
            $start_datetime = new \DateTime($start_date . ' 00:00:00', $wp_timezone);
            $end_datetime = new \DateTime($end_date . ' 23:59:59', $wp_timezone);
            $start_timestamp = $start_datetime->getTimestamp();
            $end_timestamp = $end_datetime->getTimestamp();

            $args['meta_query'][] = [
                'key' => 'date',
                'value' => [$start_timestamp, $end_timestamp],
                'compare' => 'BETWEEN',
                'type' => 'NUMERIC',
            ];
        }

        $query = new \WP_Query($args);
        $total = 0;

        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $amount = floatval(get_post_meta(get_the_ID(), 'amount', true));
                $total += $amount;
            }
        }
        wp_reset_postdata();

        return round($total, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * 計算 LESS 部分金額 (所有 Expenses 中的 Insurer Payment 類別總和)
     *
     * @param string|null $start_date
     * @param string|null $end_date
     * @return float
     */
    private function calculate_insurer_payment_total($start_date, $end_date)
    {
        // 指定的 Insurer Payment 類別 (使用 post_name 格式)
        $target_categories = [
            'insurer-payment-cmb',
            'insurer-payment-msig', 
            'insurer-payment-taiping',
            'insurer-payment-tokio'
        ];

        // 查詢 expenses 文章類型
        $args = [
            'post_type' => 'expenses',
            'posts_per_page' => -1
        ];
        
        // 只有在提供日期參數時才添加日期篩選
        if ($start_date && $end_date) {
            // 取得 WordPress 時區
            $wp_timezone = wp_timezone();
            
            // 建立開始和結束日期時間物件
            $start_datetime = new \DateTime($start_date . ' 00:00:00', $wp_timezone);
            $end_datetime = new \DateTime($end_date . ' 23:59:59', $wp_timezone);
            
            // 轉換為 UTC 時間戳記以進行資料庫查詢
            $start_timestamp = $start_datetime->getTimestamp();
            $end_timestamp = $end_datetime->getTimestamp();

            $args['meta_query'] = [
                'relation' => 'AND',
                [
                    'key' => 'date',
                    'value' => [$start_timestamp, $end_timestamp],
                    'compare' => 'BETWEEN',
                    'type' => 'NUMERIC'
                ]
            ];
        }

        $query = new \WP_Query($args);
        $total = 0;

        if ($query->have_posts()) {
            // 先收集所有的 term_id 和對應的金額
            $term_ids = [];
            $expenses_data = [];
            
            while ($query->have_posts()) {
                $query->the_post();
                $term_id = get_post_meta(get_the_ID(), 'term_id', true);
                $amount = floatval(get_post_meta(get_the_ID(), 'amount', true));
                
                if ($term_id) {
                    $term_ids[] = $term_id;
                    $expenses_data[] = [
                        'term_id' => $term_id,
                        'amount' => $amount
                    ];
                }
            }
            wp_reset_postdata();
            
            // 一次性取得所有相關的 terms
            if (!empty($term_ids)) {
                $terms_args = [
                    'post_type' => 'terms',
                    'post__in' => array_unique($term_ids),
                    'posts_per_page' => -1,
                    'meta_query' => [
                        [
                            'key' => 'taxonomy',
                            'value' => 'expense_class',
                            'compare' => '='
                        ]
                    ]
                ];
                
                $terms_query = new \WP_Query($terms_args);
                error_log('terms_query');
                error_log(print_r($terms_query, true));
                $terms_map = [];
                
                if ($terms_query->have_posts()) {
                    while ($terms_query->have_posts()) {
                        $terms_query->the_post();
                        $terms_map[get_the_ID()] = get_post_field('post_name', get_the_ID());
                    }
                    wp_reset_postdata();
                }
                
                error_log('terms_map');
                error_log(print_r($terms_map, true));
                // 計算總金額：只計算指定的 Insurer Payment 類別
                foreach ($expenses_data as $expense) {
                    $term_id = $expense['term_id'];
                    $amount = $expense['amount'];
                    
                    if (isset($terms_map[$term_id])) {
                        $term_name = $terms_map[$term_id];
                        
                        // 如果是指定的 Insurer Payment 類別，就相加
                        if (in_array($term_name, $target_categories)) {
                            $total += $amount;
                        }
                    }
                }
            }
        }

        return round($total, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * 計算 Admin & General Expenses 分類金額
     *
     * @param string|null $start_date
     * @param string|null $end_date
     * @return array
     */
    private function calculate_admin_expenses_by_category($start_date, $end_date)
    {
        // 需要排除的類別 (避免重複計算)
        $excluded_categories = [
            'insurer-payment-cmb',
            'insurer-payment-msig', 
            'insurer-payment-taiping',
            'insurer-payment-tokio',
            'other-earning-rebate'  // 也排除 Other Earning，因為已經在 Other Earning 部分計算
        ];

        // 查詢 expenses 文章類型
        $args = [
            'post_type' => 'expenses',
            'posts_per_page' => -1
        ];
        
        // 只有在提供日期參數時才添加日期篩選
        if ($start_date && $end_date) {
            // 取得 WordPress 時區
            $wp_timezone = wp_timezone();
            
            // 建立開始和結束日期時間物件
            $start_datetime = new \DateTime($start_date . ' 00:00:00', $wp_timezone);
            $end_datetime = new \DateTime($end_date . ' 23:59:59', $wp_timezone);
            
            // 轉換為 UTC 時間戳記以進行資料庫查詢
            $start_timestamp = $start_datetime->getTimestamp();
            $end_timestamp = $end_datetime->getTimestamp();

            $args['meta_query'] = [
                'relation' => 'AND',
                [
                    'key' => 'date',
                    'value' => [$start_timestamp, $end_timestamp],
                    'compare' => 'BETWEEN',
                    'type' => 'NUMERIC'
                ]
            ];
        }

        $query = new \WP_Query($args);
        $category_totals = [];

        if ($query->have_posts()) {
            // 先收集所有的 term_id 和對應的金額
            $term_ids = [];
            $expenses_data = [];
            
            while ($query->have_posts()) {
                $query->the_post();
                $term_id = get_post_meta(get_the_ID(), 'term_id', true);
                $amount = floatval(get_post_meta(get_the_ID(), 'amount', true));
                
                if ($term_id) {
                    $term_ids[] = $term_id;
                    $expenses_data[] = [
                        'term_id' => $term_id,
                        'amount' => $amount
                    ];
                }
            }
            wp_reset_postdata();
            
            // 一次性取得所有相關的 terms
            if (!empty($term_ids)) {
                $terms_args = [
                    'post_type' => 'terms',
                    'post__in' => array_unique($term_ids),
                    'posts_per_page' => -1,
                    'meta_query' => [
                        [
                            'key' => 'taxonomy',
                            'value' => 'expense_class',
                            'compare' => '='
                        ]
                    ]
                ];
                
                $terms_query = new \WP_Query($terms_args);
                $terms_map = [];
                
                if ($terms_query->have_posts()) {
                    while ($terms_query->have_posts()) {
                        $terms_query->the_post();
                        $terms_map[get_the_ID()] = [
                            'post_name' => get_post_field('post_name', get_the_ID()),
                            'post_title' => html_entity_decode(get_the_title(), ENT_QUOTES, 'UTF-8')
                        ];
                    }
                    wp_reset_postdata();
                }
                
                // 按分類累加金額
                foreach ($expenses_data as $expense) {
                    $term_id = $expense['term_id'];
                    $amount = $expense['amount'];
                    
                    if (isset($terms_map[$term_id])) {
                        $term_name = $terms_map[$term_id]['post_name'];
                        $term_title = $terms_map[$term_id]['post_title'];
                        
                        // 排除指定的 Insurer Payment 類別
                        if (!in_array($term_name, $excluded_categories)) {
                            if (!isset($category_totals[$term_title])) {
                                $category_totals[$term_title] = 0;
                            }
                            $category_totals[$term_title] += $amount;
                        }
                    }
                }
            }
        }

        return $category_totals;
    }

    /**
     * 計算 Other Earning 總金額 (Insurer Payment 類別為 Other Earning – Rebate)
     *
     * @param string|null $start_date
     * @param string|null $end_date
     * @return float
     */
    private function calculate_other_earning_total($start_date, $end_date)
    {
        // 指定的 Other Earning 類別
        $target_category = 'other-earning-rebate';

        // 查詢 expenses 文章類型
        $args = [
            'post_type' => 'expenses',
            'posts_per_page' => -1
        ];
        
        // 只有在提供日期參數時才添加日期篩選
        if ($start_date && $end_date) {
            // 取得 WordPress 時區
            $wp_timezone = wp_timezone();
            
            // 建立開始和結束日期時間物件
            $start_datetime = new \DateTime($start_date . ' 00:00:00', $wp_timezone);
            $end_datetime = new \DateTime($end_date . ' 23:59:59', $wp_timezone);
            
            // 轉換為 UTC 時間戳記以進行資料庫查詢
            $start_timestamp = $start_datetime->getTimestamp();
            $end_timestamp = $end_datetime->getTimestamp();

            $args['meta_query'] = [
                'relation' => 'AND',
                [
                    'key' => 'date',
                    'value' => [$start_timestamp, $end_timestamp],
                    'compare' => 'BETWEEN',
                    'type' => 'NUMERIC'
                ]
            ];
        }

        $query = new \WP_Query($args);
        $total = 0;

        if ($query->have_posts()) {
            // 先收集所有的 term_id 和對應的金額
            $term_ids = [];
            $expenses_data = [];
            
            while ($query->have_posts()) {
                $query->the_post();
                $term_id = get_post_meta(get_the_ID(), 'term_id', true);
                $amount = floatval(get_post_meta(get_the_ID(), 'amount', true));
                
                if ($term_id) {
                    $term_ids[] = $term_id;
                    $expenses_data[] = [
                        'term_id' => $term_id,
                        'amount' => $amount
                    ];
                }
            }
            wp_reset_postdata();
            
            // 一次性取得所有相關的 terms
            if (!empty($term_ids)) {
                $terms_args = [
                    'post_type' => 'terms',
                    'post__in' => array_unique($term_ids),
                    'posts_per_page' => -1,
                    'meta_query' => [
                        [
                            'key' => 'taxonomy',
                            'value' => 'expense_class',
                            'compare' => '='
                        ]
                    ]
                ];
                
                $terms_query = new \WP_Query($terms_args);
                $terms_map = [];
                
                if ($terms_query->have_posts()) {
                    while ($terms_query->have_posts()) {
                        $terms_query->the_post();
                        $terms_map[get_the_ID()] = get_post_field('post_name', get_the_ID());
                    }
                    wp_reset_postdata();
                }
                
                // 計算指定類別的總金額
                foreach ($expenses_data as $expense) {
                    $term_id = $expense['term_id'];
                    $amount = $expense['amount'];
                    
                    if (isset($terms_map[$term_id])) {
                        $term_name = $terms_map[$term_id];
                        
                        // 檢查是否為目標類別
                        if ($term_name === $target_category) {
                            $total += $amount;
                        }
                    }
                }
            }
        }

        return round($total, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * 計算指定 insurer（通過 post_name）的 Insurer Payment 總金額
     * 從所有 receipts 中判斷是 debitNote/creditNote/renewal，然後進行 get_insurer_payment 之後將金額加總
     *
     * @param string|null $start_date
     * @param string|null $end_date
     * @param string $insurer_post_name insurer 的 post_name（例如 'msig-insurance-hong-kong-ltd'）
     * @return float
     */
    private function calculate_insurer_payment_total_by_post_name($start_date, $end_date, $insurer_post_name)
    {
        // 首先找到對應的 insurer
        $insurer_args = [
            'post_type' => 'insurers',
            'posts_per_page' => 1,
            'name' => $insurer_post_name, // 使用 post_name 查找
        ];
        
        $insurer_query = new \WP_Query($insurer_args);
        $insurer = null;
        
        if ($insurer_query->have_posts()) {
            $insurer_query->the_post();
            $insurer = $insurer_query->post;
        }
        wp_reset_postdata();
        
        if (!$insurer) {
            return 0;
        }
        
        $insurer_id = $insurer->ID;
        
        // 查詢期間內的 receipts
        $receipts_args = [
            'post_type' => 'receipts',
            'posts_per_page' => -1,
        ];
        
        if ($start_date && $end_date) {
            $wp_timezone = wp_timezone();
            $start_datetime = new \DateTime($start_date . ' 00:00:00', $wp_timezone);
            $end_datetime = new \DateTime($end_date . ' 23:59:59', $wp_timezone);
            $start_timestamp = $start_datetime->getTimestamp();
            $end_timestamp = $end_datetime->getTimestamp();
            
            $receipts_args['meta_query'] = [
                [
                    'key' => 'date',
                    'value' => [$start_timestamp, $end_timestamp],
                    'compare' => 'BETWEEN',
                    'type' => 'NUMERIC',
                ],
            ];
        }
        
        $receipts_query = new \WP_Query($receipts_args);
        $total = 0;
        
        if ($receipts_query->have_posts()) {
            // 收集所有需要的 note IDs
            $debit_note_ids = [];
            $credit_note_ids = [];
            $renewal_ids = [];
            
            while ($receipts_query->have_posts()) {
                $receipts_query->the_post();
                $receipt_id = get_the_ID();
                
                $debit_note_id = get_post_meta($receipt_id, 'debit_note_id', true);
                $credit_note_id = get_post_meta($receipt_id, 'created_from_credit_note_id', true);
                $renewal_id = get_post_meta($receipt_id, 'created_from_renewal_id', true);
                
                if ($debit_note_id) {
                    $debit_note_ids[] = $debit_note_id;
                }
                if ($credit_note_id) {
                    $credit_note_ids[] = $credit_note_id;
                }
                if ($renewal_id) {
                    $renewal_ids[] = $renewal_id;
                }
            }
            wp_reset_postdata();
            
            // 一次性查詢所有相關的 notes
            $debit_notes_map = [];
            $credit_notes_map = [];
            $renewals_map = [];
            
            if (!empty($debit_note_ids)) {
                $debit_notes_query = new \WP_Query([
                    'post_type' => 'debit_notes',
                    'post__in' => array_unique($debit_note_ids),
                    'posts_per_page' => -1,
                ]);
                if ($debit_notes_query->have_posts()) {
                    while ($debit_notes_query->have_posts()) {
                        $debit_notes_query->the_post();
                        $debit_notes_map[get_the_ID()] = $debit_notes_query->post;
                    }
                }
                wp_reset_postdata();
            }
            
            if (!empty($credit_note_ids)) {
                $credit_notes_query = new \WP_Query([
                    'post_type' => 'credit_notes',
                    'post__in' => array_unique($credit_note_ids),
                    'posts_per_page' => -1,
                ]);
                if ($credit_notes_query->have_posts()) {
                    while ($credit_notes_query->have_posts()) {
                        $credit_notes_query->the_post();
                        $credit_notes_map[get_the_ID()] = $credit_notes_query->post;
                    }
                }
                wp_reset_postdata();
            }
            
            if (!empty($renewal_ids)) {
                $renewals_query = new \WP_Query([
                    'post_type' => 'renewals',
                    'post__in' => array_unique($renewal_ids),
                    'posts_per_page' => -1,
                ]);
                if ($renewals_query->have_posts()) {
                    while ($renewals_query->have_posts()) {
                        $renewals_query->the_post();
                        $renewals_map[get_the_ID()] = $renewals_query->post;
                    }
                }
                wp_reset_postdata();
            }
            
            // 重新查詢 receipts 並計算
            $receipts_query = new \WP_Query($receipts_args);
            if ($receipts_query->have_posts()) {
                while ($receipts_query->have_posts()) {
                    $receipts_query->the_post();
                    $receipt = $receipts_query->post;
                    
                    $debit_note_id = get_post_meta($receipt->ID, 'debit_note_id', true);
                    $credit_note_id = get_post_meta($receipt->ID, 'created_from_credit_note_id', true);
                    $renewal_id = get_post_meta($receipt->ID, 'created_from_renewal_id', true);
                    
                    // 判斷是 debitNote/creditNote/renewal（優先順序：creditNote > renewal > debitNote）
                    $the_note = null;
                    $is_credit_note = false;
                    
                    if ($credit_note_id && isset($credit_notes_map[$credit_note_id])) {
                        $the_note = $credit_notes_map[$credit_note_id];
                        $is_credit_note = true;
                    } elseif ($renewal_id && isset($renewals_map[$renewal_id])) {
                        $the_note = $renewals_map[$renewal_id];
                    } elseif ($debit_note_id && isset($debit_notes_map[$debit_note_id])) {
                        $the_note = $debit_notes_map[$debit_note_id];
                    }
                    
                    // 檢查 theNote 的 insurer_id 是否匹配
                    if ($the_note) {
                        $note_insurer_id = get_post_meta($the_note->ID, 'insurer_id', true);
                        
                        if ($note_insurer_id == $insurer_id) {
                            $insurer_payment = $this->get_insurer_payment($the_note, $insurer);
                            
                            // 如果是 creditNote 則減去，否則加上
                            if ($is_credit_note) {
                                $total -= $insurer_payment;
                            } else {
                                $total += $insurer_payment;
                            }
                        }
                    }
                }
            }
            wp_reset_postdata();
        }
        
        return round($total, 2, PHP_ROUND_HALF_UP);
    }

    /**
     * Get trial balance callback
     *
     * @param \WP_REST_Request $request Request.
     * @return \WP_REST_Response
     */
    public function get_trial_balance_callback($request)
    { // phpcs:ignore
        $params = $request->get_query_params() ?? [];
        $params = WP::sanitize_text_field_deep($params, false);

        // 取得日期參數，考慮 WordPress 時區
        $wp_timezone = wp_timezone();
        $current_wp_time = new \DateTime('now', $wp_timezone);
        
        // 檢查是否有提供日期參數
        $has_date_params = isset($params['start_date']) || isset($params['end_date']);
        
        if ($has_date_params) {
            // 如果有提供日期參數，使用提供的值或預設值
            $start_date = isset($params['start_date']) ? $params['start_date'] : $current_wp_time->format('Y-m-01'); // 預設當月第一天
            $end_date = isset($params['end_date']) ? $params['end_date'] : $current_wp_time->format('Y-m-d'); // 預設今天
        } else {
            // 如果沒有提供任何日期參數，設為 null，表示不限制日期
            $start_date = null;
            $end_date = null;
        }

        // 計算期初日期（本期開始前一天）
        if ($start_date) {
            $start_date_obj = new \DateTime($start_date, $wp_timezone);
            $beginning_date_obj = clone $start_date_obj;
            $beginning_date_obj->modify('-1 day');
            $beginning_date = $beginning_date_obj->format('d/m/Y');
        } else {
            $beginning_date = '28/02/2024'; // 預設值
        }

        // 格式化報表日期
        if ($start_date && $end_date) {
            $start_date_obj = new \DateTime($start_date, $wp_timezone);
            $end_date_obj = new \DateTime($end_date, $wp_timezone);
            $period_label = $start_date_obj->format('d/m/y') . ' - ' . $end_date_obj->format('d/m/y');
        } else {
            $period_label = '01/03/24 - 31/03/24'; // 預設值
        }

        // Log 所有參數
        error_log('Trial Balance API - All params:');
        error_log(print_r($params, true));
        error_log('Trial Balance API - start_date: ' . ($start_date ?? 'null'));
        error_log('Trial Balance API - end_date: ' . ($end_date ?? 'null'));

        // 計算 Account Receivable 的 This Period Debit（期間內所開的 Debit Note 總金額）
        $account_receivable_this_period_debit = $this->calculate_account_receivable_debit($start_date, $end_date, $wp_timezone);
        
        // 計算 Account Receivable 的 This Period Credit（期間內開立的 Receipt 總金額）
        $account_receivable_this_period_credit = $this->calculate_receipt_total($start_date, $end_date);

        // 計算 SOC - Current 的 This Period Debit（期間內 上海商業銀行 Income + Adjust Balance）
        $soc_bank_name = '上海商業銀行';
        $soc_income = $this->calculate_receipt_total_by_bank($start_date, $end_date, $soc_bank_name);
        $soc_adjust_balance = $this->calculate_adjust_balance_total_by_bank($start_date, $end_date, $soc_bank_name);
        $soc_income_plus_adjust = round($soc_income + $soc_adjust_balance, 2, PHP_ROUND_HALF_UP);
        
        // 計算 SOC - Current 的 This Period Credit（期間內 上海商業銀行 Expenses，排除 Adjust Balance）
        $soc_expenses_total = $this->calculate_expenses_total_by_bank($start_date, $end_date, $soc_bank_name);

        // 計算 KP1 - Current 的 This Period Debit（期間內 中國銀行 Income + Adjust Balance）
        $boc_bank_name = '中國銀行';
        $boc_income = $this->calculate_receipt_total_by_bank($start_date, $end_date, $boc_bank_name);
        $boc_adjust_balance = $this->calculate_adjust_balance_total_by_bank($start_date, $end_date, $boc_bank_name);
        $boc_income_plus_adjust = round($boc_income + $boc_adjust_balance, 2, PHP_ROUND_HALF_UP);
        
        // 計算 KP1 - Current 的 This Period Credit（期間內 中國銀行 Expenses，排除 Adjust Balance）
        $boc_expenses_total = $this->calculate_expenses_total_by_bank($start_date, $end_date, $boc_bank_name);

        // 計算 A/C Payable - MSIG 的 This Period Debit（期間內 Expenses 中 term_id 的 post_name = 'insurer-payment-msig' 的金額總和）
        $msig_payment_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'insurer-payment-msig');
        
        // 計算 A/C Payable - MSIG 的 This Period Credit（期間內從所有 receipts 中判斷是 debitNote/creditNote/renewal，然後進行 get_insurer_payment 之後將金額加總）
        // insurer 的 post_name 為 'msig-insurance-hong-kong-ltd'
        $msig_insurer_payment_total = $this->calculate_insurer_payment_total_by_post_name($start_date, $end_date, 'msig-insurance-hong-kong-ltd');
        
        // 計算 A/C Payable - Tokio Marine 的 This Period Debit（期間內 Expenses 中 term_id 的 post_name = 'insurer-payment-tokio' 的金額總和）
        $tokio_payment_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'insurer-payment-tokio');
        
        // 計算 A/C Payable - CMB Wing Lung 的 This Period Debit（期間內 Expenses 中 term_id 的 post_name = 'insurer-payment-cmb' 的金額總和）
        $cmb_payment_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'insurer-payment-cmb');
        
        // 計算 A/C Payable - China Taiping 的 This Period Debit（期間內 Expenses 中 term_id 的 post_name = 'insurer-payment-taiping' 的金額總和）
        $taiping_payment_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'insurer-payment-taiping');
        
        // 計算 A/C Payable - Tokio Marine 的 This Period Credit（期間內從所有 receipts 中判斷是 debitNote/creditNote/renewal，然後進行 get_insurer_payment 之後將金額加總）
        // insurer 的 post_name 為 'the-tokio-marine-fire-ins-co-hk-ltd'
        $tokio_insurer_payment_total = $this->calculate_insurer_payment_total_by_post_name($start_date, $end_date, 'the-tokio-marine-fire-ins-co-hk-ltd');
        
        // 計算 A/C Payable - CMB Wing Lung 的 This Period Credit（期間內從所有 receipts 中判斷是 debitNote/creditNote/renewal，然後進行 get_insurer_payment 之後將金額加總）
        // insurer 的 post_name 為 'cmb-wing-lung-insurance-co-ltd'
        $cmb_insurer_payment_total = $this->calculate_insurer_payment_total_by_post_name($start_date, $end_date, 'cmb-wing-lung-insurance-co-ltd');
        
        // 計算 A/C Payable - China Taiping 的 This Period Credit（期間內從所有 receipts 中判斷是 debitNote/creditNote/renewal，然後進行 get_insurer_payment 之後將金額加總）
        // insurer 的 post_name 為 'china-taiping-insurance-hk-co-ltd'
        $taiping_insurer_payment_total = $this->calculate_insurer_payment_total_by_post_name($start_date, $end_date, 'china-taiping-insurance-hk-co-ltd');
        
        // 計算 Premium Paid - General 的 This Period Debit（等於所有 insurer payment 的總和）
        $premium_paid_general_debit = round($msig_insurer_payment_total + $tokio_insurer_payment_total + $cmb_insurer_payment_total + $taiping_insurer_payment_total, 2, PHP_ROUND_HALF_UP);
        
        // 計算 Rebate-Received 的 This Period Credit（期間內所有 Adjust Balance 的總金額）
        $adjust_balance_total = $this->calculate_adjust_balance_total($start_date, $end_date);
        
        // 計算 Salary - Li Chung Chai 的 This Period Debit（期間內 Expenses 中 term 的 post_name = 'salary-lcc' 的金額總和）
        $salary_lcc_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'salary-lcc');
        
        // 計算 Director Remuneration - Li Tsun Sun 的 This Period Debit（期間內 Expenses 中 term 的 post_name = 'dir-lts' 的金額總和）
        $dir_lts_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'dir-lts');
        
        // 計算 Printing & Stationery 的 This Period Debit（期間內 Expenses 中 term 的 post_name = 'pretty-cash-printing-stationery' 的金額總和）
        $printing_stationery_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'pretty-cash-printing-stationery');
        
        // 計算 Electricity, Water Fee & Gas 的 This Period Debit（期間內 Expenses 中 term 的 post_name = 'petty-cash-electricity' 的金額總和）
        $electricity_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'petty-cash-electricity');
        
        // 計算 Telephone Fax & Internet Fee 的 This Period Debit（期間內 Expenses 中 term 的 post_name = 'petty-cash-telephone' 的金額總和）
        $telephone_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'petty-cash-telephone');
        
        // 計算 Insurance 的 This Period Debit（期間內 Expenses 中 term 的 post_name = 'pia' 的金額總和）
        $insurance_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'pia');
        
        // 計算 Management Fee 的 This Period Debit（期間內 Expenses 中 term 的 post_name = 'management-fee' 的金額總和）
        $management_fee_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'ioyl');
        
        // 計算 Business Registration 的 This Period Debit（期間內 Expenses 中 term 的 post_name = 'misc' 的金額總和）
        $business_registration_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'misc');
        
        // 計算 Bank Charges 的 This Period Debit（期間內 Expenses 中 term 的 post_name = 'bank-charges' 的金額總和）
        $bank_charges_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'bank-charges');
        
        // 計算 Study Allowance 的 This Period Debit（期間內 Expenses 中 term 的 post_name = 'cpd' 的金額總和）
        $study_allowance_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'cpd');
        
        // 計算 Medical Expenese 的 This Period Debit（期間內 Expenses 中 term 的 post_name = 'petty-cash-medical' 的金額總和）
        $medical_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'petty-cash-medical');
        
        // 計算 MPF 的 This Period Debit（期間內 Expenses 中 term 的 post_name = 'mpf' 的金額總和）
        $mpf_total = $this->calculate_expenses_total_by_term_post_name($start_date, $end_date, 'mpf');
        
        // 計算所有 This Period Debit 的總和
        $total_this_period_debit = round(
            $account_receivable_this_period_debit +
            $soc_income_plus_adjust +
            $boc_income_plus_adjust +
            $msig_payment_total +
            $tokio_payment_total +
            $cmb_payment_total +
            $taiping_payment_total +
            $premium_paid_general_debit +
            $salary_lcc_total +
            $dir_lts_total +
            $printing_stationery_total +
            $electricity_total +
            $telephone_total +
            $insurance_total +
            $management_fee_total +
            $business_registration_total +
            $bank_charges_total +
            $study_allowance_total +
            $medical_total +
            $mpf_total,
            2,
            PHP_ROUND_HALF_UP
        );
        
        // 計算所有 This Period Credit 的總和
        $premium_received_credit = $account_receivable_this_period_debit;
        $total_this_period_credit = round(
            $account_receivable_this_period_credit +
            $soc_expenses_total +
            $boc_expenses_total +
            $msig_insurer_payment_total +
            $tokio_insurer_payment_total +
            $cmb_insurer_payment_total +
            $taiping_insurer_payment_total +
            $adjust_balance_total +
            $premium_received_credit,
            2,
            PHP_ROUND_HALF_UP
        );

        // 準備假資料 - Trial Balance 報表
        $data = [
            // 標題行（獨立於上方，可置中）
            [
                'No.' => '',
                'Attribute' => '',
                'Account Name' => 'TRIAL BALANCE',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '',
                'Ending Balance Credit' => '',
                'Category' => 'HEADER'
            ],
            [
                'No.' => '',
                'Attribute' => '',
                'Account Name' => 'For Period : ' . $period_label,
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '',
                'Ending Balance Credit' => '',
                'Category' => 'HEADER'
            ],
            [
                'No.' => '',
                'Attribute' => '',
                'Account Name' => '',
                'Beginning Balance Debit' => 'BEGINNING BALANCE Until ' . $beginning_date,
                'Beginning Balance Credit' => '',
                'This Period Debit' => 'THIS PERIOD',
                'This Period Credit' => '',
                'Ending Balance Debit' => 'ENDING BALANCE',
                'Ending Balance Credit' => '',
                'Category' => 'HEADER'
            ],
            [
                'No.' => 'No.',
                'Attribute' => 'Attribute',
                'Account Name' => 'Account Name',
                'Beginning Balance Debit' => 'Debit',
                'Beginning Balance Credit' => 'Credit',
                'This Period Debit' => 'Debit',
                'This Period Credit' => 'Credit',
                'Ending Balance Debit' => 'Debit',
                'Ending Balance Credit' => 'Credit',
                'Category' => 'HEADER'
            ],
                        
            // Assets（資產）
            // Fixed Asset (固定資產)
            [
                'No.' => 1,
                'Attribute' => 'Fixed Asset',
                'Account Name' => 'Motor car',
                'Beginning Balance Debit' => '195370.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '195370.00',
                'Ending Balance Credit' => '',
                'Category' => 'ASSET'
            ],
            [
                'No.' => 2,
                'Attribute' => 'Fixed Asset',
                'Account Name' => 'Furniture & Fixture',
                'Beginning Balance Debit' => '344950.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '344950.00',
                'Ending Balance Credit' => '',
                'Category' => 'ASSET'
            ],
            [
                'No.' => 4,
                'Attribute' => 'Fixed Asset',
                'Account Name' => 'Acc.depreciation - Motor Car',
                'Beginning Balance Debit' => '-195370.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '-195370.00',
                'Ending Balance Credit' => '',
                'Category' => 'CONTRA_ASSET'
            ],
            [
                'No.' => 5,
                'Attribute' => 'Fixed Asset',
                'Account Name' => 'Acc. Depreciation - F&F',
                'Beginning Balance Debit' => '-344950.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '-344950.00',
                'Ending Balance Credit' => '',
                'Category' => 'CONTRA_ASSET'
            ],
            [
                'No.' => 6,
                'Attribute' => 'Fixed Asset',
                'Account Name' => 'Leasehold Improvement',
                'Beginning Balance Debit' => '121300.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '121300.00',
                'Ending Balance Credit' => '',
                'Category' => 'ASSET'
            ],
            [
                'No.' => 6,
                'Attribute' => 'Fixed Asset',
                'Account Name' => 'Acc. Depreciation - LH1',
                'Beginning Balance Debit' => '-121300.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '-121300.00',
                'Ending Balance Credit' => '',
                'Category' => 'CONTRA_ASSET'
            ],
            
            // Current Asset (流動資產)
            [
                'No.' => 7,
                'Attribute' => 'Current Asset',
                'Account Name' => 'Utiliity & Other Deposit',
                'Beginning Balance Debit' => '400.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '400.00',
                'Ending Balance Credit' => '',
                'Category' => 'ASSET'
            ],
            [
                'No.' => 8,
                'Attribute' => 'Current Asset',
                'Account Name' => 'Account Receivable',
                'Beginning Balance Debit' => '13463.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $account_receivable_this_period_debit,
                'This Period Credit' => $account_receivable_this_period_credit,
                'Spacer 2' => '',
                'Ending Balance Debit' => '46286.82',
                'Ending Balance Credit' => '',
                'Category' => 'ASSET'
            ],
            
            // Cash at Bank & On Hold
            [
                'No.' => 9,
                'Attribute' => 'Cash at Bank & On Hold',
                'Account Name' => 'SOC - Current',
                'Beginning Balance Debit' => '796545.01',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $soc_income_plus_adjust,
                'This Period Credit' => $soc_expenses_total,
                'Spacer 2' => '',
                'Ending Balance Debit' => '963479.54',
                'Ending Balance Credit' => '',
                'Category' => 'ASSET'
            ],
            [
                'No.' => 10,
                'Attribute' => 'Cash at Bank & On Hold',
                'Account Name' => 'KP1 - Current',
                'Beginning Balance Debit' => '71365.20',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $boc_income_plus_adjust,
                'This Period Credit' => $boc_expenses_total,
                'Spacer 2' => '',
                'Ending Balance Debit' => '40592.40',
                'Ending Balance Credit' => '',
                'Category' => 'ASSET'
            ],
            [
                'No.' => 11,
                'Attribute' => 'Cash at Bank & On Hold',
                'Account Name' => 'SOS-Call',
                'Beginning Balance Debit' => '2470.01',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '2470.01',
                'Ending Balance Credit' => '',
                'Category' => 'ASSET'
            ],
            [
                'No.' => 12,
                'Attribute' => 'Cash at Bank & On Hold',
                'Account Name' => 'Cash on Hold',
                'Beginning Balance Debit' => '1519.92',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '1519.92',
                'Ending Balance Credit' => '',
                'Category' => 'ASSET'
            ],
            
            // Current Asset (流動資產) - continued
            [
                'No.' => 13,
                'Attribute' => 'Current Asset',
                'Account Name' => 'Li Tsun Sun - A/C',
                'Beginning Balance Debit' => '1565787.44',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '1565787.44',
                'Ending Balance Credit' => '',
                'Category' => 'ASSET'
            ],
            [
                'No.' => 14,
                'Attribute' => 'Current Asset',
                'Account Name' => 'Lai Yuen Chun - A/C',
                'Beginning Balance Debit' => '1420032.16',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '1420032.16',
                'Ending Balance Credit' => '',
                'Category' => 'ASSET'
            ],
            [
                'No.' => 15,
                'Attribute' => 'Current Asset',
                'Account Name' => 'Prepaid Expenses',
                'Beginning Balance Debit' => '5000.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '5000.00',
                'Ending Balance Credit' => '',
                'Category' => 'ASSET'
            ],
            
            // Liabilities（負債）
            [
                'No.' => 16,
                'Attribute' => 'Current Liabilities',
                'Account Name' => 'A/C Payable',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '12176.25',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '',
                'Ending Balance Credit' => '12176.25',
                'Category' => 'LIABILITY'
            ],
            [
                'No.' => 17,
                'Attribute' => 'Current Liabilities',
                'Account Name' => 'A/C Payable - MSIG',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '273140.01',
                'Spacer 1' => '',
                'This Period Debit' => $msig_payment_total,
                'This Period Credit' => $msig_insurer_payment_total,
                'Spacer 2' => '',
                'Ending Balance Debit' => '',
                'Ending Balance Credit' => '252686.60',
                'Category' => 'LIABILITY'
            ],
            [
                'No.' => 18,
                'Attribute' => 'Current Liabilities',
                'Account Name' => 'A/C Payable - Tokio Marine',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '14326.23',
                'Spacer 1' => '',
                'This Period Debit' => $tokio_payment_total,
                'This Period Credit' => $tokio_insurer_payment_total,
                'Spacer 2' => '',
                'Ending Balance Debit' => '',
                'Ending Balance Credit' => '20972.96',
                'Category' => 'LIABILITY'
            ],
            [
                'No.' => 19,
                'Attribute' => 'Current Liabilities',
                'Account Name' => 'A/C Payable - CMB Wing Lung',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '577755.47',
                'Spacer 1' => '',
                'This Period Debit' => $cmb_payment_total,
                'This Period Credit' => $cmb_insurer_payment_total,
                'Spacer 2' => '',
                'Ending Balance Debit' => '',
                'Ending Balance Credit' => '616766.08',
                'Category' => 'LIABILITY'
            ],
            [
                'No.' => 20,
                'Attribute' => 'Current Liabilities',
                'Account Name' => 'A/C Payable - China Taiping',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '15416.69',
                'Spacer 1' => '',
                'This Period Debit' => $taiping_payment_total,
                'This Period Credit' => $taiping_insurer_payment_total,
                'Spacer 2' => '',
                'Ending Balance Debit' => '',
                'Ending Balance Credit' => '1869.54',
                'Category' => 'LIABILITY'
            ],
            [
                'No.' => 21,
                'Attribute' => 'Current Liabilities',
                'Account Name' => 'Creditor - Agent',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '-2044.25',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '',
                'Ending Balance Credit' => '-2044.25',
                'Category' => 'LIABILITY'
            ],
            [
                'No.' => 22,
                'Attribute' => 'Current Liabilities',
                'Account Name' => 'Accrual Expenses',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '9100.00',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '',
                'Ending Balance Credit' => '9100.00',
                'Category' => 'LIABILITY'
            ],
            
            // Equity（權益）
            [
                'No.' => 23,
                'Attribute' => 'Capital',
                'Account Name' => 'Share Capital',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '2.00',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '',
                'Ending Balance Credit' => '2.00',
                'Category' => 'EQUITY'
            ],
            [
                'No.' => 24,
                'Attribute' => 'Capital',
                'Account Name' => 'Retained Profit',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '3072069.61',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '',
                'Ending Balance Credit' => '3072069.61',
                'Category' => 'EQUITY'
            ],
            
            // Revenue（收入）
            [
                'No.' => 25,
                'Attribute' => 'Income',
                'Account Name' => 'Premium Received',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '2322723.00',
                'This Period Debit' => '',
                'This Period Credit' => $account_receivable_this_period_debit,
                'Ending Balance Debit' => '',
                'Ending Balance Credit' => '2534014.57',
                'Category' => 'REVENUE'
            ],
            [
                'No.' => 26,
                'Attribute' => 'Less',
                'Account Name' => 'Premium Paid - General',
                'Beginning Balance Debit' => '1885945.94',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $premium_paid_general_debit,
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '2016608.86',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 27,
                'Attribute' => 'Other Earning',
                'Account Name' => 'Rebate-Received',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => $adjust_balance_total,
                'Spacer 2' => '',
                'Ending Balance Debit' => '',
                'Ending Balance Credit' => '118710.00',
                'Category' => 'REVENUE'
            ],
            [
                'No.' => 28,
                'Attribute' => 'Income',
                'Account Name' => 'Other Income',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '16.97',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '',
                'Ending Balance Credit' => '16.97',
                'Category' => 'REVENUE'
            ],
            
            // Expenses（費用）
            [
                'No.' => 29,
                'Attribute' => 'Selling Expenses',
                'Account Name' => 'Entertainment',
                'Beginning Balance Debit' => '10040.57',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '10040.57',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 30,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Salary - Li Chung Chai',
                'Beginning Balance Debit' => '198000.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $salary_lcc_total,
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '215100.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 31,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Salary - Lai Yuen Chun',
                'Beginning Balance Debit' => '0.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '0.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 32,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Director Remuneration - Li Tsun Sun',
                'Beginning Balance Debit' => '176000.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $dir_lts_total,
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '192000.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 33,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Printing & Stationery',
                'Beginning Balance Debit' => '1050.18',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $printing_stationery_total,
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '1168.06',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 34,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Rent & Rates',
                'Beginning Balance Debit' => '16640.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '16640.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 35,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Electricity, Water Fee & Gas',
                'Beginning Balance Debit' => '22275.71',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $electricity_total,
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '23278.71',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 36,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Telephone Fax & Internet Fee',
                'Beginning Balance Debit' => '14037.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $telephone_total,
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '14353.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 37,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Insurance',
                'Beginning Balance Debit' => '11139.84',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $insurance_total,
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '14019.84',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 38,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Management Fee',
                'Beginning Balance Debit' => '9900.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $management_fee_total,
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '10800.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 39,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Stamp & Postage',
                'Beginning Balance Debit' => '1264.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '1264.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 40,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Repairs & Maintenance',
                'Beginning Balance Debit' => '1520.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '1520.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 41,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Business Registration',
                'Beginning Balance Debit' => '450.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $business_registration_total,
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '555.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 42,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Bank Charges',
                'Beginning Balance Debit' => '1100.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $bank_charges_total,
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '1200.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 43,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Sundry Expenses',
                'Beginning Balance Debit' => '2175.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '2175.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 44,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Study Allowance',
                'Beginning Balance Debit' => '2080.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $study_allowance_total,
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '3120.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 45,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Travel Expenses',
                'Beginning Balance Debit' => '4500.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '4500.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 46,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Bonus',
                'Beginning Balance Debit' => '30000.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '30000.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 47,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Lucky Money',
                'Beginning Balance Debit' => '7000.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '7000.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 48,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Medical Expenese',
                'Beginning Balance Debit' => '3981.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $medical_total,
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '4629.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 49,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'MPF',
                'Beginning Balance Debit' => '9900.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $mpf_total,
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => '11700.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 50,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Audit Fee',
                'Beginning Balance Debit' => '9100.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => '9100.00',
                'Ending Balance Credit' => '',
                'Category' => 'EXPENSE'
            ],
            
            // 總計行
            [
                'Account Name' => 'Total:',
                'Beginning Balance Debit' => '6294681.98',
                'Beginning Balance Credit' => '6294681.98',
                'Spacer 1' => '',
                'This Period Debit' => $total_this_period_debit,
                'This Period Credit' => $total_this_period_credit,
                'Spacer 2' => '',
                'Ending Balance Debit' => '6636340.33',
                'Ending Balance Credit' => '6636340.33',
                'Category' => 'TOTAL'
            ]
        ];

        // 確保 HEADER、EMPTY 和 TOTAL 類別有 No. 和 Attribute 字段（為空）
        foreach ($data as $key => $row) {
            if (isset($row['Category']) && ($row['Category'] === 'HEADER' || $row['Category'] === 'EMPTY' || $row['Category'] === 'TOTAL')) {
                if (!isset($row['No.'])) {
                    $data[$key]['No.'] = '';
                }
                if (!isset($row['Attribute'])) {
                    $data[$key]['Attribute'] = '';
                }
            }
        }

        // 轉換所有金額字段為數字格式（保留兩位小數，空值為 null）
        $amount_fields = [
            'Beginning Balance Debit',
            'Beginning Balance Credit',
            'This Period Debit',
            'This Period Credit',
            'Ending Balance Debit',
            'Ending Balance Credit'
        ];
        
        foreach ($data as $key => $row) {
            // 對於 HEADER 和 EMPTY 類別，保持原樣（空字符串）
            if (isset($row['Category']) && ($row['Category'] === 'HEADER' || $row['Category'] === 'EMPTY')) {
                continue;
            }
            
            foreach ($amount_fields as $field) {
                if (isset($row[$field])) {
                    $value = $row[$field];
                    // 如果是空字符串，轉換為 null
                    if ($value === '' || $value === null) {
                        $data[$key][$field] = null;
                    } else {
                        // 轉換為數字，保留兩位小數
                        $data[$key][$field] = round((float) $value, 2);
                    }
                }
            }
        }

        $response = new \WP_REST_Response([
            'data' => $data,
            'total' => count($data),
            'success' => true
        ], 200);
        
        // 設定 JSON 編碼選項，避免斜線轉義
        $response->set_headers(['Content-Type' => 'application/json; charset=utf-8']);
        
        return $response;
    }
}
