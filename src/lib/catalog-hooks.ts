/**
 * React hooks for loading component configs from Convex
 */

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { ComponentConfig } from './component-config'

/**
 * Hook to get all component configs
 */
export function useCatalogComponents() {
  const configs = useQuery(api.componentConfigs.listPublicComponentConfigs, {})
  
  if (!configs) return { components: [], isLoading: true }
  
  const components: Array<{ id: string; config: ComponentConfig }> = configs.map((config) => ({
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
  
  return { components, isLoading: false }
}

/**
 * Hook to get a single component config by ID
 */
export function useCatalogComponent(componentId: string | undefined) {
  const config = useQuery(
    api.componentConfigs.getComponentConfigById,
    componentId ? { componentId } : 'skip'
  ) as ComponentConfig | null | undefined
  
  if (!componentId) return { config: null, isLoading: false }
  if (config === undefined) return { config: null, isLoading: true }
  if (!config) return { config: null, isLoading: false }
  
  return { config, isLoading: false }
}

