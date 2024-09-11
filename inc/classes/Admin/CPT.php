<?php
/**
 * Custom Post Type: Wp Tinwing
 */

declare(strict_types=1);

namespace J7\WpTinwing\Admin;

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
	 * Post type Array
	 *
	 * @var array
	 */
	public $post_type_array = [];
	/**
	 * 各post meta Array
	 *
	 * @var array
	 */
	public $cpt_post_meta_array =[];

	/**
	 * Constructor
	 */
	public function __construct() {
		$args                      = [
			'post_meta_array'     => [ 'meta', 'settings' ],
			'rewrite'             => [
				'template_path' => 'test.php',
				'slug'          => 'test',
				'var'           => Plugin::$snake . '_test',
			],
			'post_type_array'     => [ 'quotations', 'debit_notes', 'renewals', 'receipts', 'credit_notes', 'terms', 'insurers', 'insurer_products', 'agents', 'clients', 'expenses' ],
			'cpt_post_meta_array' =>[
				'quotations'       => PostType\Quotations::instance()->get_meta(),
				'debit_notes'      => PostType\Quotations::instance()->get_meta(),
				'renewals'         => PostType\Renewals::instance()->get_meta(),
				'credit_notes'     => PostType\Quotations::instance()->get_meta(),
				'receipts'         => PostType\Receipts::instance()->get_meta(),
				'terms'            => PostType\Terms::instance()->get_meta(),
				'insurers'         => PostType\Insurers::instance()->get_meta(),
				'insurer_products' => PostType\InsurerProducts::instance()->get_meta(),
				'agents'           => PostType\Agents::instance()->get_meta(),
				'clients'          => PostType\Clients::instance()->get_meta(),
				'expenses'         => PostType\Expenses::instance()->get_meta(),
			],
		];
		$this->post_meta_array     = $args['post_meta_array'];
		$this->rewrite             = $args['rewrite'] ?? [];
		$this->post_type_array     = $args['post_type_array'] ?? [];
		$this->cpt_post_meta_array = $args['cpt_post_meta_array'] ?? [];

		\add_action( 'init', [ $this, 'init' ] );

		if ( ! empty( $args['post_meta_array'] ) ) {
			// [ 'meta', 'settings' ]
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
		// $this->register_post_meta();

		// add {$this->post_type}/{slug}/test rewrite rule
		if ( ! empty( $this->rewrite ) ) {
			\add_rewrite_rule( '^wp-tinwing/([^/]+)/' . $this->rewrite['slug'] . '/?$', 'index.php?post_type=wp-tinwing&name=$matches[1]&' . $this->rewrite['var'] . '=1', 'top' );
			\flush_rewrite_rules();
		}
	}

	/**
	 * Register wp-tinwing custom post type
	 */
	public function register_cpt(): void {

		foreach ( $this->post_type_array as $key=>$post_type ) {
			$labels = [
				'name'                     => sprintf(\esc_html__( '%s', 'wp_tinwing' ), $post_type),
				'singular_name'            => sprintf(\esc_html__( '%s', 'wp_tinwing' ), $post_type),
				'add_new'                  => \esc_html__( 'Add new', 'wp_tinwing' ),
				'add_new_item'             => \esc_html__( 'Add new item', 'wp_tinwing' ),
				'edit_item'                => \esc_html__( 'Edit', 'wp_tinwing' ),
				'new_item'                 => \esc_html__( 'New', 'wp_tinwing' ),
				'view_item'                => \esc_html__( 'View', 'wp_tinwing' ),
				'view_items'               => \esc_html__( 'View', 'wp_tinwing' ),
				'search_items'             => sprintf(\esc_html__( 'Search %s', 'wp_tinwing' ), $post_type),
				'not_found'                => \esc_html__( 'Not Found', 'wp_tinwing' ),
				'not_found_in_trash'       => \esc_html__( 'Not found in trash', 'wp_tinwing' ),
				'parent_item_colon'        => \esc_html__( 'Parent item', 'wp_tinwing' ),
				'all_items'                => \esc_html__( 'All', 'wp_tinwing' ),
				'archives'                 => sprintf(\esc_html__( '%s archives', 'wp_tinwing' ), $post_type),
				'attributes'               => sprintf(\esc_html__( '%s attributes', 'wp_tinwing' ), $post_type),
				'insert_into_item'         => sprintf(\esc_html__( 'Insert to this %s', 'wp_tinwing' ), $post_type),
				'uploaded_to_this_item'    => sprintf(\esc_html__( 'Uploaded to this %s', 'wp_tinwing' ), $post_type),
				'featured_image'           => \esc_html__( 'Featured image', 'wp_tinwing' ),
				'set_featured_image'       => \esc_html__( 'Set featured image', 'wp_tinwing' ),
				'remove_featured_image'    => \esc_html__( 'Remove featured image', 'wp_tinwing' ),
				'use_featured_image'       => \esc_html__( 'Use featured image', 'wp_tinwing' ),
				'menu_name'                => sprintf(\esc_html__( '%s', 'wp_tinwing' ), $post_type),
				'filter_items_list'        => sprintf(\esc_html__( 'Filter %s list', 'wp_tinwing' ), $post_type),
				'filter_by_date'           => \esc_html__( 'Filter by date', 'wp_tinwing' ),
				'items_list_navigation'    => sprintf(\esc_html__( '%s list navigation', 'wp_tinwing' ), $post_type),
				'items_list'               => sprintf(\esc_html__( '%s list', 'wp_tinwing' ), $post_type),
				'item_published'           => sprintf(\esc_html__( '%s published', 'wp_tinwing' ), $post_type),
				'item_published_privately' => sprintf(\esc_html__( '%s published privately', 'wp_tinwing' ), $post_type),
				'item_reverted_to_draft'   => sprintf(\esc_html__( '%s reverted to draft', 'wp_tinwing' ), $post_type),
				'item_scheduled'           => sprintf(\esc_html__( '%s scheduled', 'wp_tinwing' ), $post_type),
				'item_updated'             => sprintf(\esc_html__( '%s updated', 'wp_tinwing' ), $post_type),
			];
			$args   = [
				'label'                 => sprintf(\esc_html__( '%s', 'wp_tinwing' ), $post_type),
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
				'menu_position'         => 26 + $key,
				'menu_icon'             => 'dashicons-store',
				'capability_type'       => 'post',
				'supports'              => [ 'title', 'editor', 'thumbnail', 'custom-fields', 'author' ],
				'taxonomies'            => [],
				'rest_controller_class' => 'WP_REST_Posts_Controller',
				'rewrite'               => [
					'with_front' => true,
				],
			];
			\register_post_type( $post_type, $args );
		}
	}

	/**
	 * Register meta fields for post type to show in rest api
	 */
	public function add_post_meta(): void {
		// [ 'meta', 'settings' ]
		foreach ( $this->post_meta_array as $meta_key ) {
			\register_meta(
				'post',
				Plugin::$snake . '_' . $meta_key,
				[
					'type'          => 'string',
					'show_in_rest'  => true,
					'single'        => true,
					'auth_callback' => function () {
						return current_user_can('edit_posts');
					},
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
		// Post type array
		if ( in_array( $post_type, $this->post_type_array ) ) {
			// Post meta array
			foreach ( $this->cpt_post_meta_array[ $post_type ] as $key=>$meta_args ) {
				\add_meta_box(
					$key . '-metabox',
					\sprintf(__( '%s', 'wp_tinwing' ), $key),
					[ $this, $meta_args['display_function'] ],
					$post_type,
					'advanced',
					'high',
					$meta_args// 額外帶入的參數
				);
			}
		}
	}

	/**
	 * Render meta box to input.
	 *
	 * @param \WP_Post $post Post.
	 * @param array    $args Args.
	 *
	 * @return void
	 */
	public function render_meta_box( $post, $args ): void {
		$meta_value = \get_post_meta( $post->ID, $args['title'], true );

		\printf(
			/*html*/'
			<p>
				<label for="%1$s">%1$s</label>
				<input type="%2$s" id="%3$s" name="%3$s" value="%4$s" />
			</p>
			',
			$args['title'],
			$args['args']['input_type'],
			$args['title'],
			esc_attr($meta_value),
		);
	}

	/**
	 * Render meta checkbox to input.
	 *
	 * @param \WP_Post $post Post.
	 * @param array    $args Args.
	 *
	 * @return void
	 */
	public function render_meta_checkbox( $post, $args ): void {
		$meta_value = \get_post_meta( $post->ID, $args['title'], true );
		$checked    = ( $meta_value === '1' ) ? 'checked' : '';
		\printf(
			/*html*/'
			<p>
				<label for="%1$s">%1$s</label>
				<input type="%2$s" id="%3$s" name="%3$s" value="1" %4$s />
			</p>
			',
			$args['title'],
			$args['args']['input_type'],
			$args['title'],
			$checked
		);
	}

	/**
	 * Render meta box to JSON.
	 *
	 * @param \WP_Post $post Post.
	 * @param array    $args Args.
	 *
	 * @return void
	 */
	public function render_meta_box_json( $post, $args ): void {
		$meta_value = \get_post_meta( $post->ID, $args['title'], true );
		$meta_value = json_decode($meta_value, true);

		foreach ($args['args']['attr'] as $key => $value) {
			\printf(
				/*html*/'
				<p>
					<label for="%1$s_%2$s">%2$s</label>
					<input type="%3$s" id="%4$s_%5$s" name="%4$s[%5$s]" value="%6$s" />
				</p>
				',
				$args['title'],
				$key,
				$value['input_type'],
				$args['title'],
				$key,
				!empty($meta_value) && is_array($meta_value) ? esc_attr($meta_value[ $key ]) : ''
				);
		}
	}

	/**
	 * Render meta box to extraField JSON.
	 *
	 * @param \WP_Post $post Post.
	 * @param array    $args Args.
	 *
	 * @return void
	 */
	public function render_meta_box_json_extra_field( $post, $args ): void {
		$meta_value_data = \get_post_meta( $post->ID, $args['title'], true);
		$meta_value_data = json_decode($meta_value_data, true);

		$default_meta_value =[
			'name'  => '',
			'value' => '',
		];
		foreach ($meta_value_data as $meta_key => $meta_value) {
			$default_meta_value['name']  = $meta_key;
			$default_meta_value['value'] = $meta_value;
		}

		foreach ($args['args']['attr'] as $args_key => $args_value) {
			\printf(
				/*html*/'
				<p>
					<label for="%1$s_%2$s">%2$s</label>
					<input type="%3$s" id="%4$s_%5$s" name="%4$s[%5$s]" value="%6$s" />
				</p>
				',
				$args['title'],
				$args_key,
				$args_value['input_type'],
				$args['title'],
				$args_key,
				!empty($default_meta_value) ? esc_attr($default_meta_value[ $args_key ]) : ''
				);
		}
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
		if(!in_array( $post_type, $this->post_type_array )){
			return $post_id;
		}
		// if ( 'wp-tinwing' !== $post_type ) {
		// 	return $post_id;
		// }

		if ( ! \current_user_can( 'edit_post', $post_id ) ) {
			return $post_id;
		}

		/* OK, it's safe for us to save the data now. */

		// Sanitize the user input.
		// $meta_data = \sanitize_text_field( $_POST[ Plugin::$snake . '_meta' ] );

		// Update the meta field.
		// \update_post_meta( $post_id, Plugin::$snake . '_meta', $meta_data );
		foreach ( $this->cpt_post_meta_array[ $post_type ] as $key=>$meta_args ) {
			//檢查是否有輸入
			if(!empty($_POST[ $key ])){
				//檢查是否為陣列
				if(is_array($_POST[ $key ])){
					$meta_data = array_map( 'sanitize_text_field', $_POST[ $key ] );
				}
				else{
					$meta_data = \sanitize_text_field( $_POST[ $key ] );
				}
				//檢查是否為extraField 及 extraField2
				if("extraField"==$key||"extraField2"==$key){
					$name  = $meta_data['name'];
					$value = $meta_data['value'];
					//檢查是否有輸入,否則跳出
					if(empty ($name)||empty ($value)){
						continue;
					}
					// 重組為json格式
					$extra_field_data = array(
						$name => $value,
					);
					\update_post_meta( $post_id, $key, $extra_field_data );
					continue;
				}

				// 其他欄位的update.
				\update_post_meta( $post_id, $key, $meta_data );
			}
		}

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
