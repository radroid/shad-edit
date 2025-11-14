import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentConfig } from '@/lib/component-config'
import {
  ComponentElement,
  ComponentStructure,
  PropertyDefinition,
  applyPropertyChanges,
  extractPropertiesFromConfig,
  getDefaultPropertyValues,
} from '@/lib/property-extractor'
import {
  clearGuestEdit,
  loadGuestEdit,
  saveGuestEdit,
  type GuestEditRecord,
} from '@/lib/guest-cache'

function isBrowser() {
  return typeof window !== 'undefined'
}

type GuestEditorState = {
  structure?: ComponentStructure
  propertyValues: Record<string, any>
  defaults: Record<string, any>
  selectedElementId?: string
  isDirty: boolean
  cachedRecord?: GuestEditRecord
}

const INITIAL_STATE: GuestEditorState = {
  propertyValues: {},
  defaults: {},
  selectedElementId: undefined,
  isDirty: false,
}

export function useGuestEditor(
  componentId: string | undefined,
  config: ComponentConfig | null | undefined
) {
  const [state, setState] = useState<GuestEditorState>(INITIAL_STATE)
  const saveTimer = useRef<number | undefined>(undefined)
  const previousPropertyValuesRef = useRef<string>('')
  const defaultsRef = useRef<Record<string, any>>({})
  const previousConfigRef = useRef<string>('')
  const previousComponentIdRef = useRef<string | undefined>(undefined)
  const isInitializingRef = useRef(false)

  useEffect(() => {
    // Create a stable identifier for the config to prevent unnecessary re-initialization
    // Use componentId and a hash of key config properties
    const configId = config 
      ? `${componentId || 'no-id'}-${config.metadata.name || 'unnamed'}-${JSON.stringify(config.properties?.length || 0)}-${config.code?.length || 0}` 
      : ''
    
    // Skip if config and componentId haven't actually changed
    if (configId === previousConfigRef.current && componentId === previousComponentIdRef.current) {
      return
    }

    // Only update refs if we're actually going to initialize
    previousConfigRef.current = configId
    previousComponentIdRef.current = componentId

    if (!config) {
      setState(INITIAL_STATE)
      previousPropertyValuesRef.current = ''
      defaultsRef.current = {}
      isInitializingRef.current = false
      return
    }

    isInitializingRef.current = true

    const structure = extractPropertiesFromConfig(config)
    const defaults = getDefaultPropertyValues(structure)
    const cached = componentId && isBrowser() ? loadGuestEdit(componentId) : undefined
    const propertyValues = {
      ...defaults,
      ...(cached?.properties ?? {}),
    }

    // Store defaults in ref for stable reference
    defaultsRef.current = defaults

    setState({
      structure,
      propertyValues,
      defaults,
      selectedElementId: cached?.metadata?.selectedElementId ?? structure.elements[0]?.id,
      isDirty: Boolean(cached),
      cachedRecord: cached,
    })

    previousPropertyValuesRef.current = JSON.stringify(propertyValues)
    
    // Reset initialization flag after a brief delay to allow state to settle
    setTimeout(() => {
      isInitializingRef.current = false
    }, 0)
  }, [componentId, config])

  const propertyLookup = useMemo(() => {
    if (!state.structure) return new Map<string, { element: ComponentElement; property: PropertyDefinition }>()
    const map = new Map<string, { element: ComponentElement; property: PropertyDefinition }>()

    state.structure.elements.forEach((element) => {
      element.properties.forEach((property) => {
        map.set(`${element.id}.${property.name}`, { element, property })
      })
    })

    return map
  }, [state.structure])

  const componentCode = useMemo(() => {
    if (!config?.code || !state.structure) {
      return config?.code ?? ''
    }

    let updatedCode = config.code

    state.structure.elements.forEach((element) => {
      element.properties.forEach((property) => {
        const key = `${element.id}.${property.name}`
        const value =
          state.propertyValues[key] ??
          state.cachedRecord?.properties?.[key] ??
          property.defaultValue
        if (value !== undefined) {
          updatedCode = applyPropertyChanges(updatedCode, element, property, value)
        }
      })
    })

    return updatedCode
  }, [config, state.structure, state.propertyValues, state.cachedRecord])

  // Save to cache only when propertyValues actually change
  useEffect(() => {
    if (!componentId || !isBrowser()) return
    if (!state.structure) return
    if (isInitializingRef.current) return // Skip during initialization

    const currentPropertyValuesStr = JSON.stringify(state.propertyValues)
    
    // Skip if propertyValues haven't actually changed
    if (currentPropertyValuesStr === previousPropertyValuesRef.current) {
      return
    }

    // Update the ref immediately to prevent duplicate saves
    previousPropertyValuesRef.current = currentPropertyValuesStr

    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      const diff: Record<string, any> = {}
      const defaults = defaultsRef.current
      
      Object.entries(state.propertyValues).forEach(([key, value]) => {
        if (defaults[key] !== value) {
          diff[key] = value
        }
      })

      // Only save if there are actual changes
      if (Object.keys(diff).length > 0 || state.selectedElementId) {
        saveGuestEdit(componentId, {
          properties: diff,
          metadata: {
            selectedElementId: state.selectedElementId,
          },
        })
      }
    }, 250)

    return () => {
      window.clearTimeout(saveTimer.current)
    }
  }, [
    componentId,
    state.propertyValues,
    state.selectedElementId,
    state.structure,
  ])

  const handlePropertyChange = useCallback((propertyKey: string, value: any) => {
    setState((prev) => ({
      ...prev,
      propertyValues: {
        ...prev.propertyValues,
        [propertyKey]: value,
      },
      isDirty: true,
    }))
  }, [])

  const setSelectedElementId = useCallback((elementId: string | undefined) => {
    setState((prev) => ({
      ...prev,
      selectedElementId: elementId,
    }))
  }, [])

  const resetToDefaults = useCallback(() => {
    setState((prev) => {
      const resetValues = { ...defaultsRef.current }
      previousPropertyValuesRef.current = JSON.stringify(resetValues)
      return {
        ...prev,
        propertyValues: resetValues,
        isDirty: false,
      }
    })
    if (componentId) {
      clearGuestEdit(componentId)
    }
  }, [componentId])

  const clearGuestCache = useCallback(() => {
    if (componentId) {
      clearGuestEdit(componentId)
    }
    setState((prev) => {
      const resetValues = { ...defaultsRef.current }
      previousPropertyValuesRef.current = JSON.stringify(resetValues)
      return {
        ...prev,
        propertyValues: resetValues,
        isDirty: false,
      }
    })
  }, [componentId])

  return {
    structure: state.structure,
    propertyValues: state.propertyValues,
    defaults: state.defaults,
    selectedElementId: state.selectedElementId,
    setSelectedElementId,
    handlePropertyChange,
    componentCode,
    isDirty: state.isDirty,
    resetToDefaults,
    clearGuestCache,
  }
}



