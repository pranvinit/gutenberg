import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType } from 'react';
import { useState } from '@wordpress/element';
import type {
	ResolveWidgetModule,
	WidgetRenderProps,
	WidgetType,
} from '@wordpress/widget-primitives';
import { WidgetDashboard } from '../widget-dashboard';
import type { DashboardWidget, WidgetGridSettings } from '../types';

function PreviewWidget( {
	attributes,
}: WidgetRenderProps< { label?: string } > ) {
	return <div data-testid="widget-content">{ attributes?.label ?? '—' }</div>;
}

const widgetTypes: WidgetType[] = [
	{
		apiVersion: 1,
		name: 'wordpress/welcome',
		title: 'Welcome',
		renderModule: 'welcome-module',
		example: { attributes: { label: 'welcome-example' } },
	},
];

const resolveWidgetModule: ResolveWidgetModule = async () => ( {
	default: PreviewWidget as ComponentType< WidgetRenderProps< unknown > >,
} );

interface HarnessProps {
	initialLayout?: DashboardWidget[];
	onLayoutChange?: ( layout: DashboardWidget[] ) => void;
	gridSettings?: WidgetGridSettings;
}

function Harness( {
	initialLayout = [],
	onLayoutChange: onChange,
	gridSettings,
}: HarnessProps ) {
	const [ layout, setLayout ] =
		useState< DashboardWidget[] >( initialLayout );
	const [ editMode, setEditMode ] = useState( true );

	return (
		<WidgetDashboard
			layout={ layout }
			onLayoutChange={ ( next ) => {
				setLayout( next );
				onChange?.( next );
			} }
			widgetTypes={ widgetTypes }
			editMode={ editMode }
			onEditChange={ setEditMode }
			resolveWidgetModule={ resolveWidgetModule }
			gridSettings={ gridSettings }
		/>
	);
}

const HALF_AND_FULL: WidgetGridSettings = {
	model: 'grid',
	widthOptions: [
		{ value: 1, label: 'Half width' },
		{ value: 'full', label: 'Full width' },
	],
};

describe( 'widthOptions', () => {
	it( 'inserts a new widget at the first configured width', async () => {
		const user = userEvent.setup();
		const onLayoutChange = jest.fn();
		render(
			<Harness
				onLayoutChange={ onLayoutChange }
				gridSettings={ HALF_AND_FULL }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Add widget' } )
		);
		const dialog = await screen.findByRole( 'dialog', {
			name: 'Add widget',
		} );
		await user.click( within( dialog ).getAllByRole( 'option' )[ 0 ] );
		await user.click(
			within( dialog ).getByRole( 'button', { name: 'Select' } )
		);
		await user.click( screen.getByRole( 'button', { name: 'Done' } ) );

		const [ updated ] = onLayoutChange.mock.calls[ 0 ];
		expect( updated[ 0 ].placement ).toMatchObject( { width: 1 } );
	} );

	it( 'offers only the configured width choices in the menu', async () => {
		const user = userEvent.setup();
		const existing: DashboardWidget = {
			uuid: 'existing-1',
			type: 'wordpress/welcome',
			attributes: { label: 'kept' },
			placement: { width: 1, height: 1 },
		};
		render(
			<Harness
				initialLayout={ [ existing ] }
				gridSettings={ HALF_AND_FULL }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Widget options' } )
		);

		expect(
			screen.getByRole( 'menuitem', { name: 'Half width' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'menuitem', { name: 'Full width' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'menuitem', { name: 'Use available width' } )
		).not.toBeInTheDocument();
	} );

	it( 'applies the chosen configured width', async () => {
		const user = userEvent.setup();
		const onLayoutChange = jest.fn();
		const existing: DashboardWidget = {
			uuid: 'existing-1',
			type: 'wordpress/welcome',
			attributes: { label: 'kept' },
			placement: { width: 1, height: 1 },
		};
		render(
			<Harness
				initialLayout={ [ existing ] }
				onLayoutChange={ onLayoutChange }
				gridSettings={ HALF_AND_FULL }
			/>
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Widget options' } )
		);
		await user.click(
			screen.getByRole( 'menuitem', { name: 'Full width' } )
		);
		await user.click( screen.getByRole( 'button', { name: 'Done' } ) );

		const [ updated ] = onLayoutChange.mock.calls[ 0 ];
		expect( updated[ 0 ].placement ).toMatchObject( { width: 'full' } );
	} );

	it( 'falls back to the fill/full menu when widthOptions is omitted', async () => {
		const user = userEvent.setup();
		const existing: DashboardWidget = {
			uuid: 'existing-1',
			type: 'wordpress/welcome',
			placement: { width: 1, height: 1 },
		};
		render( <Harness initialLayout={ [ existing ] } /> );

		await user.click(
			screen.getByRole( 'button', { name: 'Widget options' } )
		);

		expect(
			screen.getByRole( 'menuitem', { name: 'Use available width' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'menuitem', { name: 'Make full width' } )
		).toBeInTheDocument();
	} );

	it( 'offers no width menu when widthOptions is invalid', () => {
		const existing: DashboardWidget = {
			uuid: 'existing-1',
			type: 'wordpress/welcome',
			placement: { width: 1, height: 1 },
		};
		render(
			<Harness
				initialLayout={ [ existing ] }
				gridSettings={ { model: 'grid', widthOptions: [] } }
			/>
		);

		expect(
			screen.queryByRole( 'button', { name: 'Widget options' } )
		).not.toBeInTheDocument();
	} );
} );
