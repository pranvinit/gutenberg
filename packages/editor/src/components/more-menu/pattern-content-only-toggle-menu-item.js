/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { check } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PatternContentOnlyToggleMenuItem( { onClose } ) {
	const disableContentOnlyForUnsyncedPatterns = useSelect(
		( select ) =>
			!! select( editorStore ).getEditorSettings()
				.disableContentOnlyForUnsyncedPatterns,
		[]
	);
	const { updateEditorSettings } = useDispatch( editorStore );

	return (
		<MenuItem
			icon={ disableContentOnlyForUnsyncedPatterns ? check : undefined }
			isSelected={ disableContentOnlyForUnsyncedPatterns }
			role="menuitemcheckbox"
			onClick={ () => {
				updateEditorSettings( {
					disableContentOnlyForUnsyncedPatterns:
						! disableContentOnlyForUnsyncedPatterns,
				} );
				onClose?.();
			} }
		>
			{ __( 'Disable content-only editing for patterns' ) }
		</MenuItem>
	);
}
