import { describe, expect, it } from 'vitest';
import type { NormalizedField, ViewTable } from '../../../../types';
import getFrozenColumnCount from '../get-frozen-column-count';

type Item = {
	title: string;
	author: string;
	date: string;
};

const fields = [
	{ id: 'title' },
	{ id: 'author' },
	{ id: 'date' },
] as NormalizedField< Item >[];

const view: ViewTable = {
	type: 'table',
	titleField: 'title',
	fields: [ 'author', 'date' ],
};

describe( 'getFrozenColumnCount', () => {
	it( 'freezes through the primary column', () => {
		expect(
			getFrozenColumnCount(
				{ ...view, layout: { freezeUpTo: 'title' } },
				fields,
				false,
				true
			)
		).toBe( 1 );
	} );

	it( 'includes the bulk-selection column', () => {
		expect(
			getFrozenColumnCount(
				{ ...view, layout: { freezeUpTo: 'title' } },
				fields,
				true,
				true
			)
		).toBe( 2 );
	} );

	it( 'freezes through a named field column', () => {
		expect(
			getFrozenColumnCount(
				{ ...view, layout: { freezeUpTo: 'author' } },
				fields,
				true,
				true
			)
		).toBe( 3 );
	} );

	it.each( [ 'hidden', 'unknown' ] )(
		'returns no frozen columns for a %s field',
		( freezeUpTo ) => {
			expect(
				getFrozenColumnCount(
					{ ...view, layout: { freezeUpTo } },
					fields,
					false,
					true
				)
			).toBe( 0 );
		}
	);
} );
