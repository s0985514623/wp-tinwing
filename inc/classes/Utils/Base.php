<?php
/**
 * Base
 */

declare (strict_types = 1);

namespace J7\WpTinwing\Utils;

/**
 * Class Base
 */
abstract class Base {
	const BASE_URL      = '/';
	const APP1_SELECTOR = '#wp_tinwing';
	const APP2_SELECTOR = '#wp_tinwing_metabox';
	const API_TIMEOUT   = '30000';
	const DEFAULT_IMAGE = 'http://1.gravatar.com/avatar/1c39955b5fe5ae1bf51a77642f052848?s=96&d=mm&r=g';

	/**
	 * 清理 value 值為空的陣列
	 *
	 * @param array $meta_query 陣列
	 * @return array
	 */
	public static function sanitize_meta_query( $meta_query ) {
		foreach ($meta_query as $key => $array) {
			if (!\is_array($array)) {
				continue;
			}
			if (!isset($array['value'])) {
				unset($meta_query[ $key ]);
			}
		}
		return array_values($meta_query);
	}
}
