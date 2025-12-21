/**
 * WordPress dependencies
 */
import { useEffect, useState, useRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );

const MAX_LOADING_TIME = 10000; // 10 seconds

export function useIsSiteEditorLoading() {
	const location = useLocation();
	const { postId, postType } = location.params;
	const { canvas } = location.query;
	const prevPostIdRef = useRef( postId );
	const prevPostTypeRef = useRef( postType );
	const prevCanvasRef = useRef( canvas );
	const [ loaded, setLoaded ] = useState( false );
	const inLoadingPause = useSelect(
		( select ) => {
			const hasResolvingSelectors =
				select( coreStore ).hasResolvingSelectors();
			return ! loaded && ! hasResolvingSelectors;
		},
		[ loaded ]
	);

	// Reset loading state when navigating to a different post/template or canvas mode
	useEffect( () => {
		const hasPostChanged = postId && postId !== prevPostIdRef.current;
		const hasPostTypeChanged =
			postType && postType !== prevPostTypeRef.current;
		const hasCanvasChanged =
			canvas === 'edit' && canvas !== prevCanvasRef.current;

		if ( hasPostChanged || hasPostTypeChanged || hasCanvasChanged ) {
			setLoaded( false );
			prevPostIdRef.current = postId;
			prevPostTypeRef.current = postType;
			prevCanvasRef.current = canvas;
		}
	}, [ postId, postType, canvas ] );

	/*
	 * If the maximum expected loading time has passed, we're marking the
	 * editor as loaded, in order to prevent any failed requests from blocking
	 * the editor canvas from appearing.
	 */
	useEffect( () => {
		let timeout;

		if ( ! loaded ) {
			timeout = setTimeout( () => {
				setLoaded( true );
			}, MAX_LOADING_TIME );
		}

		return () => {
			clearTimeout( timeout );
		};
	}, [ loaded ] );

	useEffect( () => {
		if ( inLoadingPause ) {
			/*
			 * We're using an arbitrary 100ms timeout here to catch brief
			 * moments without any resolving selectors that would result in
			 * displaying brief flickers of loading state and loaded state.
			 *
			 * It's worth experimenting with different values, since this also
			 * adds 100ms of artificial delay after loading has finished.
			 */
			const ARTIFICIAL_DELAY = 100;
			const timeout = setTimeout( () => {
				setLoaded( true );
			}, ARTIFICIAL_DELAY );

			return () => {
				clearTimeout( timeout );
			};
		}
	}, [ inLoadingPause ] );

	return ! loaded;
}
