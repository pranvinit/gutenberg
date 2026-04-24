import { useRender, mergeProps } from '@base-ui/react';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { CSSProperties } from 'react';
import { type TextProps } from './types';
import styles from './style.module.css';
import defenseStyles from '../utils/css/global-css-defense.module.css';

/**
 * A text component for rendering content with predefined typographic variants.
 * Built on design tokens for consistent typography across the UI.
 */
export const Text = forwardRef< HTMLSpanElement, TextProps >( function Text(
	{
		variant = 'body-md',
		render,
		className,
		style,
		truncate = false,
		numberOfLines,
		...props
	},
	ref
) {
	const shouldClamp = !! numberOfLines && numberOfLines > 0;
	const textStyle: CSSProperties | undefined = shouldClamp
		? {
				...style,
				WebkitLineClamp: numberOfLines,
		  }
		: style;

	const element = useRender( {
		render,
		defaultTagName: 'span',
		ref,
		props: mergeProps< 'span' >( props, {
			style: textStyle,
			className: clsx(
				styles.text,
				defenseStyles.heading,
				defenseStyles.p,
				truncate && ! shouldClamp && styles.truncate,
				shouldClamp && styles.lineClamp,
				styles[ variant ],
				className
			),
		} ),
	} );

	return element;
} );
