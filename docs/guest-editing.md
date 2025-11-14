## Guest Editing Runbook

This guide documents the cache-backed guest editing experience available from the marketplace overlay.

### Goals

- Provide a frictionless editing surface without requiring authentication.
- Persist in-progress work locally so guests can return later.
- Offer a seamless path to migrate edits into Convex-backed projects after sign-in.

### Storage Model

Guest edits live in `localStorage` under the `guestEdits` namespace.

```json
{
  "guestEdits": {
    "componentId": {
      "version": "1.0.0",
      "updatedAt": "2025-11-13T18:00:00.000Z",
      "properties": {
        "root.backgroundColor": "bg-slate-900",
        "button-0-0.variant": "outline"
      },
      "metadata": {
        "catalogComponentId": "floating-button",
        "tailwindHash": "abc123",
        "canvasView": "desktop"
      }
    }
  }
}
```

- `version` – schema version; increment when storage shape changes.
- `updatedAt` – ISO timestamp for stale cache pruning.
- `properties` – flat map of `${elementId}.${propertyName}` to raw values.
- `metadata` – optional additional state (preview device, selected variant, etc.).

### Cache Lifecycle

1. **Load** – `useGuestEditor` reads cached properties on mount and hydrates component state.
2. **Edit** – property changes debounce to both React state and `localStorage`.
3. **Preview** – Tailwind modifier rewrites JSX classes so the canvas updates instantly.
4. **Clear** – users can remove a single component edit or purge the entire cache.
5. **Promote** – on authentication, cached edits migrate to a Convex project and the cache entry is deleted.

### Sync Pathways

- **Anonymous to Authenticated**: After sign-in, prompt users to map cached edits to a new or existing project. The migration utility will:
  - Create (or update) a `projectComponents` record with cached properties.
  - Copy any metadata required by the property extractor.
  - Remove the local cache entry when migration succeeds.
- **Cache Refresh**: If the catalog component version changes, compare `tailwindHash` and prompt the user to reapply edits.

### Offline & Error Handling

- `localStorage` writes are wrapped in try/catch to surface quota or availability errors.
- Warn users if the browser is in private mode or storage is disabled.
- Display a toast if cache hydration fails and offer to reset the entry.

### Testing Checklist

1. Edit a component as a guest, reload the page, and confirm state persists.
2. Clear cache and verify the editor resets to catalog defaults.
3. Simulate quota errors (using devtools overrides) and ensure messaging is informative.
4. Sign in with cached edits and confirm successful migration to a project.

### Related Modules

- `src/hooks/useGuestEditor.ts` – orchestrates cache reads/writes and mutation debouncing.
- `src/lib/guest-cache.ts` – low-level storage helpers and migration utilities.
- `docs/editor.md` – describes dual-mode editor guidelines.
- `docs/architecture.md` – high-level overview of persistence flows.



