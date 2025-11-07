Component Marketplace Rules

Scope & Purpose
- This project is a TanStack Start + Convex app that lets design engineers create, customize, and ship shadcn/ui-derived components through a configuration-driven marketplace experience.
- Always preserve the distinction between internal app UI (`src/components/ui`) and customizable catalog components (`src/components/catalog`).

Catalog Component Guidelines
- Every catalog component lives in its own directory under `src/components/catalog/<component-id>/` with a `config.json` as the single source of truth.
- `config.json` must declare: `metadata`, `codeTemplate` with `{{placeholder}}` tokens, `properties`, `variableMappings`, and explicit `dependencies`.
- Use `{{propertyName}}` syntax inside `codeTemplate`. Never inline user-editable values directly in JSX.
- Keep component-specific docs or notes co-located (e.g. `README.md`) inside the component folder; global docs go under repo root docs.
- Avoid importing catalog component files directly from app routes—always load them through catalog loaders in `src/lib`.

Configuration & Property System
- Add or edit properties via the config file; do not hardcode property defaults in React components.
- Supported property types: `string`, `number`, `boolean`, `color`, `select`, `slider`, `textarea`. Custom editors must extend the property system before use.
- Variable mappings must clearly describe how each property value flows into the template (`style`, `attribute`, `content`, `className`). Keep mappings in sync with the template.

Auto-Discovery & Loading
- Rely on `autoRegisterCatalogComponents()` from `src/lib/catalog-loader.ts` for discovery; new components should require no manual import lists.
- Use loader helpers (`loadCatalogComponent`, `getAllCatalogComponents`) instead of reading the filesystem or Convex directly from React components.
- Preserve lazy-loading boundaries in routes; heavy processing should live in loaders or Convex functions.

Routing & Pages
- Marketplace surfaces live under `src/routes/marketplace/*`; editors under `src/routes/projects/$projectId/...`; docs under `src/routes/docs/$.tsx` using TanStack Start routing conventions.
- Use `createFileRoute` and keep route-specific loaders/components in the same file unless shared logic belongs in `src/lib`.

Convex Data Model
- Variants persist in Convex tables: `components`, `variants`, `variantVersions`. Keep schema changes consistent across mutations and queries.
- Publish flow must set `isPublic: true` and persist generated `config`/`publishedCode` snapshots; never mutate base catalog configs directly on publish.

Styling & Theming
- Tailwind CSS (v4) lives in `src/styles.css`; global additions belong there. Avoid scattering extra global stylesheets.
- Theme controls for previews belong in `src/components/projects` and should wrap previews with `ProjectThemeProvider`.

General Practices
- Favor TypeScript types from `src/lib/component-config.ts` when adding new configs or utilities.
- Keep editor-specific logic within `src/components/editor` and market presentation within `src/components/marketplace`.
- Add future enhancements (validation, search, previews) behind feature flags or isolated modules to keep the core flow stable.

