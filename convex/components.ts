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
    registryData: v.optional(v.any()), // Contains: { code, config: ComponentConfig }
    customizations: v.optional(v.any()), // Property values
    sourceComponent: v.optional(v.string()), // Catalog componentId this was based on
    forkFrom: v.optional(v.id('components')),
    componentId: v.optional(v.id('components')), // For updates
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
    // derive ownerTag from first 6 chars of email if present
    const ownerTag = identity.email ? identity.email.slice(0, 6) : undefined
    
    // If componentId is provided, update existing component
    if (args.componentId) {
      const existing = await ctx.db.get(args.componentId)
      if (!existing) throw new Error('Component not found')
      if (existing.authorId !== user._id) throw new Error('Forbidden')
      
      await ctx.db.patch(args.componentId, {
        name: args.name,
        description: args.description,
        category: args.category,
        registryData: args.registryData,
        customizations: args.customizations,
        sourceComponent: args.sourceComponent,
        updatedAt: now,
      })
      return args.componentId
    }
    
    // Create new component (draft)
    const id = await ctx.db.insert('components', {
      name: args.name,
      description: args.description,
      category: args.category,
      registryData: args.registryData, // Stores code and config
      customizations: args.customizations, // Property values
      sourceComponent: args.sourceComponent, // Original catalog componentId
      authorId: user._id,
      isPublic: false, // Always start as draft
      ownerTag,
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
    
    const now = Date.now()
    
    // Get the component config from the component's registryData
    const registryData = component.registryData as any
    if (!registryData || !registryData.config) {
      throw new Error('Component config not found in registryData')
    }
    
    const config = registryData.config
    
    // Extract componentId from component name or use a generated one
    const catalogComponentId = component.sourceComponent || 
      component.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    
    // Check if config already exists in catalog
    const existingConfig = await ctx.db
      .query('componentConfigs')
      .withIndex('by_componentId', (q) => q.eq('componentId', catalogComponentId))
      .first()
    
    if (existingConfig) {
      // Update existing config (only if user is the author)
      if (existingConfig.authorId !== user._id) {
        throw new Error('Component with this ID already exists in catalog')
      }
      
      await ctx.db.patch(existingConfig._id, {
        name: config.metadata?.name || component.name,
        description: config.metadata?.description || component.description,
        category: config.metadata?.category || component.category,
        tags: config.metadata?.tags,
        author: config.metadata?.author || user.email || 'Unknown',
        version: config.metadata?.version || '1.0.0',
        code: config.code || component.registryData?.code || '',
        properties: config.properties || [],
        variableMappings: config.variableMappings,
        dependencies: config.dependencies,
        files: config.files,
        updatedAt: now,
      })
    } else {
      // Create new config in catalog
      await ctx.db.insert('componentConfigs', {
        componentId: catalogComponentId,
        name: config.metadata?.name || component.name,
        description: config.metadata?.description || component.description,
        category: config.metadata?.category || component.category,
        tags: config.metadata?.tags,
        author: config.metadata?.author || user.email || 'Unknown',
        version: config.metadata?.version || '1.0.0',
        code: config.code || component.registryData?.code || '',
        properties: config.properties || [],
        variableMappings: config.variableMappings,
        dependencies: config.dependencies,
        files: config.files,
        authorId: user._id,
        createdAt: now,
        updatedAt: now,
      })
    }
    
    // Mark component as published
    await ctx.db.patch(componentId, { 
      isPublic: true, 
      updatedAt: now,
      publishedCode: config.code || component.registryData?.code,
    })
    
    return { componentId, catalogComponentId }
  },
})

export const listMyComponents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    let user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    if (!user) {
      // In a query we cannot write. If user is missing, return empty list.
      return []
    }
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

// Create a private fork of a public component for a specific user
export const forkComponent = mutation({
  args: { componentId: v.id('components') },
  handler: async (ctx, { componentId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    if (!user) throw new Error('User not found')

    const base = await ctx.db.get(componentId)
    if (!base || !base.isPublic) throw new Error('Base component not public')

    const now = Date.now()
    const ownerTag = identity.email ? identity.email.slice(0, 6) : undefined
    const newId = await ctx.db.insert('components', {
      name: `${base.name}${ownerTag ? ` @${ownerTag}` : ''}`,
      description: base.description,
      category: base.category,
      authorId: user._id,
      registryData: base.registryData,
      customizations: base.customizations,
      sourceComponent: base.sourceComponent,
      isPublic: false,
      ownerTag,
      createdAt: now,
      updatedAt: now,
    })
    return newId
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


