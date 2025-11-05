import { mutation } from 'convex/server'
import { v } from 'convex/values'

export const upsertUser = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = args.email
      ? await ctx.db
          .query('users')
          .withIndex('by_email', (q) => q.eq('email', args.email))
          .unique()
      : null
    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, { ...args })
      return existing._id
    }
    return await ctx.db.insert('users', { ...args, createdAt: now })
  },
})


