/**
 * Internal dependencies
 */
import { getUpdatedLinkAttributes } from '../get-updated-link-attributes';

describe( 'getUpdatedLinkAttributes', () => {
	it( 'normalizes the URL and adds new-tab link attributes', () => {
		expect(
			getUpdatedLinkAttributes( {
				url: 'example.com',
				opensInNewTab: true,
				nofollow: false,
			} )
		).toEqual( {
			url: 'https://example.com',
			linkTarget: '_blank',
			rel: 'noopener',
		} );
	} );

	it( 'preserves custom relation values', () => {
		expect(
			getUpdatedLinkAttributes( {
				url: '/example',
				rel: 'external sponsored',
				opensInNewTab: true,
				nofollow: true,
			} )
		).toEqual( {
			url: '/example',
			linkTarget: '_blank',
			rel: 'external sponsored noopener nofollow',
		} );
	} );

	it( 'does not duplicate managed relation values', () => {
		expect(
			getUpdatedLinkAttributes( {
				url: '#example',
				rel: 'nofollow noopener nofollow',
				opensInNewTab: true,
				nofollow: true,
			} )
		).toEqual( {
			url: '#example',
			linkTarget: '_blank',
			rel: 'nofollow noopener',
		} );
	} );

	it( 'removes only managed relation values when settings are disabled', () => {
		expect(
			getUpdatedLinkAttributes( {
				url: 'mailto:hello@example.com',
				rel: 'external noopener nofollow',
				opensInNewTab: false,
				nofollow: false,
			} )
		).toEqual( {
			url: 'mailto:hello@example.com',
			linkTarget: undefined,
			rel: 'external',
		} );
	} );
} );
