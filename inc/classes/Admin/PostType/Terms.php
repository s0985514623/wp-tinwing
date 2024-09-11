<?php
/**
 * Terms post type 的 post meta
 */

declare(strict_types=1);

namespace J7\WpTinwing\Admin\PostType;

/**
 * Terms post type 的 post meta
 */
final class Terms {
	use \J7\WpUtils\Traits\SingletonTrait;

	/**
	 * 收據 post meta
	 *
	 * @var array
	 */
	public $terms_meta = [
		'taxonomy' =>[
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
		return $this->terms_meta;
	}
}
