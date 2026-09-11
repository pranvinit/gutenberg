import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Dialog } from '@wordpress/ui';
import type { WidgetType } from '@wordpress/widget-primitives';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import { createDashboardWidget } from '../../utils/create-dashboard-widget';
import { WidgetPicker } from '../widget-picker';

/**
 * Modal widget inserter, mounted by the engine and shown while `inserterOpen`
 * is set in the shared UI context. Selecting widgets appends them to the
 * layout and closes the dialog.
 */
export function WidgetInserter() {
	const { layout, onLayoutChange, gridSettings, widthOptionsResolution } =
		useDashboardInternalContext();
	const { inserterOpen, setInserterOpen } = useDashboardUIContext();

	const insertWidgets = useCallback(
		( widgetTypes: WidgetType[] ) => {
			if ( widgetTypes.length > 0 ) {
				// The first configured choice is the insertion default;
				// an invalid list has no default and the staging layer
				// rejects the resulting placement instead.
				const defaultWidth =
					gridSettings.model !== 'masonry' &&
					widthOptionsResolution.valid
						? widthOptionsResolution.options?.[ 0 ]?.value
						: undefined;
				const newWidgets = widgetTypes.map( ( widgetType ) =>
					createDashboardWidget( widgetType, undefined, defaultWidth )
				);
				onLayoutChange( [ ...layout, ...newWidgets ] );
			}

			setInserterOpen( false );
		},
		[
			layout,
			onLayoutChange,
			setInserterOpen,
			gridSettings,
			widthOptionsResolution,
		]
	);

	if ( ! inserterOpen ) {
		return null;
	}

	return (
		<Dialog.Root open={ inserterOpen } onOpenChange={ setInserterOpen }>
			<Dialog.Popup
				size="full"
				portal={
					<Dialog.Portal
						style={
							{
								'--wp-ui-dialog-z-index': 99999,
							} as React.CSSProperties
						}
					/>
				}
			>
				<Dialog.Header>
					<Dialog.Title>{ __( 'Add widget' ) }</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>

				<Dialog.Content>
					<WidgetPicker onSelect={ insertWidgets } />
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
