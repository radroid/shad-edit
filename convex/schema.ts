import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_email', ['email'])
    .index('by_external', ['externalId']),

  // Public catalog components (read-only for users, admin-created)
  catalogComponents: defineTable({
    componentId: v.string(),        // e.g., 'button', 'card'
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    author: v.optional(v.string()),
    version: v.string(),
    
    // Component code with Tailwind classes
    code: v.string(),
    
    // Extractable Tailwind properties (padding, margin, colors, etc.)
    tailwindProperties: v.array(v.any()),
    
    // Default variant configurations
    variants: v.array(v.any()),
    
    dependencies: v.optional(v.any()),
    files: v.optional(v.array(v.any())),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_componentId', ['componentId'])
    .index('by_category', ['category']),

  // User projects with global theme config
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    authorId: v.id('users'),
    
    // Global theme (like tweakcn)
    globalTheme: v.any(), // Using v.any() because Convex doesn't support hyphens in object keys
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_author', ['authorId']),

  // Project-specific component instances
  projectComponents: defineTable({
    projectId: v.id('projects'),
    catalogComponentId: v.string(), // Reference to catalogComponents
    
    name: v.string(), // e.g., 'button-username'
    
    // Selected variant name
    selectedVariant: v.string(),
    
    // Variant-specific property overrides
    variantProperties: v.any(),
    
    // Custom Tailwind class overrides (user edits)
    tailwindOverrides: v.any(),
    
    // Modified code (if user customized beyond props)
    customCode: v.optional(v.string()),
    
    order: v.number(), // Display order in project
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_project', ['projectId'])
    .index('by_project_catalog', ['projectId', 'catalogComponentId']),
})
