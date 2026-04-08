/**
 * WordPress dependencies
 */
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getTypographyResetAttributes } from '../typography';

describe( 'getTypographyResetAttributes', () => {
	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'removes inline bold and italic formats from rich-text attributes', () => {
		registerBlockType( 'test/typography-reset', {
			apiVersion: 3,
			title: 'Typography Reset',
			category: 'text',
			attributes: {
				content: {
					type: 'rich-text',
					source: 'rich-text',
					selector: 'p',
				},
				label: {
					type: 'string',
				},
			},
			save: () => null,
		} );

		expect(
			getTypographyResetAttributes( 'test/typography-reset', {
				content:
					'<strong><em>Title</em></strong> <a href="#demo"><em>link</em></a>',
				label: '<em>Do not touch string attributes</em>',
			} )
		).toEqual( {
			content: 'Title <a href="#demo">link</a>',
		} );
	} );

	it( 'returns an empty object when no rich-text typography formats need resetting', () => {
		registerBlockType( 'test/no-typography-reset', {
			apiVersion: 3,
			title: 'No Typography Reset',
			category: 'text',
			attributes: {
				content: {
					type: 'rich-text',
					source: 'rich-text',
					selector: 'p',
				},
			},
			save: () => null,
		} );

		expect(
			getTypographyResetAttributes( 'test/no-typography-reset', {
				content: '<a href="#demo">link</a>',
			} )
		).toEqual( {} );
	} );
} );
