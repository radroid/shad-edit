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
} from '@/lib/property-extractor'
import { Settings2, Box, RotateCcw } from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Variant = {
  name: string
  displayName?: string
  properties?: Record<string, any>
}

type PropertyManagerProps = {
  selectedElement?: ComponentElement
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
}

export default function PropertyManager({
  selectedElement,
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
}: PropertyManagerProps) {
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null)
  
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
  if (!selectedElement) {
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
  const filteredProperties = selectedElement.properties.filter(
    (prop) => prop.name !== 'variant' && prop.name !== 'size'
  )
  
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

  const renderPropertyControl = (prop: PropertyDefinition) => {
    const propertyKey = `${selectedElement.id}.${prop.name}`
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
            <Label htmlFor={`${selectedElement.id}-${prop.name}`} className="text-sm cursor-pointer">
              {prop.label}
            </Label>
            <Switch
              id={`${selectedElement.id}-${prop.name}`}
              checked={value || false}
              onCheckedChange={(checked) =>
                onPropertyChange(propertyKey, checked)
              }
            />
          </div>
        )

      case 'color': {
        const fallbackColor = typeof prop.defaultValue === 'string' ? prop.defaultValue : '#000000'
        const colorValue = value ?? fallbackColor
        const colorString = typeof colorValue === 'string' ? colorValue : String(colorValue ?? '')
        const isTailwindUtility =
          typeof colorString === 'string' &&
          !colorString.startsWith('#') &&
          !colorString.startsWith('rgb') &&
          !colorString.startsWith('hsl')
        const isColorPickerOpen = colorPickerOpen === propertyKey

        if (isTailwindUtility) {
          return (
            <Input
              type="text"
              value={colorString}
              onChange={(e) => onPropertyChange(propertyKey, e.target.value)}
              placeholder={prop.label}
            />
          )
        }

        return (
          <div className="flex gap-2 relative">
            <div
              className="h-9 w-16 rounded border cursor-pointer"
              style={{ backgroundColor: colorString || '#000000' }}
              onClick={() => setColorPickerOpen(isColorPickerOpen ? null : propertyKey)}
            />
            {isColorPickerOpen && (
              <div className="absolute z-10 top-12 left-0 p-4 bg-background border rounded-lg shadow-lg">
                <HexColorPicker
                  color={colorString || '#000000'}
                  onChange={(color) => onPropertyChange(propertyKey, color)}
                />
                <Input
                  type="text"
                  value={colorString || ''}
              onChange={(e) => onPropertyChange(propertyKey, e.target.value)}
                  className="mt-2"
                  placeholder={prop.label}
            />
              </div>
            )}
            <Input
              type="text"
              value={colorString || ''}
              onChange={(e) => onPropertyChange(propertyKey, e.target.value)}
              className="flex-1"
              placeholder={prop.label}
            />
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

  return (
    <div className="flex flex-col h-full border-l">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Properties</h2>
        </div>
        
        {/* Variant Selector */}
        {variants.length > 0 && (
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
                {variants.map((variant) => (
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
                        {renderPropertyControl(prop)}
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
                      {renderPropertyControl(prop)}
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



