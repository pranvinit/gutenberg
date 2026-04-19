import { Dialog as _Dialog } from '@base-ui/react/dialog';
import clsx from 'clsx';
import {
	Children,
	forwardRef,
	isValidElement,
	type ReactNode,
} from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import {
	type ThemeProvider as ThemeProviderType,
	privateApis as themePrivateApis,
} from '@wordpress/theme';
import { unlock } from '../lock-unlock';
import { useDeprioritizedInitialFocus } from '../utils/use-deprioritized-initial-focus';
import { DialogValidationProvider } from './context';
import { Footer } from './footer';
import { Header } from './header';
import styles from './style.module.css';
import type { PopupProps } from './types';

const ThemeProvider: typeof ThemeProviderType =
	unlock( themePrivateApis ).ThemeProvider;

const CLOSE_ICON_ATTR = 'data-wp-ui-dialog-close-icon';

function isDialogRegion(
	child: ReactNode,
	component: typeof Header | typeof Footer
) {
	return isValidElement( child ) && child.type === component;
}

/**
 * Renders the dialog popup element that contains the dialog content.
 * Uses a portal to render outside the DOM hierarchy.
 */
const Popup = forwardRef< HTMLDivElement, PopupProps >( function DialogPopup(
	{
		className,
		container,
		size = 'medium',
		initialFocus,
		finalFocus,
		children,
		...props
	},
	ref
) {
	const { resolvedInitialFocus, popupRef } = useDeprioritizedInitialFocus( {
		initialFocus,
		deprioritizedAttribute: CLOSE_ICON_ATTR,
	} );
	const mergedRef = useMergeRefs( [ ref, popupRef ] );
	const childArray = Children.toArray( children );
	const header = isDialogRegion( childArray[ 0 ], Header )
		? childArray[ 0 ]
		: null;
	const footer = isDialogRegion(
		childArray[ childArray.length - 1 ],
		Footer
	)
		? childArray[ childArray.length - 1 ]
		: null;
	const bodyStartIndex = header ? 1 : 0;
	const bodyEndIndex = footer ? -1 : undefined;
	const bodyChildren = childArray.slice( bodyStartIndex, bodyEndIndex );

	return (
		<_Dialog.Portal container={ container }>
			<_Dialog.Backdrop className={ styles.backdrop } />
			<ThemeProvider>
				<_Dialog.Popup
					ref={ mergedRef }
					className={ clsx(
						styles.popup,
						className,
						styles[ `is-${ size }` ]
					) }
					initialFocus={ resolvedInitialFocus }
					finalFocus={ finalFocus }
					{ ...props }
				>
					<DialogValidationProvider>
						{ header }
						<div className={ styles.body }>{ bodyChildren }</div>
						{ footer }
					</DialogValidationProvider>
				</_Dialog.Popup>
			</ThemeProvider>
		</_Dialog.Portal>
	);
} );

export { Popup };
