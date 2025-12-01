<?php
/**
 * Test Block Style Inheritance
 *
 * @package WordPress
 * @subpackage Gutenberg
 */

/**
 * Test the block style inheritance system
 */
function test_block_style_inheritance() {
	// Load our classes
	require_once __DIR__ . '/load.php';

	// Create test data
	$test_data = WP_Block_Style_Theme_JSON_Resolver::get_test_data();

	// Create a mock WP_Theme_JSON_Data object
	$theme_json_data = new WP_Theme_JSON_Data( $test_data, 'theme' );

	// Process with our inheritance system
	$processed_data = WP_Block_Style_Inheritance::process_style_inheritance( $theme_json_data );

	// Get the processed data
	$result = $processed_data->get_data();

	// Check if inheritance worked
	$featured_card = $result['styles']['variations']['featured-card'];

	// Test 1: Check if parent properties were inherited
	$has_padding = isset( $featured_card['styles']['spacing']['padding'] );
	$has_border_radius = isset( $featured_card['styles']['border']['radius'] );

	// Test 2: Check if child properties override parent
	$border_width = $featured_card['styles']['border']['width'];
	$border_color = $featured_card['styles']['border']['color'];

	// Output test results
	echo "=== Block Style Inheritance Test Results ===\n";
	echo "Padding inherited: " . ( $has_padding ? 'PASS' : 'FAIL' ) . "\n";
	echo "Border radius inherited: " . ( $has_border_radius ? 'PASS' : 'FAIL' ) . "\n";
	echo "Border width overridden: " . ( $border_width === '2px' ? 'PASS' : 'FAIL' ) . "\n";
	echo "Border color overridden: " . ( $border_color === '#3b82f6' ? 'PASS' : 'FAIL' ) . "\n";

	// Debug info
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		echo "\n=== Debug Info ===\n";
		print_r( WP_Block_Style_Inheritance::get_debug_info() );
	}

	return $result;
}

// Run test if accessed directly
if ( ! defined( 'ABSPATH' ) ) {
	// Mock WordPress functions for testing
	function _doing_it_wrong( $function, $message, $version ) {
		echo "Warning: {$function} - {$message} (since {$version})\n";
	}

	function __( $text, $domain = 'default' ) {
		return $text;
	}

	function sprintf( $format, ...$args ) {
		return vsprintf( $format, $args );
	}

	// Run the test
	test_block_style_inheritance();
}
