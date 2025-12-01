<?php
/**
 * Edit This Mode: Frontend editing helpers for block themes.
 *
 * This file provides functionality to add "Edit this" buttons on the frontend
 * of block theme sites, allowing logged-in users with editing capabilities
 * to quickly navigate to the appropriate editor for template parts and post content.
 *
 * @package gutenberg
 * @since Gutenberg 22.3.0
 */

/**
 * Checks if Edit This mode is enabled for the current user.
 *
 * Edit This mode is only available for:
 * - Block themes
 * - Logged-in users with editing capabilities
 * - Users who have enabled the mode via admin bar toggle
 *
 * @since Gutenberg 22.3.0
 *
 * @return bool True if Edit This mode is enabled, false otherwise.
 */
function gutenberg_is_edit_this_mode_enabled() {
	// Only available for block themes.
	if ( ! wp_is_block_theme() ) {
		return false;
	}

	// User must be logged in.
	if ( ! is_user_logged_in() ) {
		return false;
	}

	// User must have capability to edit posts.
	if ( ! current_user_can( 'edit_posts' ) ) {
		return false;
	}

	// Check if user has enabled Edit This mode.
	// This will be stored in a cookie to persist across page loads.
	$edit_mode_enabled = isset( $_COOKIE['gutenberg_edit_this_mode'] ) &&
						 '1' === $_COOKIE['gutenberg_edit_this_mode'];

	/**
	 * Filters whether Edit This mode is enabled.
	 *
	 * @since Gutenberg 22.3.0
	 *
	 * @param bool $edit_mode_enabled Whether Edit This mode is enabled.
	 */
	return apply_filters( 'gutenberg_edit_this_mode_enabled', $edit_mode_enabled );
}

/**
 * Adds Edit This metadata to template part blocks on the frontend.
 *
 * This filter adds data attributes to template part blocks that the frontend
 * JavaScript can use to render edit buttons.
 *
 * @since Gutenberg 22.3.0
 *
 * @param string   $block_content The block content.
 * @param array    $block         The full block, including name and attributes.
 * @param WP_Block $instance      The block instance.
 *
 * @return string Modified block content with Edit This metadata.
 */
function gutenberg_add_edit_this_template_part_metadata( $block_content, $block, $instance ) {
	// Only process if Edit This mode is enabled.
	if ( ! gutenberg_is_edit_this_mode_enabled() ) {
		return $block_content;
	}

	// Only process template part blocks.
	if ( 'core/template-part' !== $block['blockName'] ) {
		return $block_content;
	}

	// Get template part attributes.
	$slug  = $block['attrs']['slug'] ?? '';
	$theme = $block['attrs']['theme'] ?? get_stylesheet();
	$area  = $block['attrs']['area'] ?? 'uncategorized';

	if ( empty( $slug ) ) {
		return $block_content;
	}

	// Build template part ID.
	$template_part_id = $theme . '//' . $slug;

	// Check if user can edit this template part.
	if ( ! current_user_can( 'edit_theme_options' ) ) {
		return $block_content;
	}

	// Create data attributes for the frontend JavaScript.
	$edit_metadata = sprintf(
		' data-gutenberg-edit-type="template-part" data-gutenberg-edit-id="%s" data-gutenberg-edit-slug="%s" data-gutenberg-edit-area="%s"',
		esc_attr( $template_part_id ),
		esc_attr( $slug ),
		esc_attr( $area )
	);

	// Inject the data attributes into the wrapper element.
	// Use WP HTML Tag Processor for safe HTML manipulation.
	$processor = new WP_HTML_Tag_Processor( $block_content );
	if ( $processor->next_tag() ) {
		$processor->set_attribute( 'data-gutenberg-edit-type', 'template-part' );
		$processor->set_attribute( 'data-gutenberg-edit-id', $template_part_id );
		$processor->set_attribute( 'data-gutenberg-edit-slug', $slug );
		$processor->set_attribute( 'data-gutenberg-edit-area', $area );
		return $processor->get_updated_html();
	}

	return $block_content;
}

/**
 * Adds Edit This metadata to post content blocks on the frontend.
 *
 * This filter adds data attributes to post content blocks that the frontend
 * JavaScript can use to render edit buttons.
 *
 * @since Gutenberg 22.3.0
 *
 * @param string   $block_content The block content.
 * @param array    $block         The full block, including name and attributes.
 * @param WP_Block $instance      The block instance.
 *
 * @return string Modified block content with Edit This metadata.
 */
