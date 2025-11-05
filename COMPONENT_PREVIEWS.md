# Component Preview System

## Overview

I've added a complete component preview system that renders actual shadcn/ui components throughout the application, replacing the placeholder previews.

## What Was Added

### 1. Component Renderer System (`/src/lib/component-renderer.tsx`)

A centralized rendering system for shadcn/ui components:

**Supported Components:**
- Button (with variants: default, secondary, outline, ghost, destructive, link)
- Input (text, email, password, number)
- Card (with header, content, footer)
- Dialog (with trigger, title, description)
- Navigation Menu (with dropdown items)
- Badge (with variants: default, secondary, destructive, outline)
- Label (form labels)

**Key Functions:**
- `renderComponentPreview()` - Renders a component with given props
- `getDefaultComponentProps()` - Gets default props for each component type
- `getComponentInfo()` - Gets metadata (name, description, category)
- `getAllComponentTypes()` - Lists all available component types

### 2. Updated Files

#### Marketplace Components

**ComponentCard.tsx**
- Now shows actual component previews instead of gray boxes
- Displays component category below the name
- Uses the component renderer to show interactive previews
- Auto-derives component type from name

**ComponentsList.tsx**
- Passes component type information to cards
- Shows Button, Input, Dialog, Card, and Navigation Menu by default
- Supports loading components from Convex with their types

**ComponentOverlay.tsx**
- Displays full interactive component preview in dialog
- Shows component name, category, and description
- Renders actual component with default props
- Has "Edit Component" button to jump to editor

#### Editor Components

**ComponentPreview.tsx (Canvas)**
- Renders actual shadcn components instead of basic HTML
- Falls back to basic HTML for unsupported types
- Applies property values to rendered components
- Shows real interactive components

**property-extractor.ts**
- Enhanced to recognize shadcn component types (Button, Input, Card, etc.)
- Provides appropriate properties for each component type
- Adds variant and size options for Button
- Adds content properties for Card and Dialog
- Distinguishes between shadcn and HTML elements

## How It Works

### Marketplace Page Flow

```
ComponentsList 
  ↓
  Gets components from Convex (or shows defaults)
  ↓
ComponentCard
  ↓
  Derives component type from name/id
  ↓
renderComponentPreview()
  ↓
  Renders actual shadcn component
  ↓
  User sees interactive preview in card
```

### Editor Canvas Flow

```
User selects component
  ↓
Component code parsed by property-extractor
  ↓
Detects Button, Input, Card, etc.
  ↓
ComponentCanvas renders elements
  ↓
Calls renderComponentPreview() for each element
  ↓
Applies user's property values
  ↓
Shows live preview with real components
```

### Component Overlay Flow

```
User clicks component card
  ↓
Dialog opens with ComponentOverlay
  ↓
Derives component type from componentId
  ↓
Gets component info and default props
  ↓
Renders preview using renderComponentPreview()
  ↓
User can interact with preview
  ↓
Click "Edit Component" to customize
```

## Component Types

Each component type has specific properties:

### Button
- **text**: Button label
- **variant**: default, secondary, outline, ghost, destructive, link
- **size**: default, sm, lg, icon

### Input
- **placeholder**: Placeholder text
- **type**: text, email, password, number, date

### Card
- **title**: Card title
- **description**: Card description  
- **content**: Main content area
- **showFooter**: Whether to show footer
- **footerAction**: Footer button text

### Dialog
- **triggerText**: Button text to open dialog
- **title**: Dialog title
- **description**: Dialog description
- **content**: Dialog content
- **actionText**: Action button text

### Badge
- **text**: Badge text
- **variant**: default, secondary, destructive, outline

### Label
- **text**: Label text

### Navigation Menu
- **item1**: First menu item text
- **item2**: Second menu item text

## Visual Examples

