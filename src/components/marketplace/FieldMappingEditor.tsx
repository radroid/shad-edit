import { useState } from 'react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { EditableElement } from '@/lib/component-config'
import type { PropertyDefinition } from '@/lib/property-extractor'
import { cn } from '@/lib/utils'

export type UIControlType =
  | 'color-palette'
  | 'color-palette-with-transparency'
  | 'dropdown'
  | 'textbox'
  | 'number-input'
  | 'slider'
  | 'textarea'

export interface FieldMapping {
  elementId: string
  propertyName: string
  uiControlType: UIControlType
  showTransparency?: boolean
  enabled?: boolean
}

interface FieldMappingEditorProps {
  editableElements: EditableElement[]
  mappings: FieldMapping[]
  onMappingsChange: (mappings: FieldMapping[]) => void
  onSave: () => void
  onCancel?: () => void
}

/**
 * Get suggested UI control type based on property definition
 */
function getSuggestedUIControlType(property: PropertyDefinition): UIControlType {
  if (property.type === 'color') {
    return 'color-palette'
  }
  if (property.type === 'select' && property.options) {
    return 'dropdown'
  }
  if (property.type === 'number') {
    if (property.min !== undefined && property.max !== undefined) {
      return 'slider'
    }
    return 'number-input'
  }
  if (property.type === 'textarea') {
    return 'textarea'
  }
  return 'textbox'
}

/**
 * FieldMappingEditor - Component for configuring UI control mappings for extracted fields
 */
