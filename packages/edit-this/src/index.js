/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Configuration object passed from PHP.
 *
 * @typedef  {Object} EditThisConfig
 * @property {string}  siteEditorUrl Base URL for the site editor.
 * @property {string}  adminUrl      Base admin URL.
 * @property {boolean} isBlockTheme  Whether the current theme is a block theme.
 */

/**
 * Gets the configuration object from the global scope.
 *
 * @return {EditThisConfig|null} Configuration object or null if not available.
 */
function getConfig() {
	return window.gutenbergEditThisConfig || null;
}

/**
 * Creates an edit button element.
 *
 * @param {string} label Button label text.
 * @param {string} href  Button URL.
 *
 * @return {HTMLElement} The edit button element.
 */
function createEditButton( label, href ) {
	const button = document.createElement( 'a' );
	button.className = 'gutenberg-edit-this-button';
	button.href = href;
	button.textContent = label;
	button.setAttribute( 'aria-label', label );
	button.setAttribute( 'title', label );

	// Prevent default and navigate manually to avoid full page reload.
	button.addEventListener( 'click', ( e ) => {
		e.preventDefault();
		e.stopPropagation();
		window.location.href = href;
	} );

	return button;
}

/**
 * Builds the edit URL for a template part.
 *
 * @param {string} templatePartId Template part ID (theme//slug).
 *
 * @return {string} The edit URL.
 */
function getTemplatePartEditUrl( templatePartId ) {
	const config = getConfig();
	if ( ! config ) {
		return '';
	}

	// Build URL to site editor with template part.
	const url = new URL( config.siteEditorUrl, window.location.origin );
	url.searchParams.set( 'postType', 'wp_template_part' );
	url.searchParams.set( 'postId', templatePartId );
	url.searchParams.set( 'canvas', 'edit' );

	return url.toString();
}

/**
 * Builds the edit URL for post content.
 *
 * @param {number} postId Post ID.
 *
 * @return {string} The edit URL.
 */
function getPostContentEditUrl( postId ) {
	const config = getConfig();
	if ( ! config ) {
		return '';
	}

	// Build URL to post editor.
	const url = new URL(
		`${ config.adminUrl }post.php`,
		window.location.origin
	);
	url.searchParams.set( 'post', postId );
	url.searchParams.set( 'action', 'edit' );

	return url.toString();
}

/**
 * Adds edit button to a template part element.
 *
 * @param {HTMLElement} element Template part element.
 */
function addTemplatePartEditButton( element ) {
	const templatePartId = element.getAttribute( 'data-gutenberg-edit-id' );

	if ( ! templatePartId ) {
		return;
	}

	const editUrl = getTemplatePartEditUrl( templatePartId );
	if ( ! editUrl ) {
		return;
	}

	// Create label based on area.
	const area = element.getAttribute( 'data-gutenberg-edit-area' );
	const label = __( 'Edit' );
	const ariaLabel = area
		? /* translators: %s: template part area (e.g., "header", "footer") */
		  __( 'Edit %s' ).replace( '%s', area )
		: __( 'Edit template part' );

	const button = createEditButton( label, editUrl );
	button.setAttribute( 'aria-label', ariaLabel );
	button.setAttribute( 'title', ariaLabel );

	// Wrap element in a container if needed.
	if ( ! element.classList.contains( 'gutenberg-edit-this-wrapper' ) ) {
		element.classList.add( 'gutenberg-edit-this-wrapper' );
	}

	element.appendChild( button );
}

/**
 * Adds edit button to a post content element.
 *
 * @param {HTMLElement} element Post content element.
 */
function addPostContentEditButton( element ) {
	const postId = element.getAttribute( 'data-gutenberg-edit-id' );

	if ( ! postId ) {
		return;
	}

	const editUrl = getPostContentEditUrl( postId );
	if ( ! editUrl ) {
		return;
	}

	const label = __( 'Edit' );
	const ariaLabel = __( 'Edit post content' );

	const button = createEditButton( label, editUrl );
	button.setAttribute( 'aria-label', ariaLabel );
	button.setAttribute( 'title', ariaLabel );

	// Wrap element in a container if needed.
	if ( ! element.classList.contains( 'gutenberg-edit-this-wrapper' ) ) {
		element.classList.add( 'gutenberg-edit-this-wrapper' );
	}

	element.appendChild( button );
}

/**
 * Initializes Edit This mode.
 * Finds all elements with edit metadata and adds edit buttons.
 */
function initEditThisMode() {
	const config = getConfig();
	if ( ! config || ! config.isBlockTheme ) {
		return;
	}

	// Find all template part elements.
	const templateParts = document.querySelectorAll(
		'[data-gutenberg-edit-type="template-part"]'
	);
	templateParts.forEach( addTemplatePartEditButton );

	// Find all post content elements.
	const postContents = document.querySelectorAll(
		'[data-gutenberg-edit-type="post-content"]'
	);
	postContents.forEach( addPostContentEditButton );
}

// Initialize when DOM is ready.
domReady( initEditThisMode );

export { initEditThisMode };
