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
     * Trial Balance 費用科目與 Tinwing 支出分類（expense_class）的對應
     *
     * 來源：客戶 2026-09-14 提供的「RAN-Trial Balance-2.xlsx」Expenses Catagories 工作表。
     * key 是系統裡的分類名稱，value 是 Trial Balance 的 Account Name，多個分類可累加到同一個科目。
     *
     * 刻意用「名稱」而不是 slug 或 ID 比對：分類大多是從「Others N」空位改名而來，slug 沒跟著改
     * （例如 Audit Fee 的 slug 是 misc、Gift 的 slug 是 others-3），用 slug 會對錯科目。
     * 比對前兩邊都會經過 normalize_expense_class_name()，大小寫、en dash、隱形字元都不影響。
     * 名稱為「Others 數字」的分類不列在這裡，統一歸到 TRIAL_BALANCE_EXPENSE_OTHERS_ITEM。
     */
    private const TRIAL_BALANCE_EXPENSE_MAP = [
        'Golf (entertainment )'                      => 'Entertainment',
        'Loan to director'                           => 'Loan to Director',
        'Bank Audit Charge'                          => 'Bank Charges',
        'Bank Charges'                               => 'Bank Charges',
        'Bonus'                                      => 'Bonus',
        'Business Registration'                      => 'Business Registration',
        'CPD – Study Allowance'                      => 'Study Allowance',
        'Director Remuneration – Li Tsun Sun'        => 'Director Remuneration - Li Tsun Sun',
        'Petty Cash – Entertainment'                 => 'Entertainment',
        'Insurance'                                  => 'Insurance',
        'Management Fee'                             => 'Management Fee',
        'Lucky Money'                                => 'Lucky Money',
        'Audit Fee'                                  => 'Audit Fee',
        'MPF'                                        => 'MPF',
        'New Computer System'                        => 'New Computer System',
        'MPF – Li Chung Chai'                        => 'Salary - Li Chung Chai',
        'MPF – Lai Yuen Chun'                        => 'Salary - Lai Yuen Chun',
        'Gift'                                       => 'Gift',
        'Repairs & Maintenance'                      => 'Repairs & Maintenance',
        'Petty Cash – Electricity / Wate Fee / Gas.' => 'Electricity, Water Fee & Gas',
        'Petty Cash – Gift'                          => 'Gift',
        'Petty Cash – Medical'                       => 'Medical Expenese',
        'Petty Cash – Repair & Maintance'            => 'Repairs & Maintenance',
        'Petty Cash – Postage / Stamp'               => 'Stamp & Postage',
        'Petty Cash – Rent & Rates'                  => 'Rent & Rates',
        'Petty Cash – Sundry'                        => 'Sundry Expenses',
        'Petty Cash – Telephone'                     => 'Telephone Fax & Internet Fee',
        'Petty Cash – Travel'                        => 'Travel Expenses',
        'Commission – D/R Li Tsun Sun'               => 'Director Remuneration - Li Tsun Sun',
        'Pretty Cash – Printing & Stationery'        => 'Printing & Stationery',
        'Printing'                                   => 'Printing & Stationery',
        'Salary – Li Chung Chai'                     => 'Salary - Li Chung Chai',
        'Salary – Lai Yuen Chun'                     => 'Salary - Lai Yuen Chun',
        'Visa – Electricity / Wate Fee / Gas.'       => 'Electricity, Water Fee & Gas',
        'Visa – Entertainment'                       => 'Entertainment',
        'Visa – Gift'                                => 'Gift',
        'Visa – Medical'                             => 'Medical Expenese',
        'Visa – Tax'                                 => 'Tax',
        'Visa – Postage / Stamp'                     => 'Stamp & Postage',
        'Visa – Rent & Rates'                        => 'Rent & Rates',
        'Visa – Sundry'                              => 'Sundry Expenses',
        'Visa – Tel / Fax / Internet Fee'            => 'Telephone Fax & Internet Fee',
        'Visa – BR'                                  => 'Business Registration',
        'Visa – Travel'                              => 'Travel Expenses',
    ];

    /**
     * 名稱為「Others 數字」的自訂分類在 Trial Balance 上顯示的科目
     */
    private const TRIAL_BALANCE_EXPENSE_OTHERS_ITEM = 'Misc';

    /**
     * 已由 A/C Payable 各列計算的保險公司付款分類（slug），費用科目彙總時略過
     */
    private const TRIAL_BALANCE_INSURER_PAYMENT_SLUGS = [
        'insurer-payment-msig',
        'insurer-payment-tokio',
        'insurer-payment-cmb',
        'insurer-payment-taiping',
    ];

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
     * 正規化支出分類名稱，供 Trial Balance 對應表比對
     *
     * 系統裡部分分類名稱帶著從別處貼上的隱形字元（U+2060），連接號也有 en dash 與 hyphen 混用，
     * 這裡統一移除隱形字元、把 en/em dash 換成 hyphen、壓縮空白並轉小寫。
     *
     * @param string $name 分類名稱
     * @return string
     */
    private function normalize_expense_class_name(string $name): string
    {
        $name = html_entity_decode($name, ENT_QUOTES, 'UTF-8');
        $name = preg_replace('/[\x{200B}-\x{200D}\x{2060}\x{FEFF}]/u', '', $name) ?? $name;
        $name = str_replace(["\u{2013}", "\u{2014}"], '-', $name);
        $name = preg_replace('/\s+/u', ' ', $name) ?? $name;

        return strtolower(trim($name));
    }

    /**
     * 計算 Trial Balance 各費用科目的 This Period Debit
     *
     * 依 TRIAL_BALANCE_EXPENSE_MAP 把期間內的 Expenses 按分類名稱累加到科目，
     * 取代原本「每個科目各查一次、只認一個 slug」的做法。
     * 保險公司付款分類已由 A/C Payable 各列計算，這裡略過；
     * 其餘對不到科目的分類只記 log、不歸入任何一列，讓合計借貸不平衡成為看得見的訊號，
     * 而不是悄悄併進 Misc。
     *
     * @param string|null $start_date
     * @param string|null $end_date
     * @return array<string, float> key 為 Trial Balance 的 Account Name，涵蓋所有費用科目
     */
    private function calculate_expenses_totals_by_trial_balance_item($start_date, $end_date): array
    {
        $item_by_name = [];
        foreach (self::TRIAL_BALANCE_EXPENSE_MAP as $category_name => $item) {
            $item_by_name[$this->normalize_expense_class_name($category_name)] = $item;
        }

        $items = array_unique(array_merge(array_values(self::TRIAL_BALANCE_EXPENSE_MAP), [self::TRIAL_BALANCE_EXPENSE_OTHERS_ITEM]));
        $totals = array_fill_keys($items, 0.0);

        $args = [
            'post_type' => 'expenses',
            'posts_per_page' => -1,
            'fields' => 'ids',
        ];

        if ($start_date && $end_date) {
            $wp_timezone = wp_timezone();
            $start_datetime = new \DateTime($start_date . ' 00:00:00', $wp_timezone);
            $end_datetime = new \DateTime($end_date . ' 23:59:59', $wp_timezone);

            $args['meta_query'] = [
                'relation' => 'AND',
                [
                    'key' => 'date',
                    'value' => [$start_datetime->getTimestamp(), $end_datetime->getTimestamp()],
                    'compare' => 'BETWEEN',
                    'type' => 'NUMERIC'
                ]
            ];
        }

        // 依分類加總金額；Adjust Balance 不屬於任何費用科目
        $amount_by_term = [];
        foreach ((new \WP_Query($args))->posts as $expense_id) {
            if (filter_var(get_post_meta($expense_id, 'is_adjust_balance', true), FILTER_VALIDATE_BOOLEAN)) {
                continue;
            }
            $term_id = (int) get_post_meta($expense_id, 'term_id', true);
            if (!$term_id) {
                continue;
            }
            $amount_by_term[$term_id] = ($amount_by_term[$term_id] ?? 0.0) + floatval(get_post_meta($expense_id, 'amount', true));
        }

        if (empty($amount_by_term)) {
            return $totals;
        }

        $term_ids = (new \WP_Query([
            'post_type' => 'terms',
            'post__in' => array_keys($amount_by_term),
            'posts_per_page' => -1,
            'fields' => 'ids',
            'meta_query' => [
                [
                    'key' => 'taxonomy',
                    'value' => 'expense_class',
                    'compare' => '='
                ]
            ]
        ]))->posts;
        // 統一成 int，才能與 $amount_by_term 的 key 做嚴格比對
        $term_ids = array_map('intval', $term_ids);

        $unmapped = [];
        foreach ($amount_by_term as $term_id => $amount) {
            if (!in_array($term_id, $term_ids, true)) {
                $unmapped['term_id ' . $term_id] = $amount;
                continue;
            }
            if (in_array(get_post_field('post_name', $term_id), self::TRIAL_BALANCE_INSURER_PAYMENT_SLUGS, true)) {
                continue;
            }

            $category_name = (string) get_post_field('post_title', $term_id);
            $normalized = $this->normalize_expense_class_name($category_name);

            if (isset($item_by_name[$normalized])) {
                $totals[$item_by_name[$normalized]] += $amount;
            } elseif (preg_match('/^others \d+$/', $normalized)) {
                $totals[self::TRIAL_BALANCE_EXPENSE_OTHERS_ITEM] += $amount;
            } else {
                $unmapped[$category_name] = $amount;
            }
        }

        if (!empty($unmapped)) {
            error_log('Trial Balance - 對不到科目的支出分類（未計入任何費用列）: ' . wp_json_encode($unmapped, JSON_UNESCAPED_UNICODE));
        }

        foreach ($totals as $item => $total) {
            $totals[$item] = round($total, 2, PHP_ROUND_HALF_UP);
        }

        return $totals;
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

        // 期初餘額是截至 31/03/2025 的固定數字，不隨報表起始日變動，標題日期也跟著固定（客戶 2026-09-14 確認）
        $beginning_date = '31/03/2025';

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
        
        // Selling / Admin & General Expenses 各科目的 This Period Debit：
        // 依 TRIAL_BALANCE_EXPENSE_MAP 把期間內的支出按分類名稱累加到科目，一次查詢算完
        $expense_totals = $this->calculate_expenses_totals_by_trial_balance_item($start_date, $end_date);

        // Trial Balance 報表資料（期末與合計為 null，由下方計算）
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
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'ASSET'
            ],
            [
                'No.' => 2,
                'Attribute' => 'Fixed Asset',
                'Account Name' => 'Furniture & Fixture',
                'Beginning Balance Debit' => '356600.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
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
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
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
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
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
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
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
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
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
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'ASSET'
            ],
            [
                'No.' => 8,
                'Attribute' => 'Current Asset',
                'Account Name' => 'Account Receivable',
                'Beginning Balance Debit' => '29546.00',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $account_receivable_this_period_debit,
                'This Period Credit' => $account_receivable_this_period_credit,
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'ASSET'
            ],
            
            // Cash at Bank & On Hold
            [
                'No.' => 9,
                'Attribute' => 'Cash at Bank & On Hold',
                'Account Name' => 'SOC - Current',
                'Beginning Balance Debit' => '417503.19',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $soc_income_plus_adjust,
                'This Period Credit' => $soc_expenses_total,
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'ASSET'
            ],
            [
                'No.' => 10,
                'Attribute' => 'Cash at Bank & On Hold',
                'Account Name' => 'KP1 - Current',
                'Beginning Balance Debit' => '20722.54',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $boc_income_plus_adjust,
                'This Period Credit' => $boc_expenses_total,
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
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
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
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
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
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
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
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
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
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
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
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
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'LIABILITY'
            ],
            [
                'No.' => 17,
                'Attribute' => 'Current Liabilities',
                'Account Name' => 'A/C Payable - MSIG',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '232538.10',
                'Spacer 1' => '',
                'This Period Debit' => $msig_payment_total,
                'This Period Credit' => $msig_insurer_payment_total,
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'LIABILITY'
            ],
            [
                'No.' => 18,
                'Attribute' => 'Current Liabilities',
                'Account Name' => 'A/C Payable - Tokio Marine',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '25403.88',
                'Spacer 1' => '',
                'This Period Debit' => $tokio_payment_total,
                'This Period Credit' => $tokio_insurer_payment_total,
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'LIABILITY'
            ],
            [
                'No.' => 19,
                'Attribute' => 'Current Liabilities',
                'Account Name' => 'A/C Payable - CMB Wing Lung',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '25985.04',
                'Spacer 1' => '',
                'This Period Debit' => $cmb_payment_total,
                'This Period Credit' => $cmb_insurer_payment_total,
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'LIABILITY'
            ],
            [
                'No.' => 20,
                'Attribute' => 'Current Liabilities',
                'Account Name' => 'A/C Payable - China Taiping',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '2334.65',
                'Spacer 1' => '',
                'This Period Debit' => $taiping_payment_total,
                'This Period Credit' => $taiping_insurer_payment_total,
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'LIABILITY'
            ],
            [
                'No.' => 21,
                'Attribute' => 'Current Liabilities',
                'Account Name' => 'Creditor - Agent',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '11398.33',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
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
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
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
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EQUITY'
            ],
            [
                'No.' => 24,
                'Attribute' => 'Capital',
                'Account Name' => 'Retained Profit',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '3155693.01',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EQUITY'
            ],
            
            // Revenue（收入）
            [
                'No.' => 25,
                'Attribute' => 'Income',
                'Account Name' => 'Premium Received',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'This Period Debit' => '',
                'This Period Credit' => $account_receivable_this_period_debit,
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'REVENUE'
            ],
            [
                'No.' => 26,
                'Attribute' => 'Less',
                'Account Name' => 'Premium Paid - General',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $premium_paid_general_debit,
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 27,
                'Attribute' => 'Other Earning',
                'Account Name' => 'Rebate-Received / Others',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => $adjust_balance_total,
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'REVENUE'
            ],
            [
                'No.' => 28,
                'Attribute' => 'Income',
                'Account Name' => 'Other Income',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => '',
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'REVENUE'
            ],
            
            // Expenses（費用）
            [
                'No.' => 29,
                'Attribute' => 'Selling Expenses',
                'Account Name' => 'Entertainment',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Entertainment'],
                'This Period Credit' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 30,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Salary - Li Chung Chai',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Salary - Li Chung Chai'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 31,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Salary - Lai Yuen Chun',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Salary - Lai Yuen Chun'],
                'This Period Credit' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 32,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Director Remuneration - Li Tsun Sun',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Director Remuneration - Li Tsun Sun'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 33,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Printing & Stationery',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Printing & Stationery'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 34,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Rent & Rates',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Rent & Rates'],
                'This Period Credit' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 35,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Electricity, Water Fee & Gas',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Electricity, Water Fee & Gas'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 36,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Telephone Fax & Internet Fee',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Telephone Fax & Internet Fee'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 37,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Insurance',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Insurance'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 38,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Management Fee',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Management Fee'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 39,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Stamp & Postage',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Stamp & Postage'],
                'This Period Credit' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 40,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Repairs & Maintenance',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Repairs & Maintenance'],
                'This Period Credit' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 41,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Business Registration',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Business Registration'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 42,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Bank Charges',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Bank Charges'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 43,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Sundry Expenses',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Sundry Expenses'],
                'This Period Credit' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 44,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Study Allowance',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Study Allowance'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 45,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Travel Expenses',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Travel Expenses'],
                'This Period Credit' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 46,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Bonus',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Bonus'],
                'This Period Credit' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 47,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Lucky Money',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Lucky Money'],
                'This Period Credit' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 48,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Medical Expenese',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Medical Expenese'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 49,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'MPF',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['MPF'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 50,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Audit Fee',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Audit Fee'],
                'This Period Credit' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 51,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'New Computer System',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['New Computer System'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 52,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Tax',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Tax'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 53,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Gift',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Gift'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 54,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Loan to Director',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Loan to Director'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            [
                'No.' => 55,
                'Attribute' => 'Admin & General Expenses',
                'Account Name' => 'Misc',
                'Beginning Balance Debit' => '',
                'Beginning Balance Credit' => '',
                'Spacer 1' => '',
                'This Period Debit' => $expense_totals['Misc'],
                'This Period Credit' => '',
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
                'Category' => 'EXPENSE'
            ],
            
            // 總計行
            [
                // 六個金額欄由下方依各列加總
                'Account Name' => 'Total:',
                'Beginning Balance Debit' => null,
                'Beginning Balance Credit' => null,
                'Spacer 1' => '',
                'This Period Debit' => null,
                'This Period Credit' => null,
                'Spacer 2' => '',
                'Ending Balance Debit' => null,
                'Ending Balance Credit' => null,
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

        // 期末餘額與合計一律由期初 + 本期算出，不再寫死
        // ASSET / CONTRA_ASSET / EXPENSE 屬借方性質，其餘屬貸方性質；
        // 淨額為負時照放在性質那一側（例如累計折舊的期末借方為負數），與客戶的 Excel 一致
        $to_amount = static function ($value): ?float {
            return ('' === $value || null === $value) ? null : (float) $value;
        };
        // + 0.0 是為了把 -0.0 轉成 0.0，避免匯出時出現 -0.00
        $round_amount = static function (float $value): float {
            return round($value, 2, PHP_ROUND_HALF_UP) + 0.0;
        };
        $debit_nature_categories = ['ASSET', 'CONTRA_ASSET', 'EXPENSE'];
        $total_fields = [
            'Beginning Balance Debit',
            'Beginning Balance Credit',
            'This Period Debit',
            'This Period Credit',
            'Ending Balance Debit',
            'Ending Balance Credit',
        ];
        $totals = array_fill_keys($total_fields, 0.0);

        foreach ($data as $key => $row) {
            $category = $row['Category'] ?? '';
            if (in_array($category, ['HEADER', 'EMPTY', 'TOTAL'], true)) {
                continue;
            }

            $beginning_debit = $to_amount($row['Beginning Balance Debit'] ?? null);
            $beginning_credit = $to_amount($row['Beginning Balance Credit'] ?? null);
            $period_debit = $to_amount($row['This Period Debit'] ?? null);
            $period_credit = $to_amount($row['This Period Credit'] ?? null);

            $data[$key]['Ending Balance Debit'] = null;
            $data[$key]['Ending Balance Credit'] = null;

            // 四個來源都沒有值的科目（例如 Other Income）期末留空，不顯示 0
            if (null !== $beginning_debit || null !== $beginning_credit || null !== $period_debit || null !== $period_credit) {
                $debit_sum = (float) $beginning_debit + (float) $period_debit;
                $credit_sum = (float) $beginning_credit + (float) $period_credit;
                if (in_array($category, $debit_nature_categories, true)) {
                    $data[$key]['Ending Balance Debit'] = $round_amount($debit_sum - $credit_sum);
                } else {
                    $data[$key]['Ending Balance Credit'] = $round_amount($credit_sum - $debit_sum);
                }
            }

            foreach ($total_fields as $field) {
                $totals[$field] += (float) $to_amount($data[$key][$field]);
            }
        }

        foreach ($data as $key => $row) {
            if ('TOTAL' === ($row['Category'] ?? '')) {
                foreach ($total_fields as $field) {
                    $data[$key][$field] = $round_amount($totals[$field]);
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
