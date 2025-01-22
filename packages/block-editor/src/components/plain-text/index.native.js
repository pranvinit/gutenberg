/**
 * External dependencies
 */
/**
 * WordPress dependencies
 */
import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
} from '@wordpress/element';
import { TextInput, Platform, Dimensions } from 'react-native';
import { getPxFromCssUnit } from '@wordpress/components';

/**
 * Internal dependencies
 */
import RichText from '../rich-text';
import styles from './style.scss';

function PlainText( props ) {
	const {
		isSelected,
		style,
		__experimentalVersion,
		onFocus,
		onBlur,
		onChange,
		...otherProps
	} = props;

	const inputRef = useRef( null );
	const timeoutRef = useRef( null );
	const prevIsSelectedRef = useRef( isSelected );
	const isAndroid = useMemo( () => Platform.OS === 'android', [] );

	const getFontSize = useCallback( () => {
		if ( ! style?.fontSize ) {
			return;
		}
		const { width, height } = Dimensions.get( 'window' );
		const cssUnitOptions = { height, width };
		return {
			fontSize: parseFloat(
				getPxFromCssUnit( style.fontSize, cssUnitOptions )
			),
		};
	}, [ style?.fontSize ] );

	const replaceLineBreakTags = useCallback( ( value ) => {
		return value?.replace( /<br>/gim, '\n' );
	}, [] );

	const onChangeTextInput = useCallback(
		( event ) => {
			onChange( event.nativeEvent.text );
		},
		[ onChange ]
	);

	const onChangeRichText = useCallback(
		( value ) => {
			// The <br> tags have to be replaced with new line characters
			// as the content of plain text shouldn't contain HTML tags.
			onChange( replaceLineBreakTags( value ) );
		},
		[ onChange, replaceLineBreakTags ]
	);

	useEffect( () => {
		if (
			inputRef.current &&
			! inputRef.current.isFocused() &&
			isSelected
		) {
			if ( isAndroid ) {
				/*
				 * There seems to be an issue in React Native where the keyboard doesn't show if called shortly after rendering.
				 * As a common work around this delay is used.
				 * https://github.com/facebook/react-native/issues/19366#issuecomment-400603928
				 */
				timeoutRef.current = setTimeout( () => {
					inputRef.current?.focus();
				}, 100 );
			} else {
				inputRef.current?.focus();
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useEffect( () => {
		if ( ! isSelected && prevIsSelectedRef.current ) {
			inputRef.current?.blur();
		}
		prevIsSelectedRef.current = isSelected;
	}, [ isSelected ] );

	useEffect( () => {
		return () => {
			if ( isAndroid && timeoutRef.current ) {
				clearTimeout( timeoutRef.current );
			}
		};
	}, [ isAndroid ] );

	const textStyles = useMemo(
		() => [ style || styles[ 'block-editor-plain-text' ], getFontSize() ],
		[ style, getFontSize ]
	);

	if ( __experimentalVersion === 2 ) {
		const disableFormattingProps = {
			withoutInteractiveFormatting: true,
			disableEditingMenu: true,
			__unstableDisableFormats: true,
			disableSuggestions: true,
		};

		const forcePlainTextProps = {
			preserveWhiteSpace: true,
			__unstablePastePlainText: true,
			multiline: false,
		};

		const fontProps = {
			fontFamily: style?.fontFamily,
			fontSize: style?.fontSize,
			fontWeight: style?.fontWeight,
		};

		return (
			<RichText
				{ ...otherProps }
				{ ...disableFormattingProps }
				{ ...forcePlainTextProps }
				{ ...fontProps }
				identifier="content"
				style={ style }
				onChange={ onChangeRichText }
				unstableOnFocus={ onFocus }
			/>
		);
	}

	return (
		<TextInput
			{ ...otherProps }
			ref={ inputRef }
			onChange={ onChangeTextInput }
			onFocus={ onFocus } // Always assign onFocus as a props.
			onBlur={ onBlur } // Always assign onBlur as a props.
			fontFamily={
				style?.fontFamily ||
				styles[ 'block-editor-plain-text' ].fontFamily
			}
			style={ textStyles }
			scrollEnabled={ false }
		/>
	);
}

export default React.memo( PlainText );
