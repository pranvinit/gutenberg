<?php
/**
 * Icon block rendering tests.
 *
 * @package Gutenberg
 */

/**
 * Tests for the Icon block.
 *
 * @group blocks
 */
class Render_Block_Icon_Test extends WP_UnitTestCase {

	/**
	 * Renders an Icon block with the supplied attributes.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered block markup.
	 */
	private function render_icon( $attributes ) {
		return render_block(
			array(
				'blockName'    => 'core/icon',
				'attrs'        => $attributes,
				'innerBlocks'  => array(),
				'innerHTML'    => '',
				'innerContent' => array(),
			)
		);
	}

	/**
	 * Returns the first tag of the requested type from rendered markup.
	 *
	 * @param string $markup   Rendered block markup.
	 * @param string $tag_name Tag name to select.
	 * @return WP_HTML_Tag_Processor HTML processor positioned at the tag.
	 */
	private function get_tag_processor( $markup, $tag_name ) {
		$processor = new WP_HTML_Tag_Processor( $markup );
		$this->assertTrue( $processor->next_tag( $tag_name ) );
		return $processor;
	}

	/**
	 * @covers ::gutenberg_render_block_core_icon
	 */
	public function test_returns_nothing_without_an_icon() {
		$this->assertSame( '', $this->render_icon( array() ) );
	}

	/**
	 * @covers ::gutenberg_render_block_core_icon
	 */
	public function test_renders_unlinked_icon_without_changing_existing_markup() {
		$markup = $this->render_icon(
			array(
				'icon' => 'core/audio',
			)
		);

		$this->assertStringNotContainsString( '<a ', $markup );

		$svg = $this->get_tag_processor( $markup, 'svg' );
		$this->assertSame( 'true', $svg->get_attribute( 'aria-hidden' ) );
		$this->assertSame( 'false', $svg->get_attribute( 'focusable' ) );
	}

	/**
	 * @covers ::gutenberg_render_block_core_icon
	 */
	public function test_renders_link_with_custom_accessible_label() {
		$markup = $this->render_icon(
			array(
				'icon'      => 'core/audio',
				'url'       => 'https://example.com',
				'ariaLabel' => 'Listen now',
			)
		);

		$link = $this->get_tag_processor( $markup, 'a' );
		$this->assertSame( 'wp-block-icon__link', $link->get_attribute( 'class' ) );
		$this->assertSame( 'https://example.com', $link->get_attribute( 'href' ) );
		$this->assertSame( 'Listen now', $link->get_attribute( 'aria-label' ) );

		$svg = $this->get_tag_processor( $markup, 'svg' );
		$this->assertSame( 'true', $svg->get_attribute( 'aria-hidden' ) );
		$this->assertSame( 'false', $svg->get_attribute( 'focusable' ) );
		$this->assertNull( $svg->get_attribute( 'aria-label' ) );
	}

	/**
	 * @covers ::gutenberg_render_block_core_icon
	 */
	public function test_uses_registered_icon_label_as_link_fallback() {
		$markup = $this->render_icon(
			array(
				'icon' => 'core/audio',
				'url'  => 'https://example.com',
			)
		);

		$link = $this->get_tag_processor( $markup, 'a' );
		$this->assertSame( 'Audio', $link->get_attribute( 'aria-label' ) );
	}

	/**
	 * @covers ::gutenberg_render_block_core_icon
	 */
	public function test_adds_noopener_to_links_that_open_in_a_new_tab() {
		$markup = $this->render_icon(
			array(
				'icon'       => 'core/audio',
				'url'        => 'https://example.com',
				'linkTarget' => '_blank',
				'rel'        => 'nofollow',
			)
		);

		$link = $this->get_tag_processor( $markup, 'a' );
		$this->assertSame( '_blank', $link->get_attribute( 'target' ) );
		$this->assertSame( 'nofollow noopener', $link->get_attribute( 'rel' ) );
	}

	/**
	 * @covers ::gutenberg_render_block_core_icon
	 */
	public function test_escapes_link_attributes() {
		$markup = $this->render_icon(
			array(
				'icon'      => 'core/audio',
				'url'       => 'https://example.com/?one=1&two=2',
				'ariaLabel' => 'Listen "now"',
				'rel'       => 'external" onclick="alert(1)',
			)
		);

		$link = $this->get_tag_processor( $markup, 'a' );
		$this->assertSame(
			'https://example.com/?one=1&two=2',
			$link->get_attribute( 'href' )
		);
		$this->assertSame( 'Listen "now"', $link->get_attribute( 'aria-label' ) );
		$this->assertSame(
			'external" onclick="alert(1)',
			$link->get_attribute( 'rel' )
		);
		$this->assertNull( $link->get_attribute( 'onclick' ) );
	}
}
