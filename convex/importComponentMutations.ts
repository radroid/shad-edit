import { internalMutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import { v } from 'convex/values'

/**
 * Internal mutation to save imported component
 * This must be in a separate file without "use node" directive
 * because mutations cannot be defined in Node.js files
 */
export const saveImportedComponent = internalMutation({
  args: {
    componentId: v.string(),
    componentConfig: v.any(),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, { componentId, componentConfig, sourceUrl }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()

    if (!user) throw new Error('User not found')

    const now = Date.now()

    // Check if component already exists
    const existing = await ctx.db
      .query('componentConfigs')
      .withIndex('by_componentId', (q) => q.eq('componentId', componentId))
      .first()

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        name: componentConfig.metadata.name,
        description: componentConfig.metadata.description,
        category: componentConfig.metadata.category,
        tags: componentConfig.metadata.tags,
        author: componentConfig.metadata.author,
        version: componentConfig.metadata.version,
        code: componentConfig.code,
        properties: componentConfig.properties,
        editableElements: componentConfig.editableElements,
        globalProperties: componentConfig.globalProperties,
        variableMappings: componentConfig.variableMappings,
        dependencies: componentConfig.dependencies,
        files: componentConfig.files,
        variants: componentConfig.variants,
        propSections: componentConfig.propSections,
        sourceUrl: sourceUrl ?? existing.sourceUrl,
        updatedAt: now,
      })
      await upsertCatalogComponent(ctx, {
        componentId,
        componentConfig,
        now,
      })
      return existing._id
    }

    // Create new component config
    const id = await ctx.db.insert('componentConfigs', {
      componentId,
      name: componentConfig.metadata.name,
      description: componentConfig.metadata.description,
      category: componentConfig.metadata.category,
      tags: componentConfig.metadata.tags,
      author: componentConfig.metadata.author,
      version: componentConfig.metadata.version,
      code: componentConfig.code,
      properties: componentConfig.properties,
      editableElements: componentConfig.editableElements,
      globalProperties: componentConfig.globalProperties,
      variableMappings: componentConfig.variableMappings,
      dependencies: componentConfig.dependencies,
      files: componentConfig.files,
      variants: componentConfig.variants,
      propSections: componentConfig.propSections,
      authorId: user._id,
      sourceUrl: sourceUrl,
      createdAt: now,
      updatedAt: now,
    })

    await upsertCatalogComponent(ctx, {
      componentId,
      componentConfig,
      now,
    })

    return id
  },
})

async function upsertCatalogComponent(
  ctx: MutationCtx,
  {
    componentId,
    componentConfig,
    now,
  }: {
    componentId: string
    componentConfig: any
    now: number
  }
) {
  const existingCatalog = await ctx.db
    .query('catalogComponents')
    .withIndex('by_componentId', (q) => q.eq('componentId', componentId))
    .first()

  const payload = {
    name: componentConfig.metadata.name,
    description: componentConfig.metadata.description,
    category: componentConfig.metadata.category,
    tags: componentConfig.metadata.tags,
    author: componentConfig.metadata.author,
    version: componentConfig.metadata.version || '1.0.0',
    code: componentConfig.code,
    tailwindProperties: componentConfig.properties || [],
    editableElements: componentConfig.editableElements,
    globalProperties: componentConfig.globalProperties,
    propSections: componentConfig.propSections,
    variants: componentConfig.variants || [],
    dependencies: componentConfig.dependencies,
    files: componentConfig.files,
    updatedAt: now,
  }

  if (existingCatalog) {
    await ctx.db.patch(existingCatalog._id, payload)
  } else {
    await ctx.db.insert('catalogComponents', {
      componentId,
      ...payload,
      createdAt: now,
    })
  }
}

