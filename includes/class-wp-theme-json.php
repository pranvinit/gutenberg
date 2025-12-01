<?php
/**
 * WP_Theme_JSON class with Block Style Variations Inheritance
 *
 * @package Gutenberg
 */

/**
 * Class to process theme.json files.
 */
class WP_Theme_JSON {

	/**
	 * Variation inheritance cache
	 *
	 * @var array
	 */
	protected static $variation_inheritance_cache = array();

	/**
	 * Process style inheritance in variations
	 *
	 * @param array $variations The style variations.
	 * @return array The processed variations with inheritance resolved.
	 */
	protected function process_style_variations_inheritance( $variations ) {
		if ( empty( $variations ) || ! is_array( $variations ) ) {
			return $variations;
		}

		$processed_variations = array();
		$resolved_cache       = array();
		$inheritance_cache    = array();

		// First pass: collect all variations and validate structure.
		foreach ( $variations as $slug => $variation ) {
			if ( $this->validate_variation_structure( $variation, $slug ) ) {
				$processed_variations[ $slug ] = $variation;
			}
		}

		// Second pass: resolve inheritance chains.
		foreach ( $processed_variations as $slug => $variation ) {
			$resolved_variation = $this->resolve_variation_inheritance_chain(
				$slug,
				$processed_variations,
				$resolved_cache,
				$inheritance_cache
			);

			if ( $resolved_variation ) {
				$processed_variations[ $slug ] = $resolved_variation;
			}
		}

		// Store inheritance cache for later use when rendering blocks.
		$this->store_variation_inheritance_cache( $inheritance_cache );

		return $processed_variations;
	}

