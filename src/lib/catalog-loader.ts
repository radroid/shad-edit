/**
 * Catalog Loader - Loads component configurations from Convex (primary) or file system (fallback)
 */

import type { ComponentConfig } from './component-config'
import { api } from '../../convex/_generated/api'
import type { ConvexClient } from 'convex/browser'

/**
 * Component registry - maps component IDs to their config paths (fallback only)
 * This is used when Convex is not available or for development
 */
const COMPONENT_REGISTRY: Record<string, () => Promise<ComponentConfig>> = {}

/**
 * Register a component configuration (fallback only)
 */
export function registerComponent(
  id: string,
  loader: () => Promise<ComponentConfig>
) {
  COMPONENT_REGISTRY[id] = loader
}

/**
 * Load a component configuration by ID from Convex
 * Falls back to file system if Convex is not available
 */
export async function loadCatalogComponent(
  id: string,
  convexClient?: ConvexClient
): Promise<ComponentConfig | null> {
  // Try Convex first if client is available
  if (convexClient) {
    try {
      const config = await convexClient.query(api.componentConfigs.getComponentConfigById, {
        componentId: id,
      })
      if (config) {
        return config
      }
    } catch (error) {
      console.warn(`Failed to load component ${id} from Convex:`, error)
      // Fall through to file system fallback
    }
  }
  
  // Fallback to file system
  const loader = COMPONENT_REGISTRY[id]
  if (!loader) {
    console.warn(`Component ${id} not found in registry`)
    return null
  }
  
  try {
    return await loader()
  } catch (error) {
    console.error(`Failed to load component ${id}:`, error)
    return null
  }
}

/**
 * Get all registered component IDs (fallback only)
 */
export function getRegisteredComponentIds(): string[] {
  return Object.keys(COMPONENT_REGISTRY)
}

/**
 * Get all component configs from Convex
 * Falls back to file system if Convex is not available
 */
export async function getAllCatalogComponents(
  convexClient?: ConvexClient
): Promise<Array<{ id: string; config: ComponentConfig }>> {
  // Try Convex first if client is available
  if (convexClient) {
    try {
      const configs = await convexClient.query(api.componentConfigs.listPublicComponentConfigs, {})
      return configs.map((config) => ({
        id: config.componentId,
        config: {
          metadata: {
            name: config.name,
            description: config.description,
            category: config.category,
            tags: config.tags,
            author: config.author,
            version: config.version,
          },
          code: config.code,
          properties: config.properties,
          variableMappings: config.variableMappings,
          dependencies: config.dependencies,
          files: config.files,
        } as ComponentConfig,
      }))
    } catch (error) {
      console.warn('Failed to load components from Convex, falling back to file system:', error)
      // Fall through to file system fallback
    }
  }
  
  // Fallback to file system
  const ids = getRegisteredComponentIds()
  const components = await Promise.all(
    ids.map(async (id) => {
      const config = await loadCatalogComponent(id)
      return config ? { id, config } : null
    })
  )
  
  return components.filter(
    (c): c is { id: string; config: ComponentConfig } => c !== null
  )
}

/**
 * Auto-register components from catalog directory
 * This will be called at build/startup time
 */
export function autoRegisterCatalogComponents() {
  // In development, we can use Vite's glob import
  // In production, this would be generated at build time
  
  try {
    // Use Vite's glob import to find all config files
    // Note: This works in both dev and build if configured correctly
    const configModules = import.meta.glob<{ default: ComponentConfig }>(
      '../components/catalog/*/config.json',
      { eager: false }
    )
    
    Object.entries(configModules).forEach(([path, loader]) => {
      // Extract component ID from path: ../components/catalog/{id}/config.json
      const match = path.match(/catalog\/([^/]+)\/config\.json/)
      if (match) {
        const id = match[1]
        registerComponent(id, async () => {
          const module = await loader()
          return module.default || module
        })
      }
    })
  } catch (error) {
    // Silently fail if glob import is not available
    // This allows for manual registration as fallback
    console.warn('Auto-registration of catalog components failed:', error)
  }
}

// Auto-register on module load (only in browser/SSR context)
if (typeof window !== 'undefined' || typeof import.meta !== 'undefined') {
  // Delay registration slightly to ensure glob imports are ready
  if (import.meta.env?.DEV) {
    autoRegisterCatalogComponents()
  }
}

