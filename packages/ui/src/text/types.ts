import { type ComponentProps } from '../utils/types';

export interface TextProps extends ComponentProps< 'span' > {
	/**
	 * Enables single-line truncation with an ellipsis when the content
	 * overflows its container.
	 *
	 * @default false
	 */
	truncate?: boolean;

	/**
	 * Limits the rendered content to a maximum number of lines.
	 *
	 * When provided with a value greater than `0`, line clamping is enabled
	 * even if `truncate` is not set.
	 */
	numberOfLines?: number;

	/**
	 * The typographic variant to apply, controlling font family, size,
	 * line height, and weight.
	 *
	 * @default "body-md"
	 */
	variant?:
		| 'heading-2xl'
		| 'heading-xl'
		| 'heading-lg'
		| 'heading-md'
		| 'heading-sm'
		| 'body-xl'
		| 'body-lg'
		| 'body-md'
		| 'body-sm';

	/**
	 * The content to be rendered inside the component.
	 */
	children?: React.ReactNode;
}
