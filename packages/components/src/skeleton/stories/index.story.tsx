/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Skeleton } from '..';
import { VStack } from '../../v-stack';
import { HStack } from '../../h-stack';

const meta: Meta< typeof Skeleton > = {
	component: Skeleton,
	title: 'Components/Feedback/Skeleton',
	id: 'components-skeleton',
	argTypes: {
		width: { control: { type: 'text' } },
		height: { control: { type: 'text' } },
		borderRadius: {
			control: { type: 'select' },
			options: [ 'none', 'small', 'medium', 'large', 'full' ],
		},
		aspectRatio: { control: { type: 'text' } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof Skeleton > = ( { ...args } ) => {
	return <Skeleton { ...args } />;
};

export const Default: StoryFn< typeof Skeleton > = Template.bind( {} );
Default.args = {
	width: '200px',
	height: '20px',
};

/**
 * Text skeleton that mimics a paragraph of text.
 */
export const TextSkeleton: StoryFn< typeof Skeleton > = () => {
	return (
		<VStack spacing={ 2 } style={ { width: '300px' } }>
			<Skeleton width="100%" height="16px" />
			<Skeleton width="90%" height="16px" />
			<Skeleton width="75%" height="16px" />
		</VStack>
	);
};

/**
 * Pattern card skeleton that mimics the layout of a pattern card.
 */
export const PatternCardSkeleton: StoryFn< typeof Skeleton > = () => {
	return (
		<VStack
			spacing={ 3 }
			style={ {
				width: '280px',
				padding: '12px',
				border: '1px solid #ddd',
				borderRadius: '8px',
			} }
		>
			<Skeleton width="100%" aspectRatio="16/9" borderRadius="medium" />
			<Skeleton width="70%" height="20px" />
			<Skeleton width="50%" height="14px" />
		</VStack>
	);
};

/**
 * Avatar skeleton with a circular shape.
 */
export const AvatarSkeleton: StoryFn< typeof Skeleton > = () => {
	return (
		<HStack spacing={ 3 } alignment="center">
			<Skeleton width="48px" height="48px" borderRadius="full" />
			<VStack spacing={ 2 }>
				<Skeleton width="120px" height="16px" />
				<Skeleton width="80px" height="12px" />
			</VStack>
		</HStack>
	);
};

/**
 * Grid of pattern card skeletons mimicking a pattern inserter loading state.
 */
export const PatternGridSkeleton: StoryFn< typeof Skeleton > = () => {
	return (
		<div
			style={ {
				display: 'grid',
				gridTemplateColumns: 'repeat(3, 1fr)',
				gap: '16px',
				padding: '16px',
			} }
		>
			{ Array.from( { length: 6 } ).map( ( _, index ) => (
				<VStack
					key={ index }
					spacing={ 2 }
					style={ {
						padding: '8px',
						border: '1px solid #ddd',
						borderRadius: '8px',
					} }
				>
					<Skeleton
						width="100%"
						aspectRatio="4/3"
						borderRadius="small"
					/>
					<Skeleton width="80%" height="14px" />
				</VStack>
			) ) }
		</div>
	);
};

/**
 * DataViews row skeleton mimicking a table row loading state.
 */
export const DataViewsRowSkeleton: StoryFn< typeof Skeleton > = () => {
	return (
		<VStack spacing={ 0 }>
			{ Array.from( { length: 5 } ).map( ( _, index ) => (
				<HStack
					key={ index }
					spacing={ 4 }
					style={ {
						padding: '12px 16px',
						borderBottom: '1px solid #ddd',
					} }
				>
					<Skeleton width="32px" height="32px" borderRadius="small" />
					<Skeleton width="200px" height="16px" />
					<Skeleton width="100px" height="16px" />
					<Skeleton width="80px" height="16px" />
				</HStack>
			) ) }
		</VStack>
	);
};

/**
 * Different border radius options.
 */
export const BorderRadiusVariants: StoryFn< typeof Skeleton > = () => {
	return (
		<HStack spacing={ 4 } alignment="center">
			<VStack spacing={ 1 } alignment="center">
				<Skeleton width="60px" height="60px" borderRadius="none" />
				<span style={ { fontSize: '12px' } }>none</span>
			</VStack>
			<VStack spacing={ 1 } alignment="center">
				<Skeleton width="60px" height="60px" borderRadius="small" />
				<span style={ { fontSize: '12px' } }>small</span>
			</VStack>
			<VStack spacing={ 1 } alignment="center">
				<Skeleton width="60px" height="60px" borderRadius="medium" />
				<span style={ { fontSize: '12px' } }>medium</span>
			</VStack>
			<VStack spacing={ 1 } alignment="center">
				<Skeleton width="60px" height="60px" borderRadius="large" />
				<span style={ { fontSize: '12px' } }>large</span>
			</VStack>
			<VStack spacing={ 1 } alignment="center">
				<Skeleton width="60px" height="60px" borderRadius="full" />
				<span style={ { fontSize: '12px' } }>full</span>
			</VStack>
		</HStack>
	);
};
