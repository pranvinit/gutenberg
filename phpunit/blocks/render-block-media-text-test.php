<?php
/**
 * Media & Text block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Media & Text block.
 *
 * @group blocks
 *
 * @covers ::render_block_core_media_text
 */
class Render_Block_MediaText_Test extends WP_UnitTestCase {

	/**
	 * Post object.
	 *
	 * @var WP_Post
	 */
	protected static $post;

	/**
	 * Attachment id.
	 *
	 * @var int
	 */
	protected static $attachment_id;

	/**
	 * Setup method.
	 */
	public static function wpSetUpBeforeClass() {
		self::$post = self::factory()->post->create_and_get();
		$file       = DIR_TESTDATA . '/images/canola.jpg';

		self::$attachment_id = self::factory()->attachment->create_upload_object(
			$file,
			self::$post->ID,
			array(
				'post_mime_type' => 'image/jpeg',
			)
		);

		set_post_thumbnail( self::$post, self::$attachment_id );
	}

	/**
	 * Tear down method.
	 */
	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$post->ID, true );
		wp_delete_post( self::$attachment_id, true );
	}

	/**
	 * Helper method for $wp_query.
	 */
	public static function setup_query() {
		global $wp_query;
		$wp_query->in_the_loop = true;
		$wp_query->post        = self::$post;
		$wp_query->posts       = array( self::$post );
		$GLOBALS['post']       = self::$post;
	}

	/**
	 * Test gutenberg_render_block_core_media_text with the featured image on the left.
	 */
	public function test_render_block_core_media_text_featured_image() {
		$this->setup_query();

		$content = '<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"></figure><div class="wp-block-media-text__content"><p></p></div></div>';

		// Assert that the rendered block contains the featured image.
		$attributes = array(
			'useFeaturedImage' => true,
		);
		$rendered   = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );

		// Assert that the rendered block contains the featured image as an image element,
		// when image fill is true.
		$attributes = array(
			'useFeaturedImage' => true,
			'imageFill'        => true,
		);
		$rendered   = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );
	}

	/**
	 * Test gutenberg_render_block_core_media_text with the featured image on the left,
	 * and a second media & text block nested inside the content area.
	 */
	public function test_render_block_core_media_text_featured_image_nested() {
		$this->setup_query();
		$content = '<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"></figure><div class="wp-block-media-text__content"><div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"></figure><div class="wp-block-media-text__content"><p></p></div></div></div></div>';

		// Assert that the rendered block contains the featured image.
		$attributes = array(
			'useFeaturedImage' => true,
		);
		$rendered   = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );

		// Assert that the rendered block contains the featured image as an image element,
		// when image fill is true.
		$attributes = array(
			'useFeaturedImage' => true,
			'imageFill'        => true,
		);
		$rendered   = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );
	}

	/**
	 * Test gutenberg_render_block_core_media_text with the featured image on the right.
	 */
	public function test_render_block_core_media_text_featured_image_media_on_right() {
		$this->setup_query();

		$content = '<div class="wp-block-media-text has-media-on-the-right is-stacked-on-mobile"><div class="wp-block-media-text__content"><p></p></div><figure class="wp-block-media-text__media"></figure></div>';

		// Assert that the rendered block contains the featured image when media is on the right.
		$attributes = array(
			'useFeaturedImage' => true,
			'mediaPosition'    => 'right',
		);
		$rendered   = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );

		// Assert that the rendered block contains the featured image as an image element,
		// when image fill is true and the media is on the right.
		$attributes = array(
			'useFeaturedImage' => true,
			'mediaPosition'    => 'right',
			'imageFill'        => true,
		);
		$rendered   = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );
	}

	/**
	 * Test gutenberg_render_block_core_media_text with the featured image on the right,
	 * and a second media & text block nested inside the content area.
	 */
	public function test_render_block_core_media_text_featured_image_media_on_right_nested() {
		$this->setup_query();

		$content = '<div class="wp-block-media-text has-media-on-the-right is-stacked-on-mobile"><div class="wp-block-media-text__content"><div class="wp-block-media-text is-stacked-on-mobile"><div class="wp-block-media-text__content"><p></p></div><figure class="wp-block-media-text__media"></figure></div></div><figure class="wp-block-media-text__media"></figure></div>';

		// Assert that the rendered block contains the featured image when media is on the right.
		$attributes = array(
			'useFeaturedImage' => true,
			'mediaPosition'    => 'right',
		);

		$rendered = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );

		// Assert that the rendered block contains the featured image as an image element,
		// when image fill is true and the media is on the right.
		$attributes = array(
			'useFeaturedImage' => true,
			'mediaPosition'    => 'right',
			'imageFill'        => true,
		);

		$rendered = gutenberg_render_block_core_media_text( $attributes, $content );
		$this->assertStringContainsString( '<img alt="" src="' . wp_get_attachment_image_url( self::$attachment_id, 'full' ) . '"', $rendered );
	}

	/**
	 * Test gutenberg_render_block_core_media_text adds the lightbox to an image
	 * that is not linked.
	 *
	 * @covers ::block_core_media_text_render_lightbox
	 */
	public function test_render_block_core_media_text_lightbox() {
		$content = '<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"><img src="canola.jpg" alt="Canola" class="wp-image-1 size-full"/></figure><div class="wp-block-media-text__content"><p></p></div></div>';

		$attributes = array(
			'useFeaturedImage' => false,
			'lightbox'         => array( 'enabled' => true ),
		);
		$rendered   = gutenberg_render_block_core_media_text( $attributes, $content );

		$this->assertStringContainsString( 'class="lightbox-trigger"', $rendered );

		$processor = new WP_HTML_Tag_Processor( $rendered );
		$processor->next_tag( 'figure' );
		$this->assertTrue( $processor->has_class( 'wp-block-media-text__media' ) );
		$this->assertTrue( $processor->has_class( 'wp-lightbox-container' ) );
		$this->assertFalse( $processor->has_class( 'wp-block-image' ), 'The figure should keep the class names of the Media & Text block.' );

		// The lightbox overlay is styled for the figure of an Image block.
		$image_id = $processor->get_attribute( 'data-wp-key' );
		$state    = wp_interactivity_state( 'core/image' );
		$this->assertSame( 'wp-block-image', $state['metadata'][ $image_id ]['figureClassNames'] );

		$this->assertTrue( wp_style_is( 'wp-block-image' ), 'The styles of the lightbox should be enqueued.' );
	}

	/**
	 * Test gutenberg_render_block_core_media_text does not add the lightbox to
	 * an image that is linked, or when the lightbox is not enabled.
	 *
	 * @covers ::block_core_media_text_render_lightbox
	 */
	public function test_render_block_core_media_text_lightbox_not_added() {
		$content = '<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"><a href="https://example.com"><img src="canola.jpg" alt=""/></a></figure><div class="wp-block-media-text__content"><p></p></div></div>';

		$attributes = array(
			'useFeaturedImage' => false,
			'lightbox'         => array( 'enabled' => true ),
		);
		$this->assertSame( $content, gutenberg_render_block_core_media_text( $attributes, $content ) );

		$content = '<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"><img src="canola.jpg" alt=""/></figure><div class="wp-block-media-text__content"><p></p></div></div>';

		$attributes = array(
			'useFeaturedImage' => false,
			'lightbox'         => array( 'enabled' => false ),
		);
		$this->assertSame( $content, gutenberg_render_block_core_media_text( $attributes, $content ) );
	}

	/**
	 * Test gutenberg_render_block_core_media_text adds the lightbox to the image
	 * of the block on the right, and not to the image of a second media & text
	 * block nested inside the content area.
	 *
	 * @covers ::block_core_media_text_render_lightbox
	 */
	public function test_render_block_core_media_text_lightbox_media_on_right_nested() {
		$nested_block = '<div class="wp-block-media-text is-stacked-on-mobile"><figure class="wp-block-media-text__media"><img src="nested.jpg" alt=""/></figure><div class="wp-block-media-text__content"><p></p></div></div>';
		$content      = '<div class="wp-block-media-text has-media-on-the-right is-stacked-on-mobile"><div class="wp-block-media-text__content">' . $nested_block . '</div><figure class="wp-block-media-text__media"><img src="canola.jpg" alt=""/></figure></div>';

		$attributes = array(
			'useFeaturedImage' => false,
			'mediaPosition'    => 'right',
			'lightbox'         => array( 'enabled' => true ),
		);
		$rendered   = gutenberg_render_block_core_media_text( $attributes, $content );

		$this->assertStringContainsString( $nested_block, $rendered );
		$this->assertSame( 1, substr_count( $rendered, 'class="lightbox-trigger"' ) );

		$processor = new WP_HTML_Tag_Processor( $rendered );
		$processor->next_tag( 'img' );
		$this->assertSame( 'nested.jpg', $processor->get_attribute( 'src' ) );
		$this->assertNull( $processor->get_attribute( 'data-wp-on--click' ) );
		$processor->next_tag( 'img' );
		$this->assertSame( 'canola.jpg', $processor->get_attribute( 'src' ) );
		$this->assertSame( 'actions.showLightbox', $processor->get_attribute( 'data-wp-on--click' ) );
	}
}
