/**
 * Catalog Loader - Loads component configurations from the catalog directory
 */

import type { ComponentConfig } from './component-config'

/**
 * Component registry - maps component IDs to their config paths
 * This can be auto-generated at build time or manually maintained
 */
const COMPONENT_REGISTRY: Record<string, () => Promise<ComponentConfig>> = {}

/**
 * Register a component configuration
 */
export function registerComponent(
  id: string,
  loader: () => Promise<ComponentConfig>
) {
  COMPONENT_REGISTRY[id] = loader
}

/**
 * Load a component configuration by ID
 */
export async function loadCatalogComponent(
  id: string
): Promise<ComponentConfig | null> {
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
 * Get all registered component IDs
 */
export function getRegisteredComponentIds(): string[] {
  return Object.keys(COMPONENT_REGISTRY)
}

/**
 * Get all component configs (for marketplace listing)
 */
export async function getAllCatalogComponents(): Promise<
  Array<{ id: string; config: ComponentConfig }>
> {
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

