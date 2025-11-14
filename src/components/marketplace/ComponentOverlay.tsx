import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { Code, Edit, Plus, RotateCcw, Trash2 } from 'lucide-react'

import PropertyManager from '@/components/editor/PropertyManager'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockItem,
} from '@/components/kibo-ui/code-block'
import { useGuestEditor } from '@/hooks/useGuestEditor'
import { useCatalogComponent } from '@/lib/catalog-hooks'
import {
  ComponentElement,
  PropertyDefinition,
} from '@/lib/property-extractor'
import {
  ComponentType,
  getAllComponentTypes,
  renderComponentPreview,
} from '@/lib/component-renderer'
import { api } from '../../../convex/_generated/api'

export default function ComponentOverlay({ 
  open, 
  onOpenChange, 
  componentId,
  onEdit
}: { 
  open: boolean
  onOpenChange: (v: boolean) => void
  componentId: string
  onEdit?: () => void
}) {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { projectId?: string } | undefined
  const { isAuthenticated } = useConvexAuth()
  const { config, isLoading } = useCatalogComponent(componentId)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('preview')
  const isNavigatingRef = useRef(false)
  const {
    structure,
    propertyValues,
    selectedElementId,
    setSelectedElementId,
    handlePropertyChange,
    componentCode,
    isDirty,
    resetToDefaults,
    clearGuestCache,
  } = useGuestEditor(componentId, config)
  
  const projects = useQuery(api.projects?.listUserProjects as any, isAuthenticated ? {} : 'skip')
  const addComponentToProject = useMutation(api.projectComponents?.addComponentToProject as any)
  
  // Set project from URL search params if available
  useEffect(() => {
    if (search?.projectId) {
      setSelectedProjectId(search.projectId)
    }
  }, [search])

  // Reset active tab to preview when component changes
  useEffect(() => {
    setActiveTab('preview')
  }, [componentId])

  const elementOptions = useMemo(() => {
    return structure?.elements ?? []
  }, [structure])

  const selectedElement = useMemo(() => {
    if (!structure) return undefined
    return (
      structure.elements.find((element) => element.id === selectedElementId) ??
      structure.elements[0]
    )
  }, [structure, selectedElementId])

  // Get selected variant from propertyValues (stored as `${elementId}.variant`)
  const selectedVariant = useMemo(() => {
    if (!selectedElement) return 'default'
    const variantKey = `${selectedElement.id}.variant`
    return propertyValues[variantKey] ?? config?.variants?.[0]?.name ?? 'default'
  }, [selectedElement, propertyValues, config])

  // Handle variant change - apply variant properties and save
  const handleVariantChange = useCallback((variantName: string) => {
    if (!selectedElement || !config?.variants) return
    
    const variant = config.variants.find((v: any) => v.name === variantName)
    if (!variant) return

    // Set the variant property
    const variantKey = `${selectedElement.id}.variant`
    handlePropertyChange(variantKey, variantName)

    // Apply variant properties if they exist
    if (variant.properties) {
      Object.entries(variant.properties).forEach(([propName, propValue]) => {
        const propertyKey = `${selectedElement.id}.${propName}`
        handlePropertyChange(propertyKey, propValue)
      })
    }
  }, [selectedElement, config, handlePropertyChange])

  const previewProps = useMemo(() => {
    if (!selectedElement) return {}
    // Include variant in preview props
    const props = buildPreviewProps(selectedElement, propertyValues)
    const variantKey = `${selectedElement.id}.variant`
    if (propertyValues[variantKey]) {
      props.variant = propertyValues[variantKey]
    }
    return props
  }, [selectedElement, propertyValues])

  const supportedComponentTypes = useMemo(
    () => new Set<ComponentType>(getAllComponentTypes()),
    []
  )

  const previewNode = useMemo(() => {
    if (!selectedElement) {
      return (
        <div className="text-center text-muted-foreground">
          No preview available for this component.
        </div>
      )
    }

    if (supportedComponentTypes.has(selectedElement.type as ComponentType)) {
      return renderComponentPreview({
        type: selectedElement.type as ComponentType,
        props: previewProps,
      })
    }

    return renderFallbackElement(selectedElement, previewProps)
  }, [selectedElement, previewProps, supportedComponentTypes])

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

  const handleDialogChange = (newOpen: boolean) => {
    try {
      // Allow dialog to close normally
      onOpenChange(newOpen)
    } catch (error) {
      // Silently handle any cleanup errors
      console.warn('Dialog cleanup error:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="!w-[90vw] !max-w-[95vw] h-[95vh] max-h-[95vh] flex flex-col p-6">
        <div className="flex flex-col flex-1 min-h-0 space-y-6 overflow-hidden">
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
            <div className="flex flex-col items-end gap-3 min-w-[16rem]">
              <Badge variant="outline" className="text-xs uppercase tracking-wide">
                {isDirty ? 'Autosaved to browser cache' : 'No guest edits yet'}
              </Badge>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    // For guests: switch to Properties tab for in-place editing
                    // For authenticated users: navigate to full-page editor if they prefer
                    if (isAuthenticated && onEdit) {
                      // Authenticated users can use the full-page editor
                      if (isNavigatingRef.current) return
                      isNavigatingRef.current = true
                      onEdit()
                    } else {
                      // Guests or when no onEdit callback: switch to Properties tab for editing
                      setActiveTab('props')
                    }
                  }}
                  disabled={!structure}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {isAuthenticated ? 'Edit in Full Page' : 'Edit Properties'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToDefaults}
                  disabled={!structure}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearGuestCache}
                  disabled={!structure}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cache
                </Button>
              </div>
              {isAuthenticated && projects && projects.length > 0 && (
                <div className="flex items-center gap-2">
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project: any) => (
                        <SelectItem key={project._id} value={project._id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={async () => {
                      if (!selectedProjectId) {
                        alert('Please select a project')
                        return
                      }
                      try {
                        const newComponentId = await addComponentToProject({
                          projectId: selectedProjectId as any,
                          catalogComponentId: componentId,
                        })
                        onOpenChange(false)
                        navigate({
                          to: '/projects/$projectId/components/$componentId',
                          params: {
                            projectId: selectedProjectId,
                            componentId: newComponentId as string,
                          },
                        })
                      } catch (error) {
                        console.error('Error adding component:', error)
                        alert('Failed to add component to project')
                      }
                    }}
                    disabled={!selectedProjectId}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Project
                  </Button>
                </div>
              )}
              {!isAuthenticated && isDirty && (
                <Button
                  onClick={() => {
                    navigate({
                      to: '/auth/sign-in',
                      search: {
                        redirect: `/marketplace?componentId=${componentId}`,
                      },
                    })
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Sign in to Save to Project
                </Button>
              )}
            </div>
          </div>

          {/* Main Content with Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 min-h-0 overflow-hidden">
            <TabsList className="w-full justify-start h-12 bg-muted/30 border-b rounded-none rounded-t-lg gap-0.5 p-1.5">
              <TabsTrigger 
                value="preview" 
                className="px-6 h-9 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all relative data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:-bottom-px data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary"
              >
                Preview
              </TabsTrigger>
              <TabsTrigger 
                value="code" 
                className="px-6 h-9 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all relative data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:-bottom-px data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary"
              >
                Code
              </TabsTrigger>
              <TabsTrigger 
                value="props" 
                className="px-6 h-9 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all relative data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:-bottom-px data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary"
              >
                Properties
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-0 pt-6 flex flex-col flex-1 min-h-0 overflow-hidden">
              <Card className="flex flex-col flex-1 min-h-0 overflow-hidden border-t-0 rounded-t-none">
                <CardHeader className="shrink-0 pb-4">
                  <CardTitle>Component Preview</CardTitle>
                  <CardDescription>
                    Edits are applied instantly; changes persist locally until cleared.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-0 overflow-auto">
                  <div className="rounded-lg bg-linear-to-br from-slate-900 to-slate-800 border border-slate-700 p-8">
                    <div className="bg-background rounded-lg border p-8 min-h-[320px] flex items-center justify-center">
                      <div className="w-full max-w-3xl space-y-4 text-sm text-muted-foreground">
                        {previewNode}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code" className="mt-0 pt-6 flex flex-col flex-1 min-h-0 overflow-hidden">
              <Card className="flex flex-col flex-1 min-h-0 overflow-hidden border-t-0 rounded-t-none">
                <CardHeader className="shrink-0 pb-4">
                  <CardTitle>
                    <Code className="h-5 w-5 inline mr-2" />
                    Component Code
                  </CardTitle>
                  <CardDescription>
                    Tailwind utility updates are reflected in real time. Copy to use locally.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
                  <CodeBlock
                    data={[
                      {
                        language: 'tsx',
                        filename: 'component.tsx',
                        code: componentCode || config.code || '',
                      },
                    ]}
                    defaultValue="tsx"
                    className="border-0 rounded-none w-full m-0 flex flex-col flex-1 min-h-0 overflow-hidden"
                  >
                    <div className="flex items-center justify-end border-b bg-secondary/50 p-2 m-0 shrink-0">
                      <CodeBlockCopyButton />
                    </div>
                    <CodeBlockBody className="flex-1 min-h-0 overflow-hidden">
                      {(item) => (
                        <CodeBlockItem
                          key={item.language}
                          value={item.language}
                          lineNumbers
                        className="h-full overflow-y-auto overflow-x-auto [&_.shiki]:bg-card [&_code]:whitespace-pre! [&_code]:overflow-x-auto! [&_code]:block! [&_code]:grid-none! [&_.line]:whitespace-pre! [&_pre]:m-0! [&_pre]:py-0! [&_pre]:px-0!"
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="props" className="mt-0 pt-6 flex flex-col flex-1 min-h-0 overflow-hidden">
              <Card className="flex flex-col flex-1 min-h-0 overflow-hidden border-t-0 rounded-t-none">
                <CardHeader className="shrink-0 pb-4">
                  <CardTitle>Editable Properties</CardTitle>
                  <CardDescription>
                    Update Tailwind-aware fields; edits are autosaved to your browser.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 min-h-0 overflow-auto">
                  {structure && structure.elements.length > 0 ? (
                    <>
                      <div className="flex flex-wrap items-center gap-3">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                          Element
                        </Label>
                        <Select
                          value={selectedElement?.id ?? ''}
                          onValueChange={(value) => {
                            setSelectedElementId(value)
                          }}
                        >
                          <SelectTrigger className="w-56">
                            <SelectValue placeholder="Choose element" />
                          </SelectTrigger>
                          <SelectContent>
                            {elementOptions.map((element) => (
                              <SelectItem key={element.id} value={element.id}>
                                {element.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedElement ? (
                        <PropertyManager
                          selectedElement={selectedElement}
                          propertyValues={propertyValues}
                          onPropertyChange={handlePropertyChange}
                          variants={config?.variants || []}
                          selectedVariant={selectedVariant}
                          onVariantChange={handleVariantChange}
                          showAdvancedOverrides={false}
                        />
                      ) : (
                        <p className="text-muted-foreground">
                          Select an element to configure its properties.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      This component has no editable Tailwind properties configured yet.
                    </p>
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

function buildPreviewProps(
  element: ComponentElement,
  propertyValues: Record<string, any>
) {
  const props: Record<string, any> = {}
  const classNames: string[] = []

  element.properties.forEach((property: PropertyDefinition) => {
    const key = `${element.id}.${property.name}`
    const value = propertyValues[key] ?? property.defaultValue
    if (value === undefined || value === null || value === '') return

    if (property.apply === 'class') {
      classNames.push(String(value))
    } else if (property.apply === 'attribute') {
      props[property.attributeName ?? property.name] = value
    } else if (property.apply === 'content') {
      props[property.name] = value
    } else {
      props[property.name] = value
    }
  })

  if (classNames.length > 0) {
    props.className = classNames.join(' ')
  }

  return props
}

function renderFallbackElement(
  element: ComponentElement,
  props: Record<string, any>
) {
  const { className, text, children, ...rest } = props
  switch (element.type) {
    case 'div':
      return (
        <div className={className} {...rest}>
          {text || element.name}
          {Array.isArray(children) ? children : null}
        </div>
      )
    case 'p':
      return (
        <p className={className} {...rest}>
          {text || 'Paragraph'}
        </p>
      )
    case 'span':
      return (
        <span className={className} {...rest}>
          {text || 'Text'}
        </span>
      )
    case 'a':
      return (
        <a className={className} {...rest}>
          {text || 'Link'}
        </a>
      )
    default:
      return (
        <div className={className} {...rest}>
          {text || `Preview unavailable for ${element.name}`}
        </div>
      )
  }
}



