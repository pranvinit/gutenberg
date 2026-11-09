import type { FormEvent, KeyboardEvent, RefObject } from 'react';
import { forwardRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import deprecated from '@wordpress/deprecated';
import { Button } from '@wordpress/components';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { BACKSPACE } from '@wordpress/keycodes';
import { closeSmall } from '@wordpress/icons';
import { URLInput } from '../';
import LinkControlSearchResults from './search-results';
import { getVisualTypeName } from './search-item';
import { CREATE_TYPE } from './constants';
import useSearchHandler from './use-search-handler';
import type {
	LinkControlSearchInputProps,
	LinkControlSearchResultsProps,
	LinkControlSuggestion,
} from './types';
import type { URLInputSuggestionsProps } from '../url-input/types';

// Must be a function as otherwise URLInput will default
// to the fetchLinkSuggestions passed in block editor settings
// which will cause an unintended http request.
const noopSearchHandler = (): Promise< LinkControlSuggestion[] > =>
	Promise.resolve( [] );

const noop = () => {};

const LinkControlSearchInput = forwardRef<
	HTMLInputElement,
	LinkControlSearchInputProps
>(
	(
		{
			value,
			children,
			currentLink = {},
			className = null,
			placeholder = null,
			withCreateSuggestion = false,
			onCreateSuggestion = noop,
			onChange = noop,
			onSelect = noop,
			chosenSuggestion,
			onRemoveChosenSuggestion = noop,
			showSuggestions = true,
			renderSuggestions = ( props: LinkControlSearchResultsProps ) => (
				<LinkControlSearchResults { ...props } />
			),
			fetchSuggestions = null,
			allowDirectEntry = true,
			showInitialSuggestions = false,
			suggestionsQuery = {},
			transformSuggestions = null,
			createSuggestionButtonText,
			hideLabelFromVision = false,
			suffix,
			isEntity = false,
			customValidity: customValidityProp,
		},
		ref
	) => {
		const genericSearchHandler = useSearchHandler(
			suggestionsQuery,
			allowDirectEntry,
			withCreateSuggestion,
			transformSuggestions
		);

		const searchHandler = showSuggestions
			? fetchSuggestions || genericSearchHandler
			: noopSearchHandler;

		const [ focusedSuggestion, setFocusedSuggestion ] = useState<
			LinkControlSuggestion | undefined
		>();

		/**
		 * Handles the user moving between different suggestions. Does not handle
		 * choosing an individual item.
		 *
		 * @param selection  the url of the selected suggestion.
		 * @param suggestion the suggestion object.
		 */
		const onInputChange = (
			selection: string,
			suggestion?: LinkControlSuggestion
		) => {
			onChange( selection, suggestion );
			setFocusedSuggestion( suggestion );
		};

		const handleRenderSuggestions = ( props: URLInputSuggestionsProps ) =>
			renderSuggestions( {
				...props,
				withCreateSuggestion,
				createSuggestionButtonText,
				suggestionsQuery,
				handleSuggestionClick: (
					suggestion: LinkControlSuggestion
				) => {
					if ( props.handleSuggestionClick ) {
						props.handleSuggestionClick( suggestion );
					}
					onSuggestionSelected( suggestion );
				},
			} );

		const onSuggestionSelected = async (
			selectedSuggestion: LinkControlSuggestion
		) => {
			let suggestion: LinkControlSuggestion | void = selectedSuggestion;
			if ( CREATE_TYPE === selectedSuggestion.type ) {
				// Create a new page and call onSelect with the output from the onCreateSuggestion callback.
				try {
					suggestion = await onCreateSuggestion(
						selectedSuggestion.title
					);
					if ( suggestion?.url ) {
						onSelect( suggestion );
					}
				} catch {}
				return;
			}

			if (
				allowDirectEntry ||
				( suggestion && Object.keys( suggestion ).length >= 1 )
			) {
				// Strip out id, url, kind, and type from the current link to prevent
				// entity metadata from persisting when switching to a different link type.
				// For example, when changing from an entity link (kind: 'post-type', type: 'page')
				// to a custom URL (type: 'link', no kind), we need to ensure the old 'kind'
				// doesn't carry over. We do want to preserve other properties like title, though.
				const { id, url, kind, type, ...restLinkProps } =
					currentLink ?? {};
				onSelect(
					// Some direct entries don't have types or IDs, and we still need to clear the previous ones.
					{ ...restLinkProps, ...suggestion },
					suggestion
				);
			}
		};

		const _placeholder = placeholder ?? __( 'Search or type URL' );

		const chosenTitle = chosenSuggestion?.title
			? stripHTML( chosenSuggestion.title as string )
			: '';
		const chosenTypeName =
			chosenSuggestion && getVisualTypeName( chosenSuggestion );

		const label =
			hideLabelFromVision && placeholder !== ''
				? _placeholder
				: __( 'Link' );

		return (
			<div className="block-editor-link-control__search-input-container">
				{ /* Before the input, so Tab from the input still reaches Apply. */ }
				{ chosenSuggestion && (
					<div className="block-editor-link-control__chosen-suggestion">
						<span className="block-editor-link-control__chosen-suggestion-title">
							{ chosenTitle }
						</span>
						{ chosenTypeName && (
							<span className="block-editor-link-control__chosen-suggestion-type">
								{ chosenTypeName }
							</span>
						) }
						<Button
							size="small"
							icon={ closeSmall }
							label={ sprintf(
								/* translators: %s: The title of the selected page, post or term. */
								__( 'Remove %s' ),
								chosenTitle
							) }
							onClick={ onRemoveChosenSuggestion }
						/>
					</div>
				) }
				<URLInput
					disableSuggestions={ currentLink?.url === value }
					label={ label }
					hideLabelFromVision={ hideLabelFromVision }
					className={ className }
					value={ value }
					onChange={ onInputChange }
					placeholder={ _placeholder }
					__experimentalRenderSuggestions={
						showSuggestions ? handleRenderSuggestions : null
					}
					__experimentalFetchLinkSuggestions={ searchHandler }
					__experimentalHandleURLSuggestions
					__experimentalShowInitialSuggestions={
						showInitialSuggestions
					}
					customValidity={ customValidityProp }
					onKeyDown={ (
						event: KeyboardEvent< HTMLInputElement >
					) => {
						if ( chosenSuggestion && event.keyCode === BACKSPACE ) {
							event.preventDefault();
							onRemoveChosenSuggestion();
						}
					} }
					// Validation is handled manually via onSubmit and handleSubmit. We may be able to rely
					// on browser validation when enhancements land to base level components:
					// https://github.com/WordPress/gutenberg/pull/75188#issuecomment-3861757260
					required={ false }
					onSubmit={ (
						suggestion: LinkControlSuggestion | null,
						event: FormEvent | KeyboardEvent
					) => {
						const hasSuggestion = suggestion || focusedSuggestion;

						// If there is no suggestion and the value (ie: any manually entered URL) is empty
						// then don't allow submission otherwise we get empty links.
						if ( ! hasSuggestion && ! value?.trim()?.length ) {
							event.preventDefault();
						} else {
							onSuggestionSelected(
								hasSuggestion || { url: value }
							);
						}
					} }
					// LinkControl passes a ref object.
					inputRef={ ref as RefObject< HTMLInputElement | null > }
					suffix={ suffix }
					disabled={ isEntity }
				/>
				{ children }
			</div>
		);
	}
);

export default LinkControlSearchInput;

export const __experimentalLinkControlSearchInput = (
	props: LinkControlSearchInputProps
) => {
	deprecated( 'wp.blockEditor.__experimentalLinkControlSearchInput', {
		since: '6.8',
	} );

	return <LinkControlSearchInput { ...props } />;
};
