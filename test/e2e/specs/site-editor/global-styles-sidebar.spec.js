const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Global styles sidebar', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin, requestUtils } ) => {
		await requestUtils.resetThemeGlobalStyles();
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.resetThemeGlobalStyles();
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'should filter blocks list results', async ( { page } ) => {
		// Navigate to Styles -> Blocks.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Blocks' } )
			.click();

		await page
			.getByRole( 'searchbox', { name: 'Search' } )
			.fill( 'heading' );

		// Matches both Heading and Accordion Item blocks.
		// The latter contains "heading" in its description.
		await expect(
			page.getByRole( 'button', { name: 'Heading', exact: true } )
		).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Accordion Item' } )
		).toBeVisible();
	} );

	test( 'should filter blocks with user customizations', async ( {
		page,
	} ) => {
		await page.evaluate( async () => {
			const globalStylesId = await window.wp.data
				.resolveSelect( 'core' )
				.__experimentalGetCurrentGlobalStylesId();
			window.wp.data
				.dispatch( 'core' )
				.editEntityRecord( 'root', 'globalStyles', globalStylesId, {
					styles: {
						blocks: {
							'core/heading': {
								typography: { textTransform: 'uppercase' },
							},
						},
					},
				} );
		} );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Blocks' } )
			.click();

		const heading = page.getByRole( 'button', {
			name: 'Heading Customized styles: Typography',
		} );
		await expect( heading ).toBeVisible();

		const filterButton = page.getByRole( 'button', {
			name: 'Filter blocks',
		} );
		await filterButton.click();
		await page.getByRole( 'menuitemradio', { name: 'Customized' } ).click();
		await expect( filterButton ).toHaveAttribute( 'aria-pressed', 'true' );
		await expect( heading ).toBeVisible();
		await expect(
			page.getByRole( 'button', { name: 'Paragraph', exact: true } )
		).toBeHidden();

		const search = page.getByRole( 'searchbox', { name: 'Search' } );
		await search.fill( 'paragraph' );
		await expect( page.getByText( 'No blocks found.' ) ).toBeVisible();
		await search.fill( 'heading' );
		await expect( heading ).toBeVisible();
	} );

	test( 'should show an empty state when no blocks are customized', async ( {
		page,
	} ) => {
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Styles' } )
			.click();
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Blocks' } )
			.click();
		await page.getByRole( 'button', { name: 'Filter blocks' } ).click();
		await page.getByRole( 'menuitemradio', { name: 'Customized' } ).click();

		await expect(
			page.getByText( "You haven't customized any blocks yet." )
		).toBeVisible();
	} );
} );
