import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import {
  PropertyDefinition,
  ComponentElement,
  getPropertyCategories,
  type ComponentStructure,
} from '@/lib/property-extractor'
import type { ComponentPropSection } from '@/lib/component-config'
import { Settings2, Box, RotateCcw } from 'lucide-react'
import { RgbaColorPicker } from 'react-colorful'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

type Variant = {
  name: string
  displayName?: string
  properties?: Record<string, any>
  description?: string
}

type PropertyManagerProps = {
  selectedElement?: ComponentElement
  structure?: ComponentStructure
  propertyValues: Record<string, any>
  onPropertyChange: (propertyName: string, value: any) => void
  isForked?: boolean // Deprecated - advanced styles are now always available
  variants?: Variant[]
  selectedVariant?: string
  onVariantChange?: (variantName: string) => void
  sizeOptions?: Array<{ label: string; value: string }>
  selectedSize?: string
  onSizeChange?: (size: string) => void
  onResetOverrides?: (elementId: string) => void
  showAdvancedOverrides?: boolean
  propSections?: ComponentPropSection[]
  onVariantsChange?: (variants: Variant[]) => void
}

export default function PropertyManager({
  selectedElement,
  structure,
  propertyValues,
  onPropertyChange,
  isForked = false, // Deprecated - kept for backward compatibility
  variants = [],
  selectedVariant = 'default',
  onVariantChange,
  sizeOptions,
  selectedSize,
  onSizeChange,
  onResetOverrides,
  showAdvancedOverrides = true,
  propSections,
  onVariantsChange,
}: PropertyManagerProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null)
  const variantList = variants || []
  const propertyLookup = useMemo(() => {
    if (!structure) {
      return new Map<string, { element: ComponentElement; property: PropertyDefinition }>()
    }
    const map = new Map<string, { element: ComponentElement; property: PropertyDefinition }>()
    structure.elements.forEach((element) => {
      element.properties.forEach((prop) => {
        map.set(`${element.id}.${prop.name}`, { element, property: prop })
      })
    })
    return map
  }, [structure])
  const hasPropSections = Boolean(propSections && propSections.length > 0)
  
  // Check if there are any advanced style overrides
  const hasOverrides = selectedElement ? [
    'backgroundColor',
    'color',
    'padding',
    'margin',
    'fontSize',
    'fontWeight',
    'borderWidth',
    'borderColor',
    'borderRadius',
  ].some((prop) => {
    const value = propertyValues[`${selectedElement.id}.${prop}`]
    return value !== undefined && value !== null && value !== ''
  }) : false
  if (!selectedElement && !hasPropSections) {
    return (
      <div className="flex flex-col h-full border-l">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Properties</h2>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="space-y-2">
            <Box className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Select an element to edit its properties
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Filter out variant and size properties since we have dedicated controls for them
  const filteredProperties = selectedElement
    ? selectedElement.properties.filter(
    (prop) => prop.name !== 'variant' && prop.name !== 'size'
  )
    : []
  
  const categories = getPropertyCategories(filteredProperties)
  const propertiesByCategory = categories.reduce(
    (acc, category) => {
      acc[category] = filteredProperties.filter(
        (prop) => prop.category === category
      )
      return acc
    },
    {} as Record<string, PropertyDefinition[]>
  )

  const uncategorizedProps = filteredProperties.filter(
    (prop) => !prop.category
  )

  const renderPropertyControl = (element: ComponentElement, prop: PropertyDefinition) => {
    const propertyKey = `${element.id}.${prop.name}`
    const value = propertyValues[propertyKey] ?? prop.defaultValue

    switch (prop.type) {
      case 'select':
        return (
          <Select
            value={String(value ?? prop.defaultValue ?? '')}
            onValueChange={(newValue) => onPropertyChange(propertyKey, newValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${prop.label}`} />
            </SelectTrigger>
            <SelectContent>
              {prop.options?.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <Label htmlFor={`${element.id}-${prop.name}`} className="text-sm cursor-pointer">
              {prop.label}
            </Label>
            <Switch
              id={`${element.id}-${prop.name}`}
              checked={value || false}
              onCheckedChange={(checked) =>
                onPropertyChange(propertyKey, checked)
              }
            />
          </div>
        )

      case 'color': {
        const fallback = typeof prop.defaultValue === 'string' ? prop.defaultValue : 'rgba(0,0,0,1)'
        const raw = (value ?? fallback) as string
        const isTailwindUtility =
          typeof raw === 'string' &&
          !raw.startsWith('#') &&
          !raw.startsWith('rgb') &&
          !raw.startsWith('hsl')
        const isColorPickerOpen = colorPickerOpen === propertyKey

        // Tailwind token mode → keep simple textbox so users can type bg tokens
        if (isTailwindUtility) {
          return (
            <Input
              type="text"
              value={raw}
              onChange={(e) => onPropertyChange(propertyKey, e.target.value)}
              placeholder={prop.label}
            />
          )
        }

        // Parse rgba string into react-colorful RGBA object
        const toRgbaObj = (input: string) => {
          // Accept hex, rgb(a), hsl(a); basic parser focusing on rgba()
          const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/i)
          if (m) {
            return {
              r: Math.min(255, Number(m[1])),
              g: Math.min(255, Number(m[2])),
              b: Math.min(255, Number(m[3])),
              a: m[4] !== undefined ? Math.max(0, Math.min(1, Number(m[4]))) : 1,
            }
          }
          // Fallback to black
          return { r: 0, g: 0, b: 0, a: 1 }
        }

        const fromRgbaObj = (c: { r: number; g: number; b: number; a?: number }) =>
          `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${
            c.a === undefined ? 1 : Number(c.a.toFixed(3))
          })`

        const rgba = toRgbaObj(raw)

        return (
          <div className="relative">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-8 w-8 rounded-md border shadow-inner"
                style={{ backgroundColor: fromRgbaObj(rgba) }}
              onClick={() => setColorPickerOpen(isColorPickerOpen ? null : propertyKey)}
                aria-label="Open color picker"
              />
              <Input
                type="text"
                value={raw}
                onChange={(e) => onPropertyChange(propertyKey, e.target.value)}
                className="flex-1"
                placeholder="rgba(0,0,0,1)"
            />
            </div>
            {isColorPickerOpen && (
              <div className="absolute z-10 mt-2 p-3 bg-background border rounded-md shadow-lg">
                <RgbaColorPicker
                  color={rgba}
                  onChange={(c) => onPropertyChange(propertyKey, fromRgbaObj(c))}
            />
              </div>
            )}
          </div>
        )
      }

      case 'number':
        return (
          <Input
            type="number"
            value={value ?? prop.defaultValue ?? ''}
            onChange={(e) => {
              const numValue = e.target.value === '' ? undefined : parseFloat(e.target.value)
              onPropertyChange(propertyKey, numValue)
            }}
            min={prop.min}
            max={prop.max}
            step={prop.step}
            placeholder={prop.label}
          />
        )

      case 'textarea':
        return (
          <textarea
            value={value ?? ''}
            onChange={(e) => onPropertyChange(propertyKey, e.target.value)}
            placeholder={prop.label}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        )

      case 'string':
      default:
        return (
          <Input
            type="text"
            value={value ?? ''}
            onChange={(e) => onPropertyChange(propertyKey, e.target.value)}
            placeholder={prop.label}
          />
        )
    }
  }

  const renderPropSections = () => {
    if (!propSections || propSections.length === 0) return null

    return (
      <Accordion
        type="multiple"
        defaultValue={propSections.map((section) => section.id)}
        className="space-y-2"
      >
        {propSections.map((section) => (
          <AccordionItem key={section.id} value={section.id}>
            <AccordionTrigger className="text-sm font-medium">
              {section.label}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {section.description && (
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                )}

                {section.options && section.options.length > 0 && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        {section.propType === 'variant' ? 'Variants' : 'Options'}
                      </Label>
                      {section.propType === 'variant' && onVariantChange && (
                        <span className="text-xs text-muted-foreground">
                          Apply a variant to preview instantly.
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      {section.options.map((option) => (
                        <div
                          key={`${section.id}-${option.value}`}
                          className="rounded-md border bg-background px-3 py-2 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{option.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {option.classes.length} utility classes
                              </p>
                            </div>
                            {section.propType === 'variant' && onVariantChange && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onVariantChange(option.value)}
                              >
                                Use Variant
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {option.classes.map((cls) => (
                              <Badge
                                key={`${option.value}-${cls.className}`}
                                variant={cls.usesCssVariable ? 'destructive' : 'secondary'}
                                className="text-[11px]"
                              >
                                {cls.className}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {section.fields.length === 0 && !section.options?.length && (
                  <p className="text-sm text-muted-foreground">No editable fields detected.</p>
                )}

                {section.fields.map((field) => {
                  const lookup = propertyLookup.get(field.propertyPath)
                  if (!lookup) {
                    return (
                      <div key={field.id} className="rounded border border-dashed p-3">
                        <p className="text-sm text-muted-foreground">
                          {field.label} is not directly editable yet.
                        </p>
                      </div>
                    )
                  }

                  return (
                    <div key={field.id} className="space-y-2 rounded-md border bg-muted/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                          {field.label}
                        </Label>
                        {field.isAnimation && (
                          <Badge variant="outline" className="text-[10px] uppercase">
                            Animation
                          </Badge>
                        )}
                      </div>
                      {field.usesCssVariable && (
                        <div className="rounded border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-900">
                          Overrides will break the link to{' '}
                          {field.cssVariables?.join(', ') || 'global tokens'} from global.css.
                        </div>
                      )}
                      {field.dataAttributes && field.dataAttributes.length > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          Data states: {field.dataAttributes.join(', ')}
                        </p>
                      )}
                      {renderPropertyControl(lookup.element, lookup.property)}
                    </div>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    )
  }

  const renderVariantManager = () => {
    if (!variantList.length) return null
    const canMutate = Boolean(onVariantsChange)

    const duplicateVariant = (variant: Variant) => {
      if (!onVariantsChange) return
      const copyName = `${variant.name}-copy`
      onVariantsChange([
        ...variantList,
        {
          ...variant,
          name: copyName,
          displayName: `${variant.displayName || variant.name} Copy`,
        },
      ])
    }

    const removeVariant = (variant: Variant) => {
      if (!onVariantsChange) return
      onVariantsChange(variantList.filter((v) => v.name !== variant.name))
    }

    const updateVariantLabel = (variant: Variant, label: string) => {
      if (!onVariantsChange) return
      onVariantsChange(
        variantList.map((v) =>
          v.name === variant.name ? { ...v, displayName: label } : v
        )
      )
    }

    const addVariant = () => {
      if (!onVariantsChange || variantList.length === 0) return
      const idx = variantList.length + 1
      const template = variantList[0]
      onVariantsChange([
        ...variantList,
        {
          ...template,
          name: `variant-${idx}`,
          displayName: `Variant ${idx}`,
        },
      ])
    }

    const captureVariant = (variant: Variant) => {
      if (!onVariantsChange) return
      const snapshot: Record<string, any> = {}
      Object.entries(propertyValues).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          snapshot[key] = value
        }
      })
      onVariantsChange(
        variantList.map((v) =>
          v.name === variant.name ? { ...v, properties: snapshot } : v
        )
      )
    }

    return (
      <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Variant Manager</p>
            <p className="text-xs text-muted-foreground">
              Duplicate and tweak variants to explore new combinations.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={addVariant} disabled={!canMutate}>
            Add Variant
          </Button>
        </div>
        <div className="space-y-2">
          {variantList.map((variant) => (
            <div key={variant.name} className="rounded-md border bg-background p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                      {variant.name}
                    </Badge>
                    <Input
                      value={variant.displayName || variant.name}
                      onChange={(e) => updateVariantLabel(variant, e.target.value)}
                      disabled={!canMutate}
                      className="h-8 text-xs"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {Object.keys(variant.properties ?? {}).length} overrides applied
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onVariantChange && (
                    <Button size="sm" onClick={() => onVariantChange(variant.name)}>
                      Apply
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => captureVariant(variant)}
                    disabled={!canMutate}
                  >
                    Capture
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicateVariant(variant)}
                    disabled={!canMutate}
                  >
                    Duplicate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeVariant(variant)}
                    disabled={!canMutate}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (hasPropSections) {
    return (
      <div className="flex flex-col h-full border-l">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Component Props</h2>
          </div>
          {renderVariantManager()}
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">{renderPropSections()}</div>
        </ScrollArea>
      </div>
    )
  }

  if (!selectedElement) {
    return null
  }

  return (
    <div className="flex flex-col h-full border-l">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Properties</h2>
        </div>
        
        {/* Variant Selector */}
        {variantList.length > 0 && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Variant</Label>
            <Select
              value={selectedVariant}
              onValueChange={(value) => onVariantChange?.(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {variantList.map((variant) => (
                  <SelectItem key={variant.name} value={variant.name}>
                    {variant.displayName || variant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Size Selector - for components that support it */}
        {sizeOptions && sizeOptions.length > 0 && selectedSize !== undefined && (
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Size</Label>
            <Select
              value={selectedSize}
              onValueChange={(value) => onSizeChange?.(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sizeOptions.map((option: { label: string; value: string }) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="space-y-1">
          <div className="text-sm font-medium">{selectedElement.name}</div>
          <Badge variant="secondary" className="text-xs">
            {selectedElement.type}
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <Accordion
            type="multiple"
            defaultValue={categories}
            className="space-y-2"
          >
            {categories.map((category) => (
              <AccordionItem key={category} value={category}>
                <AccordionTrigger className="text-sm font-medium">
                  {category}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {propertiesByCategory[category].map((prop) => (
                      <div key={prop.name} className="space-y-2">
                        {prop.type !== 'boolean' && (
                          <Label htmlFor={prop.name} className="text-xs">
                            {prop.label}
                          </Label>
                        )}
                        {renderPropertyControl(selectedElement, prop)}
                        {prop.description && (
                          <p className="text-xs text-muted-foreground">
                            {prop.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}

            {uncategorizedProps.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-4">
                  {uncategorizedProps.map((prop) => (
                    <div key={prop.name} className="space-y-2">
                      {prop.type !== 'boolean' && (
                        <Label htmlFor={prop.name} className="text-xs">
                          {prop.label}
                        </Label>
                      )}
                      {renderPropertyControl(selectedElement, prop)}
                      {prop.description && (
                        <p className="text-xs text-muted-foreground">
                          {prop.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Advanced customization options - always available when element is selected */}
            {showAdvancedOverrides && selectedElement && (
              <>
                <Separator className="my-4" />
                <AccordionItem value="advanced-styles">
                  <AccordionTrigger className="text-sm font-medium">
                    Advanced Styles / Overrides
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {/* Reset Button */}
                      {hasOverrides && (
                        <div className="pb-2 border-b">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              // Use the dedicated reset handler if available, otherwise fall back to individual resets
                              if (onResetOverrides && selectedElement) {
                                onResetOverrides(selectedElement.id)
                              } else if (selectedElement) {
                                // Fallback: reset each property individually
                                const overrideProperties = [
                                  'backgroundColor',
                                  'color',
                                  'borderColor',
                                  'padding',
                                  'margin',
                                  'fontSize',
                                  'fontWeight',
                                  'borderWidth',
                                  'borderRadius',
                                ]
                                overrideProperties.forEach((prop) => {
                                  const propKey = `${selectedElement.id}.${prop}`
                                  onPropertyChange(propKey, '')
                                })
                              }
                            }}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset to Default
                          </Button>
                        </div>
                      )}
                      
                      {/* Colors */}
                      <div className="space-y-2">
                        <Label className="text-xs">Fill Color (Background)</Label>
                        <p className="text-xs text-muted-foreground">
                          Overrides the component's fill/background color
                        </p>
                        <div className="flex gap-2 relative">
                          <div
                            className="h-9 w-16 rounded border cursor-pointer"
                            style={{ backgroundColor: propertyValues[`${selectedElement.id}.backgroundColor`] || '#ffffff' }}
                            onClick={() => setColorPickerOpen(colorPickerOpen === `${selectedElement.id}.backgroundColor` ? null : `${selectedElement.id}.backgroundColor`)}
                          />
                          {colorPickerOpen === `${selectedElement.id}.backgroundColor` && (
                            <div className="absolute z-10 top-12 left-0 p-4 bg-background border rounded-lg shadow-lg">
                              <HexColorPicker
                                color={propertyValues[`${selectedElement.id}.backgroundColor`] || '#ffffff'}
                                onChange={(color) => onPropertyChange(`${selectedElement.id}.backgroundColor`, color)}
                              />
                            </div>
                          )}
                          <Input
                            type="text"
                            value={propertyValues[`${selectedElement.id}.backgroundColor`] || ''}
                            onChange={(e) => onPropertyChange(`${selectedElement.id}.backgroundColor`, e.target.value)}
                            className="flex-1"
                            placeholder="#ffffff or hsl(...)"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Text Color</Label>
                        <p className="text-xs text-muted-foreground">
                          Overrides the component's text color
                        </p>
                        <div className="flex gap-2 relative">
                          <div
                            className="h-9 w-16 rounded border cursor-pointer"
                            style={{ backgroundColor: propertyValues[`${selectedElement.id}.color`] || '#000000' }}
                            onClick={() => setColorPickerOpen(colorPickerOpen === `${selectedElement.id}.color` ? null : `${selectedElement.id}.color`)}
                          />
                          {colorPickerOpen === `${selectedElement.id}.color` && (
                            <div className="absolute z-10 top-12 left-0 p-4 bg-background border rounded-lg shadow-lg">
                              <HexColorPicker
                                color={propertyValues[`${selectedElement.id}.color`] || '#000000'}
                                onChange={(color) => onPropertyChange(`${selectedElement.id}.color`, color)}
                              />
                            </div>
                          )}
                          <Input
                            type="text"
                            value={propertyValues[`${selectedElement.id}.color`] || ''}
                            onChange={(e) => onPropertyChange(`${selectedElement.id}.color`, e.target.value)}
                            className="flex-1"
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      {/* Spacing */}
                      <div className="space-y-2">
                        <Label className="text-xs">Padding</Label>
                        <Input
                          type="text"
                          value={propertyValues[`${selectedElement.id}.padding`] || ''}
                          onChange={(e) => onPropertyChange(`${selectedElement.id}.padding`, e.target.value)}
                          placeholder="e.g., 16px or 1rem"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Margin</Label>
                        <Input
                          type="text"
                          value={propertyValues[`${selectedElement.id}.margin`] || ''}
                          onChange={(e) => onPropertyChange(`${selectedElement.id}.margin`, e.target.value)}
                          placeholder="e.g., 16px or 1rem"
                        />
                      </div>

                      {/* Typography */}
                      <div className="space-y-2">
                        <Label className="text-xs">Font Size</Label>
                        <Input
                          type="text"
                          value={propertyValues[`${selectedElement.id}.fontSize`] || ''}
                          onChange={(e) => onPropertyChange(`${selectedElement.id}.fontSize`, e.target.value)}
                          placeholder="e.g., 16px or 1rem"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Font Weight</Label>
                        <Select
                          value={String(propertyValues[`${selectedElement.id}.fontWeight`] || '')}
                          onValueChange={(value) => onPropertyChange(`${selectedElement.id}.fontWeight`, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select font weight" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="200">200</SelectItem>
                            <SelectItem value="300">300</SelectItem>
                            <SelectItem value="400">400</SelectItem>
                            <SelectItem value="500">500</SelectItem>
                            <SelectItem value="600">600</SelectItem>
                            <SelectItem value="700">700</SelectItem>
                            <SelectItem value="800">800</SelectItem>
                            <SelectItem value="900">900</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Borders */}
                      <div className="space-y-2">
                        <Label className="text-xs">Border Width</Label>
                        <Input
                          type="text"
                          value={propertyValues[`${selectedElement.id}.borderWidth`] || ''}
                          onChange={(e) => onPropertyChange(`${selectedElement.id}.borderWidth`, e.target.value)}
                          placeholder="e.g., 1px"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Border Color</Label>
                        <div className="flex gap-2 relative">
                          <div
                            className="h-9 w-16 rounded border cursor-pointer"
                            style={{ backgroundColor: propertyValues[`${selectedElement.id}.borderColor`] || '#000000' }}
                            onClick={() => setColorPickerOpen(colorPickerOpen === `${selectedElement.id}.borderColor` ? null : `${selectedElement.id}.borderColor`)}
                          />
                          {colorPickerOpen === `${selectedElement.id}.borderColor` && (
                            <div className="absolute z-10 top-12 left-0 p-4 bg-background border rounded-lg shadow-lg">
                              <HexColorPicker
                                color={propertyValues[`${selectedElement.id}.borderColor`] || '#000000'}
                                onChange={(color) => onPropertyChange(`${selectedElement.id}.borderColor`, color)}
                              />
                            </div>
                          )}
                          <Input
                            type="text"
                            value={propertyValues[`${selectedElement.id}.borderColor`] || ''}
                            onChange={(e) => onPropertyChange(`${selectedElement.id}.borderColor`, e.target.value)}
                            className="flex-1"
                            placeholder="#000000"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Border Radius</Label>
                        <Input
                          type="text"
                          value={propertyValues[`${selectedElement.id}.borderRadius`] || ''}
                          onChange={(e) => onPropertyChange(`${selectedElement.id}.borderRadius`, e.target.value)}
                          placeholder="e.g., 4px or 0.5rem"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </>
            )}
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  )
}



