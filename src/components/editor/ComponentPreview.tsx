import { ComponentElement, ComponentStructure } from '@/lib/property-extractor'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Monitor, Smartphone, Tablet, Code, Eye } from 'lucide-react'
import { useState } from 'react'
import { renderComponentPreview, ComponentType, getAllComponentTypes } from '@/lib/component-renderer'
import type { ComponentConfig } from '@/lib/component-config'
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockItem,
} from '@/components/kibo-ui/code-block'

type ComponentCanvasProps = {
  componentStructure?: ComponentStructure
  selectedElementId?: string
  onSelectElement: (elementId: string) => void
  propertyValues: Record<string, any>
  componentCode?: string
  componentConfig?: ComponentConfig | null
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

    // Apply enhanced CSS properties for advanced overrides
    // These should be applied directly to the component, not the wrapper
    const componentStyles: React.CSSProperties = {}
    const wrapperStyles: React.CSSProperties = {}
    
    // Helper function to normalize CSS values (add 'px' if it's just a number)
    const normalizeValue = (value: any, needsUnit: boolean = false): string | undefined => {
      if (value === undefined || value === null || value === '') return undefined
      const strValue = String(value).trim()
      if (!strValue) return undefined
      
      // If it needs a unit and is just a number, add 'px'
      // Also handle decimal numbers
      if (needsUnit && /^\d+(\.\d+)?$/.test(strValue)) {
        return `${strValue}px`
      }
      
      return strValue
    }
    
    const enhancedProps = ['backgroundColor', 'color', 'padding', 'margin', 'fontSize', 'fontWeight', 'borderWidth', 'borderColor', 'borderRadius']
    enhancedProps.forEach((propName) => {
      const key = `${element.id}.${propName}`
      const value = propertyValues[key]
      if (value !== undefined && value !== null && value !== '') {
        const cssProp = propName as keyof React.CSSProperties
        
        // For component-level properties (background, text color, padding, etc.), apply to component
        // For wrapper properties (margin), apply to wrapper
        if (propName === 'margin' || propName === 'marginTop' || propName === 'marginBottom' || 
            propName === 'marginLeft' || propName === 'marginRight') {
          const normalizedValue = normalizeValue(value, true)
          if (normalizedValue) {
            // Type assertion needed for margin properties
            wrapperStyles[cssProp as 'margin' | 'marginTop' | 'marginBottom' | 'marginLeft' | 'marginRight'] = normalizedValue as any
          }
        } else if (propName === 'marginX' || propName === 'marginY') {
          // Handle marginX and marginY as marginLeft/Right or marginTop/Bottom
          const normalizedValue = normalizeValue(value, true)
          if (normalizedValue) {
            if (propName === 'marginX') {
              wrapperStyles.marginLeft = normalizedValue as any
              wrapperStyles.marginRight = normalizedValue as any
            } else {
              wrapperStyles.marginTop = normalizedValue as any
              wrapperStyles.marginBottom = normalizedValue as any
            }
          }
        } else {
          // Apply directly to component - these override variant classes via inline styles
          if (cssProp === 'fontWeight') {
            componentStyles[cssProp] = value as React.CSSProperties['fontWeight']
          } else if (cssProp === 'backgroundColor' || cssProp === 'color') {
            // For colors, ensure we're using the value directly (hex, hsl, rgb, etc.)
            componentStyles[cssProp] = value as any
          } else if (cssProp === 'padding' || cssProp === 'fontSize') {
            // Padding and fontSize need units if they're just numbers
            const normalizedValue = normalizeValue(value, true)
            if (normalizedValue) {
              componentStyles[cssProp] = normalizedValue
            }
          } else if (cssProp === 'borderWidth') {
            // Border width needs units if it's just a number
            const normalizedValue = normalizeValue(value, true)
            if (normalizedValue) {
              componentStyles[cssProp] = normalizedValue
            }
          } else if (cssProp === 'borderColor') {
            // Border color is a color value
            componentStyles[cssProp] = value as any
          } else if (cssProp === 'borderRadius') {
            // Border radius needs units if it's just a number
            const normalizedValue = normalizeValue(value, true)
            if (normalizedValue) {
              componentStyles[cssProp] = normalizedValue
            }
          } else {
            componentStyles[cssProp] = value as any
          }
        }
      }
    })

    // Add border styling - ensure border is visible when borderWidth is set
    if (componentStyles.borderWidth && componentStyles.borderWidth !== '0' && componentStyles.borderWidth !== '0px') {
      componentStyles.borderStyle = 'solid'
      // If borderColor is not set but borderWidth is, set a default border color
      if (!componentStyles.borderColor) {
        componentStyles.borderColor = 'currentColor'
      }
    }

    // Try to render using component renderer only for supported types
    let componentContent
    const supportedTypes = getAllComponentTypes()
    if (supportedTypes.includes(element.type as ComponentType)) {
      // Merge component styles into elementProps so they're applied directly to the component
      componentContent = renderComponentPreview({
        type: element.type as ComponentType,
        props: {
          ...elementProps,
          style: componentStyles, // Pass styles directly to component to override variant classes
        },
      })
    } else {
      // Fallback to basic HTML elements
      componentContent = renderBasicElement(element, { ...elementProps, style: componentStyles })
    }

    return (
      <div
        key={element.id}
        onClick={(e) => {
          e.stopPropagation()
          onSelectElement(element.id)
        }}
        className="relative inline-block border-2 border-dashed border-gray-100 dark:border-gray-200"
        style={wrapperStyles}
      >
        {componentContent}
      </div>
    )
  }

  const renderBasicElement = (element: ComponentElement, props: Record<string, any>) => {
    // Fallback rendering for basic HTML elements
    const style = props.style || {}
    switch (element.type) {
      case 'div':
        return <div style={style}>{element.children?.map(renderElement)}</div>
      case 'h1':
        return <h1 className="text-2xl font-semibold" style={style}>{props.text || 'Heading 1'}</h1>
      case 'h2':
        return <h2 className="text-xl font-semibold" style={style}>{props.text || 'Heading 2'}</h2>
      case 'h3':
        return <h3 className="text-lg font-semibold" style={style}>{props.text || 'Heading 3'}</h3>
      case 'p':
        return <p className="text-sm text-muted-foreground" style={style}>{props.text}</p>
      case 'span':
        return <span style={style}>{props.text}</span>
      case 'a':
        return <a href={props.href || '#'} style={style}>{props.text || 'Link'}</a>
      case 'img':
        return (
          <img
            src={props.src || 'https://via.placeholder.com/150'}
            alt={props.alt || ''}
            className="max-w-full"
            style={style}
          />
        )
      default:
        return <div className="text-muted-foreground text-sm" style={style}>Unknown element: {element.type}</div>
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
          <Card className="overflow-hidden !p-0 !py-0">
            <CardContent className="p-0">
              {componentCode ? (
                <CodeBlock
                  data={[
                    {
                      language: 'tsx',
                      filename: 'component.tsx',
                      code: componentCode,
                    },
                  ]}
                  defaultValue="tsx"
                  className="border-0 rounded-none w-full m-0"
                >
                  <div className="flex items-center justify-end border-b bg-secondary/50 p-2 m-0">
                    <CodeBlockCopyButton />
                  </div>
                  <CodeBlockBody>
                    {(item) => (
                      <CodeBlockItem
                        key={item.language}
                        value={item.language}
                        lineNumbers
                        className="overflow-y-auto overflow-x-hidden max-h-[calc(100vh-300px)] [&_.shiki]:bg-card [&_code]:whitespace-pre-wrap! [&_code]:break-words! [&_code]:overflow-x-hidden! [&_code]:block! [&_code]:grid-none! [&_.line]:whitespace-pre-wrap! [&_.line]:break-words! [&_pre]:m-0! [&_pre]:py-0! [&_pre]:px-0!"
                      >
                        <CodeBlockContent 
                          language="tsx"
                          themes={{
                            light: "github-light",
                            dark: "github-dark-default",
                          }}
                        >
                          {item.code}
                        </CodeBlockContent>
                      </CodeBlockItem>
                    )}
                  </CodeBlockBody>
                </CodeBlock>
              ) : (
                <div className="p-4 text-sm text-muted-foreground">
                  // No code available
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}



