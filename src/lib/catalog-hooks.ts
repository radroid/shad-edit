/**
 * React hooks for loading component configs from Convex
 */

import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { ComponentConfig } from './component-config'

/**
 * Hook to get all catalog components
 */
export function useCatalogComponents() {
  const components = useQuery(api.catalogComponents.listCatalogComponents, {})
  
  if (components === undefined) return { components: [], isLoading: true }
  
  const formatted: Array<{ id: string; config: ComponentConfig }> = components.map((comp) => ({
    id: comp.componentId,
    config: {
      metadata: {
        name: comp.name,
        description: comp.description,
        category: comp.category,
        tags: comp.tags,
        author: comp.author,
        version: comp.version,
      },
      code: comp.code,
      properties: comp.tailwindProperties || [],
      editableElements: comp.editableElements,
      globalProperties: comp.globalProperties,
      variableMappings: [],
      dependencies: comp.dependencies,
      files: comp.files,
      variants: comp.variants || [],
    } as ComponentConfig & { variants?: any[] },
  }))
  
  return { components: formatted, isLoading: false }
}

/**
 * Hook to get a single catalog component by ID
 */
export function useCatalogComponent(componentId: string | undefined) {
  const component = useQuery(
    api.catalogComponents.getCatalogComponent,
    componentId ? { componentId } : 'skip'
  )
  
  if (!componentId) return { config: null, isLoading: false }
  if (component === undefined) return { config: null, isLoading: true }
  if (!component) return { config: null, isLoading: false }
  
  const config: ComponentConfig & { variants?: any[] } = {
    metadata: {
      name: component.name,
      description: component.description || '',
      category: component.category,
      tags: component.tags,
      author: component.author,
      version: component.version,
    },
    code: component.code,
    properties: component.tailwindProperties || [],
    editableElements: component.editableElements,
    globalProperties: component.globalProperties,
    variableMappings: [],
    dependencies: component.dependencies || undefined,
    files: component.files || undefined,
    variants: component.variants || [],
  }
  
  return { config, isLoading: false }
}

