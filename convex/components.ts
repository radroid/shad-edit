import { mutation, query } from 'convex/server'
import { v } from 'convex/values'

export const listPublicComponents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('components')
      .withIndex('by_public', (q) => q.eq('isPublic', true))
      .collect()
  },
})

export const saveComponent = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    authorId: v.id('users'),
    registryData: v.optional(v.any()),
    customizations: v.optional(v.any()),
    sourceComponent: v.optional(v.string()),
    isPublic: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    const id = await ctx.db.insert('components', {
      ...args,
      createdAt: now,
      updatedAt: now,
    })
    return id
  },
})


