import * as Sentry from '@sentry/tanstackstart-react'
import { createRouter } from '@tanstack/react-router'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    // Preload on user intent (hover/focus) and keep preloaded data warm briefly
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 5 * 60 * 1000,
  })

  if (!router.isServer) {
    const dsn = (import.meta as any).env?.VITE_SENTRY_DSN

    if (dsn) {
      Sentry.init({
        dsn,
        // Adds request headers and IP for users, for more info visit:
        // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
        sendDefaultPii: true,
        beforeSend(event, hint) {
          // Filter out known non-critical errors
          if (event.exception) {
            const error = hint.originalException
            if (error instanceof Error) {
              // Ignore localStorage quota errors (common in guest editing)
              if (error.message.includes('QuotaExceededError') || error.message.includes('localStorage')) {
                return null
              }
            }
          }
          return event
        },
      })
    }
  }

  return router
}
