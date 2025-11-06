import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

/**
 * Create a new project with default theme
 */
export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    defaultTheme: v.optional(v.any()),
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
    
    // Default theme based on shadcn default
    const defaultThemeConfig = args.defaultTheme || {
      colors: {
        primary: 'hsl(222.2 47.4% 11.2%)',
        primaryForeground: 'hsl(210 40% 98%)',
        secondary: 'hsl(210 40% 96.1%)',
        secondaryForeground: 'hsl(222.2 47.4% 11.2%)',
        accent: 'hsl(210 40% 96.1%)',
        accentForeground: 'hsl(222.2 47.4% 11.2%)',
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(222.2 47.4% 11.2%)',
        card: 'hsl(0 0% 100%)',
        cardForeground: 'hsl(222.2 47.4% 11.2%)',
        popover: 'hsl(0 0% 100%)',
        popoverForeground: 'hsl(222.2 47.4% 11.2%)',
        muted: 'hsl(210 40% 96.1%)',
        mutedForeground: 'hsl(215.4 16.3% 46.9%)',
        destructive: 'hsl(0 84.2% 60.2%)',
        destructiveForeground: 'hsl(210 40% 98%)',
        border: 'hsl(214.3 31.8% 91.4%)',
        input: 'hsl(214.3 31.8% 91.4%)',
        ring: 'hsl(222.2 84% 4.9%)',
        chart1: 'hsl(12 76% 61%)',
        chart2: 'hsl(173 58% 39%)',
        chart3: 'hsl(197 37% 24%)',
        chart4: 'hsl(43 74% 66%)',
        chart5: 'hsl(27 87% 67%)',
      },
      typography: {
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: {
          base: '1rem',
          sm: '0.875rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
        },
      },
      spacing: {
        scale: 1.0,
      },
      borderRadius: {
        default: '0.5rem',
        sm: '0.25rem',
        lg: '0.75rem',
      },
    }
    
    const projectId = await ctx.db.insert('projects', {
      name: args.name,
      description: args.description,
      authorId: user._id,
      globalTheme: defaultThemeConfig,
      createdAt: now,
      updatedAt: now,
    })
    
    return projectId
  },
})

/**
 * List all projects for the authenticated user
 */
export const listUserProjects = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    
    if (!user) return []
    
    return await ctx.db
      .query('projects')
      .withIndex('by_author', (q) => q.eq('authorId', user._id))
      .collect()
  },
})

/**
 * Get a single project by ID
 */
export const getProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    
    if (!user) throw new Error('User not found')
    
    const project = await ctx.db.get(projectId)
    if (!project) return null
    
    // Only allow access to own projects
    if (project.authorId !== user._id) {
      throw new Error('Forbidden')
    }
    
    return project
  },
})

/**
 * Update project theme with real-time sync
 */
export const updateProjectTheme = mutation({
  args: {
    projectId: v.id('projects'),
    globalTheme: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    
    if (!user) throw new Error('User not found')
    
    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error('Project not found')
    
    if (project.authorId !== user._id) {
      throw new Error('Forbidden')
    }
    
    await ctx.db.patch(args.projectId, {
      globalTheme: args.globalTheme,
      updatedAt: Date.now(),
    })
    
    return { success: true }
  },
})

/**
 * Delete a project
 */
export const deleteProject = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, { projectId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    
    if (!user) throw new Error('User not found')
    
    const project = await ctx.db.get(projectId)
    if (!project) throw new Error('Project not found')
    
    if (project.authorId !== user._id) {
      throw new Error('Forbidden')
    }
    
    // Delete all project components first
    const components = await ctx.db
      .query('projectComponents')
      .withIndex('by_project', (q) => q.eq('projectId', projectId))
      .collect()
    
    for (const component of components) {
      await ctx.db.delete(component._id)
    }
    
    // Delete the project
    await ctx.db.delete(projectId)
    
    return { success: true }
  },
})

