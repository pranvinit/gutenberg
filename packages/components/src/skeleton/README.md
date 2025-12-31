# Skeleton

A component used to indicate a loading state by displaying a placeholder that mimics the shape of the content being loaded.

Skeleton screens improve perceived performance by showing users a preview of the content layout before the actual content loads, reducing perceived wait times and providing a smoother loading experience.

## Usage

Basic usage:

```jsx
import { Skeleton } from '@wordpress/components';

function MyLoadingComponent() {
	return <Skeleton width="200px" height="24px" />;
}
```

You can create more complex loading layouts by combining multiple skeletons:

```jsx
import { Skeleton } from '@wordpress/components';

function PatternCardSkeleton() {
	return (
		<div className="pattern-card">
			<Skeleton width="100%" aspectRatio="16/9" borderRadius="medium" />
			<Skeleton width="60%" height="20px" />
			<Skeleton width="40%" height="16px" />
		</div>
	);
}
```

## Props

The component accepts the following props:

### `width`

The width of the skeleton. Accepts any valid CSS value (e.g., '100px', '50%', '10em').

-   Type: `string`
-   Required: No
-   Default: `'100%'`

### `height`

The height of the skeleton. Accepts any valid CSS value (e.g., '20px', '1em').
When `aspectRatio` is provided, height is calculated automatically.

-   Type: `string`
-   Required: No
-   Default: `'1em'`

### `borderRadius`

The border radius of the skeleton. Can be one of the preset values or a custom CSS value.

-   Type: `'none' | 'small' | 'medium' | 'large' | 'full' | string`
-   Required: No
-   Default: `'small'`

Preset values:
- `'none'`: No border radius
- `'small'`: Small border radius (default)
- `'medium'`: Medium border radius
- `'large'`: Large border radius
- `'full'`: Fully rounded (pill shape)

### `aspectRatio`

The aspect ratio of the skeleton. When provided, the height will be calculated based on the width. Accepts any valid CSS aspect-ratio value (e.g., '16/9', '1/1', '4/3').

-   Type: `string`
-   Required: No

### `className`

A CSS class to apply to the skeleton element.

-   Type: `string`
-   Required: No

## Accessibility

The skeleton component is marked with `aria-hidden="true"` as it's a purely decorative loading indicator. When using skeletons, ensure that:

1. Screen reader users are notified of the loading state through other means (e.g., `aria-busy` on a container or a visually hidden loading message using `Spinner`).
2. The loading state is temporary and will be replaced with actual content.

## Animation

The skeleton includes a shimmer animation that moves from left to right, creating a visual indication of loading. The animation respects the user's `prefers-reduced-motion` preference and will be disabled when reduced motion is preferred.
