export type SkeletonProps = {
	/**
	 * The width of the skeleton.
	 * Accepts any valid CSS value (e.g., '100px', '50%', '10em').
	 *
	 * @default '100%'
	 */
	width?: string;

	/**
	 * The height of the skeleton.
	 * Accepts any valid CSS value (e.g., '20px', '1em').
	 *
	 * @default '1em'
	 */
	height?: string;

	/**
	 * The border radius of the skeleton.
	 * Can be 'none', 'small', 'medium', 'large', 'full', or a custom CSS value.
	 *
	 * @default 'small'
	 */
	borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full' | string;

	/**
	 * The aspect ratio of the skeleton.
	 * When provided, the height will be calculated based on the width.
	 * Accepts any valid CSS aspect-ratio value (e.g., '16/9', '1/1', '4/3').
	 */
	aspectRatio?: string;

	/**
	 * A CSS class to apply to the skeleton element.
	 */
	className?: string;
};
