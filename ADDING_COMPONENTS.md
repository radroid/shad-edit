# Adding Components to the Marketplace Catalog

This guide explains how to add new components to the marketplace catalog in a modular, maintainable way.

## Overview

The component catalog system allows you to:
1. Define component code with placeholders for customizable properties
2. Configure editable properties via JSON configuration
3. Automatically make components available in the editor and marketplace
4. Document components with metadata

## Directory Structure

```
src/components/
├── ui/                    # Internal app components (not editable by users)
└── catalog/              # Marketplace components (editable by users)
    └── component-name/   # One directory per component
        ├── config.json   # Component configuration (required)
        └── README.md     # Component documentation (optional)
```

## Step-by-Step Guide

### 1. Create Component Directory

Create a new directory under `src/components/catalog/` with a kebab-case name:

```bash
mkdir -p src/components/catalog/my-awesome-button
```

### 2. Define Component Code

Create your component code template with placeholders for editable properties. Use `{{propertyName}}` syntax for placeholders.

**Example: `src/components/catalog/my-awesome-button/component.tsx`** (optional, can be in config.json)

```tsx
import { Button } from '@/components/ui/button'

export default function MyAwesomeButton() {
  return (
    <Button
      variant="{{variant}}"
      size="{{size}}"
      className="{{className}}"
      style={{
        backgroundColor: '{{backgroundColor}}',
        color: '{{color}}'
      }}
    >
      {{text}}
    </Button>
  )
}
```

### 3. Create Configuration File

Create a `config.json` file in your component directory. This is the core of the component definition.

**Example: `src/components/catalog/my-awesome-button/config.json`**

```json
{
  "metadata": {
    "name": "My Awesome Button",
    "description": "A highly customizable button component",
    "category": "Form",
    "tags": ["button", "interactive"],
    "author": "Your Name",
    "version": "1.0.0"
  },
  "code": "import { Button } from '@/components/ui/button'\n\nexport default function MyAwesomeButton() {\n  return (\n    <Button variant=\"{{variant}}\" size=\"{{size}}\">\n      {{text}}\n    </Button>\n  )\n}",
  "properties": [
    {
      "name": "text",
      "label": "Button Text",
      "type": "string",
      "defaultValue": "Click me",
      "category": "Content",
      "description": "The text displayed on the button"
    },
    {
      "name": "variant",
      "label": "Variant",
      "type": "select",
      "defaultValue": "default",
      "category": "Appearance",
      "options": [
        { "label": "Default", "value": "default" },
        { "label": "Secondary", "value": "secondary" },
        { "label": "Outline", "value": "outline" }
      ],
      "description": "The visual style variant"
    }
  ],
  "variableMappings": [
    {
      "propertyName": "text",
      "type": "content",
      "target": "Button",
      "path": "text",
      "defaultValue": "Click me"
    },
    {
      "propertyName": "variant",
      "type": "attribute",
      "target": "Button",
      "path": "variant",
      "defaultValue": "default"
    }
  ],
  "dependencies": {
    "@/components/ui/button": "@/components/ui/button"
  }
}
```

### 4. Configuration Schema

#### Metadata

- `name` (required): Display name of the component
- `description` (required): Short description for marketplace cards
- `category` (optional): Category for grouping (e.g., "Form", "Layout", "Display")
- `tags` (optional): Array of tags for searching
- `author` (optional): Component author name
- `version` (optional): Semantic version string

#### Code

The `code` field contains the component source code as a string. Use `{{propertyName}}` placeholders for values that should be editable.

#### Properties

Each property defines an editable field in the property editor:

```typescript
{
  name: string              // Internal property name (used in placeholders)
  label: string            // Display label in the editor
  type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'slider' | 'textarea'
  defaultValue?: any       // Default value
  category?: string        // Grouping category
  description?: string     // Help text
  options?: Array<{        // For 'select' type
    label: string
    value: any
  }>
  min?: number            // For 'slider' type
  max?: number            // For 'slider' type
  step?: number           // For 'slider' type
}
```

#### Variable Mappings

Variable mappings define how properties are applied to the code:

