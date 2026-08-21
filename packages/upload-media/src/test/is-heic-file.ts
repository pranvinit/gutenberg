import { isHeicBuffer, isHeicFile } from '../heic-parser';

function buildFileTypeBox( ...brands: string[] ): ArrayBuffer {
	const [ majorBrand, ...compatibleBrands ] = brands;
	const contents = `ftyp${ majorBrand }\0\0\0\0${ compatibleBrands.join(
		''
	) }`;
	return new Uint8Array( [
		0,
		0,
		0,
		4 + contents.length,
		...[ ...contents ].map( ( character ) => character.charCodeAt( 0 ) ),
	] ).buffer;
}

describe( 'isHeicBuffer', () => {
	it( 'recognizes a HEIC major brand', () => {
		expect( isHeicBuffer( buildFileTypeBox( 'heic' ) ) ).toBe( true );
	} );

	it( 'recognizes a HEIC compatible brand', () => {
		expect(
			isHeicBuffer( buildFileTypeBox( 'mif1', 'miaf', 'heic' ) )
		).toBe( true );
	} );

	it( 'does not classify AVIF as HEIC', () => {
		expect( isHeicBuffer( buildFileTypeBox( 'avif', 'mif1' ) ) ).toBe(
			false
		);
	} );

	it( 'does not read brands beyond the declared box', () => {
		const heicBytes = new Uint8Array( buildFileTypeBox( 'heic' ) );
		const jpegBox = new Uint8Array( buildFileTypeBox( 'jpeg' ) );
		const combined = new Uint8Array( jpegBox.length + heicBytes.length );
		combined.set( jpegBox );
		combined.set( heicBytes, jpegBox.length );

		expect( isHeicBuffer( combined.buffer ) ).toBe( false );
	} );

	it( 'rejects an incomplete File Type Box', () => {
		const buffer = buildFileTypeBox( 'heic', 'mif1' ).slice( 0, 16 );
		expect( isHeicBuffer( buffer ) ).toBe( false );
	} );
} );

describe( 'isHeicFile', () => {
	it( 'trusts a HEIC MIME type without inspecting the file', async () => {
		const file = new File( [ 'invalid' ], 'photo.heic', {
			type: 'image/heic',
		} );

		await expect( isHeicFile( file ) ).resolves.toBe( true );
	} );

	it( 'recognizes a HEIC file named .jpg', async () => {
		const file = new File( [ buildFileTypeBox( 'heic' ) ], 'photo.jpg', {
			type: 'image/jpeg',
		} );

		await expect( isHeicFile( file ) ).resolves.toBe( true );
	} );

	it( 'recognizes a HEIC file without a MIME type', async () => {
		const file = new File( [ buildFileTypeBox( 'heic' ) ], 'photo', {
			type: '',
		} );

		await expect( isHeicFile( file ) ).resolves.toBe( true );
	} );

	it( 'leaves a JPEG file alone', async () => {
		const file = new File(
			[ new Uint8Array( [ 0xff, 0xd8, 0xff, 0xe0 ] ) ],
			'photo.jpg',
			{ type: 'image/jpeg' }
		);

		await expect( isHeicFile( file ) ).resolves.toBe( false );
	} );

	it( 'does not inspect an explicitly non-image file', async () => {
		const file = new File( [ buildFileTypeBox( 'heic' ) ], 'clip.mp4', {
			type: 'video/mp4',
		} );

		await expect( isHeicFile( file ) ).resolves.toBe( false );
	} );
} );
