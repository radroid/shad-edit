import { mutation, query } from './_generated/server'
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
    registryData: v.optional(v.any()),
    customizations: v.optional(v.any()),
    sourceComponent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    if (!user) throw new Error('User not found')
    const now = Date.now()
    const id = await ctx.db.insert('components', {
      ...args,
      authorId: user._id,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    })
    return id
  },
})

export const publishComponent = mutation({
  args: { componentId: v.id('components') },
  handler: async (ctx, { componentId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    if (!user) throw new Error('User not found')
    const component = await ctx.db.get(componentId)
    if (!component) throw new Error('Component not found')
    if (component.authorId !== user._id) throw new Error('Forbidden')
    await ctx.db.patch(componentId, { isPublic: true, updatedAt: Date.now() })
    return componentId
  },
})

export const listMyComponents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    if (!user) throw new Error('User not found')
    return ctx.db
      .query('components')
      .withIndex('by_author', (q) => q.eq('authorId', user._id))
      .collect()
  },
})


