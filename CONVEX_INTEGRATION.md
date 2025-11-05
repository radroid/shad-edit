# Convex Integration for Component Catalog

## Overview

The component catalog system now uses Convex as the primary data source for component configurations. This provides:

- **Publicly readable** component configs (no authentication required)
- **Authenticated mutations** for creating/updating configs
- **Centralized management** in Convex dashboard
- **Real-time updates** via Convex subscriptions
- **File system fallback** for development

## Database Schema

### `componentConfigs` Table

The `componentConfigs` table stores all component configuration data:

```typescript
{
  componentId: string        // Unique identifier (e.g., 'button', 'input')
  name: string              // Component display name
  description?: string       // Component description
  category?: string         // Component category
  tags?: string[]           // Component tags
  author?: string           // Author name
  version?: string          // Version string
  code: string              // Component code template
  properties: any[]         // Property definitions array
  variableMappings?: any[]  // Variable mapping rules
  dependencies?: any        // Component dependencies
  files?: any[]             // Additional files
  authorId: Id<'users'>     // Reference to user who created it
  createdAt: number         // Creation timestamp
  updatedAt: number         // Last update timestamp
}
```

**Indexes:**
- `by_componentId` - Fast lookup by component ID
- `by_category` - Filter by category
- `by_author` - Filter by author

## API Reference

### Queries (Public - No Auth Required)

#### `listPublicComponentConfigs`
Returns all component configs in the database.

```typescript
const configs = useQuery(api.componentConfigs.listPublicComponentConfigs, {})
```

#### `getComponentConfigById`
Get a specific component config by ID.

```typescript
const config = useQuery(api.componentConfigs.getComponentConfigById, {
  componentId: 'button'
})
```

#### `getComponentConfigsByCategory`
Get all configs in a specific category.

```typescript
const configs = useQuery(api.componentConfigs.getComponentConfigsByCategory, {
  category: 'Form'
})
```

### Mutations (Requires Authentication)

#### `upsertComponentConfig`
Create or update a component config. Only the author can update their own configs.

```typescript
const upsert = useMutation(api.componentConfigs.upsertComponentConfig)

await upsert({
  componentId: 'my-button',
  name: 'My Button',
  description: 'A custom button',
  category: 'Form',
  code: '...',
  properties: [...],
  // ... other fields
})
```

#### `deleteComponentConfig`
Delete a component config. Only the author can delete.

```typescript
const deleteConfig = useMutation(api.componentConfigs.deleteComponentConfig)

await deleteConfig({
  componentId: 'my-button'
})
```

## React Hooks

### `useCatalogComponents()`
Hook to get all component configs.

```typescript
import { useCatalogComponents } from '@/lib/catalog-hooks'

const { components, isLoading } = useCatalogComponents()
// components: Array<{ id: string; config: ComponentConfig }>
```

### `useCatalogComponent(componentId)`
Hook to get a single component config.

```typescript
import { useCatalogComponent } from '@/lib/catalog-hooks'

const { config, isLoading } = useCatalogComponent('button')
// config: ComponentConfig | null
```

## Seeding Initial Data

### Option 1: Using the Seed Script

1. Get your user ID from the Convex dashboard (check the `users` table)

2. Run the seed script:
```bash
npx tsx scripts/seed-component-configs.ts
```

3. Copy the formatted output and replace `YOUR_USER_ID_HERE` with your actual user ID

4. Call the `seedComponentConfigs` mutation from the Convex dashboard with the configs array

### Option 2: Manual Migration

1. For each component in `src/components/catalog/`:
   - Open the `config.json` file
   - Get your user ID from the Convex dashboard
   - Call `upsertComponentConfig` mutation with:
     - All fields from the JSON
     - `componentId` = directory name
     - `authorId` = your user ID

### Option 3: Convex Dashboard

1. Go to your Convex dashboard
2. Navigate to Functions → `seedComponentConfigs`
3. Call with the configs array (use the seed script output)

## Migration from File System

The system now prioritizes Convex over file system:

1. **Primary**: Loads from Convex database
2. **Fallback**: Loads from file system if Convex is unavailable

To migrate:
1. Seed all JSON configs to Convex (see above)
2. File system configs will be used as fallback only
3. All new components should be added via Convex mutations

## Adding New Components

### Via Code (Authenticated Users)

```typescript
import { useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'

const upsert = useMutation(api.componentConfigs.upsertComponentConfig)

await upsert({
  componentId: 'my-component',
  name: 'My Component',
  description: 'A new component',
  category: 'Form',
  code: `export default function MyComponent() { ... }`,
  properties: [
    {
      name: 'text',
      label: 'Text',
      type: 'string',
      defaultValue: 'Hello',
      category: 'Content',
    },
  ],
  // ... other fields
})
```

### Via Convex Dashboard

1. Navigate to Functions → `componentConfigs.upsertComponentConfig`
2. Fill in all required fields
3. Call the mutation

## Workflow

1. **Development**: 
   - Create JSON files in `src/components/catalog/`
   - Test locally with file system fallback
   - Seed to Convex when ready

2. **Production**:
   - All configs are stored in Convex
   - Publicly readable, no authentication needed
   - Only authenticated users can create/update

3. **Updates**:
   - Update via `upsertComponentConfig` mutation
   - Only the author can update their components
   - Changes are immediately available via Convex subscriptions

## Benefits

✅ **Centralized Management**: All configs in one database  
✅ **Public Access**: No auth required to read configs  
✅ **Real-time**: Updates propagate automatically  
✅ **Version Control**: Track who created/updated what  
✅ **Scalable**: Easy to query and filter  
✅ **Fallback**: File system still works for development  

