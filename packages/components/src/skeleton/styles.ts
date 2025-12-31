/**
 * External dependencies
 */
import styled from '@emotion/styled';
import { css, keyframes } from '@emotion/react';

/**
 * Internal dependencies
 */
import { COLORS, CONFIG } from '../utils';
import type { SkeletonProps } from './types';

const shimmer = keyframes( {
	'0%': {
		backgroundPosition: '-200% 0',
	},
	'100%': {
		backgroundPosition: '200% 0',
	},
} );

const BORDER_RADIUS_MAP: Record< string, string > = {
	none: '0',
	small: CONFIG.radiusSmall,
	medium: CONFIG.radiusMedium,
	large: CONFIG.radiusLarge,
	full: CONFIG.radiusFull,
};

function getBorderRadius( borderRadius: SkeletonProps[ 'borderRadius' ] ) {
	if ( ! borderRadius ) {
		return BORDER_RADIUS_MAP.small;
	}

	return BORDER_RADIUS_MAP[ borderRadius ] ?? borderRadius;
}

export const SkeletonElement = styled.div< {
	skeletonWidth: SkeletonProps[ 'width' ];
	skeletonHeight: SkeletonProps[ 'height' ];
	skeletonBorderRadius: SkeletonProps[ 'borderRadius' ];
	skeletonAspectRatio: SkeletonProps[ 'aspectRatio' ];
} >`
	display: block;
	width: ${ ( { skeletonWidth } ) => skeletonWidth ?? '100%' };
	height: ${ ( { skeletonHeight, skeletonAspectRatio } ) =>
		skeletonAspectRatio ? 'auto' : skeletonHeight ?? '1em' };
	${ ( { skeletonAspectRatio } ) =>
		skeletonAspectRatio &&
		css`
			aspect-ratio: ${ skeletonAspectRatio };
		` }
	border-radius: ${ ( { skeletonBorderRadius } ) =>
		getBorderRadius( skeletonBorderRadius ) };

	/* Base background color */
	background-color: color-mix(
		in srgb,
		${ COLORS.theme.foreground },
		transparent 90%
	);

	/* Shimmer animation gradient */
	background-image: linear-gradient(
		90deg,
		transparent 0%,
		color-mix( in srgb, ${ COLORS.theme.foreground }, transparent 85% ) 50%,
		transparent 100%
	);
	background-size: 200% 100%;
	background-repeat: no-repeat;

	animation: ${ shimmer } 1.5s ease-in-out infinite;

	/* Windows high contrast mode support */
	outline: 2px solid transparent;
	outline-offset: 2px;

	/* Reduced motion preference */
	@media ( prefers-reduced-motion: reduce ) {
		animation: none;
		background-image: none;
	}
`;
