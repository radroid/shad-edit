import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_email', ['email']),

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
})


