# Widget host

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A widget renders inside a host, and the host inside an application. Some of what an affordance needs, only the application knows: which router owns a URL, for one. `WidgetHostProvider` and `useWidgetHost` are that seam.

![A widget declares a link action as a portable URL. The host renders the widget and materializes the affordance. The application owns the router and provides the links capability through the seam: match recognizes its own routes, Link is its router's primitive. On a match the host mounts the route link; without the capability the same declaration mounts a plain anchor.](./assets/widget-host-seam.svg)

## Contract

`WidgetHost` is a bag of optional capabilities. An absent capability degrades to the host-agnostic behavior. `HostLink` handles that fallback for link materialization; consumers reading a capability directly still guard it.

The provider merges its value over the inherited one, so an application can mount a base host once and layer capabilities per subtree. Reading without any provider yields `{}`.

The provider belongs to the application layer, wrapping the dashboard or whatever surface renders widgets. The rendering engine never mounts one for itself, and keeps no dependency on the application's router.

## The `links` capability

```ts
links: {
	match: ( href: string ) => string | null;
	// The router's link primitive. Must render a real anchor and
	// forward `ref` to it. `path` replaces `href`.
	Link: ComponentType<
		{ path: string } & Omit< ComponentPropsWithoutRef< 'a' >, 'href' > &
			RefAttributes< HTMLAnchorElement >
	>;
}
```

`match` answers one question: does this href target one of the application's own routes? On a hit it returns the in-app route, `'/sales?by=day'`, path and query as the router takes them. `HostLink` mounts `Link` with that path, so the navigation is client-side; on `null` it falls back to a plain anchor.

The action declaration does not change either way. A widget declares the portable URL of its target, `admin.php?page=analytics&p=%2Fsales%3Fby%3Dday`, the route encoded inside `p` with its query; in the owning application that materializes as a router link, everywhere else as a plain anchor that full-loads to the same place. Recognition is the application's: reachability depends on the routes it registered, which change per application and over time.

The caller decides which navigations to offer to `HostLink`. The dashboard chrome keeps `download` and `openInNewTab` actions as plain anchors: both mean a new document, so a router link buys nothing. `match` remains available to consumers that need to know whether the host owns a target before they render it.

## Consuming it

`HostLink` takes a required `href` plus native anchor props and forwards its ref to whichever anchor it renders. It has no UI dependency. Compose it through the render prop of the link primitive that owns the presentation:

```tsx
<Link render={ <HostLink href={ href } /> }>View report</Link>
```

Without a provider, or when `match` returns `null`, the same component renders `<a href={ href }>`. Consumers do not branch on the capability for ordinary links.

## Providing it

A route that renders the dashboard supplies its matcher and its router's link. The value's identity drives the provider's memoized merge, so keep it stable: a module constant when it is static, `useMemo` when it derives from component state:

```tsx
const host: WidgetHost = {
	links: { match: matchDashboardHref, Link: RouteLink },
};

<WidgetHostProvider value={ host }>
	<WidgetDashboard { ...props } />
</WidgetHostProvider>;
```

### `Link` and its ref

Consumers compose `HostLink` into menu items and tooltip triggers through render props, and both reach the resulting anchor through the ref. The host's `Link` must pass that ref to its anchor: a link that drops it satisfies the type and fails in use, because keyboard navigation skips the menu item and the tooltip loses its anchor. Under React 18 that means `forwardRef`; under React 19, where `ref` arrives as a prop, spreading the props onto the anchor is enough.

Tests pin the ref through both the matched host link and the plain-anchor fallback:

```tsx
const ref = createRef< HTMLAnchorElement >();
render(
	<WidgetHostProvider value={ host }>
		<HostLink ref={ ref } href="admin.php?page=dashboard&p=/reports">
			Reports
		</HostLink>
	</WidgetHostProvider>
);

expect( ref.current ).toBe( screen.getByRole( 'link', { name: 'Reports' } ) );
```

See the Actions page for the materialization rules this serves: the widget declares where to go, the host decides how to get there.
