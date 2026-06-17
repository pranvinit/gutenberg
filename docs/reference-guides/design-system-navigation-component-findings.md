# Design System Navigation Component Findings

Related issue: [Design System: Add a dedicated Navigation component #79154](https://github.com/WordPress/gutenberg/issues/79154)

## Summary

Several Gutenberg screens currently use tab components for navigation between routes, filters, or screens. This creates incorrect semantics because tabs are intended to switch between panels within the same page, while route navigation should be represented as links inside a navigation landmark.

The end-to-end solution should introduce a dedicated Navigation component, document when to use it instead of Tabs, and migrate existing route-changing tab usage to the new component.

## Problem

Tabs should generally produce a relationship between a tab list, tabs, and tab panels. In the affected Gutenberg screens, the tab UI is often used as a visual treatment for navigation instead:

- Selecting a tab calls route navigation.
- The URL or route changes.
- There is no corresponding tab panel relationship.
- Users cannot rely on normal link behavior such as opening in a new tab, copying a link, or seeing a destination URL.

This is both a semantic and usability issue. These controls should be rendered as links within a navigation landmark, with the current destination indicated by `aria-current`.

## Existing Relevant Components

The existing `@wordpress/ui` Tabs implementation is located in `packages/ui/src/tabs/`. It is a good reference for compound component structure, styling, stories, tests, and validation, but it should remain focused on real tabbed interfaces.

The existing `@wordpress/ui` Link component in `packages/ui/src/link/` is an important building block. It already supports router composition through a `render` prop and can be reused by a Navigation link primitive.

The `@wordpress/admin-ui` Breadcrumbs component in `packages/admin-ui/src/breadcrumbs/` is a useful pattern for composing `@wordpress/ui` primitives with `@wordpress/route`.

The `packages/boot/src/components/navigation/` implementation is app-specific navigation. It can provide visual and behavioral reference points, but it should not be treated as the reusable design-system API.

## Proposed Direction

Add a generic `Navigation` compound component to `@wordpress/ui`, then add an optional route-aware wrapper in `@wordpress/admin-ui`.

The `@wordpress/ui` component should stay router-agnostic. It should render semantic navigation markup and allow consumers to compose custom link implementations.

Example:

```tsx
import { Navigation } from '@wordpress/ui';

<Navigation.Root aria-label="Content type">
	<Navigation.List>
		<Navigation.Item>
			<Navigation.Link href="/patterns" aria-current="page">
				Patterns
			</Navigation.Link>
		</Navigation.Item>
		<Navigation.Item>
			<Navigation.Link href="/template-parts">
				Template parts
			</Navigation.Link>
		</Navigation.Item>
	</Navigation.List>
</Navigation.Root>;
```

The `@wordpress/admin-ui` wrapper can compose `@wordpress/ui` Navigation with `@wordpress/route` Link, similar to Breadcrumbs.

Example:

```tsx
import { Navigation } from '@wordpress/admin-ui';

<Navigation
	aria-label="Templates"
	items={ views.map( ( view ) => ( {
		label: view.label,
		to: view.path,
		icon: view.icon,
		isCurrent: view.slug === currentView,
	} ) ) }
/>;
```

## Package Changes

### `@wordpress/ui`

Add:

```text
packages/ui/src/navigation/
	index.ts
	root.tsx
	list.tsx
	item.tsx
	link.tsx
	types.ts
	style.module.css
	test/
	stories/
```

Update:

```text
packages/ui/src/index.ts
packages/ui/README.md
packages/ui/CHANGELOG.md
```

Suggested public API:

```tsx
Navigation.Root
Navigation.List
Navigation.Item
Navigation.Link
```

Recommended initial scope:

- Flat navigation lists.
- Horizontal and vertical orientation if the design treatment is clear.
- Active/current state through `aria-current`, not internal route matching.
- Optional icon rendering.
- Link composition through the existing `render` pattern used by `@wordpress/ui` Link.

Defer richer dropdown, flyout, nested, or disclosure navigation until a concrete use case requires it.

### `@wordpress/admin-ui`

Add:

```text
packages/admin-ui/src/navigation/
	index.tsx
	test/
```

Update:

```text
packages/admin-ui/src/index.ts
packages/admin-ui/README.md
packages/admin-ui/CHANGELOG.md
```

The admin wrapper should accept explicit item data and compose route links. A first version should avoid automatic route matching unless there is already a reliable route utility for the target screens.

## Base UI Considerations

The issue notes that Base UI provides a `NavigationMenu` component. Before building on it, verify the rendered semantics.

For ordinary route navigation, the expected semantics are:

```html
<nav aria-label="...">
	<ul>
		<li>
			<a href="..." aria-current="page">Current item</a>
		</li>
	</ul>
</nav>
```

Avoid introducing `menu` or `menuitem` roles for standard page navigation. If Base UI `NavigationMenu` is oriented toward composite menus or flyouts, a lightweight semantic wrapper around `nav`, `ul`, `li`, and `@wordpress/ui` Link may be the better first implementation.

## Migration Targets

The first migration should focus on places where tabs currently drive navigation without corresponding tab panels.

Likely targets:

```text
routes/post-list/stage.tsx
routes/pattern-list/stage.tsx
routes/template-part-list/stage.tsx
routes/template-list/stage-activation.tsx
routes/template-list/stage-legacy.tsx
```

For each migration:

- Replace `Tabs` with the new Navigation component.
- Replace `onSelect` navigation handlers with real route links.
- Preserve current route and query-string behavior.
- Preserve current active state.
- Preserve icons where they exist.
- Use `aria-current="page"` or another appropriate `aria-current` value on the active link.

Do not migrate true tabbed interfaces that include tab panels and do not change the URL.

## Documentation

Documentation should explicitly describe the difference between Navigation and Tabs:

- Use Navigation when an item changes the URL, route, location, entity list, or screen.
- Use Tabs when an item changes the visible panel within the same page.

Add Storybook examples for:

- Basic horizontal navigation.
- Vertical navigation, if supported.
- Navigation with icons.
- Navigation composed with a custom router link.
- Current item state with `aria-current`.

## Tests

### `@wordpress/ui`

Add unit tests that verify:

- `Navigation.Root` renders a `nav` landmark.
- `Navigation.List` and `Navigation.Item` render list semantics.
- `Navigation.Link` renders an anchor by default.
- The current item can be marked with `aria-current`.
- The `render` composition pattern works with custom link components.
- Icons do not replace or break the accessible name.
- Horizontal and vertical variants render the expected attributes or classes.

### `@wordpress/admin-ui`

Add unit tests similar to Breadcrumbs tests:

- Mock `@wordpress/route` Link.
- Verify item labels and destinations render.
- Verify the current item receives `aria-current`.
- Verify icons render when provided.
- Verify empty item lists render safely or return `null`, depending on the chosen API.

### Migrated Screens

Where nearby tests already exist, add focused coverage that verifies route links render with the expected destinations and active state. Avoid broad brittle end-to-end tests unless an existing test already covers the affected screen.

## Accessibility Requirements

- Render a named navigation landmark with `aria-label` or `aria-labelledby`.
- Use links for destinations.
- Use `aria-current` for the current destination.
- Do not use tab roles unless there are corresponding tab panels.
- Do not use menu roles for ordinary page navigation.
- Preserve visible focus styles.
- Ensure icons are decorative unless they are the only visible label, in which case an accessible label is required.

## Risks And Open Questions

- `Navigation` may be confused with the Navigation block. Package context should make this acceptable, but docs and examples should be clear.
- Base UI `NavigationMenu` may provide more behavior than needed for flat page navigation. Its semantics should be verified before adoption.
- Existing boot navigation is not a reusable design-system component. Migrating or replacing it should be a separate decision.
- The visual treatment needs design confirmation, especially for active state, orientation, and overflow.
- An ESLint rule could eventually discourage Tabs-as-navigation, but documentation should come first because reliable static detection may be difficult.

## Recommended Commit Breakdown

1. Add Navigation primitive to `@wordpress/ui`.
2. Add route-aware Navigation wrapper to `@wordpress/admin-ui`.
3. Replace route-changing Tabs with Navigation.
4. Document Navigation usage and add changelog entries.

## Implementation Checklist

- Confirm the desired component name and visual treatment with design-system maintainers.
- Verify Base UI `NavigationMenu` semantics against the required markup.
- Implement `@wordpress/ui` Navigation as a router-agnostic compound component.
- Implement `@wordpress/admin-ui` Navigation as a route-aware convenience wrapper.
- Add unit tests for both packages.
- Migrate the known route-changing Tabs usages.
- Add or update Storybook examples.
- Update package README and changelog files.
- Run targeted unit tests and any relevant linting for touched files.
