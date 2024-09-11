<?php
/**
 * InsurerProducts post type 的 post meta
 */

declare(strict_types=1);

namespace J7\WpTinwing\Admin\PostType;

/**
 * InsurerProducts post type 的 post meta
 * 未使用到先開起來放著
 */
final class InsurerProducts {
	use \J7\WpUtils\Traits\SingletonTrait;

	/**
	 * 收據 post meta
	 *
	 * @var array
	 */
	public $insurer_products_meta = [
		'term_id' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'policy_no' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		'insurance_amount' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'remark' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'textarea',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_textarea_field',
		],
		'insurer_d' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'insurer_products_number' =>[
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
		return $this->insurer_products_meta;
	}
}
