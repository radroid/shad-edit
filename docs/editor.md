## Editor Experience

The editor now operates in two distinct modes:

- **Guest editor** – launched from the marketplace overlay, persists property changes to browser storage, and previews updates instantly without sign-in.
- **Project editor** – authenticated workspace at `/projects/:projectId/components/:componentId` that persists state to Convex and enables publishing.

Both modes share the same three-panel workspace for consistency.

### Layout

- **Header toolbar** – component name (inline rename), undo/redo, draft/save controls, variant selector, and publish call-to-action. Guest mode hides project-specific actions until a user signs in.
- **Canvas (center)** – renders the live shadcn/ui component using `ComponentPreview` with project theme tokens.
- **Property manager (right)** – contextual controls generated from catalog `tailwindProperties` and property extractor metadata.
- **Sidebar (left)** – shows other components in the project (`ComponentSelector`), including status pills and quick navigation.

The canvas can toggle between preview and code view and supports device presets to spot responsive issues early.

### Data & Persistence Sources

| Data | Guest Source | Authenticated Source | Purpose |
| --- | --- | --- | --- |
| Catalog config | Marketplace overlay query | `api.catalogComponents.getCatalogComponent` | Defines structure, default properties, variants |
| Component state | `guestEdits` namespace in `localStorage` | `api.projectComponents.getProjectComponent` | Stores Tailwind property overrides |
| Theme tokens | Marketplace theme defaults | `api.projects.getProject` | Supplies brand tokens consumed by `ProjectThemeProvider` |

- Guest property updates debounce into `localStorage` and trigger Tailwind modifier updates immediately.
- Authenticated property updates debounce through `projectComponents.updateComponentVariant`, ensuring fast UI feedback without flooding Convex.

### Property System

- `extractPropertiesFromConfig` transforms catalog metadata into editor-ready definitions. Each property becomes a key of the form `${elementId}.${propertyName}` to support multi-element components.
- `tailwind-modifier` translates property mutations into Tailwind utility class updates, preserving non-Tailwind styles and responsive variants.
- Supported control types include `string`, `select`, `color`, `boolean`, `slider`, and `textarea`. Extend via `PropertyManager.renderPropertyControl` when introducing new property types.
- Guest mode routes property updates through `useGuestEditor` (cache-backed), while project mode continues using Convex mutations.

### Auth & Guest Access

- Guests edit components in-place via the marketplace overlay; their work persists locally until cleared or promoted into a project.
- Signing in prompts guests to migrate cached edits into a new or existing project (`guest-cache.migrateGuestEditsToProject`).
- Authenticated users retain draft state automatically. Guard save/publish flows with `useConvexAuth()` checks before calling mutations. Guests see sign-in prompts when accessing project-only capabilities.

### Publishing Flow

1. Guest edits (optional) stay in browser cache until the user promotes them.
2. Project editors customize properties and save drafts (mutating `projectComponents`).
3. Publish triggers `components.publishComponent`, which:
   - Validates authorship.
   - Derives a catalog-safe `componentId` if needed.
   - Snapshots themed code into `components.publishedCode`.
   - Upserts `componentConfigs`/`catalogComponents` metadata for marketplace distribution.
4. Marketplace immediately reflects the change because the listing queries Convex in real time. Guest caches are cleared post-publish to prevent stale data.

### Extending the Editor

- Add new property controls by updating `PropertyManager` and `property-extractor.ts` together.
- Introduce new preview devices or breakpoints in `ComponentPreview` state.
- Theme editing lives in `ThemeEditor`; wire new tokens through `ProjectThemeProvider` so the canvas stays consistent.

### Testing Checklist

- Load editor with authenticated account: confirm sidebar, name editing, save/publish flows.
- Verify property updates persist across reloads and reflect in generated code view.
- Switch theme tokens in `ThemeEditor` and ensure the canvas + exported code update.
- Publish component and confirm it appears under `/marketplace` with themed preview.


