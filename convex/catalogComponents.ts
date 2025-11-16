import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * List all public catalog components
 */
export const listCatalogComponents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('catalogComponents')
      .collect()
  },
})

/**
 * Get a single catalog component by componentId
 */
export const getCatalogComponent = query({
  args: { componentId: v.string() },
  handler: async (ctx, { componentId }) => {
    const component = await ctx.db
      .query('catalogComponents')
      .withIndex('by_componentId', (q) => q.eq('componentId', componentId))
      .first()
    
    return component
  },
})

/**
 * Get catalog components by category
 */
export const getCatalogComponentsByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    return await ctx.db
      .query('catalogComponents')
      .withIndex('by_category', (q) => q.eq('category', category))
      .collect()
  },
})

/**
 * Add a component to the catalog (admin function)
 */
export const addCatalogComponent = mutation({
  args: {
    componentId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    author: v.optional(v.string()),
    version: v.string(),
    code: v.string(),
    tailwindProperties: v.array(v.any()),
    editableElements: v.optional(v.array(v.any())),
    globalProperties: v.optional(v.array(v.any())),
    propSections: v.optional(v.array(v.any())),
    variants: v.array(v.any()),
    dependencies: v.optional(v.any()),
    files: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    
    // Check if component already exists
    const existing = await ctx.db
      .query('catalogComponents')
      .withIndex('by_componentId', (q) => q.eq('componentId', args.componentId))
      .first()
    
    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        name: args.name,
        description: args.description,
        category: args.category,
        tags: args.tags,
        author: args.author,
        version: args.version,
        code: args.code,
        tailwindProperties: args.tailwindProperties,
        editableElements: args.editableElements,
        globalProperties: args.globalProperties,
        propSections: args.propSections,
        variants: args.variants,
        dependencies: args.dependencies,
        files: args.files,
        updatedAt: now,
      })
      return existing._id
    } else {
      // Create new
      return await ctx.db.insert('catalogComponents', {
        componentId: args.componentId,
        name: args.name,
        description: args.description,
        category: args.category,
        tags: args.tags,
        author: args.author,
        version: args.version,
        code: args.code,
        tailwindProperties: args.tailwindProperties,
        editableElements: args.editableElements,
        globalProperties: args.globalProperties,
        propSections: args.propSections,
        variants: args.variants,
        dependencies: args.dependencies,
        files: args.files,
        createdAt: now,
        updatedAt: now,
      })
    }
  },
})

/**
 * Update a catalog component's editableElements and globalProperties
 * This is used by the migration script
 */
export const updateCatalogComponent = mutation({
  args: {
    componentId: v.string(),
    editableElements: v.optional(v.array(v.any())),
    globalProperties: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('catalogComponents')
      .withIndex('by_componentId', (q) => q.eq('componentId', args.componentId))
      .first()
    
    if (!existing) {
      throw new Error(`Component with ID ${args.componentId} not found`)
    }
    
    await ctx.db.patch(existing._id, {
      editableElements: args.editableElements,
      globalProperties: args.globalProperties,
      updatedAt: Date.now(),
    })
    
    return existing._id
  },
})

