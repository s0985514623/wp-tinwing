<?php
/**
 * OtherEarnings post type 的 post meta
 */

declare(strict_types=1);

namespace J7\WpTinwing\Admin\PostType;

/**
 * OtherEarnings post type 的 post meta
 */
final class OtherEarnings {
	use \J7\WpUtils\Traits\SingletonTrait;

	/**
	 * 其他收入 post meta
	 *
	 * @var array
	 */
	public $other_earnings_meta = [
		'amount' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'number',
			'sanitize_callback' => 'absint',
		],
		'date' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		// Payment Date
		'payment_date' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		// BANK
		'payment_receiver_account' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
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
	 * 取得其他收入 post meta
	 *
	 * @return array
	 */
	public function get_meta() {
		return $this->other_earnings_meta;
	}
}
