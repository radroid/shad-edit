import { mutation } from './_generated/server'

export const ensureUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')
    const now = Date.now()
    const existing = await ctx.db
      .query('users')
      .withIndex('by_external', (q) => q.eq('externalId', identity.subject))
      .unique()
    if (existing) return existing._id
    const userId = await ctx.db.insert('users', {
      externalId: identity.subject,
      name: identity.name ?? undefined,
      email: identity.email ?? undefined,
      avatarUrl: identity.pictureUrl ?? undefined,
      createdAt: now,
    })
    return userId
  },
})


