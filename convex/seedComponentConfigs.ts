import { internalMutation } from './_generated/server'
import { v } from 'convex/values'

/**
 * Seed component configs from JSON files
 * This is an internal mutation that can be called from the Convex dashboard
 * or via a script to populate the componentConfigs table
 */
export const seedComponentConfigs = internalMutation({
  args: {
    configs: v.array(v.object({
      componentId: v.string(),
      name: v.string(),
      description: v.optional(v.string()),
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      author: v.optional(v.string()),
      version: v.optional(v.string()),
      code: v.string(),
      properties: v.array(v.any()),
      variableMappings: v.optional(v.array(v.any())),
      dependencies: v.optional(v.any()),
      files: v.optional(v.array(v.any())),
      authorId: v.id('users'),
    })),
  },
  handler: async (ctx, { configs }) => {
    const now = Date.now()
    const results = []
    
    for (const config of configs) {
      // Check if config already exists
      const existing = await ctx.db
        .query('componentConfigs')
        .withIndex('by_componentId', (q) => q.eq('componentId', config.componentId))
        .first()
      
      if (existing) {
        // Update existing
        await ctx.db.patch(existing._id, {
          ...config,
          updatedAt: now,
        })
        results.push({ componentId: config.componentId, action: 'updated', id: existing._id })
      } else {
        // Create new
        const id = await ctx.db.insert('componentConfigs', {
          ...config,
          createdAt: now,
          updatedAt: now,
        })
        results.push({ componentId: config.componentId, action: 'created', id })
      }
    }
    
    return results
  },
})

