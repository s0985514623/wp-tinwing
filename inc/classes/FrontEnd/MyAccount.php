<?php
/**
 * Front-end MyAccount Page
 *
 * @package J7\WpTinwing\FrontEnd
 */

declare( strict_types=1 );

namespace J7\WpTinwing\FrontEnd;

/**
 * Class MyAccount
 */
final class MyAccount {
	use \J7\WpUtils\Traits\SingletonTrait;


	/**
	 * 我的帳號頁面
	 *
	 * @var array<string, string> $my_account_pages
	 */
	public static $my_account_pages = [
		'my_insurance'     => '我的保單',
		'online_quotation' => '網上查詢報價',
		'quotation_record' => '報價歷史紀錄',
		'online_claim'     => '網上遞交索償申請',
		'claim_record'     => '索償申請紀錄',
	];

	/**
	 * Constructor
	 */
	public function __construct() {

		\add_action( 'init', [ __CLASS__, 'custom_account_pages' ] );
		\add_filter( 'woocommerce_account_menu_items', [ __CLASS__, 'custom_menu_items' ], 100, 1 );

		foreach ( self::$my_account_pages as $endpoint => $page ) {
			$endpoint = str_replace( '-', '_', $endpoint );
			\add_action(
			'woocommerce_account_' . $endpoint . '_endpoint',
			[ __CLASS__, "render_{$endpoint}" ] // @phpstan-ignore-line
			);
		}

		\add_action( 'admin_menu', [ __CLASS__, 'add_menu_page' ] );
	}

	/**
	 * Custom account pages
	 */
	public static function custom_account_pages(): void {
		foreach ( self::$my_account_pages as $endpoint => $page ) {
			\add_rewrite_endpoint( $endpoint, EP_ROOT | EP_PAGES );  // @phpstan-ignore-line
		}
		\flush_rewrite_rules();
	}

	/**
	 * Add menu item
	 *
	 * @param array<string, string> $items Menu items.
	 *
	 * @return array<string, string>
	 */
	public static function custom_menu_items( array $items ): array {

		$new_items = [];
		foreach ( self::$my_account_pages as $endpoint => $page ) {
			$new_items[ $endpoint ] = $page;
		}
		return array_slice( $items, 0, 1 ) + $new_items + array_slice( $items, 1 );
	}

	/**
	 * Render my insurance
	 */
	public static function render_my_insurance(): void { // phpcs:ignore
		echo 'my_insurance';
	}

	/**
	 * Render online quotation
	 */
	public static function render_online_quotation(): void { // phpcs:ignore
		echo 'online_quotation';
	}

	/**
	 * Render quotation record
	 */
	public static function render_quotation_record(): void { // phpcs:ignore
		echo 'quotation_record';
	}

	/**
	 * Render online claim
	 */
	public static function render_online_claim(): void { // phpcs:ignore
		echo 'online_claim';
	}

	/**
	 * Render claim record
	 */
	public static function render_claim_record(): void { // phpcs:ignore
		echo 'claim_record';
	}

	/**
	 * Add menu page
	 */
	public static function add_menu_page(): void {
		\add_menu_page(
		'回覆客戶紀錄',
		'回覆客戶紀錄',
		'manage_options',
		'all-quotation',
		[ __CLASS__, 'render_all_quotation' ],
		'dashicons-admin-comments',
		6
		);
		\add_menu_page(
		'客戶文件儲存',
		'客戶文件儲存',
		'manage_options',
		'all-claim',
		[ __CLASS__, 'render_all_claim' ],
		'dashicons-media-document',
		7
		);
	}

	/**
	 * Render all quotation
	 */
	public static function render_all_quotation(): void { // phpcs:ignore
		echo 'all_quotation';
	}

	/**
	 * Render all claim
	 */
	public static function render_all_claim(): void { // phpcs:ignore
		echo 'all_claim';
	}
}
