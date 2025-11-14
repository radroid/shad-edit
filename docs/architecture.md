## Architecture Overview

`ShadE-it` is a TanStack Start application that turns shadcn/ui primitives into configurable design assets that engineering teams can remix. The experience is split across three pillars:

- **Catalog** – public, curated shadcn-based components stored in Convex `catalogComponents`.
- **Projects** – authenticated workspaces where teams clone catalog entries, apply theme tokens, and manage variants (`projectComponents`, `projectVariants`).
- **Marketplace** – first-touch discovery surface that blends catalog metadata with published project variants (`components`) and now serves as the default landing route for every user session.

### Entry Experience

- `/` redirects to `/marketplace`, ensuring guests immediately browse available components.
- Guest editors work entirely from the marketplace overlay—property edits persist to browser storage (`localStorage`) so sign-in is optional.
- Authenticated users can promote marketplace edits into their Convex-backed projects through the same overlay without losing in-progress changes.

### Frontend Layers

- `src/routes` uses TanStack Start file-based routing with nested routes under `marketplace/` and `projects/$projectId/…`.
- `src/components/marketplace` renders discovery UI, cards, overlays, and the guest editor surface with live previews.
- `src/components/editor` hosts the three-panel editor (canvas, property manager, asset selector) and now supports both guest (cache-backed) and project (Convex-backed) modes.
- `src/components/projects` contains theming helpers (`ProjectThemeProvider`, `ThemeEditor`).
- `src/components/ui` houses the shadcn/ui primitives that power both catalog entries and core UI.

### Data Flow

1. **Catalog ingestion** – Admins or automation call `convex/catalogComponents.addCatalogComponent` with code, Tailwind property metadata, default variants, and dependencies.
2. **Marketplace browse** – `marketplace/index.tsx` loads catalog entries through `useCatalogComponents` and renders previews via `src/lib/component-renderer.tsx`.
3. **Guest editing (optional)** – Selecting *Edit component* in the overlay spawns a cache-backed editing session:
   - Tailwind properties are extracted client-side via `property-extractor`.
   - Property changes persist to `localStorage` (`guestEdits`) and re-render instantly.
   - Guests may continue anonymously or sign in later to promote their edits.
4. **Project cloning** – Selecting *Use in project* (guest or authenticated) creates a Convex `projectComponents` record linked back to the catalog component ID and copies variant defaults. If the user previously edited the component as a guest, cached properties are migrated into the new project record.
5. **Editor session** – `/projects/:projectId/components/:componentId` loads:
   - Catalog config for structural metadata.
   - Project component for saved variant properties (or migrated guest edits).
   - Project theme for brand tokens.
   Property changes update Convex through debounced mutations, and the canvas regenerates code with `generateCodeWithTheme`.
6. **Publishing** – When an authenticated user publishes, Convex snapshots the themed JSX, persists variant metadata, and flags the component in `components` as public for marketplace reuse.

### Persistence Modes

- **Guest cache** – browser `localStorage` (namespaced by component ID) stores Tailwind property bags plus timestamp/version metadata. Used only on `/marketplace` guest sessions.
- **Convex** – authenticated sessions persist via `projectComponents`, `projects`, and related tables. Cache migrations clear the guest store after successful import so Convex stays authoritative.

### Convex Tables (Simplified)

| Table | Purpose |
| --- | --- |
| `catalogComponents` | Source-of-truth shadcn/ui configs used as templates. |
| `projectComponents` | A team’s instance of a catalog component plus variant state. |
| `projects` | Workspace metadata including brand tokens and theme preferences. |
| `components` | Published variants visible to the marketplace (`isPublic = true`). |
| `variants`, `variantVersions` | Historical snapshots for version diffing. |

### Support Libraries

- `src/lib/component-config.ts` – shared types for metadata, properties, and variant mappings.
- `src/lib/property-extractor.ts` – converts catalog configs into editor-ready structures and property definitions, aware of Tailwind utility mappings.
- `src/lib/tailwind-modifier.ts` – (new) adjusts Tailwind utility classes when properties change, shared across guest and project editors.
- `src/lib/catalog-hooks.ts` – Convex query hooks for catalog data.
- `src/lib/component-renderer.tsx` – deterministic renderer for shadcn/ui previews across marketplace, overlay, and editor.
- `src/lib/code-transformer.ts` – injects project theme tokens into generated code.

### Styling & Theming

- Tailwind CSS v4 powers utility styling; extend tokens in `src/styles.css`.
- `ProjectThemeProvider` bridges stored theme tokens with Tailwind contexts so previews and exported code stay synchronized.
- Editors avoid ad-hoc CSS files—compose from shadcn/ui primitives and Tailwind utilities.

### Operational Notes

- Prefer Convex hooks (`useQuery`, `useMutation`) in React components; loaders are reserved for server-only fetches.
- Keep catalog component definitions declarative—avoid embedding imperative code or external network requests inside catalog JSX.
- Guard mutations with auth checks (`ctx.auth.getUserIdentity()`) and ownership validation before writes.
- Store documentation and runbooks in `docs/` (this file) to keep the repository self-describing.


