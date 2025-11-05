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
import { Settings2, Box } from 'lucide-react'

type PropertyManagerProps = {
  selectedElement?: ComponentElement
  propertyValues: Record<string, any>
  onPropertyChange: (propertyName: string, value: any) => void
}

export default function PropertyManager({
  selectedElement,
  propertyValues,
  onPropertyChange,
}: PropertyManagerProps) {
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

  const categories = getPropertyCategories(selectedElement.properties)
  const propertiesByCategory = categories.reduce(
    (acc, category) => {
      acc[category] = selectedElement.properties.filter(
        (prop) => prop.category === category
      )
      return acc
    },
    {} as Record<string, PropertyDefinition[]>
  )

  const uncategorizedProps = selectedElement.properties.filter(
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

      case 'color':
        return (
          <div className="flex gap-2">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onPropertyChange(propertyKey, e.target.value)}
              className="h-9 w-16 rounded border cursor-pointer bg-transparent"
            />
            <Input
              type="text"
              value={value || ''}
              onChange={(e) => onPropertyChange(propertyKey, e.target.value)}
              className="flex-1"
              placeholder={prop.label}
            />
          </div>
        )

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
          </Accordion>
        </div>
      </ScrollArea>
    </div>
  )
}



