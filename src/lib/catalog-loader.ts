/**
 * Catalog Loader - Loads component configurations from Convex
 * 
 * Note: All component configs are stored in Convex database.
 * The catalog directory has been removed as we use Convex as the source of truth.
 */

import type { ComponentConfig } from './component-config'
import { api } from '../../convex/_generated/api'
import type { ConvexClient } from 'convex/browser'

/**
 * Load a component configuration by ID from Convex
 * @deprecated Use React hooks (useCatalogComponent) instead
 */
export async function loadCatalogComponent(
  id: string,
  convexClient?: ConvexClient
): Promise<ComponentConfig | null> {
  if (!convexClient) {
    console.warn('Convex client not available')
    return null
  }
  
  try {
    const config = await convexClient.query(api.componentConfigs.getComponentConfigById, {
      componentId: id,
    })
    return config
  } catch (error) {
    console.error(`Failed to load component ${id} from Convex:`, error)
    return null
  }
}

/**
 * Get all component configs from Convex
 * @deprecated Use React hooks (useCatalogComponents) instead
 */
export async function getAllCatalogComponents(
  convexClient?: ConvexClient
): Promise<Array<{ id: string; config: ComponentConfig }>> {
  if (!convexClient) {
    console.warn('Convex client not available')
    return []
  }
  
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
    console.error('Failed to load components from Convex:', error)
    return []
  }
}

