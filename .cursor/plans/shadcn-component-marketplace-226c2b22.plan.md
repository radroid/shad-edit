<!-- 226c2b22-6c6f-429a-b92a-2d2f446801ff e6d91d63-0040-4408-a281-00ea7ad07673 -->
# Shadcn Component Marketplace - Implementation Plan

## Overview

Build a web application using TanStack Start + Convex that allows users to customize shadcn components visually, save them as custom blocks, and share them with the community. The app will integrate with Firecrawl for component discovery and be compatible with shadcn registry format for future registry integration.

## Architecture Decisions

### Tech Stack

- **Frontend Framework**: TanStack Start (React)
- **Backend/Database**: Convex (real-time database and serverless functions)
- **Deployment**: Cloudflare Pages
- **Component Discovery**: Firecrawl API
- **UI Components**: shadcn/ui
- **State Management**: TanStack Query + Convex React hooks
- **Styling**: Tailwind CSS (already configured)

### Key Features

1. Component Editor Page - Visual editing with real-time preview
2. Community Marketplace - Browse, search, and fork shared components
3. Component Discovery - Firecrawl integration for finding components across the web
4. Registry Compatibility - Output components in shadcn registry format

## Phase 1: Project Setup & Infrastructure

### 1.1 Convex Setup

- Initialize Convex project (`npx convex dev`)
- Create `convex/` directory structure
- Configure Convex client in root route (`src/routes/__root.tsx`)
- Set up Convex environment variables
- Install and configure `@convex-dev/react-query` for TanStack Query integration

**Files to create/modify:**

- `convex/schema.ts` - Database schema definition
- `convex/_generated/api.d.ts` - Auto-generated types
- `src/lib/convex.ts` - Convex client setup
- Update `src/routes/__root.tsx` - Add ConvexProvider

### 1.2 Database Schema Design

Define Convex schema for:

- **users**: User profiles (name, email, avatar)
- **components**: Custom component definitions
  - `id`, `name`, `description`, `category`, `authorId`
  - `registryData`: JSON following shadcn registry-item.json schema
  - `customizations`: Style overrides (padding, margin, border, colors, fonts)
  - `sourceComponent`: Reference to base shadcn component
  - `isPublic`: Boolean for community sharing
  - `createdAt`, `updatedAt`
- **componentVersions**: Version history for components
- **categories**: Component categories (forms, navigation, feedback, etc.)
- **componentForks**: Track component forks/derivatives

**File**: `convex/schema.ts`

### 1.3 Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn components (to be installed)
│   ├── editor/          # Editor-specific components
│   │   ├── ComponentSelector.tsx
│   │   ├── StyleEditor.tsx
│   │   ├── ComponentPreview.tsx
│   │   └── PropertyPanel.tsx
│   └── marketplace/     # Marketplace components
│       ├── ComponentCard.tsx
│       ├── ComponentOverlay.tsx
│       ├── CategoryFilter.tsx
│       └── SearchBar.tsx
├── lib/
│   ├── convex.ts        # Convex client
│   ├── firecrawl.ts     # Firecrawl API client
│   ├── registry.ts      # shadcn registry utilities
│   └── component-parser.ts  # Parse components from Firecrawl
├── hooks/
│   ├── useComponentEditor.ts
│   └── useComponentRegistry.ts
├── routes/
│   ├── __root.tsx       # Update with ConvexProvider
│   ├── index.tsx        # Landing page
│   ├── editor/
│   │   └── $componentId.tsx  # Component editor route
│   └── marketplace/
│       ├── index.tsx    # Marketplace listing
│       └── $componentId.tsx  # Component detail/overlay
└── convex/
    ├── schema.ts
    ├── users.ts
    ├── components.ts
    └── firecrawl.ts
