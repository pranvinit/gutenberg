/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SkeletonElement } from './styles';
import type { SkeletonProps } from './types';
import type { WordPressComponentProps } from '../context';

function UnforwardedSkeleton(
	props: WordPressComponentProps< SkeletonProps, 'div', false >,
	ref: ForwardedRef< HTMLDivElement >
) {
	const {
		className,
		width,
		height,
		borderRadius = 'small',
		aspectRatio,
		...additionalProps
	} = props;

	return (
		<SkeletonElement
			className={ clsx( 'components-skeleton', className ) }
			skeletonWidth={ width }
			skeletonHeight={ height }
			skeletonBorderRadius={ borderRadius }
			skeletonAspectRatio={ aspectRatio }
			aria-hidden="true"
			ref={ ref }
			{ ...additionalProps }
		/>
	);
}

/**
 * `Skeleton` is a component used to indicate a loading state by displaying
 * a placeholder that mimics the shape of the content being loaded.
 *
 * Skeleton screens improve perceived performance by showing users a preview
 * of the content layout before the actual content loads, reducing perceived
 * wait times and providing a smoother loading experience.
 *
 * ```jsx
 * import { Skeleton } from '@wordpress/components';
 *
 * function MyLoadingComponent() {
 *   return (
 *     <div>
 *       <Skeleton width="200px" height="24px" />
 *       <Skeleton width="100%" height="16px" />
 *       <Skeleton width="80%" height="16px" />
 *     </div>
 *   );
 * }
 * ```
 */
export const Skeleton = forwardRef( UnforwardedSkeleton );

export default Skeleton;
