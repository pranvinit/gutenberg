import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { describe, expect, it, vi } from 'vitest';
import DataViews from '../index';
import type { Action, Field, ViewTable } from '../../types';
import '../../style.scss';

type Item = {
	id: string;
	title: string;
	author: string;
};

const data: Item[] = [ { id: '1', title: 'A frozen title', author: 'Ada' } ];

const fields: Field< Item >[] = [
	{ id: 'title', label: 'Title', type: 'text' },
	{ id: 'author', label: 'Author', type: 'text' },
];

const view: ViewTable = {
	type: 'table',
	titleField: 'title',
	fields: [ 'author' ],
	layout: { freezeUpTo: 'title' },
};

const actions: Action< Item >[] = [
	{
		id: 'edit',
		label: 'Edit',
		supportsBulk: true,
		callback: vi.fn(),
	},
];

async function renderTable( width: number, withBulkActions = false ) {
	return render(
		<div style={ { width } }>
			<DataViews
				view={ view }
				onChangeView={ vi.fn() }
				fields={ fields }
				data={ data }
				paginationInfo={ { totalItems: 1, totalPages: 1 } }
				defaultLayouts={ { table: true } }
				actions={ withBulkActions ? actions : [] }
			/>
		</div>
	);
}

describe( 'DataViews frozen table columns', () => {
	it( 'keeps the configured column sticky at table widths of at least 480px', async () => {
		await renderTable( 600 );

		const titleHeader = screen
			.getByRole( 'button', { name: 'Title' } )
			.closest( 'th' );
		expect( titleHeader ).not.toBeNull();
		expect( getComputedStyle( titleHeader! ).position ).toBe( 'sticky' );
	} );

	it( 'does not keep the configured column sticky below 480px', async () => {
		await renderTable( 400 );

		const titleHeader = screen
			.getByRole( 'button', { name: 'Title' } )
			.closest( 'th' );
		expect( titleHeader ).not.toBeNull();
		expect( getComputedStyle( titleHeader! ).position ).toBe( 'static' );
	} );

	it( 'offsets the primary column by the frozen checkbox width', async () => {
		await renderTable( 600, true );

		const headers = screen.getAllByRole( 'columnheader' );
		const checkboxHeader = headers[ 0 ];
		const titleHeader = headers[ 1 ];

		await waitFor( () => {
			expect(
				parseFloat( getComputedStyle( titleHeader ).left )
			).toBeCloseTo( checkboxHeader.getBoundingClientRect().width );
		} );
	} );
} );