### Marketplace Page
```
┌────────────────────────────────────────────────────────┐
│  Components                                            │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ [Button] │  │ [______] │  │ Open Dia │            │
│  │          │  │          │  │ [log]    │            │
│  │ Button   │  │ Input    │  │ Dialog   │            │
│  │ Form     │  │ Form     │  │ Overlay  │            │
│  └──────────┘  └──────────┘  └──────────┘            │
│                                                        │
│  ┌──────────┐  ┌──────────┐                           │
│  │ ┌──────┐ │  │ Item1 ▼  │                           │
│  │ │Title │ │  │ Item2 ▼  │                           │
│  │ │------│ │  │          │                           │
│  │ │Cont..│ │  │ Nav Menu │                           │
│  │ │[Act] │ │  │ Nav      │                           │
│  │ Card    │  │          │                           │
│  │ Layout  │  │          │                           │
│  └──────────┘  └──────────┘                           │
└────────────────────────────────────────────────────────┘
```

### Editor Canvas
```
┌────────────────────────────────────────────────────────┐
│  Canvas                    [Desktop][Tablet][Mobile]   │
│                            [Preview][Code]             │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  ╔══════════════╗  ← Selected Button 1           │ │
│  │  ║ [Click me]   ║                                 │ │
│  │  ╚══════════════╝                                 │ │
│  │                                                    │ │
│  │  [Input field_____________]                        │ │
│  │                                                    │ │
│  │  ┌─────────────────────────┐                      │ │
│  │  │ Card Title              │                      │ │
│  │  │ Card description        │                      │ │
│  │  │ Card content here...    │                      │ │
│  │  │ [Action]                │                      │ │
│  │  └─────────────────────────┘                      │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

## Benefits

1. **Visual Feedback**: Users see exactly what they're building
2. **Interactive**: Components work as they would in production
3. **Consistent**: Same rendering system everywhere
4. **Extensible**: Easy to add new component types
5. **Type-Safe**: Full TypeScript support
6. **Reusable**: One renderer for marketplace and editor

## Adding New Components

To add a new component type:

1. **Add to component-renderer.tsx:**
```typescript
export type ComponentType = 
  | 'button'
  | 'your-new-component' // Add here

// Add rendering logic
case 'your-new-component':
  return <YourComponent {...props} />

// Add default props
case 'your-new-component':
  return { prop1: 'value', prop2: 'value' }

// Add component info
'your-new-component': {
  name: 'Your Component',
  description: 'Description',
  category: 'Category',
}
```

2. **Add to property-extractor.ts:**
```typescript
{ tag: 'YourComponent', name: 'Your Component', isShadcn: true }

// Add properties
else if (tagLower === 'your-component') {
  elementProps.push({
    name: 'prop1',
    label: 'Prop 1',
    type: 'string',
    defaultValue: 'default',
    category: 'Content',
  })
}
```

3. **Add to ComponentsList fallback (optional):**
```typescript
{ 
  id: 'shadcn-your-component', 
  name: 'Your Component', 
  type: 'your-new-component' as ComponentType 
}
```

## Testing

1. **Marketplace**: Navigate to `/marketplace` - you should see component cards with actual previews
2. **Component Overlay**: Click any component card - dialog shows full interactive preview
3. **Editor**: Go to `/editor/shadcn-button` - canvas shows actual Button component
4. **Property Editing**: Select the button, change text/variant - see live updates

## Future Enhancements

- [ ] Add more shadcn components (Select, Tabs, Accordion, etc.)
- [ ] Support compound components (CardHeader, CardContent separately)
- [ ] Add theme preview (light/dark modes)
- [ ] Component composition (nested components)
- [ ] Live code generation showing component usage
- [ ] Export component as standalone file
- [ ] Component variants gallery
- [ ] Accessibility props editor
- [ ] Animation preview
- [ ] Responsive property values

## Technical Notes

- Components are rendered with `pointer-events-none` in cards to prevent interaction
- Editor canvas allows interaction for testing
- Component renderer gracefully handles missing props
- Fallback rendering for unsupported types
- Type derivation from component names for backwards compatibility

