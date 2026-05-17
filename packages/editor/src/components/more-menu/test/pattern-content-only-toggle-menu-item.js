/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PatternContentOnlyToggleMenuItem from '../pattern-content-only-toggle-menu-item';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/src/components/use-dispatch/use-dispatch', () =>
	jest.fn()
);

const updateEditorSettings = jest.fn();

function mockEditorSettings( settings ) {
	useSelect.mockImplementation( ( map ) =>
		map( () => ( {
			getEditorSettings: () => settings,
		} ) )
	);
	useDispatch.mockImplementation( () => ( {
		updateEditorSettings,
	} ) );
}

describe( 'PatternContentOnlyToggleMenuItem', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'enables the opt-out setting when inactive', async () => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		mockEditorSettings( {
			disableContentOnlyForUnsyncedPatterns: false,
		} );

		render( <PatternContentOnlyToggleMenuItem onClose={ onClose } /> );

		await user.click(
			screen.getByRole( 'menuitemcheckbox', {
				name: 'Disable content-only editing for patterns',
			} )
		);

		expect( updateEditorSettings ).toHaveBeenCalledWith( {
			disableContentOnlyForUnsyncedPatterns: true,
		} );
		expect( onClose ).toHaveBeenCalled();
	} );

	it( 'disables the opt-out setting when active', async () => {
		const user = userEvent.setup();
		mockEditorSettings( {
			disableContentOnlyForUnsyncedPatterns: true,
		} );

		render( <PatternContentOnlyToggleMenuItem /> );

		const menuItem = screen.getByRole( 'menuitemcheckbox', {
			name: 'Disable content-only editing for patterns',
		} );

		expect( menuItem ).toHaveAttribute( 'aria-checked', 'true' );

		await user.click( menuItem );

		expect( updateEditorSettings ).toHaveBeenCalledWith( {
			disableContentOnlyForUnsyncedPatterns: false,
		} );
	} );
} );
