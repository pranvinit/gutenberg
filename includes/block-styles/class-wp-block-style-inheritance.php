<?php
/**
 * Block Style Variation Inheritance System
 *
 * @package WordPress
 * @subpackage Gutenberg
 */

/**
 * Class WP_Block_Style_Inheritance
 *
 * Adds support for inheriting properties from parent style variations
 * in WordPress block themes using theme.json structure.
 */
class WP_Block_Style_Inheritance {
	/**
	 * Initialize the inheritance system
	 */
	public static function init() {
		// Skip if not in a proper WordPress environment.
		if ( ! function_exists( 'add_filter' ) ) {
			return;
		}

		// Load dependencies
		self::load_dependencies();

		// Process theme.json data to resolve inheritance chains.
		add_filter( 'wp_theme_json_data_theme', array( 'WP_Block_Style_Inheritance_Processor', 'process' ), 10, 1 );

		// Add inherited classes to blocks during rendering.
		add_filter( 'render_block', array( 'WP_Block_Style_Inheritance_Processor', 'add_inherited_classes' ), 10, 2 );
	}

	/**
	 * Load dependencies
	 */
	private static function load_dependencies() {
		// Check if processor class exists and load if needed
		if ( ! class_exists( 'WP_Block_Style_Inheritance_Processor' ) ) {
			require_once __DIR__ . '/class-wp-block-style-inheritance-processor.php';
		}
	}

	/**
	 * Process style inheritance in theme.json data
	 *
	 * @param WP_Theme_JSON_Data $theme_json_data The theme.json data object.
	 * @return WP_Theme_JSON_Data The processed theme.json data.
	 */
	public static function process_style_inheritance( $theme_json_data ) {
		return WP_Block_Style_Inheritance_Processor::process( $theme_json_data );
	}

	/**
	 * Add inherited CSS classes to blocks that use style variations
	 *
	 * @param string $block_content The block content.
	 * @param array  $block The block data.
	 * @return string The modified block content.
	 */
	public static function add_inherited_classes( $block_content, $block ) {
		return WP_Block_Style_Inheritance_Processor::add_inherited_classes( $block_content, $block );
	}

	/**
	 * Get debug information about inheritance chains
	 *
	 * @return array Debug information.
	 */
	public static function get_debug_info() {
		return WP_Block_Style_Inheritance_Processor::get_debug_info();
	}

	/**
	 * Clear all caches (useful for development)
	 */
	public static function clear_caches() {
		WP_Block_Style_Inheritance_Processor::clear_caches();
	}
}

// Initialize the inheritance system.
add_action( 'after_setup_theme', array( 'WP_Block_Style_Inheritance', 'init' ) );
