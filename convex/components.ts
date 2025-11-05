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

// Variant & Versioning API
export const listVariantsForComponent = query({
  args: { componentId: v.id('components') },
  handler: async (ctx, { componentId }) => {
    return await ctx.db
      .query('variants')
      .withIndex('by_component', (q) => q.eq('componentId', componentId))
      .collect()
  },
})

export const getVariantWithLatestVersion = query({
  args: { variantId: v.id('variants') },
  handler: async (ctx, { variantId }) => {
    const variant = await ctx.db.get(variantId)
    if (!variant) return null
    let latest = null as any
    if (typeof variant.latestVersion === 'number') {
      latest = await ctx.db
        .query('variantVersions')
        .withIndex('by_variant_version', (q) => q.eq('variantId', variantId))
        .filter((q) => q.eq(q.field('version'), variant.latestVersion))
        .first()
    }
    return { variant, latest }
  },
})

export const createVariant = mutation({
  args: {
    componentId: v.id('components'),
    name: v.string(),
    initialCode: v.optional(v.string()),
    initialSchema: v.optional(v.any()),
  },
  handler: async (ctx, { componentId, name, initialCode, initialSchema }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    if (!user) throw new Error('User not found')
    const now = Date.now()
    const variantId = await ctx.db.insert('variants', {
      componentId,
      name,
      latestVersion: 0,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    })
    // create version 1 if provided
    if (initialCode || initialSchema) {
      await ctx.db.insert('variantVersions', {
        variantId,
        version: 1,
        code: initialCode,
        schema: initialSchema,
        changeset: { type: 'init' },
        createdBy: user._id,
        createdAt: now,
      })
      await ctx.db.patch(variantId, { latestVersion: 1, updatedAt: now })
    }
    return variantId
  },
})

export const createVariantVersion = mutation({
  args: {
    variantId: v.id('variants'),
    code: v.optional(v.string()),
    schema: v.optional(v.any()),
    changeset: v.optional(v.any()),
  },
  handler: async (ctx, { variantId, code, schema, changeset }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    if (!user) throw new Error('User not found')
    const variant = await ctx.db.get(variantId)
    if (!variant) throw new Error('Variant not found')
    const now = Date.now()
    const nextVersion = (variant.latestVersion ?? 0) + 1
    await ctx.db.insert('variantVersions', {
      variantId,
      version: nextVersion,
      code,
      schema,
      changeset,
      createdBy: user._id,
      createdAt: now,
    })
    await ctx.db.patch(variantId, { latestVersion: nextVersion, updatedAt: now })
    return nextVersion
  },
})

export const listVariantVersions = query({
  args: { variantId: v.id('variants') },
  handler: async (ctx, { variantId }) => {
    return await ctx.db
      .query('variantVersions')
      .withIndex('by_variant', (q) => q.eq('variantId', variantId))
      .collect()
  },
})


