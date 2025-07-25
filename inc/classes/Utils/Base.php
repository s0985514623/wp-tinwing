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
			// 不是陣列就跳過
			if (!\is_array($array)) {
				continue;
			}
			// 如果有 relation，表示是群組，遞迴處理
			if ( isset( $array['relation'] ) ) {
				$meta_query[ $key ] = self::sanitize_meta_query( $array );
	
				// 如果 relation 底下沒有有效條件，刪掉這個群組
				if ( count( $meta_query[ $key ] ) === 1 && isset( $meta_query[ $key ]['relation'] ) ) {
					unset( $meta_query[ $key ] );
				}
				continue;
			}
			// 如果沒有 value，刪掉這個條件
			if (!isset($array['value'])) {
				unset($meta_query[ $key ]);
			}
		}
		return $meta_query;
	}
	/**
	 * 將post meta返回的陣列轉成key string
	 *
	 * @param array $meta_query 陣列
	 * @return array
	 */
	public static function sanitize_post_meta_array( $meta_query ) {
		foreach ($meta_query as $key => $array) {
			if (!is_array($array)) {
				continue;
			}
			$meta_query[ $key ] = $array[0];
		}
		return $meta_query;
	}
}
