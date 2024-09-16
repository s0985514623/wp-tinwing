<?php
/**
 * Bootstrap
 */

declare (strict_types = 1);

namespace J7\WpTinwing;

use Kucrut\Vite;

/**
 * Class Bootstrap
 */
final class Bootstrap {
	use \J7\WpUtils\Traits\SingletonTrait;

	/**
	 * Constructor
	 */
	public function __construct() {
		// FrontEnd\Entry::instance();
		FrontEnd\MyAccount::instance();
		Admin\Entry::instance();
		Admin\CPT::instance();
		Api\CreditNotes::instance();
		Api\Quotations::instance();
		Api\DebitNotes::instance();
		Api\Renewals::instance();
		Api\Insurers::instance();
		Api\Terms::instance();
		Api\Agents::instance();
		Api\Expenses::instance();
		Api\Clients::instance();
		Api\Receipts::instance();
		Api\InsurerProducts::instance();

		\add_action( 'admin_enqueue_scripts', [ $this, 'admin_enqueue_script' ], 99 );
		\add_action( 'wp_enqueue_scripts', [ $this, 'frontend_enqueue_script' ], 99 );
	}

	/**
	 * Admin Enqueue script
	 * You can load the script on demand
	 *
	 * @param string $hook current page hook
	 *
	 * @return void
	 */
	public function admin_enqueue_script( $hook ): void {
		self::enqueue_script();
	}


	/**
	 * Front-end Enqueue script
	 * You can load the script on demand
	 *
	 * @return void
	 */
	public function frontend_enqueue_script(): void {
		self::enqueue_script();
	}

	/**
	 * Enqueue script
	 * You can load the script on demand
	 *
	 * @return void
	 */
	public static function enqueue_script(): void {

		Vite\enqueue_asset(
			Plugin::$dir . '/js/dist',
			'js/src/index.tsx',
			[
				'handle'    => Plugin::$kebab,
				'in-footer' => true,
			]
		);

		$post_id   = \get_the_ID();
		$permalink = \get_permalink( $post_id );

		\wp_localize_script(
			Plugin::$kebab,
			Plugin::$snake . '_data',
			[
				'env' => [
					'siteUrl'       => \untrailingslashit( \site_url() ),
					'ajaxUrl'       => \untrailingslashit( \admin_url( 'admin-ajax.php' ) ),
					'userId'        => \wp_get_current_user()->data->ID ?? null,
					'postId'        => $post_id,
					'permalink'     => \untrailingslashit( $permalink ),
					'APP_NAME'      => Plugin::$app_name,
					'KEBAB'         => Plugin::$kebab,
					'SNAKE'         => Plugin::$snake,
					'BASE_URL'      => Utils\Base::BASE_URL,
					'APP1_SELECTOR' => Utils\Base::APP1_SELECTOR,
					'APP2_SELECTOR' => Utils\Base::APP2_SELECTOR,
					'API_TIMEOUT'   => Utils\Base::API_TIMEOUT,
					'nonce'         => \wp_create_nonce( Plugin::$kebab ),
				],
			]
		);

		\wp_localize_script(
			Plugin::$kebab,
			'wpApiSettings',
			[
				'root'  => \untrailingslashit( \esc_url_raw( rest_url() ) ),
				'nonce' => \wp_create_nonce( 'wp_rest' ),
			]
		);
	}
}
