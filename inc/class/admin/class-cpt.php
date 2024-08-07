<?php
/**
 * Custom Post Type: Wp Tinwing
 */

declare(strict_types=1);

namespace J7\WpTinwing\Admin;

use J7\WpTinwing\Utils\Base;
use J7\WpTinwing\Plugin;

/**
 * Class CPT
 */
final class CPT {
	use \J7\WpUtils\Traits\SingletonTrait;

	/**
	 * Post metas
	 *
	 * @var array
	 */
	public $post_meta_array = [];
	/**
	 * Rewrite
	 *
	 * @var array
	 */
	public $rewrite = [];

	/**
	 * Constructor
	 */
	public function __construct() {
		$args                  = [
			'post_meta_array' => [ 'meta', 'settings' ],
			'rewrite'         => [
				'template_path' => 'test.php',
				'slug'          => 'test',
				'var'           => Plugin::$snake . '_test',
			],
		];
		$this->post_meta_array = $args['post_meta_array'];
		$this->rewrite         = $args['rewrite'] ?? [];

		\add_action( 'init', [ $this, 'init' ] );

		if ( ! empty( $args['post_meta_array'] ) ) {
			\add_action( 'rest_api_init', [ $this, 'add_post_meta' ] );
		}

		\add_action( 'load-post.php', [ $this, 'init_metabox' ] );
		\add_action( 'load-post-new.php', [ $this, 'init_metabox' ] );

		if ( ! empty( $args['rewrite'] ) ) {
			\add_filter( 'query_vars', [ $this, 'add_query_var' ] );
			\add_filter( 'template_include', [ $this, 'load_custom_template' ], 99 );
		}
	}

	/**
	 * Initialize
	 */
	public function init(): void {
		$this->register_cpt();

		// add {$this->post_type}/{slug}/test rewrite rule
		if ( ! empty( $this->rewrite ) ) {
			\add_rewrite_rule( '^wp-tinwing/([^/]+)/' . $this->rewrite['slug'] . '/?$', 'index.php?post_type=wp-tinwing&name=$matches[1]&' . $this->rewrite['var'] . '=1', 'top' );
			\flush_rewrite_rules();
		}
	}

	/**
	 * Register wp-tinwing custom post type
	 */
	public static function register_cpt(): void {

		$labels = [
			'name'                     => \esc_html__( 'wp-tinwing', 'wp_tinwing' ),
			'singular_name'            => \esc_html__( 'wp-tinwing', 'wp_tinwing' ),
			'add_new'                  => \esc_html__( 'Add new', 'wp_tinwing' ),
			'add_new_item'             => \esc_html__( 'Add new item', 'wp_tinwing' ),
			'edit_item'                => \esc_html__( 'Edit', 'wp_tinwing' ),
			'new_item'                 => \esc_html__( 'New', 'wp_tinwing' ),
			'view_item'                => \esc_html__( 'View', 'wp_tinwing' ),
			'view_items'               => \esc_html__( 'View', 'wp_tinwing' ),
			'search_items'             => \esc_html__( 'Search wp-tinwing', 'wp_tinwing' ),
			'not_found'                => \esc_html__( 'Not Found', 'wp_tinwing' ),
			'not_found_in_trash'       => \esc_html__( 'Not found in trash', 'wp_tinwing' ),
			'parent_item_colon'        => \esc_html__( 'Parent item', 'wp_tinwing' ),
			'all_items'                => \esc_html__( 'All', 'wp_tinwing' ),
			'archives'                 => \esc_html__( 'wp-tinwing archives', 'wp_tinwing' ),
			'attributes'               => \esc_html__( 'wp-tinwing attributes', 'wp_tinwing' ),
			'insert_into_item'         => \esc_html__( 'Insert to this wp-tinwing', 'wp_tinwing' ),
			'uploaded_to_this_item'    => \esc_html__( 'Uploaded to this wp-tinwing', 'wp_tinwing' ),
			'featured_image'           => \esc_html__( 'Featured image', 'wp_tinwing' ),
			'set_featured_image'       => \esc_html__( 'Set featured image', 'wp_tinwing' ),
			'remove_featured_image'    => \esc_html__( 'Remove featured image', 'wp_tinwing' ),
			'use_featured_image'       => \esc_html__( 'Use featured image', 'wp_tinwing' ),
			'menu_name'                => \esc_html__( 'wp-tinwing', 'wp_tinwing' ),
			'filter_items_list'        => \esc_html__( 'Filter wp-tinwing list', 'wp_tinwing' ),
			'filter_by_date'           => \esc_html__( 'Filter by date', 'wp_tinwing' ),
			'items_list_navigation'    => \esc_html__( 'wp-tinwing list navigation', 'wp_tinwing' ),
			'items_list'               => \esc_html__( 'wp-tinwing list', 'wp_tinwing' ),
			'item_published'           => \esc_html__( 'wp-tinwing published', 'wp_tinwing' ),
			'item_published_privately' => \esc_html__( 'wp-tinwing published privately', 'wp_tinwing' ),
			'item_reverted_to_draft'   => \esc_html__( 'wp-tinwing reverted to draft', 'wp_tinwing' ),
			'item_scheduled'           => \esc_html__( 'wp-tinwing scheduled', 'wp_tinwing' ),
			'item_updated'             => \esc_html__( 'wp-tinwing updated', 'wp_tinwing' ),
		];
		$args   = [
			'label'                 => \esc_html__( 'wp-tinwing', 'wp_tinwing' ),
			'labels'                => $labels,
			'description'           => '',
			'public'                => true,
			'hierarchical'          => false,
			'exclude_from_search'   => true,
			'publicly_queryable'    => true,
			'show_ui'               => true,
			'show_in_nav_menus'     => false,
			'show_in_admin_bar'     => false,
			'show_in_rest'          => true,
			'query_var'             => false,
			'can_export'            => true,
			'delete_with_user'      => true,
			'has_archive'           => false,
			'rest_base'             => '',
			'show_in_menu'          => true,
			'menu_position'         => 6,
			'menu_icon'             => 'dashicons-store',
			'capability_type'       => 'post',
			'supports'              => [ 'title', 'editor', 'thumbnail', 'custom-fields', 'author' ],
			'taxonomies'            => [],
			'rest_controller_class' => 'WP_REST_Posts_Controller',
			'rewrite'               => [
				'with_front' => true,
			],
		];

		\register_post_type( 'wp-tinwing', $args );
	}

