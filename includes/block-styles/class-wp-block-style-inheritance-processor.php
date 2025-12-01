<?php
/**
 * Block Style Inheritance Processor
 *
 * @package WordPress
 * @subpackage Gutenberg
 */

/**
 * Class WP_Block_Style_Inheritance_Processor
 *
 * Processes theme.json data to resolve block style inheritance relationships.
 */
class WP_Block_Style_Inheritance_Processor {
	/**
	 * Cache for resolved style variations to prevent infinite loops
	 *
	 * @var array
	 */
	private static $resolved_cache = array();

	/**
	 * Cache for inheritance chains to optimize performance
	 *
	 * @var array
	 */
	private static $inheritance_cache = array();

	/**
	 * Process theme.json data to resolve style inheritance
	 *
	 * @param WP_Theme_JSON_Data $theme_json_data Theme JSON data object.
	 * @return WP_Theme_JSON_Data Processed theme JSON data.
	 */
	public static function process( $theme_json_data ) {
		$data = $theme_json_data->get_data();

		if ( ! isset( $data['styles'] ) || ! isset( $data['styles']['variations'] ) ) {
			return $theme_json_data;
		}

		$variations = $data['styles']['variations'];
		$processed_variations = array();

		// First pass: collect all variations and validate structure
		foreach ( $variations as $slug => $variation ) {
			if ( self::validate_variation_structure( $variation, $slug ) ) {
				$processed_variations[ $slug ] = $variation;
			}
		}

		// Second pass: resolve inheritance chains
		foreach ( $processed_variations as $slug => $variation ) {
			$resolved_variation = self::resolve_inheritance_chain( $slug, $processed_variations );
			if ( $resolved_variation ) {
				$processed_variations[ $slug ] = $resolved_variation;
			}
		}

		// Update the theme data
		$data['styles']['variations'] = $processed_variations;
		$theme_json_data->update_with( $data );

		return $theme_json_data;
	}

	/**
	 * Validate variation structure and inheritance relationships
	 *
	 * @param array  $variation Variation data.
	 * @param string $slug Variation slug.
	 * @return bool Whether the variation is valid.
	 */
	private static function validate_variation_structure( $variation, $slug ) {
		// Basic structure validation
		if ( ! is_array( $variation ) ) {
			if ( function_exists( '_doing_it_wrong' ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: %s: variation slug */
						__( 'Block style variation "%s" must be an array.', 'gutenberg' ),
						$slug
					),
					'6.3.0'
				);
			}
			return false;
		}

		// Validate parent reference if exists
		if ( isset( $variation['parent'] ) ) {
			if ( ! is_string( $variation['parent'] ) || empty( $variation['parent'] ) ) {
				if ( function_exists( '_doing_it_wrong' ) ) {
					_doing_it_wrong(
						__METHOD__,
						sprintf(
							/* translators: %s: variation slug */
							__( 'Block style variation "%s" has invalid parent reference.', 'gutenberg' ),
							$slug
						),
						'6.3.0'
					);
				}
				return false;
			}

			// Prevent self-inheritance
			if ( $variation['parent'] === $slug ) {
				if ( function_exists( '_doing_it_wrong' ) ) {
					_doing_it_wrong(
						__METHOD__,
						sprintf(
							/* translators: %s: variation slug */
							__( 'Block style variation "%s" cannot inherit from itself.', 'gutenberg' ),
							$slug
						),
						'6.3.0'
					);
				}
				return false;
			}
		}

