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
			'meta_type'         => 'integer',
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
		'cheque_number' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
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
