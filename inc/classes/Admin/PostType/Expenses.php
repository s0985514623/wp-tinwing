<?php
/**
 * Expenses post type 的 post meta
 */

declare(strict_types=1);

namespace J7\WpTinwing\Admin\PostType;

/**
 * Expenses post type 的 post meta
 */
final class Expenses {
	use \J7\WpUtils\Traits\SingletonTrait;

	/**
	 * 收據 post meta
	 *
	 * @var array
	 */
	public $expenses_meta = [
		'amount' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'number',
			'sanitize_callback' => 'absint',
		],
		'term_id' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'date' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'cheque_no' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		// BANK
		'payment_receiver_account' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		// Is Adjust Balance
		'is_adjust_balance' =>[
			'display_function'  => 'render_meta_checkbox',
			'input_type'        => 'checkbox',
			'meta_type'         => 'boolean',
			'sanitize_callback' => 'rest_sanitize_boolean',
		],
		// Payment Date
		'payment_date' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'remark' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
	];
	/**
	 * 建構子
	 */
	public function __construct() {
	}
	/**
	 * 取得收據 post meta
	 *
	 * @return array
	 */
	public function get_meta() {
		return $this->expenses_meta;
	}
}