```typescript
{
  propertyName: string      // Must match a property name
  type: 'style' | 'attribute' | 'content' | 'className'
  target: string           // Element selector (e.g., 'Button', '#my-id', '.my-class')
  path: string             // Property path (e.g., 'variant', 'backgroundColor', 'text')
  defaultValue?: any       // Fallback value
}
```

**Types:**
- `style`: CSS style property (e.g., `backgroundColor`, `color`)
- `attribute`: React/HTML attribute (e.g., `variant`, `size`, `placeholder`)
- `content`: Text content inside elements
- `className`: CSS class name

### 5. Register Component (Auto-Discovery)

The catalog loader automatically discovers components using Vite's glob import. As long as your component follows the directory structure and has a `config.json` file, it will be automatically registered.

If you need manual registration, you can add it in `src/lib/catalog-loader.ts`:

```typescript
import myButtonConfig from '../components/catalog/my-awesome-button/config.json'

registerComponent('my-awesome-button', async () => myButtonConfig)
```

### 6. Accessing Components

Once registered, components are available:

- **In the Editor**: `/editor/my-awesome-button`
- **In the Marketplace**: Listed automatically in `/marketplace`
- **In Documentation**: `/docs/my-awesome-button`

## Best Practices

### 1. Replace Hardcoded Values

Replace hardcoded styling with placeholders:

```tsx
// ❌ Bad - hardcoded values
<Button style={{ backgroundColor: '#3b82f6' }}>Click me</Button>

// ✅ Good - uses placeholders
<Button style={{ backgroundColor: '{{backgroundColor}}' }}>
  {{text}}
</Button>
```

### 2. Use Semantic Property Names

Use descriptive, semantic names:

```json
// ❌ Bad
{ "name": "bg", "label": "Background" }

// ✅ Good
{ "name": "backgroundColor", "label": "Background Color" }
```

### 3. Group Related Properties

Use categories to group related properties:

```json
{
  "properties": [
    { "name": "text", "category": "Content" },
    { "name": "variant", "category": "Appearance" },
    { "name": "backgroundColor", "category": "Colors" }
  ]
}
```

### 4. Provide Defaults

Always provide sensible default values:

```json
{
  "name": "text",
  "defaultValue": "Click me"  // ✅ Good default
}
```

### 5. Document Properties

Include descriptions for clarity:

```json
{
  "name": "variant",
  "description": "The visual style variant of the button. 'default' uses primary colors, 'outline' shows only borders."
}
```

### 6. Use Select for Limited Options

Use `select` type for properties with limited, known options:

```json
{
  "type": "select",
  "options": [
    { "label": "Small", "value": "sm" },
    { "label": "Medium", "value": "md" },
    { "label": "Large", "value": "lg" }
  ]
}
```

## Component Workflow

### Development Workflow

1. **Create** component directory and `config.json`
2. **Define** code template with placeholders
3. **Configure** properties and variable mappings
4. **Test** in editor at `/editor/component-name`
5. **Document** in README.md (optional)

### User Workflow

1. **Browse** marketplace at `/marketplace`
2. **View** component documentation at `/docs/component-name`
3. **Edit** component in editor at `/editor/component-name`
4. **Customize** properties via the property panel
5. **Save** variant (stored in database under user)
6. **Publish** variant (creates new public component config)

## Database Integration

When users save or publish variants:

- **Save**: Creates a variant in the database linked to the user
- **Publish**: Creates a new component config with the customized properties

The system automatically:
- Stores property values in `customizations`
- Snapshots the rendered code in `publishedCode`
- Maintains version history via `variantVersions`

## Example: Complete Component

See `src/components/catalog/example-button/config.json` for a complete example.

## Troubleshooting

### Component Not Appearing

1. Check that `config.json` exists and is valid JSON
2. Verify the directory name matches the component ID
3. Check browser console for loading errors
4. Ensure the component is registered (check `catalog-loader.ts`)

### Properties Not Working

1. Verify property names match placeholders in code (e.g., `{{text}}` → `"text"`)
2. Check variable mappings are correctly configured
3. Ensure property types match the expected input type

### Code Not Rendering

1. Check that all dependencies are available
2. Verify placeholder syntax is correct: `{{propertyName}}`
3. Ensure the code template is valid React/TSX

## Next Steps

- Add more components to the catalog
- Enhance property editor with more input types
- Add component preview thumbnails
- Implement component search and filtering

