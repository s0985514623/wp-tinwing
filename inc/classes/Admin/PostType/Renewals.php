<?php
/**
 * Renewals post type 的 post meta
 */

declare(strict_types=1);

namespace J7\WpTinwing\Admin\PostType;

/**
 * Renewals post type 的 post meta
 */
final class Renewals {
	use \J7\WpUtils\Traits\SingletonTrait;

	/**
	 * Renewals post meta
	 * 多debit_note_id created_from_renewal_id
	 *
	 * @var array
	 */
	public $insurance_meta = [
		'date' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'template'                 =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		'term_id'                  =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'agent_id'                 =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'client_id'                =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'insurer_id'               =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'policy_no'                =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		'name_of_insured'          =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		'sum_insured'              =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		'period_of_insurance_from' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'period_of_insurance_to'   =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'insured_premises'         =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		'motor_attr' =>[
			'display_function'  => 'render_meta_box_json',
			'meta_type'         => 'object',
			'sanitize_callback' => 'sanitize_motor_attributes',
			'attr'              =>[
				'manufacturingYear' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'text',
					'meta_type'         => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				],
				'registrationNo' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'text',
					'meta_type'         => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				],
				'model' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'text',
					'meta_type'         => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				],
				'tonnes' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'text',
					'meta_type'         => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				],
				'body' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'text',
					'meta_type'         => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				],
				'chassi' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'text',
					'meta_type'         => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				],
				'additionalValues' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'text',
					'meta_type'         => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				],
				'namedDriver' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'text',
					'meta_type'         => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				],
				'ls' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'number',
					'meta_type'         => 'number',
					'sanitize_callback' => 'floatval',
				],
				'ncb' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'number',
					'meta_type'         => 'number',
					'sanitize_callback' => 'floatval',
				],
				'mib' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'number',
					'meta_type'         => 'number',
					'sanitize_callback' => 'floatval',
				],
			],
		],
		'premium' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'less' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'number',
			'sanitize_callback' => 'floatval',
		],
		'levy' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'number',
			'sanitize_callback' => 'floatval',
		],
		'agent_fee' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		'insurer_fee_percent' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		'short_terms_content' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		'particulars' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		'motor_engine_no' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		'chassi' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		'remark' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'textarea',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_textarea_field',
		],
		'extra_field' =>[
			'display_function'  => 'render_meta_box_json_extra_field',
			'meta_type'         => 'object',
			'sanitize_callback' =>'sanitize_motor_attributes',
			'attr'              =>[
				'name' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'text',
					'meta_type'         => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				],
				'value' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'text',
					'meta_type'         => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				],
			],
		],
		'extra_field2' =>[
			'display_function'  => 'render_meta_box_json_extra_field',
			'meta_type'         => 'object',
			'sanitize_callback' =>'sanitize_motor_attributes',
			'attr'              =>[
				'name' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'text',
					'meta_type'         => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				],
				'value' =>[
					'display_function'  => 'render_meta_box',
					'input_type'        => 'text',
					'meta_type'         => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				],
			],
		],
		'is_archived' =>[
			'display_function'  => 'render_meta_checkbox',
			'input_type'        => 'checkbox',
			'meta_type'         => 'boolean',
			'sanitize_callback' => 'rest_sanitize_boolean',
		],
		'package_content' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'text',
			'meta_type'         => 'string',
			'sanitize_callback' => 'sanitize_text_field',
		],
		'debit_note_id' =>[
			'display_function'  => 'render_meta_box',
			'input_type'        => 'number',
			'meta_type'         => 'integer',
			'sanitize_callback' => 'absint',
		],
		'created_from_renewal_id' =>[
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
	 * Get meta
	 *
	 * @return array
	 */
	public function get_meta() {
		return $this->insurance_meta;
	}
}
