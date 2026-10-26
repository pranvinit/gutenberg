import type { MouseEventHandler } from 'react';
import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useContext, useMemo, useState } from '@wordpress/element';
import { moreVertical } from '@wordpress/icons';
import { useRegistry } from '@wordpress/data';
import { useViewportMatch } from '@wordpress/compose';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
	Stack,
} from '@wordpress/ui';
import { kebabCase } from '@wordpress/kebab-case';
import DataViewsContext from '../dataviews-context';
import type { Action, ActionModal as ActionModalType } from '../../types';

export interface ActionTriggerProps< Item > {
	action: Action< Item >;
	onClick: MouseEventHandler;
	isBusy?: boolean;
	items: Item[];
	variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
}

const FOCUS_FALLBACK_SELECTOR = [
	'.dataviews-layout__container input:not([disabled])',
	'.dataviews-layout__container button:not([disabled])',
	'.dataviews-layout__container [tabindex="0"]',
	'.dataviews-bulk-actions input:not([disabled])',
].join( ',' );

export interface ActionModalProps< Item > {
	action: ActionModalType< Item >;
	items: Item[];
	closeModal: () => void;
}

interface ActionsMenuGroupProps< Item > {
	actions: Action< Item >[];
	item: Item;
	registry: ReturnType< typeof useRegistry >;
	setActiveModalAction: ( action: ActionModalType< Item > | null ) => void;
}

interface ItemActionsProps< Item > {
	item: Item;
	actions: Action< Item >[];
	isCompact?: boolean;
}

interface CompactItemActionsProps< Item > {
	item: Item;
	actions: Action< Item >[];
	isSmall?: boolean;
	registry: ReturnType< typeof useRegistry >;
}

interface PrimaryActionsProps< Item > {
	item: Item;
	actions: Action< Item >[];
	registry: ReturnType< typeof useRegistry >;
	buttonVariant?: 'primary' | 'secondary' | 'tertiary' | 'link';
}

function ButtonTrigger< Item >( {
	action,
	onClick,
	items,
	variant,
}: ActionTriggerProps< Item > ) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	return (
		<Button
			disabled={ !! action.disabled }
			accessibleWhenDisabled
			size="compact"
			variant={ variant }
			onClick={ onClick }
			aria-haspopup={ 'RenderModal' in action ? 'dialog' : undefined }
		>
			{ label }
		</Button>
	);
}

function MenuItemTrigger< Item >( {
	action,
	onClick,
	items,
}: ActionTriggerProps< Item > ) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	return (
		<Menu.Item
			disabled={ action.disabled }
			onClick={ onClick }
			aria-haspopup={ 'RenderModal' in action ? 'dialog' : undefined }
		>
			<Menu.ItemLabel>{ label }</Menu.ItemLabel>
		</Menu.Item>
	);
}

export function ActionModal< Item >( {
	action,
	items,
	closeModal,
}: ActionModalProps< Item > ) {
	const { containerRef } = useContext( DataViewsContext );
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );

	// The modal returns focus to its trigger when it closes. When the action
	// removes the item (e.g. moving it to the trash), the trigger is gone and
	// focus falls back to the document body, so move it into the view instead.
	const closeModalAndRestoreFocus = useCallback( () => {
		closeModal();
		const container = containerRef.current;
		if ( ! container ) {
			return;
		}
		const { ownerDocument } = container;
		ownerDocument.defaultView?.requestAnimationFrame( () => {
			const { activeElement } = ownerDocument;
			if ( activeElement && activeElement !== ownerDocument.body ) {
				return;
			}
			const wrapper =
				container.closest< HTMLElement >( '.dataviews-wrapper' ) ??
				container;
			wrapper
				.querySelector< HTMLElement >( FOCUS_FALLBACK_SELECTOR )
				?.focus();
		} );
	}, [ closeModal, containerRef ] );

	const modalHeader =
		typeof action.modalHeader === 'function'
			? action.modalHeader( items )
			: action.modalHeader;
	return (
		<Modal
			title={ modalHeader || label }
			__experimentalHideHeader={ !! action.hideModalHeader }
			onRequestClose={ closeModalAndRestoreFocus }
			focusOnMount={ action.modalFocusOnMount ?? true }
			size={ action.modalSize || 'medium' }
			overlayClassName={ `dataviews-action-modal dataviews-action-modal__${ kebabCase(
				action.id
			) }` }
		>
			<action.RenderModal
				items={ items }
				closeModal={ closeModalAndRestoreFocus }
			/>
		</Modal>
	);
}

