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
})



