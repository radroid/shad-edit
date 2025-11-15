# AST-Based Component Config Migration

This document describes the enhanced schema-based approach for managing Tailwind CSS class overrides using AST-based autodiscovery.

## Overview

The system now uses **AST-based autodiscovery** to generate explicit component configurations. This provides:

- ✅ **Consistency**: Every component has explicit, predictable editable properties
- ✅ **Control**: You decide exactly what can be edited
- ✅ **Maintainability**: Configs are versioned and can be updated independently
- ✅ **Performance**: No regex parsing on every edit
- ✅ **Flexibility**: Supports complex mappings and variants

## What Changed

### 1. Enhanced Schema Structure

Components now use `editableElements` instead of relying on regex-based extraction:

```typescript
type EditableElement = {
  id: string                    // "button-0", "card-header-1"
  selector: string              // How to find it in code
  tag?: string                  // Element tag name
  name: string                  // Display name
  properties: PropertyDefinition[]
  applyStrategy: 'className' | 'style' | 'attribute' | 'cssVariable'
  tailwindConfig?: TailwindElementConfig
}
```

### 2. AST-Based Config Generator

The new `ast-config-generator.ts` uses Babel AST parsing to:
- Extract JSX elements from component code
- Identify className attributes
- Generate property definitions from Tailwind classes
- Infer Tailwind config (editableGroups, replaceGroups, mergeGroups)

### 3. Validation System

The `config-validator.ts` ensures:
- Element IDs are unique
- Selectors can find elements in code
- Properties are properly defined
- Code is valid JSX/TSX

## Migration Steps

### Step 1: Generate Configs for Existing Components

Run the migration script to generate AST-based configs:

```bash
# Set your Convex URL
export VITE_CONVEX_URL="https://your-project.convex.cloud"

# Optional: Set auth token to enable automatic updates
export CONVEX_AUTH_TOKEN="your-auth-token"

# Run the migration script
pnpm generate-ast-configs
# OR
pnpm tsx scripts/generate-ast-configs.ts
```

This will:
1. Load all existing components from Convex
2. Generate `editableElements` using AST parsing
3. Validate the generated configs
4. Show what would be updated (doesn't auto-update for safety)

### Step 2: Review and Update Components

For each component:
1. Review the generated `editableElements`
2. Refine property definitions if needed
3. Update via Convex dashboard or API

### Step 3: Update Component Code

The system automatically uses `editableElements` when available, falling back to legacy extraction if not present.

## Usage

### Generating a Config for a New Component

```typescript
import { generateConfigFromCode } from '@/lib/ast-config-generator'

const config = generateConfigFromCode(
  componentCode,
  {
    name: 'My Button',
    description: 'A customizable button',
    category: 'Buttons',
  },
  {
    componentName: 'My Button',
    includeCommonStyles: true,
  }
)

// Validate before saving
import { validateComponentConfig } from '@/lib/config-validator'
const validation = validateComponentConfig(config)

if (validation.valid) {
  // Save to Convex
  await upsertComponentConfig(config)
}
```

### Using the Enhanced Schema

Components with `editableElements` will:
- Show consistent property panels
- Use explicit apply strategies
- Respect Tailwind config (editableGroups, replaceGroups, etc.)

## Backward Compatibility

The system maintains backward compatibility:
- Components without `editableElements` still work (uses legacy extraction)
- `properties` field is still supported (deprecated)
- Gradual migration is possible

## Files Changed

- `src/lib/component-config.ts` - Enhanced schema types
- `src/lib/ast-config-generator.ts` - AST-based config generation (NEW)
- `src/lib/config-validator.ts` - Validation utilities (NEW)
- `src/lib/property-extractor.ts` - Updated to use schema when available
- `convex/schema.ts` - Added `editableElements` and `globalProperties`
- `convex/componentConfigs.ts` - Updated mutations/queries
- `convex/catalogComponents.ts` - Updated mutations
- `src/lib/catalog-hooks.ts` - Updated to include new fields
- `src/hooks/useGuestEditor.ts` - Updated to pass config to applyPropertyChanges

## Next Steps

1. Run the migration script to generate configs
2. Review and refine generated configs
3. Update components in Convex
4. Test the editor with new schema-based components
5. Gradually migrate all components

## Troubleshooting

### Config validation fails

Check:
- Element selectors can find elements in code
- Property names are unique per element
- Code is valid JSX/TSX

### Elements not found

The selector might not match. Update the selector in the config:
- Use exact tag name: `"button-0"` for the first button
- Use component name for shadcn components: `"Button-0"`

### Properties not showing

Ensure:
- `editableElements` is defined in the component config
- Properties are properly defined with correct types
- Component is loaded from Convex with the new schema