```

## Phase 2: Component Editor Page

### 2.1 Route Setup

Create route: `src/routes/editor/$componentId.tsx`

- Dynamic route parameter for component ID
- Loader to fetch component data from Convex
- Handle "new" component creation

### 2.2 Left Sidebar - Component Selector

**Component**: `src/components/editor/ComponentSelector.tsx`

- Fetch available shadcn components from:
  - Local registry (installed components)
  - Firecrawl API (web-scraped components)
  - User's saved components
- Display as searchable list with icons
- Group by categories (Forms, Navigation, Feedback, etc.)
- Allow creating new component from template

**Convex Functions**:

- `convex/components.ts`: `listAvailableComponents` query
- `convex/firecrawl.ts`: `fetchShadcnComponents` mutation (caches results)

### 2.3 Center Canvas - Live Preview

**Component**: `src/components/editor/ComponentPreview.tsx`

- Render selected component with current customizations
- Real-time update as styles change
- Support for all shadcn component types
- Isolated preview container with controlled environment
- Show component code preview (optional tab)

**Key Features**:

- Use React state for component props/styling
- Apply Tailwind classes dynamically based on editor values
- Support responsive preview sizes

### 2.4 Right Sidebar - Style Editor

**Component**: `src/components/editor/StyleEditor.tsx`

- **Spacing Controls**:
  - Padding (all sides + individual)
  - Margin (all sides + individual)
- **Border Controls**:
  - Border width, style, radius
  - Border color picker
- **Typography Controls**:
  - Font family, size, weight
  - Line height, letter spacing
  - Text color
- **Background Controls**:
  - Background color picker
  - Gradient support (optional)
- **Layout Controls**:
  - Display type, flexbox, grid
  - Width, height
- Real-time updates using controlled inputs
- Reset to default button

**State Management**:

- Use `useState` for editor state
- Debounce updates to prevent excessive re-renders
- Sync with Convex on save

### 2.5 Component Saving

- Save button in header
- Create/update Convex mutation: `convex/components.ts` → `saveComponent`
- Convert editor state to shadcn registry format
- Generate component code with customizations applied
- Show success/error feedback

**Registry Format Conversion**:

- Map style properties to Tailwind classes
- Generate component TypeScript code
- Create registry-item.json structure
- Store in Convex with proper schema

## Phase 3: Community Marketplace Page

### 3.1 Route Setup

Create route: `src/routes/marketplace/index.tsx`

- Loader to fetch public components from Convex
- Support query params for category filtering and search

### 3.2 Marketplace Layout

**Component**: `src/components/marketplace/MarketplaceLayout.tsx`

- Header with search bar
- Category filter tabs/chips
- Grid layout for component cards
- Infinite scroll or pagination
- Loading states

### 3.3 Component Cards

**Component**: `src/components/marketplace/ComponentCard.tsx`

- Display component preview (thumbnail)
- Component name, description, author
- Category badge
- View count, fork count
- Click to open overlay

**Convex Query**: `convex/components.ts` → `listPublicComponents`

### 3.4 Component Overlay (21st.dev style)

**Component**: `src/components/marketplace/ComponentOverlay.tsx`

- Full-screen overlay modal
- Interactive component preview (can interact with component)
- Component metadata sidebar
- Action buttons:
  - "Edit Component" → Navigate to editor
  - "Fork Component" → Create copy for editing
  - "Use in Project" → Show install command (future: registry integration)
  - "Close" → Return to marketplace
- Component code preview (collapsible)
- Author info and link to their profile

**Route**: `src/routes/marketplace/$componentId.tsx`

- Load component data
- Render overlay component

### 3.5 Search & Filtering

- Search by component name, description, tags
- Filter by category (Forms, Navigation, etc.)
- Sort by: newest, most forked, most viewed
- Convex query with search/filter params

## Phase 4: Firecrawl Integration

### 4.1 Firecrawl API Client

**File**: `src/lib/firecrawl.ts`

- Setup Firecrawl API client
- Functions to:
  - Scrape shadcn component pages
  - Extract component code and metadata
  - Parse registry.json files
  - Cache results in Convex

### 4.2 Component Discovery

**Convex Function**: `convex/firecrawl.ts`

- `discoverShadcnComponents`: Scrape known shadcn component sources
- Parse HTML to extract component code
- Store discovered components in Convex for searchability
- Periodic background job to refresh component list

**Sources to scrape**:

- shadcn/ui official components
- Community-built components (from GitHub, blogs, etc.)
- Other registry providers (kibo-ui, clerk, etc.)

### 4.3 Component Parser

**File**: `src/lib/component-parser.ts`

- Parse component code from Firecrawl results
- Extract component name, props, dependencies
- Convert to registry format
- Validate component structure

## Phase 5: shadcn Registry Compatibility

### 5.1 Registry Format Utilities

**File**: `src/lib/registry.ts`

- Functions to convert component data to `registry-item.json` format
- Generate component files (TSX, CSS if needed)
- Create registry.json index file
- Validate registry structure

### 5.2 Registry Export

- Allow users to export their components as registry-compatible JSON
- Generate installable component packages
- Prepare for future registry hosting

### 5.3 Registry Endpoint (Future)

- API route to serve registry.json: `/api/registry/$componentName.json`
- Compatible with shadcn CLI: `npx shadcn@latest add @your-registry/component-name`
- Deploy on Cloudflare for public access

## Phase 6: Additional Features

### 6.1 User Authentication (Optional for MVP)

- Convex Auth integration
- User profiles
- "My Components" page
- Component ownership

### 6.2 Component Forking

- Allow users to fork public components
- Create copy linked to original
- Track fork tree

### 6.3 Component Versioning

- Save component versions on each edit
- Allow reverting to previous versions
- Show version history

## Phase 7: Deployment

### 7.1 Cloudflare Pages Setup

- Configure build command: `npm run build`
- Set environment variables (Convex deployment URL, Firecrawl API key)
- Deploy frontend to Cloudflare Pages

### 7.2 Convex Deployment

- Deploy Convex backend: `npx convex deploy`
- Configure production environment
- Set up environment variables

### 7.3 Registry Hosting (Future)

- Host registry.json files on Cloudflare
- Configure CORS for shadcn CLI access
- Public URL for registry endpoint

## Implementation Order

1. **Setup Phase** (Convex, basic routes, UI components)
2. **Editor Core** (Component selector, preview, basic style editor)
3. **Saving & Loading** (Convex mutations/queries, component persistence)
4. **Marketplace UI** (Listing page, component cards)
5. **Overlay Component** (Interactive preview modal)
6. **Firecrawl Integration** (Component discovery)
7. **Registry Format** (Export utilities, compatibility)
8. **Polish & Deploy** (Error handling, loading states, deployment)

## Key Dependencies to Install

```json
{
  "dependencies": {
    "@radix-ui/react-*": "Component-specific Radix UI primitives",
    "firecrawl-js": "Firecrawl SDK",
    "react-colorful": "Color picker for style editor",
    "zod": "Schema validation for registry format"
  }
}
```

## Questions to Consider

1. **Authentication**: Do we need user auth for MVP, or can we use anonymous components initially?
2. **Component Code Generation**: How to handle complex component logic vs. just styling?
3. **Firecrawl Rate Limits**: How to handle API limits and caching strategy?
4. **Registry Hosting**: Immediate or phase 2 feature?

This plan provides a comprehensive roadmap for building the component marketplace while maintaining compatibility with shadcn registry standards.

### To-dos

- [ ] Initialize Convex project, create schema, and set up ConvexProvider in root route
- [ ] Create editor route with three-panel layout (selector, preview, style editor)
- [ ] Build left sidebar component selector with Firecrawl integration for component discovery
- [ ] Build right sidebar style editor with controls for padding, margin, border, typography, and colors
- [ ] Build center canvas component preview with real-time updates
- [ ] Implement component saving to Convex with registry format conversion
- [ ] Create marketplace route with component listing, search, and category filtering
- [ ] Build 21st.dev-style interactive component overlay with preview and actions
- [ ] Integrate Firecrawl API for scraping and discovering shadcn components
- [ ] Implement registry format utilities and component export functionality