import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

/**
 * Add a catalog component to a project
 */
export const addComponentToProject = mutation({
  args: {
    projectId: v.id('projects'),
    catalogComponentId: v.string(),
    customCode: v.optional(v.string()),
    cssVariables: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    
    if (!user) throw new Error('User not found')
    
    // Verify project ownership
    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error('Project not found')
    if (project.authorId !== user._id) throw new Error('Forbidden')
    
    // Get catalog component
    const catalogComponent = await ctx.db
      .query('catalogComponents')
      .withIndex('by_componentId', (q) => q.eq('componentId', args.catalogComponentId))
      .first()
    
    if (!catalogComponent) throw new Error('Catalog component not found')
    
    // Get username for default name
    const username = user.email?.split('@')[0] || 'user'
    const defaultName = `${catalogComponent.name}-${username}`
    
    // Get current max order
    const existingComponents = await ctx.db
      .query('projectComponents')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect()
    
    const maxOrder = existingComponents.length > 0
      ? Math.max(...existingComponents.map(c => c.order))
      : -1
    
    const now = Date.now()
    
    // Get default variant (first variant or 'default')
    const defaultVariant = catalogComponent.variants?.[0]?.name || 'default'
    const defaultVariantProps = catalogComponent.variants?.find(
      (v: any) => v.name === defaultVariant
    )?.properties || {}
    
    const componentId = await ctx.db.insert('projectComponents', {
      projectId: args.projectId,
      catalogComponentId: args.catalogComponentId,
      name: defaultName,
      selectedVariant: defaultVariant,
      variantProperties: defaultVariantProps,
      tailwindOverrides: {},
      customCode: args.customCode,
      cssVariables: args.cssVariables,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    })
    
    return componentId
  },
})

/**
 * List all components in a project
 */
export const listProjectComponents = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    
    if (!user) return []
    
    // Verify project ownership
    const project = await ctx.db.get(projectId)
    if (!project) return []
    if (project.authorId !== user._id) return []
    
    const components = await ctx.db
      .query('projectComponents')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect()
    
    // Sort by order
    return components.sort((a, b) => a.order - b.order)
  },
})

/**
 * Get a single project component
 */
export const getProjectComponent = query({
  args: { componentId: v.id('projectComponents') },
  handler: async (ctx, { componentId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    
    if (!user) return null
    
    const component = await ctx.db.get(componentId)
    if (!component) return null
    
    // Verify project ownership
    const project = await ctx.db.get(component.projectId)
    if (!project) return null
    if (project.authorId !== user._id) return null
    
    return component
  },
})

/**
 * Update component variant and properties (with debouncing handled client-side)
 */
export const updateComponentVariant = mutation({
  args: {
    componentId: v.id('projectComponents'),
    variant: v.optional(v.string()),
    properties: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    
    if (!user) throw new Error('User not found')
    
    const component = await ctx.db.get(args.componentId)
    if (!component) throw new Error('Component not found')
    
    // Verify project ownership
    const project = await ctx.db.get(component.projectId)
    if (!project) throw new Error('Project not found')
    if (project.authorId !== user._id) throw new Error('Forbidden')
    
    const updates: any = {
      updatedAt: Date.now(),
    }
    
    if (args.variant !== undefined) {
      updates.selectedVariant = args.variant
    }
    
    if (args.properties !== undefined) {
      updates.variantProperties = args.properties
    }
    
    await ctx.db.patch(args.componentId, updates)
    
    return { success: true }
  },
})

/**
 * Update component Tailwind overrides
 */
export const updateComponentOverride = mutation({
  args: {
    componentId: v.id('projectComponents'),
    tailwindOverrides: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    
    if (!user) throw new Error('User not found')
    
    const component = await ctx.db.get(args.componentId)
    if (!component) throw new Error('Component not found')
    
    // Verify project ownership
    const project = await ctx.db.get(component.projectId)
    if (!project) throw new Error('Project not found')
    if (project.authorId !== user._id) throw new Error('Forbidden')
    
    await ctx.db.patch(args.componentId, {
      tailwindOverrides: args.tailwindOverrides,
      updatedAt: Date.now(),
    })
    
    return { success: true }
  },
})

/**
 * Update component name (called on blur)
 */
export const updateComponentName = mutation({
  args: {
    componentId: v.id('projectComponents'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    
    if (!user) throw new Error('User not found')
    
    const component = await ctx.db.get(args.componentId)
    if (!component) throw new Error('Component not found')
    
    // Verify project ownership
    const project = await ctx.db.get(component.projectId)
    if (!project) throw new Error('Project not found')
    if (project.authorId !== user._id) throw new Error('Forbidden')
    
    await ctx.db.patch(args.componentId, {
      name: args.name,
      updatedAt: Date.now(),
    })
    
    return { success: true }
  },
})

/**
 * Remove component from project
 */
export const removeComponentFromProject = mutation({
  args: { componentId: v.id('projectComponents') },
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
    
    // Verify project ownership
    const project = await ctx.db.get(component.projectId)
    if (!project) throw new Error('Project not found')
    if (project.authorId !== user._id) throw new Error('Forbidden')
    
    await ctx.db.delete(componentId)
    
    return { success: true }
  },
})

