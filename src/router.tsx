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

  return router
}
