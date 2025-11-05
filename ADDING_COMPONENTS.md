# Adding Components to the Marketplace Catalog

This guide explains how to add new components to the marketplace catalog using Convex.

## Overview

The component catalog system uses Convex as the source of truth. All component configurations are stored in the `componentConfigs` table in Convex.

The system allows you to:
1. Define component code with placeholders for customizable properties
2. Configure editable properties via JSON configuration
3. Store components in Convex database (publicly readable)
4. Manage components through authenticated mutations

## Prerequisites

- You must be authenticated (signed in)
- Components are stored in Convex `componentConfigs` table
- Public components are automatically available in marketplace

## Step-by-Step Guide

### 1. Prepare Your Component Configuration

Create a JSON configuration object with your component definition. Use `{{propertyName}}` syntax for placeholders in the code.

**Example Component Config:**

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
  "code": "import { Button } from '@/components/ui/button'\n\nexport default function MyAwesomeButton() {\n  return (\n    <Button\n      variant=\"{{variant}}\"\n      size=\"{{size}}\"\n      className=\"{{className}}\"\n      style={{\n        backgroundColor: '{{backgroundColor}}',
        color: '{{color}}'
      }}
    >
      {{text}}
    </Button>
  )
}
```

### 2. Add Component to Convex

You can add components in two ways:

#### Option A: Via Convex Dashboard

1. Go to your Convex dashboard
2. Navigate to Functions → `componentConfigs.upsertComponentConfig`
3. Fill in the component configuration
4. Call the mutation

#### Option B: Via Code (React Hook)

```typescript
import { useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'

const upsert = useMutation(api.componentConfigs.upsertComponentConfig)

await upsert({
  componentId: 'my-awesome-button',
  name: 'My Awesome Button',
  description: 'A highly customizable button',
  category: 'Form',
  code: '...',
  properties: [...],
  // ... other fields
})
```

### 3. Component Configuration Format

The configuration object follows this structure:

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

### 4. Component Availability

Once added to Convex, components are immediately available:

- **In the Marketplace**: Listed automatically in `/marketplace`
- **In the Editor**: Accessible at `/editor/{componentId}`
- **Publicly Readable**: No authentication required to view

## Best Practices

### 1. Use Unique Component IDs

Component IDs must be unique across the catalog. Use kebab-case:

- ✅ `my-awesome-button`
- ✅ `custom-input-field`
- ❌ `MyAwesomeButton` (camelCase)
- ❌ `my awesome button` (spaces)

### 2. Replace Hardcoded Values

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

### Adding a New Component

1. **Prepare** your component configuration (JSON format)
2. **Add to Convex** via dashboard or mutation
3. **Verify** component appears in marketplace
4. **Test** in editor at `/editor/{componentId}`

### User Workflow

1. **Browse** marketplace at `/marketplace`
2. **View** component details in overlay (preview, code, properties)
3. **Edit** component in editor at `/editor/{componentId}`
4. **Customize** properties via the property panel
5. **Save** as draft (stored in `components` table, private)
6. **Publish** (moves to `componentConfigs` table, public)

## Database Integration

When users save or publish variants:

- **Save**: Creates a variant in the database linked to the user
- **Publish**: Creates a new component config with the customized properties

The system automatically:
- Stores property values in `customizations`
- Snapshots the rendered code in `publishedCode`
- Maintains version history via `variantVersions`

## Example: Complete Component

See the seed script (`scripts/seed-component-configs.ts`) for examples of complete component configurations.

You can also check existing components in your Convex dashboard under the `componentConfigs` table.

## Troubleshooting

### Component Not Appearing

1. Check that component exists in Convex `componentConfigs` table
2. Verify the `componentId` is correct and unique
3. Check browser console for loading errors
4. Ensure you're using the correct component ID (kebab-case)
5. Verify Convex queries are working (check network tab)

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

