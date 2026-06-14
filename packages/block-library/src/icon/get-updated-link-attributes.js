/**
 * WordPress dependencies
 */
import { prependHTTPS } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { NEW_TAB_REL, NEW_TAB_TARGET, NOFOLLOW_REL } from './constants';

/**
 * Updates the Icon block's link attributes.
 *
 * @param {Object}  attributes               Current link attributes.
 * @param {string}  attributes.rel           Current link relation.
 * @param {string}  attributes.url           Current link URL.
 * @param {boolean} attributes.opensInNewTab Whether the link opens in a new tab.
 * @param {boolean} attributes.nofollow      Whether the link is marked nofollow.
 * @return {Object} Updated block attributes.
 */
export function getUpdatedLinkAttributes( {
	rel = '',
	url = '',
	opensInNewTab,
	nofollow,
} ) {
	const relValues = new Set( rel.split( /\s+/ ).filter( Boolean ) );

	if ( opensInNewTab ) {
		relValues.add( NEW_TAB_REL );
	} else {
		relValues.delete( NEW_TAB_REL );
	}

	if ( nofollow ) {
		relValues.add( NOFOLLOW_REL );
	} else {
		relValues.delete( NOFOLLOW_REL );
	}

	const updatedRel = Array.from( relValues ).join( ' ' );

	return {
		url: prependHTTPS( url ),
		linkTarget: opensInNewTab ? NEW_TAB_TARGET : undefined,
		rel: updatedRel || undefined,
	};
}
