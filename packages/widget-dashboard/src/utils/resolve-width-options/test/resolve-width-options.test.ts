import { resolveWidthOptions } from '../resolve-width-options';

describe( 'resolveWidthOptions', () => {
	it( 'returns valid with no options when none are supplied', () => {
		expect( resolveWidthOptions( undefined ) ).toEqual( {
			valid: true,
			options: undefined,
		} );
	} );

	it( 'accepts a well-formed list of numeric and named values', () => {
		const widthOptions = [
			{ value: 1, label: 'Half width' },
			{ value: 'full' as const, label: 'Full width' },
		];
		expect( resolveWidthOptions( widthOptions ) ).toEqual( {
			valid: true,
			options: widthOptions,
		} );
	} );

	it( 'rejects an empty list', () => {
		expect( resolveWidthOptions( [] ) ).toEqual( {
			valid: false,
			options: undefined,
		} );
	} );

	it( 'rejects duplicate values', () => {
		expect(
			resolveWidthOptions( [
				{ value: 1, label: 'Half width' },
				{ value: 1, label: 'Also half width' },
			] )
		).toEqual( { valid: false, options: undefined } );
	} );

	it( 'rejects a non-positive-integer numeric value', () => {
		expect(
			resolveWidthOptions( [ { value: 0, label: 'Zero' } ] )
		).toEqual( { valid: false, options: undefined } );
		expect(
			resolveWidthOptions( [ { value: 1.5, label: 'Fraction' } ] )
		).toEqual( { valid: false, options: undefined } );
		expect(
			resolveWidthOptions( [ { value: -1, label: 'Negative' } ] )
		).toEqual( { valid: false, options: undefined } );
	} );

	it( 'rejects an empty label', () => {
		expect( resolveWidthOptions( [ { value: 1, label: '' } ] ) ).toEqual( {
			valid: false,
			options: undefined,
		} );
	} );
} );
