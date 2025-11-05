# Component Editor Documentation

## Overview

The component editor is a comprehensive visual editing interface for React components with a three-panel layout:

- **Left Panel**: Component List
- **Center Panel**: Component Canvas (Preview/Code)
- **Right Panel**: Property Manager

## Architecture

### 1. Component Structure

#### `/src/lib/property-extractor.ts`
The property extraction system that analyzes React components and extracts editable properties:

- **PropertyDefinition**: Defines editable properties with type, default values, and options
- **ComponentElement**: Represents a single element in the component tree
- **ComponentStructure**: The complete structure of a component with all its elements
- **extractPropertiesFromCode()**: Parses component code and extracts editable properties
- **getDefaultPropertyValues()**: Gets default values for all properties
- **getPropertyCategories()**: Organizes properties by category

Supported property types:
- `string`: Text input
- `number`: Numeric input
- `boolean`: Checkbox
- `color`: Color picker + text input
- `select`: Dropdown selection
- `slider`: Range slider
- `textarea`: Multi-line text

### 2. Editor Components

#### Left Sidebar: ComponentSelector
**Location**: `/src/components/editor/ComponentSelector.tsx`

Features:
- Lists all user's components from Convex
- Search functionality to filter components
- Shows component status (Public/Draft)
- Shows component category
- Highlights selected component
- Integrates with Convex `listMyComponents` query

Props:
```typescript
{
  selectedComponentId?: string
  onSelectComponent: (componentId: string) => void
}
```

#### Center Canvas: ComponentCanvas
**Location**: `/src/components/editor/ComponentPreview.tsx`

Features:
- Live preview of component with applied property values
- Interactive element selection (click to select)
- Device size toggle (Desktop/Tablet/Mobile)
- View mode toggle (Preview/Code)
- Real-time style application
- Visual selection indicators
- Element type badges

Props:
```typescript
{
  componentStructure?: ComponentStructure
  selectedElementId?: string
  onSelectElement: (elementId: string) => void
  propertyValues: Record<string, any>
  componentCode?: string
}
```

#### Right Sidebar: PropertyManager
**Location**: `/src/components/editor/PropertyManager.tsx`

Features:
- Dynamic property editing based on selected element
- Properties organized by categories (using Accordion)
- Different input types based on property type
- Shows element name and type
- Real-time property updates
- Descriptive labels and help text

Props:
```typescript
{
  selectedElement?: ComponentElement
  propertyValues: Record<string, any>
  onPropertyChange: (propertyName: string, value: any) => void
}
```

### 3. Main Editor Route

**Location**: `/src/routes/editor/$componentId.tsx`

#### State Management

The editor maintains several pieces of state:

1. **Component State**:
   - `selectedComponentId`: Currently selected component from list
   - `name`: Component name
   - `description`: Component description
   - `componentCode`: Raw component code
   - `componentStructure`: Parsed component structure

2. **Selection State**:
   - `selectedElementId`: Currently selected element for editing

3. **Property State**:
   - `propertyValues`: All property values keyed by `${elementId}.${propertyName}`

4. **History State** (Undo/Redo):
   - `history`: Array of previous property states
   - `historyIndex`: Current position in history

#### Key Features

1. **Component Loading**:
   - Loads component data from Convex
   - Generates sample code if none exists
   - Extracts properties and elements
   - Initializes property values (merges defaults with saved customizations)

2. **Property Editing**:
   - Real-time updates to canvas
   - Automatic history tracking
   - Undo/Redo support

3. **Saving & Publishing**:
   - Save Draft: Saves to Convex with `isPublic: false`
   - Publish: Saves and sets `isPublic: true`
   - Saves both code and customizations

#### Layout

Three-panel responsive layout:
```
┌─────────────────────────────────────────────────────────┐
│                     Top Toolbar                          │
│  [Component Name Input] [Undo] [Redo] [Save] [Publish] │
├──────────┬────────────────────────────┬─────────────────┤
│          │                            │                 │
│ Component│     Component Canvas       │   Property      │
│   List   │   (Preview/Code View)      │   Manager       │
│  (256px) │      (Flexible)            │   (320px)       │
│          │                            │                 │
│          │                            │                 │
└──────────┴────────────────────────────┴─────────────────┘
```

## Property System

### Property Key Format

Properties are stored with the key format: `${elementId}.${propertyName}`

Example:
```typescript
{
  'button-0-0.text': 'Click me',
  'button-0-0.variant': 'default',
  'button-0-0.backgroundColor': '#007bff',
  'div-0-0.padding': '16px'
}
```

### Property Categories

Properties are organized into logical categories:
- **Content**: Text, placeholders, URLs, etc.
- **Spacing**: Padding, margin
- **Colors**: Background, text, border colors
- **Typography**: Font size, weight
- **Border**: Border radius, width, color
- **Layout**: Width, height, max-width
- **Appearance**: Variants, themes
- **Behavior**: Input types, link targets

### Adding New Property Types

To add a new property type:

1. Add the type to `PropertyType` in `property-extractor.ts`
2. Add the rendering logic in `PropertyManager.tsx`'s `renderPropertyControl()` function
3. Add style application logic in `ComponentCanvas.tsx`'s `renderElement()` function

## Extensibility

### Adding New Element Types

To support new element types:

1. Add detection in `extractPropertiesFromCode()`:
```typescript
{ tag: 'newElement', name: 'New Element' }
```

2. Add element-specific properties:
```typescript
if (element.tag === 'newElement') {
  elementProps.push({
    name: 'customProp',
    label: 'Custom Property',
    type: 'string',
    category: 'Custom',
  })
}
```

3. Add rendering in `ComponentCanvas.tsx`:
```typescript
{element.type === 'newElement' && (
  <div>{/* Render your element */}</div>
)}
```

### Integrating with Real Components

To integrate with actual React components instead of HTML elements:

1. Import the component in `ComponentCanvas.tsx`
2. Parse the component's TypeScript types to extract props
3. Map props to PropertyDefinitions
4. Render the actual component with applied props

## Best Practices

1. **Property Naming**: Use camelCase for property names that map to CSS properties
2. **Default Values**: Always provide sensible defaults
3. **Categories**: Group related properties together
4. **Descriptions**: Add helpful descriptions for complex properties
5. **Validation**: Add min/max/step for numeric inputs
6. **Options**: Provide clear labels for select options

## Future Enhancements

Potential improvements:
- [ ] Real-time collaboration
- [ ] Component templates library
- [ ] Advanced CSS property support (flexbox, grid)
- [ ] Component nesting/hierarchy
- [ ] Export to different formats (JSX, Vue, etc.)
- [ ] Import existing components from code
- [ ] Visual drag-and-drop editor
- [ ] Keyboard shortcuts
- [ ] Property search/filter
- [ ] Custom property types
- [ ] Property presets/themes
- [ ] Responsive property values per breakpoint

## Troubleshooting

### Component not loading
- Ensure the component exists in Convex
- Check browser console for errors
- Verify authentication

### Properties not updating
- Check that property keys follow the format `${elementId}.${propertyName}`
- Verify the element is selected
- Check the property type matches the control

### Undo/Redo not working
- Ensure property changes are going through `handlePropertyChange`
- Check history state in React DevTools

## Technologies Used

- **React**: Component framework
- **TanStack Router**: Routing
- **Convex**: Backend and real-time data
- **shadcn/ui**: UI components
- **Tailwind CSS**: Styling
- **Lucide Icons**: Icons
- **TypeScript**: Type safety

