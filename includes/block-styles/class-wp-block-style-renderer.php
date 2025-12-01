<?php
/**
 * Block Style Renderer
 *
 * @package WordPress
 * @subpackage Gutenberg
 */

/**
 * Class WP_Block_Style_Renderer
 *
 * Handles the rendering of blocks with inherited style variations.
 */
class WP_Block_Style_Renderer {
	/**
	 * Inheritance cache from theme.json processing
	 *
	 * @var array
	 */
	private static $inheritance_cache = array();

	/**
	 * Initialize the renderer
	 *
	 * @param array $inheritance_cache The inheritance cache from theme.json processing.
	 */
	public static function init( $inheritance_cache ) {
		self::$inheritance_cache = $inheritance_cache;
		add_filter( 'render_block', array( __CLASS__, 'add_inherited_classes' ), 10, 2 );
	}

	/**
	 * Add inherited CSS classes to blocks that use style variations
	 *
	 * @param string $block_content The block content.
	 * @param array  $block The block data.
	 * @return string The modified block content.
	 */
	public static function add_inherited_classes( $block_content, $block ) {
		// Only process blocks with className attribute.
		if ( ! isset( $block['attrs']['className'] ) || ! is_string( $block['attrs']['className'] ) ) {
			return $block_content;
		}

		$classes = explode( ' ', $block['attrs']['className'] );
		$style_classes = array();

		// Find style variation classes.
		foreach ( $classes as $class ) {
			if ( strpos( $class, 'is-style-' ) === 0 ) {
				$style_slug = substr( $class, 9 ); // Remove 'is-style-' prefix.

				// Add inheritance chain classes.
				if ( isset( self::$inheritance_cache[ $style_slug ] ) ) {
					foreach ( self::$inheritance_cache[ $style_slug ] as $inherited_slug ) {
						$style_classes[] = "is-style-{$inherited_slug}";
					}
				} else {
					$style_classes[] = $class;
				}
			}
		}

		if ( ! empty( $style_classes ) ) {
			// Remove duplicate style classes and merge with other classes.
			$non_style_classes = array_filter( $classes, function( $class ) {
				return strpos( $class, 'is-style-' ) !== 0;
			} );

			$all_classes = array_unique( array_merge( $non_style_classes, $style_classes ) );
			$new_class_string = implode( ' ', $all_classes );

			// Replace className in block content.
			$block_content = preg_replace(
				'/class="([^"]*)"/',
				'class="' . esc_attr( $new_class_string ) . '"',
				$block_content,
				1
			);
		}

		return $block_content;
	}
}
