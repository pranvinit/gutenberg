import type { WidgetWidthOption, DashboardWidget } from '../../types';

/**
 * Re-applies `widthOptions` restrictions to a staged layout against the
 * last committed layout.
 *
 * A staged width outside the allowed set is restored to the instance's
 * committed width when that width is itself allowed; a new instance
 * with no committed width to restore (or an invalid `widthOptions`
 * list) is dropped instead of landing with an unrestricted width. A
 * committed width that predates the restriction and is unchanged in
 * staging is left alone — existing unsupported widths can remain
 * visible, they just cannot be introduced by a new change.
 *
 * @param staged     Layout as currently staged.
 * @param committed  Last committed layout, used to recover a valid width.
 * @param resolution Result of `resolveWidthOptions()` for the active
 *                    `gridSettings.widthOptions`.
 */
export function enforceWidthOptions(
	staged: DashboardWidget[],
	committed: DashboardWidget[],
	resolution: {
		valid: boolean;
		options: readonly WidgetWidthOption[] | undefined;
	}
): DashboardWidget[] {
	// No restriction configured: leave every width untouched.
	if ( resolution.valid && resolution.options === undefined ) {
		return staged;
	}

	const allowed = resolution.valid
		? new Set( resolution.options!.map( ( option ) => option.value ) )
		: new Set< number | 'full' | 'fill' >();

	let changed = false;
	const next: DashboardWidget[] = [];

	for ( const widget of staged ) {
		const width = widget.placement?.width;
		if ( width === undefined || allowed.has( width ) ) {
			next.push( widget );
			continue;
		}

		const committedWidget = committed.find(
			( { uuid } ) => uuid === widget.uuid
		);
		const committedWidth = committedWidget?.placement?.width;

		if ( committedWidget === undefined ) {
			// A new insertion with no committed width to restore.
			changed = true;
			continue;
		}

		if ( width === committedWidth ) {
			// Grandfathered value, unchanged since before the
			// restriction applied — preserve it as-is.
			next.push( widget );
			continue;
		}

		if ( committedWidth !== undefined && allowed.has( committedWidth ) ) {
			changed = true;
			next.push( {
				...widget,
				placement: { ...widget.placement, width: committedWidth },
			} );
			continue;
		}

		// The committed width is itself outside the allowed set; best
		// effort is to restore it rather than keep the new invalid one.
		changed = true;
		next.push( {
			...widget,
			placement: { ...widget.placement, width: committedWidth },
		} );
	}

	return changed ? next : staged;
}
