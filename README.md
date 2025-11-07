## ShadE-it

This repository powers a TanStack Start + Convex application that helps design engineers craft bespoke shadcn/ui-inspired components. Teams browse a catalog of configurable building blocks, tailor them with a visual property editor, and publish reusable variants directly into their projects.

### What You Can Do
- Explore a marketplace backed by Convex `catalogComponents`, each describing shadcn/ui code, editable Tailwind tokens, and variants.
- Customize theme tokens and interaction patterns in real time with the project editor and preview playgrounds.
- Persist private component variants or publish public templates through Convex-powered flows.
- Generate copy-pastable React code that stays aligned with shadcn/ui conventions and project branding.

## Tech Stack
- TanStack Start (React) for file-based routing and SSR.
- Convex for storing components, variants, and published code snapshots.
- Tailwind CSS v4 with shadcn/ui primitives for styling.
- TypeScript across the client, server, and configuration schemas.

## Getting Started

```bash
pnpm install
pnpm dev
```

The app runs on `http://localhost:3000` by default. The Convex dev server starts automatically; ensure you have the Convex CLI installed (`pnpm dlx convex dev`) if you need to run it separately.

### Useful Commands
- `pnpm dev` – start the Vite dev server.
- `pnpm build` – create a production bundle.
- `pnpm serve` – preview the production build locally.
- `pnpm test` – run the Vitest suite.

## Project Layout
- `src/components/ui` – shared shadcn/ui primitives used across catalog and app chrome.
- `src/components/marketplace` – marketplace listing, cards, and overlays.
- `src/components/editor` – canvas, selector, and property manager powering the customization experience.
- `src/components/projects` – project-level theming controls and providers.
- `src/components/kibo-ui` – experimental/partner integrations (code blocks, etc.).
- `src/lib` – catalog hooks, property extraction, preview renderer, and code transformers.
- `src/routes` – TanStack Start routes for marketing, marketplace, and project workflows.
- `convex` – queries, mutations, and schema for catalog, project, and published component data.

## Working With Catalog Components
1. Author a shadcn/ui code sample plus property metadata.
2. Call `api.catalogComponents.addCatalogComponent` (via Convex dashboard, script, or utility) to upsert the entry.
3. Visit `/marketplace` to browse or `/projects/:projectId/components/:componentId` to customize the component inside a project.
4. Publish variants to surface them in the marketplace as reusable templates.

See `docs/catalog-components.md` and `docs/architecture.md` for deeper details.

## Documentation
- `docs/architecture.md` – system architecture and data flow.
- `docs/catalog-components.md` – catalog ingestion and publishing workflow.
- `docs/editor.md` – project editor behavior and extension points.
- `docs/component-preview-system.md` – shared preview renderer internals.

## Contributing
- Follow the Cursor rules in `.cursor/rules/` to stay compliant with architecture conventions.
- Keep Tailwind extensions in `src/styles.css` and reuse shared primitives from `src/components/ui`.
- Add tests for new catalog or editor utilities when possible (`pnpm test`).

## License

This project is currently private for hackathon use. Clarify licensing before sharing outside your organization.
