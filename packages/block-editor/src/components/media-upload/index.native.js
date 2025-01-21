/**
 * External dependencies
 */
import { Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import React, {
	useState,
	useRef,
	useCallback,
	useEffect,
	memo,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	BottomSheet,
	PanelBody,
	Picker,
	TextControl,
} from '@wordpress/components';
import {
	getOtherMediaOptions,
	requestMediaPicker,
	mediaSources,
} from '@wordpress/react-native-bridge';
import {
	capturePhoto,
	captureVideo,
	image,
	wordpress,
	mobile,
	globe,
} from '@wordpress/icons';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	MEDIA_TYPE_IMAGE,
	MEDIA_TYPE_VIDEO,
	MEDIA_TYPE_AUDIO,
	MEDIA_TYPE_ANY,
	OPTION_TAKE_VIDEO,
	OPTION_TAKE_PHOTO,
	OPTION_INSERT_FROM_URL,
	OPTION_WORDPRESS_MEDIA_LIBRARY,
} from './constants';
import styles from './style.scss';

const URL_MEDIA_SOURCE = 'URL';
const PICKER_OPENING_DELAY = 200;

function URLInput( props ) {
	return (
		<BottomSheet
			hideHeader
			isVisible={ props.isVisible }
			onClose={ props.onClose }
		>
			<PanelBody style={ styles[ 'media-upload__link-input' ] }>
				<TextControl
					// TODO: Switch to `true` (40px size) if possible
					__next40pxDefaultSize={ false }
					// eslint-disable-next-line jsx-a11y/no-autofocus
					autoFocus
					autoCapitalize="none"
					autoCorrect={ false }
					autoComplete={ Platform.isIOS ? 'url' : 'off' }
					keyboardType="url"
					label={ OPTION_INSERT_FROM_URL }
					onChange={ props.onChange }
					placeholder={ __( 'Type a URL' ) }
					value={ props.value }
				/>
			</PanelBody>
		</BottomSheet>
	);
}

