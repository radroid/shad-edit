import { ComponentElement, ComponentStructure } from '@/lib/property-extractor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Monitor, Smartphone, Tablet, Code, Eye } from 'lucide-react'
import { useState } from 'react'
import { renderComponentPreview, ComponentType, getAllComponentTypes } from '@/lib/component-renderer'

type ComponentCanvasProps = {
  componentStructure?: ComponentStructure
  selectedElementId?: string
  onSelectElement: (elementId: string) => void
  propertyValues: Record<string, any>
  componentCode?: string
}

export default function ComponentCanvas({
  componentStructure,
  selectedElementId,
  onSelectElement,
  propertyValues,
  componentCode,
}: ComponentCanvasProps) {
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>(
    'desktop'
  )

  const deviceSizes = {
    desktop: 'w-full',
    tablet: 'max-w-3xl',
    mobile: 'max-w-md',
  }

  if (!componentStructure) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Canvas</h2>
        </div>
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center space-y-2">
            <Monitor className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Select a component to start editing
            </p>
          </div>
        </div>
      </div>
    )
  }

  const renderElement = (element: ComponentElement) => {
    const isSelected = element.id === selectedElementId
    const elementStyles: React.CSSProperties = {}

    // Collect all property values for this element
    const elementProps: Record<string, any> = {}
    element.properties.forEach((prop) => {
      const key = `${element.id}.${prop.name}`
      const value = propertyValues[key] ?? prop.defaultValue
      
      if (value !== undefined) {
        elementProps[prop.name] = value

        // Also apply to inline styles if it's a CSS property
        const cssPropertyMap: Record<string, string> = {
          padding: 'padding',
          margin: 'margin',
          backgroundColor: 'backgroundColor',
          color: 'color',
          fontSize: 'fontSize',
          fontWeight: 'fontWeight',
          borderRadius: 'borderRadius',
          borderWidth: 'borderWidth',
          borderColor: 'borderColor',
        }

        const cssProperty = cssPropertyMap[prop.name] as keyof React.CSSProperties
        if (cssProperty) {
          elementStyles[cssProperty] = value
        }
      }
    })

    // Add border styling
    if (elementStyles.borderWidth && elementStyles.borderWidth !== '0') {
      elementStyles.borderStyle = 'solid'
    }

    // Try to render using component renderer only for supported types
    let componentContent
    const supportedTypes = getAllComponentTypes()
    if (supportedTypes.includes(element.type as ComponentType)) {
      componentContent = renderComponentPreview({
        type: element.type as ComponentType,
        props: elementProps,
      })
    } else {
      // Fallback to basic HTML elements
      componentContent = renderBasicElement(element, elementProps)
    }

    return (
      <div
        key={element.id}
        onClick={(e) => {
          e.stopPropagation()
          onSelectElement(element.id)
        }}
        className="relative inline-block"
        style={elementStyles}
      >
        {componentContent}
      </div>
    )
  }

  const renderBasicElement = (element: ComponentElement, props: Record<string, any>) => {
    // Fallback rendering for basic HTML elements
    switch (element.type) {
      case 'div':
        return <div>{element.children?.map(renderElement)}</div>
      case 'h1':
        return <h1 className="text-2xl font-semibold">{props.text || 'Heading 1'}</h1>
      case 'h2':
        return <h2 className="text-xl font-semibold">{props.text || 'Heading 2'}</h2>
      case 'h3':
        return <h3 className="text-lg font-semibold">{props.text || 'Heading 3'}</h3>
      case 'p':
        return <p className="text-sm text-muted-foreground">{props.text}</p>
      case 'span':
        return <span>{props.text}</span>
      case 'a':
        return <a href={props.href || '#'}>{props.text || 'Link'}</a>
      case 'img':
        return (
          <img
            src={props.src || 'https://via.placeholder.com/150'}
            alt={props.alt || ''}
            className="max-w-full"
          />
        )
      default:
        return <div className="text-muted-foreground text-sm">Unknown element: {element.type}</div>
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {componentStructure.name}
          </h2>

          <div className="flex items-center gap-2">
            {/* Device size toggle */}
            <div className="flex border rounded-md">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`p-2 ${
                  deviceMode === 'desktop'
                    ? 'bg-accent'
                    : 'hover:bg-accent/50'
                }`}
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeviceMode('tablet')}
                className={`p-2 border-x ${
                  deviceMode === 'tablet'
                    ? 'bg-accent'
                    : 'hover:bg-accent/50'
                }`}
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`p-2 ${
                  deviceMode === 'mobile'
                    ? 'bg-accent'
                    : 'hover:bg-accent/50'
                }`}
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>

            {/* View mode toggle */}
            <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <TabsList>
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code">
                  <Code className="h-4 w-4 mr-1" />
                  Code
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-muted/10 p-8">
        {viewMode === 'preview' ? (
          <div
            className={`mx-auto transition-all ${deviceSizes[deviceMode]}`}
            style={{
              width: (propertyValues['width'] as string) || undefined,
              height: (propertyValues['height'] as string) || undefined,
              maxWidth: (propertyValues['maxWidth'] as string) || undefined,
            }}
          >
            <Card>
              <CardContent className="min-h-[400px]">
                <div className="space-y-4">
                  {componentStructure.elements.map(renderElement)}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent>
              <pre className="text-sm overflow-auto">
                <code>{componentCode || '// No code available'}</code>
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}



