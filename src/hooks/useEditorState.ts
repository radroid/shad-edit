import { useCallback, useMemo, useState } from 'react'
import type { ComponentElement, ComponentStructure } from '@/lib/property-extractor'

/**
 * Shared editor state management hook
 * Reduces prop drilling and centralizes common editor patterns
 */
export function useEditorState(initialStructure?: ComponentStructure) {
  const [selectedElementId, setSelectedElementId] = useState<string | undefined>(
    initialStructure?.elements[0]?.id
  )

  const selectedElement = useMemo(() => {
    if (!initialStructure || !selectedElementId) {
      return initialStructure?.elements[0]
    }
    return (
      initialStructure.elements.find((el) => el.id === selectedElementId) ??
      initialStructure.elements[0]
    )
  }, [initialStructure, selectedElementId])

  const handleElementSelect = useCallback((elementId: string) => {
    setSelectedElementId(elementId)
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedElementId(initialStructure?.elements[0]?.id)
  }, [initialStructure])

  return {
    selectedElementId,
    selectedElement,
    setSelectedElementId: handleElementSelect,
    resetSelection,
  }
}

/**
 * Hook for managing property values with debouncing support
 */
export function usePropertyValues(
  initialValues: Record<string, any> = {},
  onSave?: (values: Record<string, any>) => void
) {
  const [propertyValues, setPropertyValues] = useState<Record<string, any>>(initialValues)
  const [isDirty, setIsDirty] = useState(false)

  const updateProperty = useCallback(
    (key: string, value: any) => {
      setPropertyValues((prev) => ({
        ...prev,
        [key]: value,
      }))
      setIsDirty(true)
      if (onSave) {
        onSave({ ...propertyValues, [key]: value })
      }
    },
    [propertyValues, onSave]
  )

  const updateProperties = useCallback(
    (updates: Record<string, any>) => {
      setPropertyValues((prev) => ({
        ...prev,
        ...updates,
      }))
      setIsDirty(true)
      if (onSave) {
        onSave({ ...propertyValues, ...updates })
      }
    },
    [propertyValues, onSave]
  )

  const resetToDefaults = useCallback((defaults: Record<string, any>) => {
    setPropertyValues(defaults)
    setIsDirty(false)
  }, [])

  return {
    propertyValues,
    isDirty,
    updateProperty,
    updateProperties,
    resetToDefaults,
    setPropertyValues,
  }
}


