import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useCatalogComponent } from '@/lib/catalog-hooks'
import type { ComponentConfig } from '@/lib/component-config'
import {
  CSSVariables,
  DEFAULT_CSS_VARIABLES,
  mergeCSSVariables,
} from '@/lib/scoped-css'

const STORAGE_KEY = 'test-component-edits'

type ComponentEditorCache = {
  code: string
  cssVariables: CSSVariables
  propertyValues: Record<string, any>
  timestamp: number
}

type ComponentEditorState = {
  componentId: string | null
  config: (ComponentConfig & { variants?: any[] }) | null
  code: string
  cssVariables: CSSVariables
  propertyValues: Record<string, any>
  isLoading: boolean
  isDirty: boolean
}

/**
 * Hook for managing component editor state with localStorage caching
 */
export function useComponentEditor(componentId?: string) {
  const [code, setCode] = useState<string>('')
  const [cssVariables, setCssVariables] = useState<CSSVariables>(
    DEFAULT_CSS_VARIABLES
  )
  const [propertyValues, setPropertyValues] = useState<Record<string, any>>({})
  const [isDirty, setIsDirty] = useState(false)
  const lastLoadedIdRef = useRef<string | null>(null)

  const { config, isLoading } = useCatalogComponent(componentId || undefined)

  // Load from cache when component changes
  useEffect(() => {
    if (!componentId || !config) {
      // Reset state when no component is selected
      setCode('')
      setCssVariables(DEFAULT_CSS_VARIABLES)
      setPropertyValues({})
      setIsDirty(false)
      return
    }
    
    // Check if componentId has changed
    const hasComponentChanged = lastLoadedIdRef.current !== componentId
    
    if (hasComponentChanged) {
      // Component changed, always reload
      lastLoadedIdRef.current = componentId
      
      const cache = loadFromCache(componentId)
      
      if (cache) {
        setCode(cache.code)
        setCssVariables(cache.cssVariables)
        setPropertyValues(cache.propertyValues)
        setIsDirty(true)
      } else {
        // Initialize with config defaults
        setCode(config.code || '')
        setCssVariables(DEFAULT_CSS_VARIABLES)
        setPropertyValues({})
        setIsDirty(false)
      }
    }
  }, [componentId, config])

  // Save to cache on changes
  const saveToCache = useCallback(() => {
    if (!componentId) return

    const cache: ComponentEditorCache = {
      code,
      cssVariables,
      propertyValues,
      timestamp: Date.now(),
    }

    try {
      const storage = getAllCache()
      storage[componentId] = cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
    } catch (error) {
      console.error('Failed to save to cache:', error)
    }
  }, [componentId, code, cssVariables, propertyValues])

  // Auto-save to cache with debouncing
  useEffect(() => {
    if (!isDirty) return

    const timeoutId = setTimeout(() => {
      saveToCache()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [code, cssVariables, propertyValues, isDirty, saveToCache])

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode)
    setIsDirty(true)
  }, [])

  const handleCssVariablesChange = useCallback((newVariables: CSSVariables) => {
    setCssVariables(newVariables)
    setIsDirty(true)
  }, [])

  const handlePropertyChange = useCallback((key: string, value: any) => {
    setPropertyValues((prev) => ({
      ...prev,
      [key]: value,
    }))
    setIsDirty(true)
  }, [])

  const selectComponent = useCallback((_newComponentId: string) => {
    // Component selection is now handled via URL navigation
    // This function is kept for backward compatibility but does nothing
  }, [])

  const resetToDefaults = useCallback(() => {
    if (!config) return

    setCode(config.code)
    setCssVariables(DEFAULT_CSS_VARIABLES)
    setPropertyValues({})
    setIsDirty(false)

    if (componentId) {
      clearCache(componentId)
    }
  }, [config, componentId])

  const clearCache = useCallback((targetComponentId: string) => {
    try {
      const storage = getAllCache()
      delete storage[targetComponentId]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }, [])

  const clearAllCache = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setIsDirty(false)
    } catch (error) {
      console.error('Failed to clear all cache:', error)
    }
  }, [])

  const getCachedComponents = useCallback((): string[] => {
    const storage = getAllCache()
    return Object.keys(storage)
  }, [])

  // Merged CSS variables (defaults + overrides)
  const mergedCssVariables = useMemo(() => {
    return mergeCSSVariables(DEFAULT_CSS_VARIABLES, cssVariables)
  }, [cssVariables])

  const state: ComponentEditorState = {
    componentId,
    config,
    code,
    cssVariables: mergedCssVariables,
    propertyValues,
    isLoading,
    isDirty,
  }

  return {
    ...state,
    handleCodeChange,
    handleCssVariablesChange,
    handlePropertyChange,
    selectComponent,
    resetToDefaults,
    clearCache,
    clearAllCache,
    getCachedComponents,
    saveToCache,
  }
}

/**
 * Load component edit cache from localStorage
 */
function loadFromCache(componentId: string): ComponentEditorCache | null {
  try {
    const storage = getAllCache()
    return storage[componentId] || null
  } catch (error) {
    console.error('Failed to load from cache:', error)
    return null
  }
}

/**
 * Get all cached component edits
 */
function getAllCache(): Record<string, ComponentEditorCache> {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (error) {
    console.error('Failed to parse cache:', error)
    return {}
  }
}

/**
 * Check if component has cached edits
 */
export function hasComponentCache(componentId: string): boolean {
  const storage = getAllCache()
  return componentId in storage
}

/**
 * Export cache for migration to project
 */
export function exportComponentCache(
  componentId: string
): ComponentEditorCache | null {
  return loadFromCache(componentId)
}

