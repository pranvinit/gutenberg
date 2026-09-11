import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical, trash } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components
import { IconButton } from '@wordpress/ui';
import { unlock } from '../../lock-unlock';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import type { DashboardWidget, GridTilePlacement } from '../../types';

const { Menu } = unlock( componentsPrivateApis );

type NamedGridWidth = Exclude<
	NonNullable< GridTilePlacement[ 'width' ] >,
	number
>;

export interface WidgetLayoutControlsProps {
	/**
	 * The instance these controls manage within the layout.
	 */
	widget: DashboardWidget< unknown >;

	/**
	 * Whether the policy allows removing the instance.
	 *
	 * @default true
	 */
	canRemove?: boolean;

	/**
	 * Whether the policy allows resizing the instance.
	 *
	 * @default true
	 */
	canResize?: boolean;
}

/**
 * Customize-mode controls: width menu and removal, each following the
 * policy's answer for its operation.
 *
 * @param {WidgetLayoutControlsProps} props Component props.
 */
export function WidgetLayoutControls( {
	widget,
	canRemove = true,
	canResize = true,
}: WidgetLayoutControlsProps ): React.ReactNode {
	const { layout, onLayoutChange, widthOptionsResolution } =
		useDashboardInternalContext();
	const width = widget.placement?.width;

	const updateWidth = ( nextWidth: GridTilePlacement[ 'width' ] ) => {
		const nextLayout = layout.map( ( currentWidget ) =>
			currentWidget.uuid === widget.uuid
				? {
						...currentWidget,
						placement: {
							...currentWidget.placement,
							width: nextWidth,
						},
				  }
				: currentWidget
		);
		onLayoutChange( nextLayout );
	};

	const onNamedWidthChange = ( nextWidth: NamedGridWidth ) => {
		updateWidth( nextWidth );
	};

	const onRemove = () => {
		onLayoutChange(
			layout.filter(
				( currentWidget ) => currentWidget.uuid !== widget.uuid
			)
		);
	};

	// An invalid `widthOptions` list fails closed: no width menu offered
	// rather than falling back to unrestricted `fill`/`full` choices.
	const showWidthMenu = canResize && widthOptionsResolution.valid;
	const widthOptions = widthOptionsResolution.valid
		? widthOptionsResolution.options
		: undefined;

	return (
		<>
			{ showWidthMenu && (
				<Menu>
					<Menu.TriggerButton
						render={
							<IconButton
								icon={ moreVertical }
								label={ __( 'Widget options' ) }
								size="compact"
								variant="minimal"
								tone="neutral"
							/>
						}
					/>

					<Menu.Popover>
						<Menu.Group>
							<Menu.GroupLabel>{ __( 'Width' ) }</Menu.GroupLabel>
							{ widthOptions ? (
								widthOptions.map( ( option ) => (
									<Menu.Item
										key={ String( option.value ) }
										disabled={ width === option.value }
										onClick={ () =>
											updateWidth( option.value )
										}
									>
										<Menu.ItemLabel>
											{ option.label }
										</Menu.ItemLabel>
									</Menu.Item>
								) )
							) : (
								<>
									<Menu.Item
										disabled={ width === 'fill' }
										onClick={ () =>
											onNamedWidthChange( 'fill' )
										}
									>
										<Menu.ItemLabel>
											{ __( 'Use available width' ) }
										</Menu.ItemLabel>
									</Menu.Item>
									<Menu.Item
										disabled={ width === 'full' }
										onClick={ () =>
											onNamedWidthChange( 'full' )
										}
									>
										<Menu.ItemLabel>
											{ __( 'Make full width' ) }
										</Menu.ItemLabel>
									</Menu.Item>
								</>
							) }
						</Menu.Group>
					</Menu.Popover>
				</Menu>
			) }

			{ canRemove && (
				<IconButton
					icon={ trash }
					label={ __( 'Remove' ) }
					size="compact"
					variant="minimal"
					tone="neutral"
					onClick={ onRemove }
				/>
			) }
		</>
	);
}
