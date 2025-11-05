import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCatalogComponent } from '@/lib/catalog-hooks'
import { applyPropertiesToCode } from '@/lib/component-config'
import { useState, useEffect } from 'react'
import { Code, Settings } from 'lucide-react'

export default function ComponentOverlay({ 
  open, 
  onOpenChange, 
  componentId 
}: { 
  open: boolean
  onOpenChange: (v: boolean) => void
  componentId: string 
}) {
  const navigate = useNavigate()
  const { config, isLoading } = useCatalogComponent(componentId)
  const [propertyValues, setPropertyValues] = useState<Record<string, any>>({})

  // Initialize property values with defaults from config
  useEffect(() => {
    if (config && config.properties.length > 0 && Object.keys(propertyValues).length === 0) {
      const defaults: Record<string, any> = {}
      config.properties.forEach((prop) => {
        defaults[prop.name] = prop.defaultValue
      })
      setPropertyValues(defaults)
    }
  }, [config, propertyValues])

  // Apply properties to code
  const renderedCode = config 
    ? applyPropertiesToCode(config.code, propertyValues, config.variableMappings)
    : ''

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading component...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!config) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Component not found</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{config.metadata.name}</h2>
              {config.metadata.description && (
                <p className="text-muted-foreground mb-3">{config.metadata.description}</p>
              )}
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
            <Button
              onClick={() => navigate({ to: '/editor/$componentId', params: { componentId } })}>
              <Settings className="h-4 w-4 mr-2" />
              Edit in Editor
            </Button>
          </div>

          {/* Main Content with Tabs */}
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
                    Interactive preview of the component
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-8">
                    <div className="bg-background rounded-lg border p-8 min-h-[400px] flex items-center justify-center">
                      <div className="w-full space-y-4">
                        {/* TODO: Render actual component from config */}
                        <div className="text-center text-muted-foreground">
                          Component preview will be rendered here
                        </div>
                      </div>
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
                    The component code with current property values applied
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderedCode ? (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{renderedCode}</code>
                    </pre>
                  ) : (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{config.code}</code>
                    </pre>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="props" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Editable Properties</CardTitle>
                  <CardDescription>
                    Component properties and their default values
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {config.properties.length > 0 ? (
                    <div className="space-y-4">
                      {config.properties.map((prop) => (
                        <div key={prop.name} className="space-y-2 pb-4 border-b last:border-0">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">
                              {prop.label}
                            </label>
                            <Badge variant="outline" className="text-xs">
                              {prop.type}
                            </Badge>
                          </div>
                          {prop.description && (
                            <p className="text-xs text-muted-foreground">
                              {prop.description}
                            </p>
                          )}
                          {prop.defaultValue !== undefined && (
                            <div className="text-xs text-muted-foreground">
                              Default: <code className="bg-muted px-1 rounded">{String(prop.defaultValue)}</code>
                            </div>
                          )}
                          {prop.options && (
                            <div className="text-xs text-muted-foreground">
                              Options: {prop.options.map(opt => opt.label).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No properties defined</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}