	/**
	 * Validate variation structure and inheritance relationships
	 *
	 * @param array  $variation The variation data.
	 * @param string $slug The variation slug.
	 * @return bool Whether the variation is valid.
	 */
	protected function validate_variation_structure( $variation, $slug ) {
		// Basic structure validation.
		if ( ! is_array( $variation ) ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: %s: variation slug */
					__( 'Block style variation "%s" must be an array.', 'gutenberg' ),
					$slug
				),
				'6.3.0'
			);
			return false;
		}

		// Validate parent reference if exists.
		if ( isset( $variation['parent'] ) ) {
			if ( ! is_string( $variation['parent'] ) || empty( $variation['parent'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: %s: variation slug */
						__( 'Block style variation "%s" has invalid parent reference.', 'gutenberg' ),
						$slug
					),
					'6.3.0'
				);
				return false;
			}

			// Prevent self-inheritance.
			if ( $variation['parent'] === $slug ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						/* translators: %s: variation slug */
						__( 'Block style variation "%s" cannot inherit from itself.', 'gutenberg' ),
						$slug
					),
					'6.3.0'
				);
				return false;
			}
		}

		return true;
	}

	/**
	 * Resolve inheritance chain for a style variation
	 *
	 * @param string $slug The variation slug.
	 * @param array  $all_variations All available variations.
	 * @param array  $resolved_cache Cache for resolved variations.
	 * @param array  $inheritance_cache Cache for inheritance chains.
	 * @param array  $chain_tracker Array to track the inheritance chain.
	 * @return array|false The resolved variation or false if resolution failed.
	 */
	protected function resolve_variation_inheritance_chain( $slug, $all_variations, &$resolved_cache, &$inheritance_cache, $chain_tracker = array() ) {
		// Check cache first.
		if ( isset( $resolved_cache[ $slug ] ) ) {
			return $resolved_cache[ $slug ];
		}

		// Prevent circular inheritance.
		if ( in_array( $slug, $chain_tracker, true ) ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: %s: inheritance chain */
					__( 'Circular inheritance detected in style variation chain: %s', 'gutenberg' ),
					implode( ' -> ', array_merge( $chain_tracker, array( $slug ) ) )
				),
				'6.3.0'
			);
			return false;
		}

		$variation = isset( $all_variations[ $slug ] ) ? $all_variations[ $slug ] : false;
		if ( ! $variation ) {
			_doing_it_wrong(
				__METHOD__,
				sprintf(
					/* translators: %s: variation slug */
					__( 'Style variation "%s" not found.', 'gutenberg' ),
					$slug
				),
				'6.3.0'
			);
			return false;
		}

		// If no parent, return as-is.
		if ( ! isset( $variation['parent'] ) ) {
			$resolved_cache[ $slug ] = $variation;
			$inheritance_cache[ $slug ] = array( $slug );
			return $variation;
		}

		// Resolve parent first.
		$parent_slug = $variation['parent'];
		$chain_tracker[] = $slug;

		$parent_variation = $this->resolve_variation_inheritance_chain(
			$parent_slug,
			$all_variations,
			$resolved_cache,
			$inheritance_cache,
			$chain_tracker
		);

		if ( ! $parent_variation ) {
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
			return false;
		}

		// Merge parent and child properties.
		$resolved_variation = $this->merge_style_variation_properties( $parent_variation, $variation );

		// Store inheritance chain for CSS class generation.
		$inheritance_cache[ $slug ] = array_merge(
			$inheritance_cache[ $parent_slug ] ?? array( $parent_slug ),
			array( $slug )
		);

		// Cache the resolved variation.
		$resolved_cache[ $slug ] = $resolved_variation;

		return $resolved_variation;
	}

	/**
	 * Merge parent and child style properties with proper override logic
	 *
	 * @param array $parent The parent variation.
	 * @param array $child The child variation.
	 * @return array The merged variation.
	 */
	protected function merge_style_variation_properties( $parent, $child ) {
		// Start with parent properties.
		$merged = $parent;

		// Override with child properties.
		foreach ( $child as $key => $value ) {
			if ( $key === 'parent' ) {
				// Don't inherit the parent reference itself.
				continue;
			}

			if ( is_array( $value ) && isset( $merged[ $key ] ) && is_array( $merged[ $key ] ) ) {
				// Deep merge for nested arrays (like styles, spacing, etc.).
				$merged[ $key ] = $this->merge_nested_style_arrays( $merged[ $key ], $value );
			} else {
				// Direct override for non-array values.
				$merged[ $key ] = $value;
			}
		}

		return $merged;
	}

	/**
	 * Deep merge arrays with child values taking precedence
	 *
	 * @param array $parent The parent array.
	 * @param array $child The child array.
	 * @return array The merged array.
	 */
	protected function merge_nested_style_arrays( $parent, $child ) {
		$merged = $parent;

		foreach ( $child as $key => $value ) {
			if ( is_array( $value ) && isset( $merged[ $key ] ) && is_array( $merged[ $key ] ) ) {
				$merged[ $key ] = $this->merge_nested_style_arrays( $merged[ $key ], $value );
			} else {
				$merged[ $key ] = $value;
			}
		}

		return $merged;
	}

	/**
	 * Store variation inheritance cache for later use
	 *
	 * @param array $inheritance_cache The inheritance cache.
	 */
	protected function store_variation_inheritance_cache( $inheritance_cache ) {
		static::$variation_inheritance_cache = $inheritance_cache;
	}

	/**
	 * Get the variation inheritance cache
	 *
	 * @return array The inheritance cache.
	 */
	public static function get_variation_inheritance_cache() {
		return static::$variation_inheritance_cache;
	}

	/**
	 * Returns the raw data.
	 *
	 * @return array Raw data.
	 */
	public function get_raw_data() {
		$data = $this->theme_json;

		// Process style variations inheritance if they exist.
		if ( isset( $data['styles'] ) && isset( $data['styles']['variations'] ) ) {
			$data['styles']['variations'] = $this->process_style_variations_inheritance( $data['styles']['variations'] );
		}

		return $data;
	}


	/**
	 * Gets the data in the specified format.
	 *
	 * This is a modified version of the original method that includes
	 * processing of style variations inheritance.
	 *
	 * @param string $format Optional. The format to output the data.
	 *                      One of 'tree', 'array'. Default 'array'.
	 * @return array|WP_Theme_JSON_Data The theme JSON data in the requested format.
	 */
	public function get_data( $format = 'array' ) {
		if ( 'tree' === $format ) {
			return $this;
		}

		// Process style variations inheritance
		$this->theme_json = $this->process_style_variations_inheritance($this->theme_json['styles']['variations'] ?? array() );

		return $this->theme_json;
	}
}
