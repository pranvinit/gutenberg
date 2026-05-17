# Pattern content-only toggle demo

This local demo explores a UI entry point for [WordPress/gutenberg#77923](https://github.com/WordPress/gutenberg/issues/77923). It adds a session-level checkbox-style menu item under **Options > Tools**:

> Disable content-only editing for patterns

The menu item updates the existing `disableContentOnlyForUnsyncedPatterns` editor setting through `core/editor`. The block editor already consumes that setting when deriving editing modes, so this demo does not introduce new pattern-editing state.

## Local testing

1. Run `npm run wp-env status`.
2. Run `npm run wp-env start` only if the environment is not already running.
3. Run `npm start`.
4. Open the post editor or site editor.
5. Insert one or more unsynced patterns.
6. Open **Options > Tools** and toggle **Disable content-only editing for patterns**.
7. Confirm that unsynced patterns no longer start in content-only mode while the toggle is enabled.
8. Toggle the item off and confirm that the default content-only behavior returns.

## Unit test

Run:

```bash
npm run test:unit packages/editor/src/components/more-menu/test/pattern-content-only-toggle-menu-item.js
```

## Demo scope

This is intentionally a local implementation spike. The GitHub issue still needs design feedback on whether this control belongs in the More Tools menu, Preferences, List View, or another pattern-specific surface.