function MediaUpload( props ) {
	const {
		allowedTypes = [],
		autoOpen,
		onSelectURL,
		onSelect,
		isReplacingMedia,
		multiple = false,
		isAudioBlockMediaUploadEnabled,
		__experimentalOnlyMediaLibrary,
		render,
	} = props;

	const [ url, setUrl ] = useState( '' );
	const [ showURLInput, setShowURLInput ] = useState( false );
	const [ otherMediaOptions, setOtherMediaOptions ] = useState( [] );

	const pickerRef = useRef( null );
	const pickerTimeout = useRef();

	useEffect( () => {
		getOtherMediaOptions( allowedTypes, ( otherMediaOptionsData ) => {
			const otherMediaOptionsWithIcons = otherMediaOptionsData.map(
				( option ) => {
					return {
						...option,
						requiresModal: true,
						types: allowedTypes,
						id: option.value,
					};
				}
			);
			setOtherMediaOptions( otherMediaOptionsWithIcons );
		} );

		if ( autoOpen ) {
			onPickerPresent();
		}

		return () => {
			clearTimeout( pickerTimeout.current );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const getAllSources = useCallback( () => {
		const cameraImageSource = {
			id: mediaSources.deviceCamera, // ID is the value sent to native.
			value: mediaSources.deviceCamera + '-IMAGE', // This is needed to diferenciate image-camera from video-camera sources.
			label: OPTION_TAKE_PHOTO,
			requiresModal: true,
			types: [ MEDIA_TYPE_IMAGE ],
			icon: capturePhoto,
		};

		const cameraVideoSource = {
			id: mediaSources.deviceCamera,
			value: mediaSources.deviceCamera,
			label: OPTION_TAKE_VIDEO,
			requiresModal: true,
			types: [ MEDIA_TYPE_VIDEO ],
			icon: captureVideo,
		};

		const deviceLibrarySource = {
			id: mediaSources.deviceLibrary,
			value: mediaSources.deviceLibrary,
			label: __( 'Choose from device' ),
			requiresModal: true,
			types: [ MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO ],
			icon: image,
		};

		const siteLibrarySource = {
			id: mediaSources.siteMediaLibrary,
			value: mediaSources.siteMediaLibrary,
			label: OPTION_WORDPRESS_MEDIA_LIBRARY,
			requiresModal: true,
			types: [
				MEDIA_TYPE_IMAGE,
				MEDIA_TYPE_VIDEO,
				MEDIA_TYPE_AUDIO,
				MEDIA_TYPE_ANY,
			],
			icon: wordpress,
			mediaLibrary: true,
		};

		const urlSource = {
			id: URL_MEDIA_SOURCE,
			value: URL_MEDIA_SOURCE,
			label: OPTION_INSERT_FROM_URL,
			types: [ MEDIA_TYPE_AUDIO, MEDIA_TYPE_IMAGE, MEDIA_TYPE_VIDEO ],
			icon: globe,
		};

		// Only include `urlSource` option if `onSelectURL` prop is present, in order to match the web behavior.
		const internalSources = [
			deviceLibrarySource,
			cameraImageSource,
			cameraVideoSource,
			siteLibrarySource,
			...( onSelectURL ? [ urlSource ] : [] ),
		];

		return internalSources.concat( otherMediaOptions );
	}, [ onSelectURL, otherMediaOptions, allowedTypes ] );

	const getChooseFromDeviceIcon = useCallback( () => {
		return mobile;
	}, [] );

	const getMediaOptionsItems = useCallback( () => {
		return getAllSources()
			.filter( ( source ) => {
				if ( __experimentalOnlyMediaLibrary ) {
					return source.mediaLibrary;
				} else if (
					allowedTypes.every(
						( allowedType ) =>
							allowedType === MEDIA_TYPE_AUDIO &&
							source.types.includes( allowedType )
					) &&
					source.id !== URL_MEDIA_SOURCE
				) {
					return isAudioBlockMediaUploadEnabled === true;
				}

				return allowedTypes.some( ( allowedType ) =>
					source.types.includes( allowedType )
				);
			} )
			.map( ( source ) => {
				return {
					...source,
					icon: source.icon || getChooseFromDeviceIcon(),
				};
			} );
	}, [
		allowedTypes,
		__experimentalOnlyMediaLibrary,
		isAudioBlockMediaUploadEnabled,
		getAllSources,
		getChooseFromDeviceIcon,
	] );

	const onPickerPresent = useCallback( () => {
		const isIOS = Platform.OS === 'ios';

		if ( pickerRef.current ) {
			// the delay below is required because on iOS this action sheet gets dismissed by the close event of the Inserter
			// so this delay allows the Inserter to be closed fully before presenting action sheet.
			if ( autoOpen && isIOS ) {
				pickerTimeout.current = setTimeout( () => {
					pickerRef.current.presentPicker();
				}, PICKER_OPENING_DELAY );
			} else {
				pickerRef.current.presentPicker();
			}
		}
	}, [ autoOpen ] );

	const onPickerSelect = useCallback(
		( value ) => {
			if ( value === URL_MEDIA_SOURCE ) {
				setShowURLInput( true );
				return;
			}

			const source = getAllSources()
				.filter( ( s ) => s.value === value )
				.shift();
			const types = allowedTypes.filter( ( type ) =>
				source.types.includes( type )
			);

			requestMediaPicker( source.id, types, multiple, ( media ) => {
				if ( ( multiple && media ) || ( media && media.id ) ) {
					onSelect( media );
				}
			} );
		},
		[ allowedTypes, onSelect, getAllSources, multiple ]
	);

	const isOneType = allowedTypes.length === 1;
	const isImage = isOneType && allowedTypes.includes( MEDIA_TYPE_IMAGE );
	const isVideo = isOneType && allowedTypes.includes( MEDIA_TYPE_VIDEO );
	const isAudio = isOneType && allowedTypes.includes( MEDIA_TYPE_AUDIO );
	const isAnyType = isOneType && allowedTypes.includes( MEDIA_TYPE_ANY );

	const isImageOrVideo =
		allowedTypes.length === 2 &&
		allowedTypes.includes( MEDIA_TYPE_IMAGE ) &&
		allowedTypes.includes( MEDIA_TYPE_VIDEO );

	let pickerTitle;
	if ( isImage ) {
		if ( isReplacingMedia ) {
			pickerTitle = __( 'Replace image' );
		} else {
			pickerTitle = multiple
				? __( 'Choose images' )
				: __( 'Choose image' );
		}
	} else if ( isVideo ) {
		if ( isReplacingMedia ) {
			pickerTitle = __( 'Replace video' );
		} else {
			pickerTitle = __( 'Choose video' );
		}
	} else if ( isImageOrVideo ) {
		if ( isReplacingMedia ) {
			pickerTitle = __( 'Replace image or video' );
		} else {
			pickerTitle = __( 'Choose image or video' );
		}
	} else if ( isAudio ) {
		if ( isReplacingMedia ) {
			pickerTitle = __( 'Replace audio' );
		} else {
			pickerTitle = __( 'Choose audio' );
		}
	} else if ( isAnyType ) {
		pickerTitle = __( 'Choose file' );
		if ( isReplacingMedia ) {
			pickerTitle = __( 'Replace file' );
		} else {
			pickerTitle = __( 'Choose file' );
		}
	}

	const getMediaOptions = useCallback( () => {
		return (
			<Picker
				title={ pickerTitle }
				hideCancelButton
				ref={ ( instance ) => ( pickerRef.current = instance ) }
				options={ getMediaOptionsItems() }
				onChange={ onPickerSelect }
				testID="media-options-picker"
			/>
		);
	}, [ pickerTitle, getMediaOptionsItems, onPickerSelect ] );

	return (
		<>
			<URLInput
				isVisible={ showURLInput }
				onClose={ () => {
					if ( url !== '' ) {
						props.onSelectURL( url );
					}
					setShowURLInput( false );
					setUrl( '' );
				} }
				onChange={ setUrl }
				value={ url }
			/>
			{ render( {
				open: onPickerPresent,
				getMediaOptions,
			} ) }
		</>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const { capabilities } = select( blockEditorStore ).getSettings();
		return {
			isAudioBlockMediaUploadEnabled:
				capabilities?.isAudioBlockMediaUploadEnabled === true,
		};
	} ),
] )( memo( MediaUpload ) );
