/**
 * Internal dependencies
 */
import {
	filterIncompatibleBlocks,
	RESTRICTED_BLOCK_TYPES,
} from '../use-clipboard-handler';

describe( 'filterIncompatibleBlocks', () => {
	// Mock canInsertBlockType function that returns false for template parts
	const mockCanInsertBlockType = ( blockName ) => {
		return ! RESTRICTED_BLOCK_TYPES.includes( blockName );
	};

	// Mock that allows all blocks
	const mockCanInsertAllBlocks = () => true;

	describe( 'basic filtering', () => {
		it( 'should return empty arrays when given empty blocks', () => {
			const result = filterIncompatibleBlocks(
				[],
				mockCanInsertBlockType,
				null
			);

			expect( result.filteredBlocks ).toEqual( [] );
			expect( result.removedBlockNames.size ).toBe( 0 );
		} );

		it( 'should pass through valid blocks unchanged', () => {
			const blocks = [
				{ name: 'core/paragraph', innerBlocks: [] },
				{ name: 'core/heading', innerBlocks: [] },
			];

			const result = filterIncompatibleBlocks(
				blocks,
				mockCanInsertBlockType,
				null
			);

			expect( result.filteredBlocks ).toEqual( blocks );
			expect( result.removedBlockNames.size ).toBe( 0 );
		} );

		it( 'should filter out template parts', () => {
			const blocks = [
				{ name: 'core/template-part', innerBlocks: [] },
				{ name: 'core/paragraph', innerBlocks: [] },
			];

			const result = filterIncompatibleBlocks(
				blocks,
				mockCanInsertBlockType,
				null
			);

			expect( result.filteredBlocks ).toHaveLength( 1 );
			expect( result.filteredBlocks[ 0 ].name ).toBe( 'core/paragraph' );
			expect( result.removedBlockNames.has( 'core/template-part' ) ).toBe(
				true
			);
		} );

		it( 'should filter out post content blocks', () => {
			const blocks = [
				{ name: 'core/post-content', innerBlocks: [] },
				{ name: 'core/paragraph', innerBlocks: [] },
			];

			const result = filterIncompatibleBlocks(
				blocks,
				mockCanInsertBlockType,
				null
			);

			expect( result.filteredBlocks ).toHaveLength( 1 );
			expect( result.filteredBlocks[ 0 ].name ).toBe( 'core/paragraph' );
			expect( result.removedBlockNames.has( 'core/post-content' ) ).toBe(
				true
			);
		} );
	} );

	describe( 'preserving inner blocks', () => {
		it( 'should preserve inner blocks of filtered template parts', () => {
			const blocks = [
				{
					name: 'core/template-part',
					innerBlocks: [
						{ name: 'core/paragraph', innerBlocks: [] },
						{ name: 'core/heading', innerBlocks: [] },
					],
				},
			];

			const result = filterIncompatibleBlocks(
				blocks,
				mockCanInsertBlockType,
				null
			);

			expect( result.filteredBlocks ).toHaveLength( 2 );
			expect( result.filteredBlocks[ 0 ].name ).toBe( 'core/paragraph' );
			expect( result.filteredBlocks[ 1 ].name ).toBe( 'core/heading' );
			expect( result.removedBlockNames.has( 'core/template-part' ) ).toBe(
				true
			);
		} );

		it( 'should preserve valid blocks with their inner blocks', () => {
			const blocks = [
				{
					name: 'core/group',
					innerBlocks: [
						{ name: 'core/paragraph', innerBlocks: [] },
					],
				},
			];

			const result = filterIncompatibleBlocks(
				blocks,
				mockCanInsertBlockType,
				null
			);

			expect( result.filteredBlocks ).toHaveLength( 1 );
			expect( result.filteredBlocks[ 0 ].name ).toBe( 'core/group' );
			expect( result.filteredBlocks[ 0 ].innerBlocks ).toHaveLength( 1 );
			expect( result.removedBlockNames.size ).toBe( 0 );
		} );
	} );

	describe( 'nested template parts', () => {
		it( 'should filter nested template parts inside valid blocks', () => {
			const blocks = [
				{
					name: 'core/group',
					innerBlocks: [
						{ name: 'core/template-part', innerBlocks: [] },
						{ name: 'core/paragraph', innerBlocks: [] },
					],
				},
			];

			const result = filterIncompatibleBlocks(
				blocks,
				mockCanInsertBlockType,
				null
			);

			expect( result.filteredBlocks ).toHaveLength( 1 );
			expect( result.filteredBlocks[ 0 ].name ).toBe( 'core/group' );
			expect( result.filteredBlocks[ 0 ].innerBlocks ).toHaveLength( 1 );
			expect( result.filteredBlocks[ 0 ].innerBlocks[ 0 ].name ).toBe(
				'core/paragraph'
			);
			expect( result.removedBlockNames.has( 'core/template-part' ) ).toBe(
				true
			);
		} );

		it( 'should handle deeply nested template parts', () => {
			const blocks = [
				{
					name: 'core/group',
					innerBlocks: [
						{
							name: 'core/columns',
							innerBlocks: [
								{
									name: 'core/column',
									innerBlocks: [
										{
											name: 'core/template-part',
											innerBlocks: [
												{
													name: 'core/paragraph',
													innerBlocks: [],
												},
											],
										},
									],
								},
							],
						},
					],
				},
			];

			const result = filterIncompatibleBlocks(
				blocks,
				mockCanInsertBlockType,
				null
			);

			expect( result.removedBlockNames.has( 'core/template-part' ) ).toBe(
				true
			);
			// The paragraph inside the template part should be preserved
			const column =
				result.filteredBlocks[ 0 ].innerBlocks[ 0 ].innerBlocks[ 0 ];
			expect( column.innerBlocks ).toHaveLength( 1 );
			expect( column.innerBlocks[ 0 ].name ).toBe( 'core/paragraph' );
		} );
	} );

	describe( 'mixed content scenarios', () => {
		it( 'should handle template content with header and footer template parts', () => {
			const blocks = [
				{
					name: 'core/template-part',
					attributes: { slug: 'header' },
					innerBlocks: [
						{ name: 'core/site-title', innerBlocks: [] },
						{ name: 'core/navigation', innerBlocks: [] },
					],
				},
				{
					name: 'core/group',
					innerBlocks: [
						{ name: 'core/heading', innerBlocks: [] },
						{ name: 'core/paragraph', innerBlocks: [] },
					],
				},
				{
					name: 'core/template-part',
					attributes: { slug: 'footer' },
					innerBlocks: [
						{ name: 'core/paragraph', innerBlocks: [] },
					],
				},
			];

			const result = filterIncompatibleBlocks(
				blocks,
				mockCanInsertBlockType,
				null
			);

			// Template parts should be removed but their inner blocks preserved
			// The group block should remain intact
			expect( result.removedBlockNames.has( 'core/template-part' ) ).toBe(
				true
			);

			// Should have: site-title, navigation, group, paragraph (from footer)
			expect( result.filteredBlocks.length ).toBeGreaterThan( 0 );

			// The group should be preserved with its inner blocks
			const groupBlock = result.filteredBlocks.find(
				( b ) => b.name === 'core/group'
			);
			expect( groupBlock ).toBeDefined();
			expect( groupBlock.innerBlocks ).toHaveLength( 2 );
		} );

		it( 'should return all blocks when canInsertBlockType allows everything', () => {
			const blocks = [
				{ name: 'core/template-part', innerBlocks: [] },
				{ name: 'core/paragraph', innerBlocks: [] },
			];

			const result = filterIncompatibleBlocks(
				blocks,
				mockCanInsertAllBlocks,
				null
			);

			expect( result.filteredBlocks ).toEqual( blocks );
			expect( result.removedBlockNames.size ).toBe( 0 );
		} );
	} );

	describe( 'tracking removed blocks', () => {
		it( 'should track multiple removed block types', () => {
			const blocks = [
				{ name: 'core/template-part', innerBlocks: [] },
				{ name: 'core/post-content', innerBlocks: [] },
				{ name: 'core/paragraph', innerBlocks: [] },
			];

			const result = filterIncompatibleBlocks(
				blocks,
				mockCanInsertBlockType,
				null
			);

			expect( result.removedBlockNames.size ).toBe( 2 );
			expect( result.removedBlockNames.has( 'core/template-part' ) ).toBe(
				true
			);
			expect( result.removedBlockNames.has( 'core/post-content' ) ).toBe(
				true
			);
		} );

		it( 'should not duplicate block names in removed set', () => {
			const blocks = [
				{ name: 'core/template-part', innerBlocks: [] },
				{ name: 'core/template-part', innerBlocks: [] },
				{ name: 'core/paragraph', innerBlocks: [] },
			];

			const result = filterIncompatibleBlocks(
				blocks,
				mockCanInsertBlockType,
				null
			);

			expect( result.removedBlockNames.size ).toBe( 1 );
			expect( result.filteredBlocks ).toHaveLength( 1 );
		} );
	} );
} );
