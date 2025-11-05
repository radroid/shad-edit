import { createFileRoute } from '@tanstack/react-router'
import { loadCatalogComponent } from '@/lib/catalog-loader'
import { extractPropertiesFromConfig } from '@/lib/property-extractor'
import { applyPropertiesToCode } from '@/lib/component-config'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, Code, Settings } from 'lucide-react'

export const Route = createFileRoute('/docs/$')({
  loader: async ({ params }) => {
    // Extract component ID from splat parameter
    // In TanStack Start, catch-all routes use the `_splat` parameter
    const splat = (params as any)._splat || ''
    
    // Extract component ID (first segment of the path)
    // For /docs/component-name, splat will be "component-name"
    // For /docs/component-name/subpath, splat will be "component-name/subpath"
    const componentId = splat.split('/')[0] || ''
    
    // If it's empty or just the index, return null
    if (!componentId || componentId === 'index') {
      return { componentId: null, config: null }
    }
    
    // Load the component config
    const config = await loadCatalogComponent(componentId)
    return { componentId, config }
  },
  component: DocsPage,
})

function DocsPage() {
  const { componentId, config } = Route.useLoaderData()
  const [propertyValues, setPropertyValues] = useState<Record<string, any>>({})

  if (!componentId || !config) {
    return (
      <div className="container mx-auto py-12">
        <h1 className="text-3xl font-bold mb-4">Component Documentation</h1>
        <p className="text-muted-foreground">
          Select a component from the catalog to view its documentation.
        </p>
      </div>
    )
  }

  // Initialize property values with defaults
  if (Object.keys(propertyValues).length === 0 && config.properties.length > 0) {
    const defaults: Record<string, any> = {}
    config.properties.forEach((prop) => {
      defaults[prop.name] = prop.defaultValue
    })
    setPropertyValues(defaults)
  }

  // Apply properties to code
  const renderedCode = applyPropertiesToCode(
    config.code,
    propertyValues,
    config.variableMappings
  )

  const structure = extractPropertiesFromConfig(config)

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/marketplace"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Marketplace
        </Link>
        
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{config.metadata.name}</h1>
            <p className="text-lg text-muted-foreground mb-4">
              {config.metadata.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {config.metadata.category && (
                <Badge variant="secondary">{config.metadata.category}</Badge>
              )}
              {config.metadata.tags?.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <Link
            to="/editor/$componentId"
            params={{ componentId }}
            className="inline-flex items-center"
          >
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Edit in Editor
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="preview" className="w-full">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="props">Properties</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Component Preview</CardTitle>
              <CardDescription>
                Interactive preview with customizable properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-8 bg-muted/50 min-h-[400px] flex items-center justify-center">
                {/* This would render the actual component */}
                <div className="text-sm text-muted-foreground">
                  Component preview will be rendered here
                  {/* TODO: Use component renderer to render the actual component */}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <Code className="h-5 w-5 inline mr-2" />
                Component Code
              </CardTitle>
              <CardDescription>
                The rendered code with current property values applied
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{renderedCode}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="props" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Editable Properties</CardTitle>
              <CardDescription>
                Customize the component properties to see live updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.properties.map((prop) => (
                  <div key={prop.name} className="space-y-2">
                    <label className="text-sm font-medium">
                      {prop.label}
                      {prop.description && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {prop.description}
                        </span>
                      )}
                    </label>
                    {/* TODO: Render appropriate input based on prop.type */}
                    <div className="text-sm text-muted-foreground">
                      Type: {prop.type}
                      {prop.defaultValue !== undefined && (
                        <span className="ml-2">
                          (Default: {String(prop.defaultValue)})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

