import type { RefObject } from 'react';
import { useLayoutEffect } from '@wordpress/element';

const OFFSET_PROPERTY_PREFIX = '--wp-dataviews-frozen-column-offset-';

/**
 * Measures frozen header cells and exposes their cumulative inline offsets as
 * table-level custom properties shared by every row.
 *
 * @param tableRef          The rendered table.
 * @param frozenColumnCount The number of leading columns to measure.
 * @param measurementKey    Changes when the rendered column sequence changes.
 */
export default function useFrozenColumnOffsets(
	tableRef: RefObject< HTMLTableElement >,
	frozenColumnCount: number,
	measurementKey: string
) {
	useLayoutEffect( () => {
		const table = tableRef.current;
		const headerCells = Array.from(
			table?.tHead?.rows[ 0 ]?.cells ?? []
		).slice( 0, frozenColumnCount );

		if ( ! table || ! headerCells.length ) {
			return;
		}

		const updateOffsets = () => {
			let offset = 0;
			headerCells.forEach( ( cell, index ) => {
				table.style.setProperty(
					`${ OFFSET_PROPERTY_PREFIX }${ index }`,
					`${ offset }px`
				);
				offset += cell.getBoundingClientRect().width;
			} );
		};

		updateOffsets();

		if ( typeof ResizeObserver === 'undefined' ) {
			return;
		}

		const resizeObserver = new ResizeObserver( updateOffsets );
		headerCells.forEach( ( cell ) => resizeObserver.observe( cell ) );

		return () => resizeObserver.disconnect();
	}, [ tableRef, frozenColumnCount, measurementKey ] );
}
