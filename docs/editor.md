## Editor Experience

The project editor lives at `/projects/:projectId/components/:componentId` and provides a three-panel workspace for customizing catalog components per project.

### Layout

- **Header toolbar** – component name (inline rename), undo/redo, draft/save controls, variant selector, and publish call-to-action.
- **Canvas (center)** – renders the live shadcn/ui component using `ComponentPreview` with project theme tokens.
- **Property manager (right)** – contextual controls generated from catalog `tailwindProperties` and property extractor metadata.
- **Sidebar (left)** – shows other components in the project (`ComponentSelector`), including status pills and quick navigation.

The canvas can toggle between preview and code view and supports device presets to spot responsive issues early.

### Data Sources

| Data | Source | Purpose |
| --- | --- | --- |
| Catalog config | `api.catalogComponents.getCatalogComponent` | Defines structure, default properties, variants |
| Project component | `api.projectComponents.getProjectComponent` | Stores saved overrides (`variantProperties`) |
| Project theme | `api.projects.getProject` | Supplies brand tokens consumed by `ProjectThemeProvider` |

Property updates debounce through `projectComponents.updateComponentVariant`, ensuring fast UI feedback without flooding Convex.

### Property System

`extractPropertiesFromConfig` transforms catalog metadata into editor-ready definitions. Each property becomes a key of the form `${elementId}.${propertyName}` to support multi-element components. Supported control types include `string`, `select`, `color`, `boolean`, and `slider`. Extend via `PropertyManager.renderPropertyControl` when introducing new property types.

### Auth & Guest Access

- Unauthenticated users can browse projects but cannot load project-bound editors. Add onboarding experiences via marketplace overlays instead.
- Authenticated users retain draft state automatically. Guard save/publish flows with `useConvexAuth()` checks before calling mutations.

### Publishing Flow

1. User customizes properties and saves a draft (mutating `projectComponents`).
2. Publish triggers `components.publishComponent`, which:
   - Validates authorship.
   - Derives a catalog-safe `componentId` if needed.
   - Snapshots themed code into `components.publishedCode`.
   - Upserts `componentConfigs`/`catalogComponents` metadata for marketplace distribution.
3. Marketplace immediately reflects the change because the listing queries Convex in real time.

### Extending the Editor

- Add new property controls by updating `PropertyManager` and `property-extractor.ts` together.
- Introduce new preview devices or breakpoints in `ComponentPreview` state.
- Theme editing lives in `ThemeEditor`; wire new tokens through `ProjectThemeProvider` so the canvas stays consistent.

### Testing Checklist

- Load editor with authenticated account: confirm sidebar, name editing, save/publish flows.
- Verify property updates persist across reloads and reflect in generated code view.
- Switch theme tokens in `ThemeEditor` and ensure the canvas + exported code update.
- Publish component and confirm it appears under `/marketplace` with themed preview.

