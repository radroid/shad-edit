/**
 * Sentry instrumentation utilities
 * Provides error tracking, performance monitoring, and custom instrumentation
 * 
 * Note: Sentry initialization happens in src/router.tsx (client) and instrument.server.mjs (server)
 */

import * as Sentry from '@sentry/tanstackstart-react'

/**
 * Track guest editor usage
 */
export function trackGuestEdit(componentId: string, action: 'edit' | 'save' | 'clear' | 'migrate') {
  Sentry.addBreadcrumb({
    category: 'guest-editor',
    message: `Guest edit: ${action}`,
    level: 'info',
    data: {
      componentId,
      action,
    },
  })
}

/**
 * Track cache operations
 */
export function trackCacheOperation(
  operation: 'read' | 'write' | 'clear' | 'migrate',
  componentId?: string,
  error?: Error
) {
  if (error) {
    Sentry.captureException(error, {
      tags: {
        operation: 'cache',
        cacheOperation: operation,
      },
      extra: {
        componentId,
      },
    })
  } else {
    Sentry.addBreadcrumb({
      category: 'cache',
      message: `Cache ${operation}`,
      level: 'info',
      data: {
        operation,
        componentId,
      },
    })
  }
}

/**
 * Track Tailwind modifier operations
 */
export function trackTailwindModifier(
  operation: 'parse' | 'modify' | 'apply',
  componentId?: string,
  error?: Error
) {
  if (error) {
    Sentry.captureException(error, {
      tags: {
        operation: 'tailwind-modifier',
        modifierOperation: operation,
      },
      extra: {
        componentId,
      },
    })
  } else {
    Sentry.addBreadcrumb({
      category: 'tailwind-modifier',
      message: `Tailwind ${operation}`,
      level: 'info',
      data: {
        operation,
        componentId,
      },
    })
  }
}

/**
 * Track Convex sync events
 */
export function trackConvexSync(
  operation: 'query' | 'mutation' | 'subscription',
  endpoint: string,
  duration?: number,
  error?: Error
) {
  if (error) {
    Sentry.captureException(error, {
      tags: {
        operation: 'convex-sync',
        syncOperation: operation,
      },
      extra: {
        endpoint,
        duration,
      },
    })
  } else if (duration !== undefined) {
    // Track performance via breadcrumbs with timing data
    Sentry.addBreadcrumb({
      category: 'convex-sync',
      message: `Convex ${operation} completed`,
      level: 'info',
      data: {
        operation,
        endpoint,
        duration,
      },
    })
  }
}

/**
 * Track authentication conversion
 */
export function trackAuthConversion(source: 'guest-edit' | 'marketplace' | 'direct') {
  Sentry.addBreadcrumb({
    category: 'auth',
    message: 'User authentication',
    level: 'info',
    data: {
      source,
    },
  })
}

/**
 * Track cache migration
 */
export function trackCacheMigration(
  componentCount: number,
  success: boolean,
  error?: Error
) {
  if (error) {
    Sentry.captureException(error, {
      tags: {
        operation: 'cache-migration',
      },
      extra: {
        componentCount,
        success: false,
      },
    })
  } else {
    Sentry.addBreadcrumb({
      category: 'cache-migration',
      message: `Migrated ${componentCount} components`,
      level: success ? 'info' : 'warning',
      data: {
        componentCount,
        success,
      },
    })
  }
}

/**
 * Sentry Error Boundary wrapper
 * Use this to wrap your error boundary components
 * 
 * Example:
 * ```tsx
 * import { withErrorBoundary } from '@sentry/tanstackstart-react'
 * 
 * export const MySentryWrappedErrorBoundary = withErrorBoundary(
 *   MyErrorBoundary,
 *   {
 *     // ... sentry error wrapper options
 *   }
 * )
 * ```
 */
export { withErrorBoundary } from '@sentry/tanstackstart-react'


