import type { NormalizedField, ViewTable } from '../../../types';
import getTableColumns from './get-table-columns';

/**
 * Returns the number of leading table cells to freeze for each row.
 *
 * The checkbox column is included when bulk actions are available, but it is
 * not a consumer-addressable field. The primary column represents the visible
 * title, media, and description fields as one cell.
 *
 * @param view             The table view.
 * @param fields           The normalized fields.
 * @param hasBulkActions   Whether the checkbox column is rendered.
 * @param hasPrimaryColumn Whether the primary column is rendered.
 * @return The number of leading cells to freeze.
 */
export default function getFrozenColumnCount< Item >(
	view: ViewTable,
	fields: NormalizedField< Item >[],
	hasBulkActions: boolean,
	hasPrimaryColumn: boolean
): number {
	const freezeUpTo = view.layout?.freezeUpTo;
	if ( ! freezeUpTo ) {
		return 0;
	}

	const primaryFieldIds = [
		view.showTitle !== false ? view.titleField : undefined,
		view.showMedia !== false ? view.mediaField : undefined,
		view.showDescription !== false ? view.descriptionField : undefined,
	].filter( Boolean );

	const leadingColumnCount = hasBulkActions ? 1 : 0;
	if ( hasPrimaryColumn && primaryFieldIds.includes( freezeUpTo ) ) {
		return leadingColumnCount + 1;
	}

	const columnIndex = getTableColumns( view, fields ).indexOf( freezeUpTo );
	if ( columnIndex === -1 ) {
		return 0;
	}

	return leadingColumnCount + ( hasPrimaryColumn ? 1 : 0 ) + columnIndex + 1;
}
