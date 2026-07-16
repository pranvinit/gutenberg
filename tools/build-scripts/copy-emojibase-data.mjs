#!/usr/bin/env node
/**
 * Copy Emojibase locale data into Gutenberg's `build/emojibase-data/`
 * directory so the editor's emoji picker can fetch translated emoji
 * labels and category names same-origin without inlining the data into
 * the JS bundle. Files are loaded per-locale at runtime (one locale per
 * editor session), so the disk cost on the build artifact does not
 * translate into a network cost for users.
 *
 * Runs as a step in `tools/build-scripts/build.mjs`, after wp-build has
 * populated `build/`. Missing source files fail the build so release
 * artifacts cannot advertise a picker URL that serves incomplete data.
 */

import { access, copyFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire( import.meta.url );
const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../..' );

// Resolve emojibase-data via node module resolution so this works whether
// the dependency is hoisted to the repo root or nested in this workspace.
const SRC_DIR = path.dirname(
	require.resolve( 'emojibase-data/package.json' )
);
const DEST_DIR = path.join( ROOT_DIR, 'build', 'emojibase-data' );

// We only ever fetch data.json and messages.json. Shipping just those
// two files per locale keeps the rest of the upstream package
// (~50MB unpacked) out of the plugin distribution.
const FILES = [ 'data.json', 'messages.json' ];

// All locales Emojibase ships translated data for. Keep in sync with
// `EMOJIBASE_LOCALES` in `packages/editor/src/components/collab-sidebar/
// emojibase-data.ts`. Each locale adds ~85KB gzipped on disk; only the
// active locale is fetched per editor session.
const LOCALES = [
	'bn',
	'da',
	'de',
	'en',
	'en-gb',
	'es',
	'es-mx',
	'et',
	'fi',
	'fr',
	'hi',
	'hu',
	'it',
	'ja',
	'ko',
	'lt',
	'ms',
	'nb',
	'nl',
	'pl',
	'pt',
	'ru',
	'sv',
	'th',
	'uk',
	'vi',
	'zh',
	'zh-hant',
];

async function copyEmojibaseData() {
	// Validate the complete source set before writing anything. A partially
	// copied directory would only fail later at runtime for a subset of users.
	await Promise.all(
		LOCALES.flatMap( ( locale ) =>
			FILES.map( ( file ) =>
				access( path.join( SRC_DIR, locale, file ) )
			)
		)
	);

	for ( const locale of LOCALES ) {
		const localeDest = path.join( DEST_DIR, locale );
		await mkdir( localeDest, { recursive: true } );
		for ( const file of FILES ) {
			const from = path.join( SRC_DIR, locale, file );
			const to = path.join( localeDest, file );
			await copyFile( from, to );
		}
	}
	console.log(
		`   ✔ Copied emojibase data for ${ LOCALES.join(
			', '
		) } to build/emojibase-data/`
	);
}

copyEmojibaseData().catch( ( error ) => {
	console.error( '❌ Failed to copy emojibase data:', error );
	process.exit( 1 );
} );