export function ActionsMenuGroup< Item >( {
	actions,
	item,
	registry,
	setActiveModalAction,
}: ActionsMenuGroupProps< Item > ) {
	const { primaryActions, regularActions } = useMemo( () => {
		return actions.reduce(
			( acc, action ) => {
				( action.isPrimary
					? acc.primaryActions
					: acc.regularActions
				).push( action );
				return acc;
			},
			{
				primaryActions: [] as Action< Item >[],
				regularActions: [] as Action< Item >[],
			}
		);
	}, [ actions ] );

	const renderActionGroup = ( actionList: Action< Item >[] ) =>
		actionList.map( ( action ) => (
			<MenuItemTrigger
				key={ action.id }
				action={ action }
				onClick={ () => {
					if ( 'RenderModal' in action ) {
						setActiveModalAction( action );
						return;
					}
					action.callback( [ item ], { registry } );
				} }
				items={ [ item ] }
			/>
		) );

	return (
		<Menu.Group>
			{ renderActionGroup( primaryActions ) }
			{ renderActionGroup( regularActions ) }
		</Menu.Group>
	);
}

export default function ItemActions< Item >( {
	item,
	actions,
	isCompact,
}: ItemActionsProps< Item > ) {
	const registry = useRegistry();
	const { primaryActions, eligibleActions } = useMemo( () => {
		// If an action is eligible for all items, doesn't need
		// to provide the `isEligible` function.
		const _eligibleActions = actions.filter(
			( action ) => ! action.isEligible || action.isEligible( item )
		);
		const _primaryActions = _eligibleActions.filter(
			( action ) => action.isPrimary
		);
		return {
			primaryActions: _primaryActions,
			eligibleActions: _eligibleActions,
		};
	}, [ actions, item ] );

	const isMobileViewport = useViewportMatch( 'medium', '<' );

	if ( isCompact ) {
		return (
			<CompactItemActions
				item={ item }
				actions={ eligibleActions }
				isSmall
				registry={ registry }
			/>
		);
	}

	return (
		<Stack
			direction="row"
			justify="flex-end"
			className="dataviews-item-actions"
			style={ {
				flexShrink: 0,
				width: 'auto',
			} }
		>
			<PrimaryActions
				item={ item }
				actions={ primaryActions }
				registry={ registry }
			/>
			{ ( primaryActions.length < eligibleActions.length ||
				// Since we hide primary actions on mobile, we need to show the menu
				// there if there are any actions at all.
				isMobileViewport ) && (
				<CompactItemActions
					item={ item }
					actions={ eligibleActions }
					registry={ registry }
				/>
			) }
		</Stack>
	);
}

function CompactItemActions< Item >( {
	item,
	actions,
	isSmall,
	registry,
}: CompactItemActionsProps< Item > ) {
	const [ activeModalAction, setActiveModalAction ] = useState(
		null as ActionModalType< Item > | null
	);
	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					disabled={ ! actions.length }
					render={
						<Button
							size={ isSmall ? 'small' : 'compact' }
							icon={ moreVertical }
							label={ __( 'Actions' ) }
							accessibleWhenDisabled
							className="dataviews-all-actions-button"
						/>
					}
				/>
				<Menu.Popup positioner={ <Menu.Positioner align="end" /> }>
					<ActionsMenuGroup
						actions={ actions }
						item={ item }
						registry={ registry }
						setActiveModalAction={ setActiveModalAction }
					/>
				</Menu.Popup>
			</Menu.Root>
			{ !! activeModalAction && (
				<ActionModal
					action={ activeModalAction }
					items={ [ item ] }
					closeModal={ () => setActiveModalAction( null ) }
				/>
			) }
		</>
	);
}

export function PrimaryActions< Item >( {
	item,
	actions,
	registry,
	buttonVariant,
}: PrimaryActionsProps< Item > ) {
	const [ activeModalAction, setActiveModalAction ] = useState( null as any );
	const isMobileViewport = useViewportMatch( 'medium', '<' );

	if ( isMobileViewport ) {
		return null;
	}

	if ( ! Array.isArray( actions ) || actions.length === 0 ) {
		return null;
	}
	return (
		<>
			{ actions.map( ( action ) => (
				<ButtonTrigger
					key={ action.id }
					action={ action }
					onClick={ () => {
						if ( 'RenderModal' in action ) {
							setActiveModalAction( action );
							return;
						}
						action.callback( [ item ], { registry } );
					} }
					items={ [ item ] }
					variant={ buttonVariant }
				/>
			) ) }
			{ !! activeModalAction && (
				<ActionModal
					action={ activeModalAction }
					items={ [ item ] }
					closeModal={ () => setActiveModalAction( null ) }
				/>
			) }
		</>
	);
}
