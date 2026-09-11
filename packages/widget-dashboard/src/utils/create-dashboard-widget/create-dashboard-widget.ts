import { v4 as uuid } from 'uuid';
import type { WidgetType } from '@wordpress/widget-primitives';
import type { DashboardWidget, GridTilePlacement } from '../../types';

const DEFAULT_PLACEMENT: GridTilePlacement = {
	width: 1,
	height: 2,
	order: 0,
};

/**
 * Create a new dashboard widget from a widget type.
 *
 * Generates a unique id and applies default placement. If no initial
 * attributes are provided, falls back to the type's `example.attributes`
 * (matching the `widget.json` schema).
 *
 * @param widgetType        Source widget type.
 * @param initialAttributes Initial attributes; default to the type's example.
 * @param defaultWidth      Width to place the instance at, overriding the
 *                          built-in default of `1`. Pass the host's
 *                          configured insertion default (the first entry
 *                          of `gridSettings.widthOptions`) when set.
 */
export function createDashboardWidget< T >(
	widgetType: WidgetType,
	initialAttributes?: T,
	defaultWidth?: GridTilePlacement[ 'width' ]
): DashboardWidget< T > {
	return {
		uuid: uuid(),
		type: widgetType.name,
		attributes:
			initialAttributes ?? ( widgetType.example?.attributes as T ),
		placement:
			defaultWidth === undefined
				? DEFAULT_PLACEMENT
				: { ...DEFAULT_PLACEMENT, width: defaultWidth },
	};
}
