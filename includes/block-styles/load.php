<?php
/**
 * Block Style Inheritance - Loader
 *
 * @package WordPress
 * @subpackage Gutenberg
 */

// Load the main inheritance class
require_once __DIR__ . '/class-wp-block-style-inheritance.php';

// Load the CSS handler if not already loaded.
if ( ! class_exists( 'WP_Block_Style_CSS_Handler' ) ) {
	require_once __DIR__ . '/class-wp-block-style-css-handler.php';
}

// Load the inheritance processor
if ( ! class_exists( 'WP_Block_Style_Inheritance_Processor' ) ) {
	require_once __DIR__ . '/class-wp-block-style-inheritance-processor.php';
}

// Hook to debug inheritance when WP_DEBUG is enabled.
if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
	add_action( 'wp_footer', function() {
		if ( current_user_can( 'manage_options' ) && isset( $_GET['debug_inheritance'] ) ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			echo '<script>console.log(' . wp_json_encode( WP_Block_Style_Inheritance::get_debug_info() ) . ');</script>';
		}
	} );
}
