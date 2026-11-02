import type { Block } from '@wordpress/blocks';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { DataViews } from '@wordpress/dataviews';
import type { Field, View } from '@wordpress/dataviews';
import { Stack } from '@wordpress/ui';
import BlockPreview from '../../block-preview';
import InserterDraggableBlocks from '../../inserter-draggable-blocks';
import type { BlockPattern } from '../../../store/types';

const PER_PAGE = 20;

// A preview size wider than half the inserter keeps a single column, so
// patterns keep the full width they have in the list.
const GRID_LAYOUT = {
	previewSize: 230,
	density: 'compact',
} as const;
const DEFAULT_LAYOUTS = { grid: { layout: GRID_LAYOUT } };

const getItemId = ( pattern: BlockPattern ) => pattern.name;

type PatternGridProps = {
	/**
	 * The patterns of the current category, after filtering.
	 */
	patterns: BlockPattern[];
	onClickPattern: ( pattern: BlockPattern, blocks?: Block[] ) => void;
	onHover?: ( pattern: BlockPattern | null ) => void;
};

function PatternGridPreview( {
	pattern,
	onHover,
}: {
	pattern: BlockPattern;
	onHover?: ( pattern: BlockPattern | null ) => void;
} ) {
	// The card's media area is the click-to-insert target (a DataViews click
	// wrapper); the preview inside it is what gets dragged onto the canvas.
	return (
		<InserterDraggableBlocks
			isEnabled
			blocks={ pattern.blocks ?? [] }
			pattern={ pattern }
		>
			{ ( { draggable, onDragStart, onDragEnd } ) => (
				<div
					className="block-editor-inserter__pattern-grid__preview"
					draggable={ draggable }
					onDragStart={ ( event ) => {
						onHover?.( null );
						onDragStart?.( event );
					} }
					onDragEnd={ onDragEnd }
					onMouseEnter={ () => onHover?.( pattern ) }
					onMouseLeave={ () => onHover?.( null ) }
				>
					<BlockPreview.Async
						placeholder={
							<div className="block-editor-inserter__pattern-grid__placeholder" />
						}
					>
						<BlockPreview
							blocks={ pattern.blocks }
							viewportWidth={
								pattern.viewportWidth as number | undefined
							}
						/>
					</BlockPreview.Async>
				</div>
			) }
		</InserterDraggableBlocks>
	);
}

/**
 * Proof of concept for #85552: lists a pattern category in a DataViews grid,
 * paged the same way as the media tab, so both tabs browse alike.
 */
export default function PatternGrid( {
	patterns,
	onClickPattern,
	onHover,
}: PatternGridProps ) {
	const [ page, setPage ] = useState( 1 );

	// A new category or filter gives a new list, which starts on page one.
	useEffect( () => {
		setPage( 1 );
	}, [ patterns ] );

	const fields: Field< BlockPattern >[] = useMemo(
		() => [
			{
				id: 'preview',
				label: __( 'Preview' ),
				type: 'media',
				render: ( { item } ) => (
					<PatternGridPreview pattern={ item } onHover={ onHover } />
				),
			},
			{
				id: 'title',
				label: __( 'Title' ),
				type: 'text',
				getValue: ( { item } ) => item.title ?? '',
				enableSorting: false,
				enableGlobalSearch: false,
			},
		],
		[ onHover ]
	);

	const view: View = useMemo(
		() => ( {
			type: 'grid',
			page,
			perPage: PER_PAGE,
			fields: [],
			titleField: 'title',
			mediaField: 'preview',
			showTitle: true,
			showMedia: true,
			layout: GRID_LAYOUT,
		} ),
		[ page ]
	);

	// Paging is the only thing `DataViews` changes here.
	const onChangeView = useCallback( ( nextView: View ) => {
		setPage( nextView.page ?? 1 );
	}, [] );

	const totalItems = patterns.length;
	const totalPages = Math.max( 1, Math.ceil( totalItems / PER_PAGE ) );
	const pagePatterns = useMemo(
		() => patterns.slice( ( page - 1 ) * PER_PAGE, page * PER_PAGE ),
		[ patterns, page ]
	);
	const paginationInfo = useMemo(
		() => ( { totalItems, totalPages } ),
		[ totalItems, totalPages ]
	);

	const onClickItem = useCallback(
		( pattern: BlockPattern ) => {
			onClickPattern( pattern, pattern.blocks );
			onHover?.( null );
		},
		[ onClickPattern, onHover ]
	);

	const start = ( page - 1 ) * PER_PAGE + 1;
	const itemRange = sprintf(
		/* translators: 1: The first item shown on the page. 2: The last item shown on the page. 3: The total number of items. */
		__( '%1$d–%2$d of %3$d' ),
		start,
		Math.min( page * PER_PAGE, totalItems ),
		totalItems
	);

	return (
		<DataViews
			data={ pagePatterns }
			fields={ fields }
			view={ view }
			onChangeView={ onChangeView }
			paginationInfo={ paginationInfo }
			defaultLayouts={ DEFAULT_LAYOUTS }
			getItemId={ getItemId }
			onClickItem={ onClickItem }
		>
			<DataViews.Layout className="block-editor-inserter__pattern-grid" />
			{ totalPages > 1 && (
				<Stack
					direction="row"
					justify="space-between"
					align="center"
					gap="sm"
					className="block-editor-inserter__pattern-grid__footer"
				>
					<span className="block-editor-inserter__pattern-grid__range">
						{ itemRange }
					</span>
					<DataViews.Pagination />
				</Stack>
			) }
		</DataViews>
	);
}
