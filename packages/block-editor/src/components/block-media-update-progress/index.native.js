/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	subscribeMediaUpload,
	subscribeMediaSave,
} from '@wordpress/react-native-bridge';

/**
 * Internal dependencies
 */
import styles from './styles.scss';

export const MEDIA_UPLOAD_STATE_UPLOADING = 1;
export const MEDIA_UPLOAD_STATE_SUCCEEDED = 2;
export const MEDIA_UPLOAD_STATE_FAILED = 3;
export const MEDIA_UPLOAD_STATE_RESET = 4;

export const MEDIA_SAVE_STATE_SAVING = 5;
export const MEDIA_SAVE_STATE_SUCCEEDED = 6;
export const MEDIA_SAVE_STATE_FAILED = 7;
export const MEDIA_SAVE_STATE_RESET = 8;
export const MEDIA_SAVE_FINAL_STATE_RESULT = 9;
export const MEDIA_SAVE_MEDIAID_CHANGED = 10;

export function BlockMediaUpdateProgress( props ) {
	const {
		renderContent = () => null,
		mediaFiles,
		onUpdateMediaUploadProgress,
		onFinishMediaUploadWithSuccess,
		onFinishMediaUploadWithFailure,
		onMediaUploadStateReset,
		onUpdateMediaSaveProgress,
		onFinishMediaSaveWithSuccess,
		onFinishMediaSaveWithFailure,
		onMediaSaveStateReset,
		onFinalSaveResult,
		onMediaIdChanged,
	} = props;

	const [ progress, setProgress ] = useState( 0 );
	const [ isUploadInProgress, setIsUploadInProgress ] = useState( false );
	const [ isUploadFailed, setIsUploadFailed ] = useState( false );
	const [ isSaveInProgress, setIsSaveInProgress ] = useState( false );
	const [ isSaveFailed, setIsSaveFailed ] = useState( false );

	const subscriptionParentMediaUpload = useRef( null );
	const subscriptionParentMediaSave = useRef( null );

	const mediaIdContainedInMediaFiles = useCallback(
		( mediaId, mediaFilesList ) => {
			if ( mediaId !== undefined && mediaFilesList !== undefined ) {
				return mediaFilesList.some(
					( element ) => element.id === mediaId.toString()
				);
			}
			return false;
		},
		[]
	);

	// ---- Block media upload actions ----
	const updateMediaUploadProgress = useCallback(
		( payload ) => {
			setProgress( payload.progress );
			setIsUploadInProgress( true );
			setIsUploadFailed( false );
			setIsSaveInProgress( false );
			setIsSaveFailed( false );

			if ( onUpdateMediaUploadProgress ) {
				onUpdateMediaUploadProgress( payload );
			}
		},
		[ onUpdateMediaUploadProgress ]
	);

	const finishMediaUploadWithSuccess = useCallback(
		( payload ) => {
			setIsUploadInProgress( false );
			setIsSaveInProgress( false );

			if ( onFinishMediaUploadWithSuccess ) {
				onFinishMediaUploadWithSuccess( payload );
			}
		},
		[ onFinishMediaUploadWithSuccess ]
	);

	const finishMediaUploadWithFailure = useCallback(
		( payload ) => {
			setIsUploadInProgress( false );
			setIsUploadFailed( true );

			if ( onFinishMediaUploadWithFailure ) {
				onFinishMediaUploadWithFailure( payload );
			}
		},
		[ onFinishMediaUploadWithFailure ]
	);

	const mediaUploadStateReset = useCallback(
		( payload ) => {
			setIsUploadInProgress( false );
			setIsUploadFailed( false );

			if ( onMediaUploadStateReset ) {
				onMediaUploadStateReset( payload );
			}
		},
		[ onMediaUploadStateReset ]
	);

	const mediaUpload = useCallback(
		( payload ) => {
			if (
				! mediaIdContainedInMediaFiles( payload.mediaId, mediaFiles )
			) {
				return;
			}

			switch ( payload.state ) {
				case MEDIA_UPLOAD_STATE_UPLOADING:
					updateMediaUploadProgress( payload );
					break;
				case MEDIA_UPLOAD_STATE_SUCCEEDED:
					finishMediaUploadWithSuccess( payload );
					break;
				case MEDIA_UPLOAD_STATE_FAILED:
					finishMediaUploadWithFailure( payload );
					break;
				case MEDIA_UPLOAD_STATE_RESET:
					mediaUploadStateReset( payload );
					break;
			}
		},
		[
			mediaFiles,
			mediaIdContainedInMediaFiles,
			updateMediaUploadProgress,
			finishMediaUploadWithSuccess,
			finishMediaUploadWithFailure,
			mediaUploadStateReset,
		]
	);

	// ---- Block media save actions ----
	const updateMediaSaveProgress = useCallback(
		( payload ) => {
			setProgress( payload.progress );
			setIsSaveInProgress( true );
			setIsSaveFailed( false );
			setIsUploadInProgress( false );
			setIsUploadFailed( false );

			if ( onUpdateMediaSaveProgress ) {
				onUpdateMediaSaveProgress( payload );
			}
		},
		[ onUpdateMediaSaveProgress ]
	);

	const finishMediaSaveWithSuccess = useCallback(
		( payload ) => {
			setIsSaveInProgress( false );

			if ( onFinishMediaSaveWithSuccess ) {
				onFinishMediaSaveWithSuccess( payload );
			}
		},
		[ onFinishMediaSaveWithSuccess ]
	);

	const finishMediaSaveWithFailure = useCallback(
		( payload ) => {
			setIsSaveInProgress( false );
			setIsSaveFailed( true );

			if ( onFinishMediaSaveWithFailure ) {
				onFinishMediaSaveWithFailure( payload );
			}
		},
		[ onFinishMediaSaveWithFailure ]
	);

	const mediaSaveStateReset = useCallback(
		( payload ) => {
			setIsSaveInProgress( false );
			setIsSaveFailed( false );

			if ( onMediaSaveStateReset ) {
				onMediaSaveStateReset( payload );
			}
		},
		[ onMediaSaveStateReset ]
	);

	const finalSaveResult = useCallback(
		( payload ) => {
			setProgress( payload.progress );
			setIsUploadInProgress( false );
			setIsUploadFailed( false );
			setIsSaveInProgress( false );
			setIsSaveFailed( ! payload.success );

			if ( onFinalSaveResult ) {
				onFinalSaveResult( payload );
			}
		},
		[ onFinalSaveResult ]
	);

	const mediaIdChanged = useCallback(
		( payload ) => {
			setIsUploadInProgress( false );
			setIsUploadFailed( false );
			setIsSaveInProgress( false );
			setIsSaveFailed( false );

			if ( onMediaIdChanged ) {
				onMediaIdChanged( payload );
			}
		},
		[ onMediaIdChanged ]
	);

	const mediaSave = useCallback(
		( payload ) => {
			if (
				! mediaIdContainedInMediaFiles( payload.mediaId, mediaFiles )
			) {
				return;
			}

			switch ( payload.state ) {
				case MEDIA_SAVE_STATE_SAVING:
					updateMediaSaveProgress( payload );
					break;
				case MEDIA_SAVE_STATE_SUCCEEDED:
					finishMediaSaveWithSuccess( payload );
					break;
				case MEDIA_SAVE_STATE_FAILED:
					finishMediaSaveWithFailure( payload );
					break;
				case MEDIA_SAVE_STATE_RESET:
					mediaSaveStateReset( payload );
					break;
				case MEDIA_SAVE_FINAL_STATE_RESULT:
					finalSaveResult( payload );
					break;
				case MEDIA_SAVE_MEDIAID_CHANGED:
					mediaIdChanged( payload );
					break;
			}
		},
		[
			mediaFiles,
			mediaIdContainedInMediaFiles,
			updateMediaSaveProgress,
			finishMediaSaveWithSuccess,
			finishMediaSaveWithFailure,
			mediaSaveStateReset,
			finalSaveResult,
			mediaIdChanged,
		]
	);

	// ---- Subscription management ----
	const addMediaUploadListener = useCallback( () => {
		if ( subscriptionParentMediaUpload.current ) {
			return;
		}
		subscriptionParentMediaUpload.current = subscribeMediaUpload(
			( payload ) => {
				mediaUpload( payload );
			}
		);
	}, [ mediaUpload ] );

	const removeMediaUploadListener = useCallback( () => {
		if ( subscriptionParentMediaUpload.current ) {
			subscriptionParentMediaUpload.current.remove();
			subscriptionParentMediaUpload.current = null;
		}
	}, [] );

	const addMediaSaveListener = useCallback( () => {
		if ( subscriptionParentMediaSave.current ) {
			return;
		}
		subscriptionParentMediaSave.current = subscribeMediaSave(
			( payload ) => {
				mediaSave( payload );
			}
		);
	}, [ mediaSave ] );

	const removeMediaSaveListener = useCallback( () => {
		if ( subscriptionParentMediaSave.current ) {
			subscriptionParentMediaSave.current.remove();
			subscriptionParentMediaSave.current = null;
		}
	}, [] );

	useEffect( () => {
		addMediaUploadListener();
		addMediaSaveListener();

		return () => {
			removeMediaUploadListener();
			removeMediaSaveListener();
		};
	}, [
		addMediaUploadListener,
		addMediaSaveListener,
		removeMediaUploadListener,
		removeMediaSaveListener,
	] );

	// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
	const retryMessageSave = __(
		'Failed to save files.\nPlease tap for options.'
	);
	// eslint-disable-next-line @wordpress/i18n-no-collapsible-whitespace
	const retryMessageUpload = __(
		'Failed to upload files.\nPlease tap for options.'
	);

	const showSpinner = isUploadInProgress || isSaveInProgress;
	const computedProgress = progress * 100;

	let retryMessage = retryMessageSave;
	if ( isUploadFailed ) {
		retryMessage = retryMessageUpload;
	}

	return useMemo(
		() => (
			<View style={ styles.mediaUploadProgress } pointerEvents="box-none">
				{ showSpinner && (
					<View style={ styles.progressBar }>
						<Spinner
							progress={ computedProgress }
							testID="spinner"
						/>
					</View>
				) }
				{ renderContent( {
					isUploadInProgress,
					isUploadFailed,
					isSaveInProgress,
					isSaveFailed,
					retryMessage,
				} ) }
			</View>
		),
		[
			showSpinner,
			computedProgress,
			isUploadInProgress,
			isUploadFailed,
			isSaveInProgress,
			isSaveFailed,
			retryMessage,
			renderContent,
		]
	);
}

export default BlockMediaUpdateProgress;
