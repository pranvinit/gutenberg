<?php
/**
 * Block Style Theme JSON Resolver Integration
 *
 * @package WordPress
 * @subpackage Gutenberg
 */

/**
 * Class WP_Block_Style_Theme_JSON_Resolver
 *
 * Integrates block style inheritance with the Theme JSON resolver.
 */
class WP_Block_Style_Theme_JSON_Resolver {
	/**
	 * Initialize the integration
	 */
	public static function init() {
		// Use high priority to ensure we run after theme.json is initially processed
		add_filter( 'wp_theme_json_data_theme', array( __CLASS__, 'process_theme_json' ), 999, 1 );
	}

	/**
	 * Process theme.json data with our inheritance system
	 *
	 * @param WP_Theme_JSON_Data $theme_json_data The theme.json data.
	 * @return WP_Theme_JSON_Data The processed theme.json data.
	 */
	public static function process_theme_json( $theme_json_data ) {
		// Only process if our inheritance class is available
		if ( class_exists( 'WP_Block_Style_Inheritance' ) ) {
			// Log before processing if debug is enabled
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( 'Processing theme.json with block style inheritance' );
			}

			$theme_json_data = WP_Block_Style_Inheritance::process_style_inheritance( $theme_json_data );

			// Log after processing if debug is enabled
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( 'Block style inheritance processing complete' );
			}
		}

		return $theme_json_data;
	}

	/**
	 * Get test data for debugging
	 *
	 * @return array Test data structure
	 */
	public static function get_test_data() {
		return array(
			'styles' => array(
				'variations' => array(
					'base-card' => array(
						'title' => 'Base Card',
						'blockTypes' => array( 'core/group' ),
						'styles' => array(
							'spacing' => array(
								'padding' => array(
									'top' => '1rem',
									'bottom' => '1rem',
									'left' => '1rem',
									'right' => '1rem',
								),
							),
							'border' => array(
								'radius' => '8px',
								'width' => '1px',
								'style' => 'solid',
								'color' => '#e2e8f0',
							),
						),
					),
					'featured-card' => array(
						'title' => 'Featured Card',
						'parent' => 'base-card',
						'blockTypes' => array( 'core/group' ),
						'styles' => array(
							'border' => array(
								'width' => '2px',
								'color' => '#3b82f6',
							),
							'color' => array(
								'background' => '#eff6ff',
							),
						),
					),
				),
			),
		);
	}
}

// Initialize the integration
add_action( 'after_setup_theme', array( 'WP_Block_Style_Theme_JSON_Resolver', 'init' ) );
