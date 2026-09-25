<?php
/**
 * Server-side rendering of the `core/media-text` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/media-text` block on server.
 *
 * @since 6.6.0
 * @since 7.2.0 Adds the lightbox to the image.
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block rendered content.
 *
 * @return string Returns the Media & Text block markup.
 */
function render_block_core_media_text( $attributes, $content ) {
	$content = block_core_media_text_render_featured_image( $attributes, $content );

	if ( ! empty( $attributes['lightbox']['enabled'] ) ) {
		$content = block_core_media_text_render_lightbox( $attributes, $content );
	}

	return $content;
}

/**
 * Renders the featured image of the `core/media-text` block.
 *
 * @since 7.2.0
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block rendered content.
 *
 * @return string Returns the Media & Text block markup, with the featured image if useFeaturedImage is true.
 */
function block_core_media_text_render_featured_image( $attributes, $content ) {
	if ( false === $attributes['useFeaturedImage'] ) {
		return $content;
	}

	if ( in_the_loop() ) {
		update_post_thumbnail_cache();
	}

	$current_featured_image = get_the_post_thumbnail_url();
	if ( ! $current_featured_image ) {
		return $content;
	}

	$has_media_on_right = 'right' === ( $attributes['mediaPosition'] ?? null );
	$image_fill         = (bool) ( $attributes['imageFill'] ?? false );
	$focal_point_attr   = $attributes['focalPoint'] ?? null;
	$focal_point_x      = null;
	$focal_point_y      = null;
	if ( is_array( $focal_point_attr ) ) {
		$focal_point_x = isset( $focal_point_attr['x'] ) && is_numeric( $focal_point_attr['x'] ) ? $focal_point_attr['x'] : null;
		$focal_point_y = isset( $focal_point_attr['y'] ) && is_numeric( $focal_point_attr['y'] ) ? $focal_point_attr['y'] : null;
	}
	$focal_point = null !== $focal_point_x && null !== $focal_point_y
		? round( $focal_point_x * 100 ) . '% ' . round( $focal_point_y * 100 ) . '%'
		: '50% 50%';
	$unique_id   = 'wp-block-media-text__media-' . wp_unique_id();

	$block_tag_processor = new WP_HTML_Tag_Processor( $content );
	$block_query         = array(
		'tag_name'   => 'div',
		'class_name' => 'wp-block-media-text',
	);

	while ( $block_tag_processor->next_tag( $block_query ) ) {
		if ( $image_fill ) {
			// The markup below does not work with the deprecated `is-image-fill` class.
			$block_tag_processor->remove_class( 'is-image-fill' );
			$block_tag_processor->add_class( 'is-image-fill-element' );
		}
	}

	$content = $block_tag_processor->get_updated_html();

	$media_tag_processor   = new WP_HTML_Tag_Processor( $content );
	$wrapping_figure_query = array(
		'tag_name'   => 'figure',
		'class_name' => 'wp-block-media-text__media',
	);

	if ( $has_media_on_right ) {
		// Loop through all the figure tags and set a bookmark on the last figure tag.
		while ( $media_tag_processor->next_tag( $wrapping_figure_query ) ) {
			$media_tag_processor->set_bookmark( 'last_figure' );
		}
		if ( $media_tag_processor->has_bookmark( 'last_figure' ) ) {
			$media_tag_processor->seek( 'last_figure' );
			// Insert a unique ID to identify the figure tag.
			$media_tag_processor->set_attribute( 'id', $unique_id );
		}
	} else {
		if ( $media_tag_processor->next_tag( $wrapping_figure_query ) ) {
			// Insert a unique ID to identify the figure tag.
			$media_tag_processor->set_attribute( 'id', $unique_id );
		}
	}

	$content = $media_tag_processor->get_updated_html();

	// Add the image tag inside the figure tag, and update the image attributes
	// in order to display the featured image.
	$media_size_slug = $attributes['mediaSizeSlug'] ?? 'full';
	$image_tag       = '<img class="wp-block-media-text__featured_image">';
	$content         = preg_replace(
		'/(<figure\s+id="' . preg_quote( $unique_id, '/' ) . '"\s+class="wp-block-media-text__media"\s*>)/',
		'$1' . $image_tag,
		$content
	);

	$image_tag_processor = new WP_HTML_Tag_Processor( $content );
	if ( $image_tag_processor->next_tag(
		array(
			'tag_name' => 'figure',
			'id'       => $unique_id,
		)
	) ) {
		// The ID is only used to ensure that the correct figure tag is selected,
		// and can now be removed.
		$image_tag_processor->remove_attribute( 'id' );
		if ( $image_tag_processor->next_tag(
			array(
				'tag_name'   => 'img',
				'class_name' => 'wp-block-media-text__featured_image',
			)
		) ) {
			$image_tag_processor->set_attribute( 'src', esc_url( $current_featured_image ) );
			$image_tag_processor->set_attribute( 'class', 'wp-image-' . get_post_thumbnail_id() . ' size-' . $media_size_slug );
			$image_tag_processor->set_attribute( 'alt', trim( strip_tags( get_post_meta( get_post_thumbnail_id(), '_wp_attachment_image_alt', true ) ) ) );
			if ( $image_fill ) {
				$image_tag_processor->set_attribute( 'style', 'object-position:' . $focal_point . ';' );
			}

			$content = $image_tag_processor->get_updated_html();
		}
	}

	return $content;
}

