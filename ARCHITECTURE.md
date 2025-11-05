# Component Marketplace Architecture

## Overview

This document describes the modular architecture for the component marketplace system, designed to make adding new components simple and maintainable.

## Core Concepts

### 1. Component Separation

Components are organized into two categories:

- **Internal UI Components** (`src/components/ui/`): Application components used for building the web app itself. These are not editable by users.
- **Catalog Components** (`src/components/catalog/`): Marketplace components that users can edit, customize, and publish. Each component has its own directory with a configuration file.

### 2. Configuration-Driven System

Each catalog component is defined by a JSON configuration file (`config.json`) that contains:

- **Metadata**: Name, description, category, tags for marketplace display
- **Code Template**: React component code with placeholders (`{{propertyName}}`)
- **Properties**: Editable properties definition for the property editor
- **Variable Mappings**: How to replace placeholders with property values
- **Dependencies**: Required imports and modules

### 3. Property System

The property system allows components to be customizable without code changes:

1. **Define Properties**: In `config.json`, define what can be edited
2. **Use Placeholders**: In code template, use `{{propertyName}}` syntax
3. **Map Variables**: Configure how properties apply to code elements
4. **Auto-Apply**: System automatically replaces placeholders with property values

## Directory Structure

```
src/
├── components/
│   ├── ui/                          # Internal app components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── catalog/                     # Marketplace components
│       ├── example-button/
│       │   └── config.json
│       └── component-name/
│           ├── config.json          # Component configuration
│           └── README.md            # Optional documentation
│
├── lib/
│   ├── component-config.ts          # Config schema and types
│   ├── catalog-loader.ts            # Component loader and registry
│   └── property-extractor.ts        # Property extraction logic
│
└── routes/
    ├── docs/$.tsx                   # Catch-all route for component docs
    ├── editor/$componentId.tsx      # Component editor
    └── marketplace/
        ├── index.tsx                # Marketplace listing
        └── $componentId.tsx         # Component preview
```

## Workflow

### Adding a New Component

1. **Create Directory**: `src/components/catalog/my-component/`
2. **Create Config**: `config.json` with metadata, code, properties
3. **Auto-Discovery**: Component is automatically registered via glob import
4. **Available Immediately**: 
   - Editor: `/editor/my-component`
   - Docs: `/docs/my-component`
   - Marketplace: Listed in `/marketplace`

### User Workflow

1. **Browse**: User views components in marketplace
2. **View Docs**: Clicks to see component documentation
3. **Edit**: Opens component in editor
4. **Customize**: Adjusts properties via property panel
5. **Save**: Creates variant saved to database (private)
6. **Publish**: Publishes variant, creating new public component config

## Key Files

### `src/lib/component-config.ts`

Defines the configuration schema:

- `ComponentConfig`: Main config type
- `ComponentMetadata`: Marketplace display info
- `VariableMapping`: How properties map to code
- `PropertyDefinition`: Editable property schema

### `src/lib/catalog-loader.ts`

Component registry and loader:

- `registerComponent()`: Register a component manually
- `loadCatalogComponent()`: Load component config by ID
- `getAllCatalogComponents()`: Get all registered components
- `autoRegisterCatalogComponents()`: Auto-discover via glob import

### `src/lib/property-extractor.ts`

Property extraction and management:

- `extractPropertiesFromConfig()`: Extract from config (preferred)
- `extractPropertiesFromCode()`: Legacy code-based extraction
- `getDefaultPropertyValues()`: Get default values
- `applyPropertyChanges()`: Apply changes to code

### `src/routes/docs/$.tsx`

Catch-all route for component documentation:

- Uses TanStack Start's `$` catch-all route syntax
- Extracts component ID from URL path
- Loads component config via loader
- Displays documentation with preview, code, and properties

## TanStack Start Routing

TanStack Start uses file-based routing. The catch-all route syntax:

- **File**: `src/routes/docs/$.tsx`
- **URL Pattern**: `/docs/*` matches everything after `/docs/`
- **Parameter**: Access via `params._splat` in the loader
- **Example**: `/docs/example-button` → `params._splat = "example-button"`

This is equivalent to Next.js's `[[...slug]].tsx` pattern.

## Database Integration

### Component Storage

Components are stored in Convex with:

- `components` table: Base component definitions
- `variants` table: User-specific variants
- `variantVersions` table: Version history

### Save Flow

1. User customizes component in editor
2. Property values stored in `customizations` field
3. Rendered code snapshot in `publishedCode` field
4. Variant linked to user via `authorId`

### Publish Flow

1. User publishes variant
2. New component config created with customized properties
3. Component marked as `isPublic: true`
4. Appears in marketplace listing

## Property System Details

### Placeholder Syntax

In code templates, use `{{propertyName}}`:

```tsx
<Button variant="{{variant}}">
  {{text}}
</Button>
```

### Variable Mapping Types

- **`style`**: CSS properties (e.g., `backgroundColor`, `color`)
- **`attribute`**: React/HTML attributes (e.g., `variant`, `size`)
- **`content`**: Text content inside elements
- **`className`**: CSS class names

### Property Types

- **`string`**: Text input
- **`number`**: Number input
- **`boolean`**: Checkbox
- **`color`**: Color picker
- **`select`**: Dropdown with options
- **`slider`**: Numeric slider (with min/max/step)
- **`textarea`**: Multi-line text

## Benefits

### Modularity

- Each component is self-contained
- No changes needed to core system when adding components
- Easy to remove or update components

### Maintainability

- Clear separation of concerns
- Configuration-driven approach
- Type-safe with TypeScript

### Scalability

- Auto-discovery via glob imports
- Easy to add many components
- Efficient loading with lazy registration

### Developer Experience

- Simple workflow: create directory + config
- Clear documentation
- TypeScript support throughout

## Future Enhancements

Potential improvements:

1. **Component Templates**: Starter templates for common patterns
2. **Component Validation**: Validate configs at build time
3. **Component Preview**: Generate thumbnails automatically
4. **Component Search**: Full-text search across components
5. **Component Categories**: Hierarchical categorization
6. **Component Dependencies**: Manage component dependencies
7. **Component Versioning**: Semantic versioning for components
8. **Component Testing**: Automated testing framework

## See Also

- [ADDING_COMPONENTS.md](./ADDING_COMPONENTS.md) - Step-by-step guide for adding components
- `src/components/catalog/example-button/config.json` - Example configuration

