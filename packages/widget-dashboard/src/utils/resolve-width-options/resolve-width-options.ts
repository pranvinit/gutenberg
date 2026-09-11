import type { WidgetWidthOption } from '../../types';

/**
 * Result of validating a host-supplied `widthOptions` list.
 *
 * `valid: false` means the list was present but malformed — callers
 * must fail closed (block width changes and insertion) rather than
 * falling back to unrestricted widths. `options: undefined` means no
 * list was supplied at all, preserving existing unrestricted behavior.
 */
export type ResolvedWidthOptions =
	| { valid: true; options: undefined }
	| { valid: true; options: readonly WidgetWidthOption[] }
	| { valid: false; options: undefined };

function isPositiveInteger( value: unknown ): value is number {
	return typeof value === 'number' && Number.isInteger( value ) && value > 0;
}

/**
 * Validates a `widthOptions` list: nonempty, unique `value`s, positive
 * integer numeric values (or `'full'`/`'fill'`), and nonempty `label`s.
 *
 * @param widthOptions Host-supplied width choices, or `undefined`.
 */
export function resolveWidthOptions(
	widthOptions: readonly WidgetWidthOption[] | undefined
): ResolvedWidthOptions {
	if ( widthOptions === undefined ) {
		return { valid: true, options: undefined };
	}

	if ( widthOptions.length === 0 ) {
		return { valid: false, options: undefined };
	}

	const seen = new Set< number | 'full' | 'fill' >();
	for ( const option of widthOptions ) {
		const { value, label } = option;
		const isValidValue =
			value === 'full' || value === 'fill' || isPositiveInteger( value );
		if ( ! isValidValue || typeof label !== 'string' || label === '' ) {
			return { valid: false, options: undefined };
		}
		if ( seen.has( value ) ) {
			return { valid: false, options: undefined };
		}
		seen.add( value );
	}

	return { valid: true, options: widthOptions };
}