function gutenberg_add_edit_this_post_content_metadata( $block_content, $block, $instance ) {
	// Only process if Edit This mode is enabled.
	if ( ! gutenberg_is_edit_this_mode_enabled() ) {
		return $block_content;
	}

	// Only process post content blocks.
	if ( 'core/post-content' !== $block['blockName'] ) {
		return $block_content;
	}

	// Get post ID from block context.
	$post_id = $instance->context['postId'] ?? null;

	if ( ! $post_id ) {
		return $block_content;
	}

	// Check if user can edit this post.
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return $block_content;
	}

	// Get post type.
	$post = get_post( $post_id );
	if ( ! $post ) {
		return $block_content;
	}

	$post_type = $post->post_type;

	// Create data attributes for the frontend JavaScript.
	// Use WP HTML Tag Processor for safe HTML manipulation.
	$processor = new WP_HTML_Tag_Processor( $block_content );
	if ( $processor->next_tag() ) {
		$processor->set_attribute( 'data-gutenberg-edit-type', 'post-content' );
		$processor->set_attribute( 'data-gutenberg-edit-id', (string) $post_id );
		$processor->set_attribute( 'data-gutenberg-edit-post-type', $post_type );
		return $processor->get_updated_html();
	}

	return $block_content;
}

/**
 * Enqueues Edit This mode assets on the frontend.
 *
 * @since Gutenberg 22.3.0
 */
function gutenberg_enqueue_edit_this_mode_assets() {
	// Only enqueue if Edit This mode is enabled.
	if ( ! gutenberg_is_edit_this_mode_enabled() ) {
		return;
	}

	// Enqueue the Edit This mode script module.
	wp_enqueue_script_module( '@wordpress/edit-this' );

	// Enqueue the Edit This mode styles.
	wp_enqueue_style(
		'wp-edit-this-mode',
		gutenberg_url( 'build/edit-this/style-index.css' ),
		array(),
		GUTENBERG_VERSION
	);

	// Pass configuration to the frontend JavaScript.
	wp_add_inline_script(
		'@wordpress/edit-this',
		sprintf(
			'window.gutenbergEditThisConfig = %s;',
			wp_json_encode(
				array(
					'siteEditorUrl' => admin_url( 'site-editor.php' ),
					'adminUrl'      => admin_url(),
					'isBlockTheme'  => wp_is_block_theme(),
				)
			)
		),
		'before'
	);
}

/**
 * Adds Edit This mode toggle to the admin bar.
 *
 * @since Gutenberg 22.3.0
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
 */
function gutenberg_add_edit_this_mode_admin_bar_toggle( $wp_admin_bar ) {
	// Only show for block themes.
	if ( ! wp_is_block_theme() ) {
		return;
	}

	// User must be logged in and able to edit.
	if ( ! is_user_logged_in() || ! current_user_can( 'edit_posts' ) ) {
		return;
	}

	// Don't show in admin.
	if ( is_admin() ) {
		return;
	}

	$is_enabled = gutenberg_is_edit_this_mode_enabled();

	$wp_admin_bar->add_node(
		array(
			'id'    => 'gutenberg-edit-this-mode',
			'title' => __( 'Edit This Mode', 'gutenberg' ),
			'href'  => '#',
			'meta'  => array(
				'class' => 'gutenberg-edit-this-mode-toggle ' . ( $is_enabled ? 'is-enabled' : '' ),
				'title' => __( 'Toggle Edit This mode to show edit buttons on the frontend', 'gutenberg' ),
			),
		)
	);

	// Add inline script to handle toggle.
	add_action(
		'wp_footer',
		function () {
			?>
			<script>
				( function() {
					const toggle = document.getElementById( 'wp-admin-bar-gutenberg-edit-this-mode' );
					if ( ! toggle ) {
						return;
					}

					toggle.addEventListener( 'click', function( e ) {
						e.preventDefault();
						const isEnabled = toggle.classList.contains( 'is-enabled' );

						// Set cookie.
						document.cookie = 'gutenberg_edit_this_mode=' + ( isEnabled ? '0' : '1' ) + '; path=/; max-age=31536000; SameSite=Lax';

						// Reload page to apply changes.
						window.location.reload();
					} );
				} )();
			</script>
			<style>
				#wp-admin-bar-gutenberg-edit-this-mode .ab-item {
					cursor: pointer;
				}
				#wp-admin-bar-gutenberg-edit-this-mode.is-enabled .ab-item {
					background: #2271b1;
					color: #fff;
				}
			</style>
			<?php
		}
	);
}

// Register hooks.
add_filter( 'render_block', 'gutenberg_add_edit_this_template_part_metadata', 10, 3 );
add_filter( 'render_block', 'gutenberg_add_edit_this_post_content_metadata', 10, 3 );
add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_edit_this_mode_assets' );
add_action( 'admin_bar_menu', 'gutenberg_add_edit_this_mode_admin_bar_toggle', 100 );
