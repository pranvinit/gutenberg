/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import icon from './icon';
import { unlock } from '../lock-unlock';

const { fieldsKey, formKey } = unlock( blocksPrivateApis );

const { name } = metadata;
export { metadata, name };
export const settings = {
	icon,
	example: {
		attributes: {
			icon: 'core/audio',
			style: {
				dimensions: {
					width: '48px',
				},
			},
		},
	},
	edit,
};

if ( window.__experimentalContentOnlyInspectorFields ) {
	settings[ fieldsKey ] = [
		{
			id: 'link',
			label: __( 'Link' ),
			type: 'url',
			Edit: 'link',
			getValue: ( { item } ) => ( {
				url: item.url,
				rel: item.rel,
				linkTarget: item.linkTarget,
			} ),
			setValue: ( { value } ) => ( {
				url: value.url,
				rel: value.rel,
				linkTarget: value.linkTarget,
			} ),
		},
		{
			id: 'ariaLabel',
			label: __( 'Label' ),
			type: 'text',
		},
	];
	settings[ formKey ] = {
		fields: [ 'link', 'ariaLabel' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