		return true;
	}

	/**
	 * Resolve complete inheritance chain for a style variation
	 *
	 * @param string $slug Variation slug.
	 * @param array  $all_variations All available variations.
	 * @param array  $chain_tracker Chain tracker to prevent circular references.
	 * @return array|false Resolved variation or false on failure.
	 */
	private static function resolve_inheritance_chain( $slug, $all_variations, $chain_tracker = array() ) {
		// Check cache first
		if ( isset( self::$resolved_cache[ $slug ] ) ) {
			return self::$resolved_cache[ $slug ];
		}

		// Prevent circular inheritance
		if ( in_array( $slug, $chain_tracker, true ) ) {
			if ( function_exists( '_doing_it_wrong' ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: %s: inheritance chain */
						__( 'Circular inheritance detected in style variation chain: %s', 'gutenberg' ),
						implode( ' -> ', array_merge( $chain_tracker, array( $slug ) ) )
					),
					'6.3.0'
				);
			}
			return false;
		}

		$variation = isset( $all_variations[ $slug ] ) ? $all_variations[ $slug ] : false;
		if ( ! $variation ) {
			if ( function_exists( '_doing_it_wrong' ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: %s: variation slug */
						__( 'Style variation "%s" not found.', 'gutenberg' ),
						$slug
					),
					'6.3.0'
				);
			}
			return false;
		}

		// If no parent, return as-is
		if ( ! isset( $variation['parent'] ) ) {
			self::$resolved_cache[ $slug ] = $variation;
			self::$inheritance_cache[ $slug ] = array( $slug );
			return $variation;
		}

		// Resolve parent first
		$parent_slug = $variation['parent'];
		$chain_tracker[] = $slug;

		$parent_variation = self::resolve_inheritance_chain( $parent_slug, $all_variations, $chain_tracker );
		if ( ! $parent_variation ) {
			if ( function_exists( '_doing_it_wrong' ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: 1: parent slug, 2: child slug */
						__( 'Failed to resolve parent "%1$s" for style variation "%2$s".', 'gutenberg' ),
						$parent_slug,
						$slug
					),
					'6.3.0'
				);
			}
			return false;
		}

		// Merge parent and child properties
		$resolved_variation = self::merge_style_properties( $parent_variation, $variation );

		// Store inheritance chain for CSS class generation
		self::$inheritance_cache[ $slug ] = array_merge(
			self::$inheritance_cache[ $parent_slug ] ?? array( $parent_slug ),
			array( $slug )
		);

		// Cache the resolved variation
		self::$resolved_cache[ $slug ] = $resolved_variation;

		return $resolved_variation;
	}

	/**
	 * Merge parent and child style properties with proper override logic
	 *
	 * @param array $parent Parent variation.
	 * @param array $child Child variation.
	 * @return array Merged variation.
	 */
	private static function merge_style_properties( $parent, $child ) {
		// Start with parent properties
		$merged = $parent;

		// Override with child properties
		foreach ( $child as $key => $value ) {
			if ( $key === 'parent' ) {
				// Don't inherit the parent reference itself
				continue;
			}

			if ( is_array( $value ) && isset( $merged[ $key ] ) && is_array( $merged[ $key ] ) ) {
				// Deep merge for nested arrays (like styles, spacing, etc.)
				$merged[ $key ] = self::deep_merge_arrays( $merged[ $key ], $value );
			} else {
				// Direct override for non-array values
				$merged[ $key ] = $value;
			}
		}

		return $merged;
	}

	/**
	 * Deep merge arrays with child values taking precedence
	 *
	 * @param array $parent Parent array.
	 * @param array $child Child array.
	 * @return array Merged array.
	 */
	private static function deep_merge_arrays( $parent, $child ) {
		$merged = $parent;

		foreach ( $child as $key => $value ) {
			if ( is_array( $value ) && isset( $merged[ $key ] ) && is_array( $merged[ $key ] ) ) {
				$merged[ $key ] = self::deep_merge_arrays( $merged[ $key ], $value );
			} else {
				$merged[ $key ] = $value;
			}
		}

		return $merged;
	}

	/**
	 * Add inherited CSS classes to blocks that use style variations
	 *
	 * @param string $block_content Block content.
	 * @param array  $block Block data.
	 * @return string Modified block content.
	 */
	public static function add_inherited_classes( $block_content, $block ) {
		// Only process blocks with className attribute
		if ( ! isset( $block['attrs']['className'] ) || ! is_string( $block['attrs']['className'] ) ) {
			return $block_content;
		}

		$classes = explode( ' ', $block['attrs']['className'] );
		$style_classes = array();

		// Find style variation classes
		foreach ( $classes as $class ) {
			if ( strpos( $class, 'is-style-' ) === 0 ) {
				$style_slug = substr( $class, 9 ); // Remove 'is-style-' prefix

				// Add inheritance chain classes
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
			// Remove duplicate style classes and merge with other classes
			$non_style_classes = array_filter( $classes, function( $class ) {
				return strpos( $class, 'is-style-' ) !== 0;
			} );

			$all_classes = array_unique( array_merge( $non_style_classes, $style_classes ) );
			$new_class_string = implode( ' ', $all_classes );

			// Replace className in block content
			$block_content = preg_replace(
				'/class="([^"]*)"/',
				'class="' . esc_attr( $new_class_string ) . '"',
				$block_content,
				1
			);
		}

		return $block_content;
	}

	/**
	 * Get inheritance cache
	 *
	 * @return array Inheritance cache.
	 */
	public static function get_inheritance_cache() {
		return self::$inheritance_cache;
	}

	/**
	 * Get debug information
	 *
	 * @return array Debug information.
	 */
	public static function get_debug_info() {
		return array(
			'resolved_cache'    => self::$resolved_cache,
			'inheritance_cache' => self::$inheritance_cache,
		);
	}

	/**
	 * Clear caches
	 */
	public static function clear_caches() {
		self::$resolved_cache = array();
		self::$inheritance_cache = array();
	}
}
