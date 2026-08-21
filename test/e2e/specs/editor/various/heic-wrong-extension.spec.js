const path = require( 'path' );
const fs = require( 'fs/promises' );
const os = require( 'os' );
const { randomUUID } = require( 'crypto' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

async function uploadMisnamedHeic( inputElement ) {
	const contents = 'ftypheic\0\0\0\0mif1';
	const bytes = Buffer.from( [
		0,
		0,
		0,
		4 + contents.length,
		...[ ...contents ].map( ( character ) => character.charCodeAt( 0 ) ),
	] );
	const directory = await fs.mkdtemp(
		path.join( os.tmpdir(), 'gutenberg-test-media-' )
	);
	const fileName = path.join( directory, `${ randomUUID() }.jpg` );
	await fs.writeFile( fileName, bytes );

	try {
		await inputElement.setInputFiles( fileName );
	} finally {
		await fs.rm( directory, { recursive: true, force: true } );
	}
}

async function insertImageBlock( editor ) {
	await editor.insertBlock( { name: 'core/image' } );
	const imageBlock = editor.canvas.locator(
		'role=document[name="Block: Image"i]'
	);
	await expect( imageBlock ).toBeVisible();
	return imageBlock;
}

async function expectHeicFailure( page, imageBlock ) {
	await expect(
		page.locator( '.components-snackbar' ).filter( { hasText: 'HEIC' } )
	).toBeVisible( { timeout: 60_000 } );
	await expect(
		imageBlock.getByRole( 'button', { name: 'Media Library' } )
	).toBeVisible();
	await expect
		.poll( () =>
			page.evaluate(
				() =>
					window.wp.data.select( 'core/upload-media' ).getItems()
						.length
			)
		)
		.toBe( 0 );
}

test.describe( 'Uploading a HEIC file with a mismatched extension', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'settles the upload instead of sending raw HEIC bytes', async ( {
		editor,
		page,
	} ) => {
		const mediaRequests = [];
		page.on( 'request', ( request ) => {
			if (
				request.method() === 'POST' &&
				/\/wp\/v2\/media\b/.test( request.url() )
			) {
				mediaRequests.push( request.url() );
			}
		} );

		const imageBlock = await insertImageBlock( editor );
		await uploadMisnamedHeic(
			imageBlock.locator( 'data-testid=form-file-upload-input' )
		);
		await expectHeicFailure( page, imageBlock );

		expect( mediaRequests ).toEqual( [] );
	} );

	test.describe( 'HEIC-only canvas mode', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin(
				'gutenberg-test-plugin-disable-cross-origin-isolation'
			);
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin(
				'gutenberg-test-plugin-disable-cross-origin-isolation'
			);
		} );

		test( 'routes the file to HEIC conversion instead of the server', async ( {
			editor,
			page,
		} ) => {
			await expect
				.poll( () => page.evaluate( () => window.crossOriginIsolated ) )
				.toBe( false );

			const imageBlock = await insertImageBlock( editor );
			await uploadMisnamedHeic(
				imageBlock.locator( 'data-testid=form-file-upload-input' )
			);
			await expectHeicFailure( page, imageBlock );
		} );
	} );
} );
