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

  components: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    authorId: v.id('users'),
    registryData: v.optional(v.any()),
    customizations: v.optional(v.any()),
    sourceComponent: v.optional(v.string()),
    isPublic: v.boolean(),
    // snapshot of published artifact code (tsx)
    publishedCode: v.optional(v.string()),
    ownerTag: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_public', ['isPublic']).index('by_author', ['authorId']),

  // Each component can have multiple variants (e.g., sizes, styles)
  variants: defineTable({
    componentId: v.id('components'),
    name: v.string(),
    // points to the latest version for quick access
    latestVersion: v.optional(v.number()),
    createdBy: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_component', ['componentId'])
    .index('by_component_name', ['componentId', 'name']),

  // Immutable version history for a variant
  variantVersions: defineTable({
    variantId: v.id('variants'),
    version: v.number(), // monotonically increasing
    // complete artifact snapshot for rendering and rollbacks
    code: v.optional(v.string()),
    schema: v.optional(v.any()),
    // minimal structured changeset to understand what changed
    changeset: v.optional(v.any()),
    createdBy: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_variant', ['variantId'])
    .index('by_variant_version', ['variantId', 'version']),

  // Component configurations - publicly readable catalog
  componentConfigs: defineTable({
    // Unique identifier (e.g., 'button', 'input')
    componentId: v.string(),
    
    // Metadata fields (flattened for easy querying)
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    author: v.optional(v.string()),
    version: v.optional(v.string()),
    
    // Component code template
    code: v.string(),
    
    // Properties array (stored as JSON)
    properties: v.array(v.any()),
    
    // Variable mappings (optional, stored as JSON)
    variableMappings: v.optional(v.array(v.any())),
    
    // Dependencies (optional, stored as JSON)
    dependencies: v.optional(v.any()),
    
    // Files (optional, stored as JSON)
    files: v.optional(v.array(v.any())),
    
    // Author information
    authorId: v.id('users'),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_componentId', ['componentId'])
    .index('by_category', ['category'])
    .index('by_author', ['authorId']),
})