	/**
	 * Register meta fields for post type to show in rest api
	 */
	public function add_post_meta(): void {
		foreach ( $this->post_meta_array as $meta_key ) {
			\register_meta(
				'post',
				Plugin::$snake . '_' . $meta_key,
				[
					'type'         => 'string',
					'show_in_rest' => true,
					'single'       => true,
				]
			);
		}
	}

	/**
	 * Meta box initialization.
	 */
	public function init_metabox(): void {
		\add_action( 'add_meta_boxes', [ $this, 'add_metabox' ] );
		\add_action( 'save_post', [ $this, 'save_metabox' ], 10, 2 );
		\add_filter( 'rewrite_rules_array', [ $this, 'custom_post_type_rewrite_rules' ] );
	}

	/**
	 * Adds the meta box.
	 *
	 * @param string $post_type Post type.
	 */
	public function add_metabox( string $post_type ): void {
		if ( in_array( $post_type, [ Plugin::$kebab ] ) ) {
			\add_meta_box(
				Plugin::$kebab . '-metabox',
				__( 'Wp Tinwing', 'wp_tinwing' ),
				[ $this, 'render_meta_box' ],
				$post_type,
				'advanced',
				'high'
			);
		}
	}

	/**
	 * Render meta box.
	 */
	public function render_meta_box(): void {
		// phpcs:ignore
		echo '<div id="wp_tinwing_metabox"></div>';
	}


	/**
	 * Add query var
	 *
	 * @param array $vars Vars.
	 * @return array
	 */
	public function add_query_var( $vars ) {
		$vars[] = $this->rewrite['var'];
		return $vars;
	}

	/**
	 * Custom post type rewrite rules
	 *
	 * @param array $rules Rules.
	 * @return array
	 */
	public function custom_post_type_rewrite_rules( $rules ) {
		global $wp_rewrite;
		$wp_rewrite->flush_rules();
		return $rules;
	}

	/**
	 * Save the meta when the post is saved.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 */
	public function save_metabox( $post_id, $post ) { // phpcs:ignore
		// phpcs:disable
		/*
		* We need to verify this came from the our screen and with proper authorization,
		* because save_post can be triggered at other times.
		*/

		// Check if our nonce is set.
		if ( ! isset( $_POST['_wpnonce'] ) ) {
			return $post_id;
		}

		$nonce = $_POST['_wpnonce'];

		/*
		* If this is an autosave, our form has not been submitted,
		* so we don't want to do anything.
		*/
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return $post_id;
		}

		$post_type = \sanitize_text_field( $_POST['post_type'] ?? '' );

		// Check the user's permissions.
		if ( 'wp-tinwing' !== $post_type ) {
			return $post_id;
		}

		if ( ! \current_user_can( 'edit_post', $post_id ) ) {
			return $post_id;
		}

		/* OK, it's safe for us to save the data now. */

		// Sanitize the user input.
		$meta_data = \sanitize_text_field( $_POST[ Plugin::$snake . '_meta' ] );

		// Update the meta field.
		\update_post_meta( $post_id, Plugin::$snake . '_meta', $meta_data );
	}

	/**
	 * Load custom template
	 * Set {Plugin::$kebab}/{slug}/report  php template
	 *
	 * @param string $template Template.
	 */
	public function load_custom_template( $template ) {
		$repor_template_path = Plugin::$dir . '/inc/templates/' . $this->rewrite['template_path'];

		if ( \get_query_var( $this->rewrite['var'] ) ) {
			if ( file_exists( $repor_template_path ) ) {
				return $repor_template_path;
			}
		}
		return $template;
	}
}

CPT::instance();
