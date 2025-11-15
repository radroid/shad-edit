import { mutation, query } from './_generated/server'
import { v } from 'convex/values'
import type { ComponentConfig } from '../src/lib/component-config'

/**
 * List all public component configs (publicly readable)
 */
export const listPublicComponentConfigs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('componentConfigs')
      .collect()
  },
})

/**
 * Get a component config by componentId (publicly readable)
 */
export const getComponentConfigById = query({
  args: { componentId: v.string() },
  handler: async (ctx, { componentId }) => {
    const config = await ctx.db
      .query('componentConfigs')
      .withIndex('by_componentId', (q) => q.eq('componentId', componentId))
      .first()
    
    if (!config) return null
    
    // Convert database record to ComponentConfig format
    return {
      metadata: {
        name: config.name,
        description: config.description,
        category: config.category,
        tags: config.tags,
        author: config.author,
        version: config.version,
      },
      code: config.code,
      properties: config.properties,
      editableElements: config.editableElements,
      globalProperties: config.globalProperties,
      variableMappings: config.variableMappings,
      dependencies: config.dependencies,
      files: config.files,
      variants: config.variants,
    } as ComponentConfig
  },
})

/**
 * Get component configs by category (publicly readable)
 */
export const getComponentConfigsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    return await ctx.db
      .query('componentConfigs')
      .withIndex('by_category', (q) => q.eq('category', category))
      .collect()
  },
})

/**
 * Create or update a component config (requires auth)
 */
export const upsertComponentConfig = mutation({
  args: {
    componentId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    author: v.optional(v.string()),
    version: v.optional(v.string()),
    code: v.string(),
    properties: v.array(v.any()),
    editableElements: v.optional(v.array(v.any())),
    globalProperties: v.optional(v.array(v.any())),
    variableMappings: v.optional(v.array(v.any())),
    dependencies: v.optional(v.any()),
    files: v.optional(v.array(v.any())),
    variants: v.optional(v.array(v.any())),
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
    
    // Check if config already exists
    const existing = await ctx.db
      .query('componentConfigs')
      .withIndex('by_componentId', (q) => q.eq('componentId', args.componentId))
      .first()
    
    if (existing) {
      // Update existing config (only if user is the author)
      if (existing.authorId !== user._id) {
        throw new Error('Only the author can update this component config')
      }
      
      await ctx.db.patch(existing._id, {
        name: args.name,
        description: args.description,
        category: args.category,
        tags: args.tags,
        author: args.author,
        version: args.version,
        code: args.code,
        properties: args.properties,
        editableElements: args.editableElements,
        globalProperties: args.globalProperties,
        variableMappings: args.variableMappings,
        dependencies: args.dependencies,
        files: args.files,
        variants: args.variants,
        updatedAt: now,
      })
      
      return existing._id
    } else {
      // Create new config
      const id = await ctx.db.insert('componentConfigs', {
        componentId: args.componentId,
        name: args.name,
        description: args.description,
        category: args.category,
        tags: args.tags,
        author: args.author || identity.email || 'Unknown',
        version: args.version || '1.0.0',
        code: args.code,
        properties: args.properties,
        editableElements: args.editableElements,
        globalProperties: args.globalProperties,
        variableMappings: args.variableMappings,
        dependencies: args.dependencies,
        files: args.files,
        variants: args.variants,
        authorId: user._id,
        createdAt: now,
        updatedAt: now,
      })
      
      return id
    }
  },
})

/**
 * Delete a component config (requires auth, only author can delete)
 */
export const deleteComponentConfig = mutation({
  args: { componentId: v.string() },
  handler: async (ctx, { componentId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    
    if (!user) throw new Error('User not found')
    
    const config = await ctx.db
      .query('componentConfigs')
      .withIndex('by_componentId', (q) => q.eq('componentId', componentId))
      .first()
    
    if (!config) throw new Error('Component config not found')
    
    if (config.authorId !== user._id) {
      throw new Error('Only the author can delete this component config')
    }
    
    await ctx.db.delete(config._id)
    return { success: true }
  },
})

/**
 * Get component configs by author (publicly readable)
 */
export const getComponentConfigsByAuthor = query({
  args: { authorId: v.id('users') },
  handler: async (ctx, { authorId }) => {
    return await ctx.db
      .query('componentConfigs')
      .withIndex('by_author', (q) => q.eq('authorId', authorId))
      .collect()
  },
})