/**
 * Adds the lightbox of the `core/image` block to the image of the
 * `core/media-text` block.
 *
 * @since 7.2.0
 *
 * @param array  $attributes The block attributes.
 * @param string $content    The block rendered content.
 *
 * @return string Returns the Media & Text block markup, with the lightbox if the image is not linked.
 */
function block_core_media_text_render_lightbox( $attributes, $content ) {
	$has_media_on_right = 'right' === ( $attributes['mediaPosition'] ?? null );
	$unique_id          = 'wp-block-media-text__media-' . wp_unique_id();

	// The content can hold the figures of nested Media & Text blocks, so the
	// figure of this block is marked with a unique ID to find it.
	$media_tag_processor   = new WP_HTML_Tag_Processor( $content );
	$wrapping_figure_query = array(
		'tag_name'   => 'figure',
		'class_name' => 'wp-block-media-text__media',
	);

	if ( $has_media_on_right ) {
		while ( $media_tag_processor->next_tag( $wrapping_figure_query ) ) {
			$media_tag_processor->set_bookmark( 'last_figure' );
		}
		if ( ! $media_tag_processor->has_bookmark( 'last_figure' ) ) {
			return $content;
		}
		$media_tag_processor->seek( 'last_figure' );
	} elseif ( ! $media_tag_processor->next_tag( $wrapping_figure_query ) ) {
		return $content;
	}

	$media_tag_processor->set_attribute( 'id', $unique_id );
	$content = $media_tag_processor->get_updated_html();

	// The figure only holds an image, a link or a video, never another figure.
	if ( ! preg_match( '/<figure\s+id="' . preg_quote( $unique_id, '/' ) . '".*?<\/figure>/s', $content, $figure_match ) ) {
		return $content;
	}

	$figure           = $figure_match[0];
	$figure_processor = new WP_HTML_Tag_Processor( $figure );
	$figure_processor->next_tag( 'figure' );
	// The ID is only used to find the figure, and can now be removed.
	$figure_processor->remove_attribute( 'id' );
	$figure_processor->set_bookmark( 'figure' );

	// Like in the Image block, the lightbox only applies to an image that is
	// not linked.
	$has_unlinked_image = $figure_processor->next_tag() && 'IMG' === $figure_processor->get_tag();

	if ( $has_unlinked_image ) {
		// The lightbox overlay reuses the class names of the figure, and is
		// styled for the figure of an Image block. The styles of the Media &
		// Text block would stretch the enlarged image, so the figure is handed
		// to the lightbox as the figure of an Image block.
		$figure_processor->seek( 'figure' );
		$figure_processor->remove_class( 'wp-block-media-text__media' );
		$figure_processor->add_class( 'wp-block-image' );
	}

	$media = $figure_processor->get_updated_html();

	if ( $has_unlinked_image ) {
		$media_id    = ! empty( $attributes['useFeaturedImage'] ) ? get_post_thumbnail_id() : ( $attributes['mediaId'] ?? null );
		$image_block = new WP_Block(
			array(
				'blockName' => 'core/image',
				'attrs'     => $media_id ? array( 'id' => $media_id ) : array(),
			)
		);
		$media       = block_core_image_render_lightbox( $media, $image_block->parsed_block, $image_block );

		// Restore the class names of the figure.
		$figure_processor = new WP_HTML_Tag_Processor( $media );
		$figure_processor->next_tag( 'figure' );
		$figure_processor->remove_class( 'wp-block-image' );
		$figure_processor->add_class( 'wp-block-media-text__media' );
		$media = $figure_processor->get_updated_html();

		// The page may hold no Image block to load the lightbox.
		wp_enqueue_script_module( '@wordpress/block-library/image/view' );
		wp_enqueue_style( 'wp-block-image' );
	}

	return str_replace( $figure, $media, $content );
}

/**
 * Registers the `core/media-text` block renderer on server.
 *
 * @since 6.6.0
 */
function register_block_core_media_text() {
	register_block_type_from_metadata(
		__DIR__ . '/media-text',
		array(
			'render_callback' => 'render_block_core_media_text',
		)
	);
}
add_action( 'init', 'register_block_core_media_text' );
