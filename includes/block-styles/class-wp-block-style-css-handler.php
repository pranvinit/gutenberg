<?php
/**
 * CSS Handler for Block Style Inheritance
 *
 * @package WordPress
 * @subpackage Gutenberg
 */

/**
 * Class WP_Block_Style_CSS_Handler
 *
 * Handles the generation and optimization of CSS for inherited style variations.
 */
class WP_Block_Style_CSS_Handler {

	/**
	 * Generate CSS for inherited style variations
	 *
	 * @param array $variations The style variations.
	 * @return string The generated CSS.
	 */
	public static function generate_inherited_css( $variations ) {
		$css = "/* Block Style Variation Inheritance CSS */\n";
		$css .= "/* Generated automatically - do not edit directly */\n\n";

		foreach ( $variations as $slug => $variation ) {
			$css .= self::generate_variation_css( $slug, $variation );
		}

		return $css;
	}

	/**
	 * Generate CSS for a single variation
	 *
	 * @param string $slug The variation slug.
	 * @param array  $variation The variation data.
	 * @return string The generated CSS.
	 */
	private static function generate_variation_css( $slug, $variation ) {
		if ( ! isset( $variation['styles'] ) ) {
			return '';
		}

		$selector = ".is-style-{$slug}";

		// Get block types if specified.
		if ( isset( $variation['blockTypes'] ) && is_array( $variation['blockTypes'] ) ) {
			$block_selectors = array();
			foreach ( $variation['blockTypes'] as $block_type ) {
				$block_selectors[] = ".wp-block-{$block_type}.is-style-{$slug}";
			}
			$selector = implode( ', ', $block_selectors );
		}

		$css = "{$selector} {\n";

		// Convert variation styles to CSS.
		$css .= self::styles_to_css( $variation['styles'] );

		$css .= "}\n\n";

		// Handle elements (child selectors).
		if ( isset( $variation['styles']['elements'] ) && is_array( $variation['styles']['elements'] ) ) {
			foreach ( $variation['styles']['elements'] as $element => $element_styles ) {
				if ( $element === 'link' ) {
					$css .= "{$selector} a {\n";
				} elseif ( $element === 'heading' ) {
					$css .= "{$selector} h1, {$selector} h2, {$selector} h3, {$selector} h4, {$selector} h5, {$selector} h6 {\n";
				} else {
					$css .= "{$selector} {$element} {\n";
				}

				$css .= self::styles_to_css( $element_styles );

				$css .= "}\n\n";
			}
		}

		return $css;
	}

	/**
	 * Convert style object to CSS string
	 *
	 * @param array $styles The styles array.
	 * @param string $indent The indentation string.
	 * @return string The CSS string.
	 */
	private static function styles_to_css( $styles, $indent = '  ' ) {
		$css = '';

		foreach ( $styles as $property => $value ) {
			if ( $property === 'elements' ) {
				continue; // Elements are processed separately.
			}

			if ( is_array( $value ) ) {
				if ( $property === 'spacing' ) {
					if ( isset( $value['padding'] ) ) {
						if ( is_array( $value['padding'] ) ) {
							foreach ( $value['padding'] as $side => $padding ) {
								$css .= "{$indent}padding-{$side}: {$padding};\n";
							}
						} else {
							$css .= "{$indent}padding: {$value['padding']};\n";
						}
					}

					if ( isset( $value['margin'] ) ) {
						if ( is_array( $value['margin'] ) ) {
							foreach ( $value['margin'] as $side => $margin ) {
								$css .= "{$indent}margin-{$side}: {$margin};\n";
							}
						} else {
							$css .= "{$indent}margin: {$value['margin']};\n";
						}
					}

					if ( isset( $value['blockGap'] ) ) {
						$css .= "{$indent}gap: {$value['blockGap']};\n";
					}
				} elseif ( $property === 'color' ) {
					if ( isset( $value['background'] ) ) {
						// Handle linear gradients and other complex background values
						if ( strpos( $value['background'], 'linear-gradient' ) === 0 ) {
							$css .= "{$indent}background: {$value['background']};\n";
						} else {
							$css .= "{$indent}background-color: {$value['background']};\n";
						}
					}
					if ( isset( $value['text'] ) ) {
						$css .= "{$indent}color: {$value['text']};\n";
					}
					if ( isset( $value['gradient'] ) ) {
						$css .= "{$indent}background: {$value['gradient']};\n";
					}
				} elseif ( $property === 'typography' ) {
					foreach ( $value as $typo_prop => $typo_value ) {
						$css_prop = self::convert_typography_property( $typo_prop );
						$css .= "{$indent}{$css_prop}: {$typo_value};\n";
					}
				} elseif ( $property === 'border' ) {
					if ( isset( $value['radius'] ) ) {
						$css .= "{$indent}border-radius: {$value['radius']};\n";
					}
					if ( isset( $value['width'] ) ) {
						$css .= "{$indent}border-width: {$value['width']};\n";
					}
					if ( isset( $value['style'] ) ) {
						$css .= "{$indent}border-style: {$value['style']};\n";
					}
					if ( isset( $value['color'] ) ) {
						$css .= "{$indent}border-color: {$value['color']};\n";
					}
				} else {
					// Other nested properties.
					foreach ( $value as $sub_prop => $sub_value ) {
						if ( is_array( $sub_value ) ) {
							// Skip deeply nested arrays for now.
							continue;
						}
						$css .= "{$indent}{$property}-{$sub_prop}: {$sub_value};\n";
					}
				}
			} else {
				$css .= "{$indent}{$property}: {$value};\n";
			}
		}

		return $css;
	}

	/**
	 * Convert typography property to CSS property
	 *
	 * @param string $property The typography property.
	 * @return string The CSS property.
	 */
	private static function convert_typography_property( $property ) {
		$mapping = array(
			'fontSize'   => 'font-size',
			'fontFamily' => 'font-family',
			'fontWeight' => 'font-weight',
			'fontStyle'  => 'font-style',
			'lineHeight' => 'line-height',
			'textDecoration' => 'text-decoration',
			'textTransform' => 'text-transform',
			'letterSpacing' => 'letter-spacing',
		);

		return isset( $mapping[ $property ] ) ? $mapping[ $property ] : $property;
	}
}