export default function FieldMappingEditor({
  editableElements,
  mappings,
  onMappingsChange,
  onSave,
  onCancel,
}: FieldMappingEditorProps) {
  // Initialize mappings if empty
  const getInitialMappings = (): FieldMapping[] => {
    if (mappings.length > 0) {
      return mappings
    }
    const initialMappings: FieldMapping[] = []
    editableElements.forEach((element) => {
      element.properties.forEach((property) => {
        initialMappings.push({
          elementId: element.id,
          propertyName: property.name,
          uiControlType: getSuggestedUIControlType(property),
          showTransparency: property.type === 'color',
          enabled: true,
        })
      })
    })
    return initialMappings
  }

  const [localMappings, setLocalMappings] = useState<FieldMapping[]>(() => getInitialMappings())

  // Initialize mappings on mount if empty, and sync with prop changes
  React.useEffect(() => {
    if (mappings.length > 0) {
      // Parent provided mappings, use them
      setLocalMappings(mappings)
    } else if (localMappings.length > 0) {
      // No parent mappings, but we have generated ones - notify parent once
      onMappingsChange(localMappings)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Sync with prop changes after initial mount
  React.useEffect(() => {
    if (mappings.length > 0) {
      setLocalMappings(mappings)
    }
  }, [mappings])

  const updateMapping = (
    elementId: string,
    propertyName: string,
    updates: Partial<FieldMapping>
  ) => {
    const newMappings = localMappings.map((m) => {
      if (m.elementId === elementId && m.propertyName === propertyName) {
        return { ...m, ...updates }
      }
      return m
    })
    setLocalMappings(newMappings)
    onMappingsChange(newMappings)
  }

  const toggleElement = (elementId: string, enabled: boolean) => {
    const newMappings = localMappings.map((m) =>
      m.elementId === elementId ? { ...m, enabled } : m
    )
    setLocalMappings(newMappings)
    onMappingsChange(newMappings)
  }

  const handleSave = () => {
    onMappingsChange(localMappings)
    onSave()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configure Field Mappings</h3>
        <p className="text-sm text-muted-foreground">
          Choose the UI control type for each extracted field. These controls will be
          used in the property editor.
        </p>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto">
        {editableElements.map((element) => {
          const elementEnabled = element.properties.some((property) => {
            const mapping = localMappings.find(
              (m) => m.elementId === element.id && m.propertyName === property.name
            )
            return mapping ? mapping.enabled !== false : true
          })
          return (
            <div key={element.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm text-foreground/80">
                  {element.name} ({element.tag || 'element'})
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={elementEnabled}
                    onCheckedChange={(checked) => toggleElement(element.id, checked)}
                  />
                  <Label className="text-xs cursor-pointer">Include element</Label>
                </div>
              </div>
              <div className="space-y-3 pl-4 border-l-2 border-border">
                {element.properties.map((property) => {
                const mapping =
                  localMappings.find(
                    (m) => m.elementId === element.id && m.propertyName === property.name
                  ) || {
                  elementId: element.id,
                  propertyName: property.name,
                  uiControlType: getSuggestedUIControlType(property),
                  showTransparency: property.type === 'color',
                    enabled: true,
                  }
                  const propertyEnabled = mapping.enabled !== false
                  const isFieldEnabled = elementEnabled && propertyEnabled

                return (
                  <div
                    key={`${element.id}-${property.name}`}
                    className="space-y-2 p-3 rounded-md border bg-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Label className="font-medium">{property.label || property.name}</Label>
                        {property.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {property.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Type: {property.type}
                        </p>
                        {property.classMetadata && (
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                            <span className="rounded bg-muted px-2 py-0.5">
                              {property.classMetadata.className}
                            </span>
                            {property.classMetadata.group && (
                              <span className="rounded bg-muted px-2 py-0.5">
                                group: {property.classMetadata.group}
                              </span>
                            )}
                            {property.classMetadata.cssVariables?.length ? (
                              <span className="rounded bg-muted px-2 py-0.5">
                                tokens: {property.classMetadata.cssVariables.join(', ')}
                              </span>
                            ) : null}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={propertyEnabled}
                            onCheckedChange={(checked) =>
                              updateMapping(element.id, property.name, { enabled: checked })
                            }
                          />
                          <Label className="text-xs cursor-pointer">Include field</Label>
                        </div>
                        {property.type === 'color' && (
                          <div className="text-[11px] text-muted-foreground">
                            Color Palette {mapping.showTransparency ? '(transparency enabled)' : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={cn('space-y-2', !isFieldEnabled && 'opacity-50 pointer-events-none')}>
                      {property.type === 'color' ? (
                        <div className="space-y-2">
                          <Label className="text-xs">UI Control Type</Label>
                          <div className="text-sm font-medium">Color Palette</div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`${element.id}-${property.name}-transparency`}
                              checked={mapping.showTransparency || false}
                              onCheckedChange={(checked) => {
                                updateMapping(element.id, property.name, {
                                  showTransparency: checked,
                                  uiControlType: checked
                                    ? 'color-palette-with-transparency'
                                    : 'color-palette',
                                })
                              }}
                            />
                            <Label
                              htmlFor={`${element.id}-${property.name}-transparency`}
                              className="text-xs cursor-pointer"
                            >
                              Enable transparency
                            </Label>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Label htmlFor={`${element.id}-${property.name}-control`} className="text-xs">
                            UI Control Type
                          </Label>
                          <Select
                            value={mapping.uiControlType}
                            onValueChange={(value: UIControlType) => {
                              updateMapping(element.id, property.name, {
                                uiControlType: value,
                              })
                            }}
                          >
                            <SelectTrigger id={`${element.id}-${property.name}-control`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {property.type === 'select' && property.options && (
                                <SelectItem value="dropdown">Dropdown</SelectItem>
                              )}
                              {property.type === 'string' && (
                                <>
                                  <SelectItem value="textbox">Textbox</SelectItem>
                                  <SelectItem value="textarea">Textarea</SelectItem>
                                </>
                              )}
                              {property.type === 'number' && (
                                <>
                                  <SelectItem value="number-input">Number Input</SelectItem>
                                  {property.min !== undefined && property.max !== undefined && (
                                    <SelectItem value="slider">Slider</SelectItem>
                                  )}
                                </>
                              )}
                              {property.type === 'textarea' && (
                                <SelectItem value="textarea">Textarea</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          )
        })}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave}>Save Mappings</Button>
      </div>
    </div>
  )
}

