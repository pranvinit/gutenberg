import { __, sprintf } from '@wordpress/i18n';
import {
	getGlobalStylesChangelist,
	type GlobalStylesConfig,
} from '@wordpress/global-styles-engine';

interface BlockStyle {
	name: string;
	label?: string;
}

/**
 * Whether a value, or anything nested inside it, holds a user value.
 *
 * Clearing a value can leave an `undefined` property in the user config, so
 * empty objects and arrays containing only empty values are not customizations.
 * Falsy leaf values such as an empty string, zero, and false remain valid.
 *
 * @param value The value to inspect.
 * @return Whether the value holds at least one leaf value.
 */
function hasAnyValue( value: unknown ): boolean {
	if ( value === undefined || value === null ) {
		return false;
	}

	if ( Array.isArray( value ) ) {
		return value.some( hasAnyValue );
	}

	if ( typeof value === 'object' ) {
		return Object.values( value ).some( hasAnyValue );
	}

	return true;
}

/**
 * Whether the user has customized a block.
 *
 * This reads only the user layer. Theme styles belong to the base layer and
 * must not make a block appear customized by the user.
 *
 * @param user      The user's global styles config.
 * @param blockName The block to check, e.g. `core/quote`.
 * @return Whether the user has styles or settings for the block.
 */
export function hasUserStylesForBlock(
	user: GlobalStylesConfig | undefined,
	blockName: string
): boolean {
	return (
		hasAnyValue( user?.styles?.blocks?.[ blockName ] ) ||
		hasAnyValue( user?.settings?.blocks?.[ blockName ] )
	);
}

/**
 * Returns a short summary of the categories the user changed on a block.
 *
 * Changed block style variations are named instead of listing the categories
 * changed inside each variation.
 *
 * @param user             The user's global styles config.
 * @param blockName        The block to summarize, e.g. `core/quote`.
 * @param registeredStyles The block's registered style variations.
 * @return The translated summary, or an empty string when no category is known.
 */
export function getUserStylesSummary(
	user: GlobalStylesConfig | undefined,
	blockName: string,
	registeredStyles: BlockStyle[] = []
): string {
	const blockStyles = user?.styles?.blocks?.[ blockName ];
	const changes = getGlobalStylesChangelist(
		{
			styles: blockStyles,
			settings: user?.settings?.blocks?.[ blockName ],
		},
		{}
	);
	const entries = [ ...new Set( changes.map( ( [ , label ] ) => label ) ) ];

	Object.entries( blockStyles?.variations ?? {} ).forEach(
		( [ slug, variationStyles ] ) => {
			if ( ! hasAnyValue( variationStyles ) ) {
				return;
			}

			const label =
				registeredStyles.find( ( style ) => style.name === slug )
					?.label || slug;
			entries.push(
				sprintf(
					/* translators: %s: the name of a block style variation, e.g. "Plain". */
					__( '%s variation' ),
					label
				)
			);
		}
	);

	return entries.join(
		/* translators: Used between list items, there is a space after the comma. */
		__( ', ' ) // eslint-disable-line @wordpress/i18n-no-flanking-whitespace
	);
}
