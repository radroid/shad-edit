## Catalog Component Workflow

This guide explains how curated shadcn/ui components flow from the catalog into projects, the guest editor, and the marketplace.

### 1. Compose a Catalog Entry

Catalog components live entirely in Convex (`catalogComponents` table). Each entry should include:

- `componentId` – kebab-case identifier (`floating-button`, `marketing-hero`).
- `code` – JSX/TSX built from shadcn/ui primitives and Tailwind utilities.
- `tailwindProperties` – array of editable tokens exposed in the ShadE-it editor. Each item matches the shape used in `convex/catalogComponents.addCatalogComponent` (name, label, type, defaultValue, options, category, description) and should map directly to Tailwind utilities or known CSS variables.
- `propSections` – optional semantic groups (variants, sizes, header slots, etc.). When omitted, the importer derives sections automatically, but explicitly providing them yields better accordion titles and warnings.
- `variants` – optional presets with `name`, `description`, and `properties` payloads that map to property names.
- `dependencies` / `files` – any supporting imports or usage snippets.

Authoring tips:
- Use semantic property names (`backgroundColor`, `headline`) and provide defaults. Include `elementId` references when a property targets a specific node so the extractor can namespace keys as `${elementId}.${property}`.
- Keep variant names short (`default`, `secondary`, `ghost`).
- Ensure the code sample imports from `@/components/ui/*` so the editor and exported code share primitives.
- Prefer Tailwind utilities over inline styles; the Tailwind modifier can only reason about classes it recognizes.
- Document responsive or state-specific classes (e.g., `md:flex`, `hover:bg-primary/80`) inside `tailwindProperties.metadata.responsive` to help the modifier avoid collisions.

### 2. Add or Update via Convex

In most cases you can open the marketplace **Add Component** dialog, follow the shadcn/ui “Manual install” wizard, and paste the generated code. The importer (`importComponentFromCode`) AST-parses the snippet, infers prop sections, detects CVA variants, and persists the config straight into Convex—no scraping or command-line tooling required.

For scripted migrations or CI, use one of the following approaches:

```ts
import { useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'

const addCatalogComponent = useMutation(api.catalogComponents.addCatalogComponent)

await addCatalogComponent({
  componentId: 'floating-button',
  name: 'Floating Action Button',
  description: 'Call-to-action blob with icon + label',
  category: 'Actions',
  version: '1.0.0',
  code,
  tailwindProperties,
  variants,
  dependencies,
  files,
})
```

- **Convex dashboard** – call the mutation manually when testing.
- **Seed script** – automate large imports by iterating over local config files or JSON payloads.

The mutation upserts by `componentId`, so re-running the same payload updates existing entries.

### 3. Guest Editing & Cache Compatibility

- When the marketplace overlay loads a component, it hydrates from `tailwindProperties` and stores guest edits in `localStorage`.
- Ensure default variant data is serializable; avoid functions or non-JSON values.
- Provide conservative defaults so guest previews look complete without project themes.

### 4. Clone into a Project

When a user elects to use a catalog component, Convex creates a `projectComponents` record:

- `catalogComponentId` links back to the source catalog entry.
- `variantProperties` stores custom property overrides per project.
- `selectedVariant` tracks variant choice.
- `name`, `category`, and description can be project-specific.

Variants render inside `ProjectThemeProvider`, so design tokens from `projects` apply instantly.

### 5. Save and Publish Variants

- **Save Draft**: Persists edits on the `projectComponents` record without exposing them publicly.
- **Publish**: Calls `convex/components.publishComponent`, snapshots themed code, and either creates or updates a `componentConfigs` + `components` entry flagged `isPublic: true`.

Published components return to the marketplace as reusable templates. The original catalog entry remains unchanged; future projects inherit the same base config.

### 5. Maintenance Checklist

- Keep catalog components minimal—avoid business logic or API calls inside JSX samples.
- Update `version` when making breaking changes to property structure.
- Provide descriptive `tags` to enhance search and filtering once implemented.
- When deprecating a component, add a `status` tag (e.g., `deprecated`) and migrate projects before removal.
- Document Tailwind utility expectations in the catalog entry notes so future authors maintain extractor compatibility.

### Troubleshooting

- **Component not appearing** – confirm the mutation ran successfully and that `catalogComponents.listCatalogComponents` returns the ID. Check Convex indexes (`by_componentId`).
- **Preview missing properties** – ensure `tailwindProperties` names match the code placeholders. The editor maps property keys to `${elementId}.${propertyName}` format.
- **Publish conflicts** – publishing enforces ownership; only the original author of an existing catalog entry can overwrite it. Generate a new `componentId` if ownership has changed.


