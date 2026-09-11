import type { DashboardWidget } from '../../../types';
import { enforceWidthOptions } from '../enforce-width-options';

function widget(
	uuid: string,
	width: number | 'full' | 'fill' | undefined
): DashboardWidget {
	return {
		uuid,
		type: 'core/example',
		placement: width === undefined ? {} : { width },
	};
}

const NO_RESTRICTION = { valid: true as const, options: undefined };
const HALF_AND_FULL = {
	valid: true as const,
	options: [
		{ value: 1 as const, label: 'Half width' },
		{ value: 'full' as const, label: 'Full width' },
	],
};
const INVALID = { valid: false as const, options: undefined };

describe( 'enforceWidthOptions', () => {
	it( 'leaves the layout untouched when no widthOptions are configured', () => {
		const staged = [ widget( 'a', 2 ) ];
		expect( enforceWidthOptions( staged, staged, NO_RESTRICTION ) ).toBe(
			staged
		);
	} );

	it( 'leaves an allowed width untouched', () => {
		const staged = [ widget( 'a', 1 ) ];
		const result = enforceWidthOptions( staged, staged, HALF_AND_FULL );
		expect( result ).toBe( staged );
	} );

	it( 'restores the committed width when a staged width becomes invalid', () => {
		const committed = [ widget( 'a', 1 ) ];
		const staged = [ widget( 'a', 2 ) ];
		expect(
			enforceWidthOptions( staged, committed, HALF_AND_FULL )
		).toEqual( [ widget( 'a', 1 ) ] );
	} );

	it( 'rejects a new insertion with no committed width to restore', () => {
		const committed: DashboardWidget[] = [];
		const staged = [ widget( 'a', 2 ) ];
		expect(
			enforceWidthOptions( staged, committed, HALF_AND_FULL )
		).toEqual( [] );
	} );

	it( 'preserves a grandfathered unsupported width left unchanged', () => {
		const committed = [ widget( 'a', 3 ) ];
		const staged = [ widget( 'a', 3 ) ];
		expect( enforceWidthOptions( staged, committed, HALF_AND_FULL ) ).toBe(
			staged
		);
	} );

	it( 'fails closed for a new width when the option list is invalid, keeping unchanged committed widths', () => {
		const committed = [ widget( 'a', 1 ) ];
		const staged = [ widget( 'a', 1 ), widget( 'b', 2 ) ];
		expect( enforceWidthOptions( staged, committed, INVALID ) ).toEqual( [
			widget( 'a', 1 ),
		] );
	} );
} );
