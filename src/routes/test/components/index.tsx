import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { Copy, Plus, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import CodeEditor from '@/components/editor/CodeEditor'
import GlobalCSSEditor from '@/components/editor/GlobalCSSEditor'
import LivePreview from '@/components/editor/LivePreview'
import { useCatalogComponents } from '@/lib/catalog-hooks'
import { useComponentEditor } from '@/hooks/useComponentEditor'
import { getScopedClassName, cssVariablesToInlineStyle } from '@/lib/scoped-css'
import { cn } from '@/lib/utils'
import { api } from '../../../../convex/_generated/api'

type SearchParams = {
  componentId?: string
}

export const Route = createFileRoute('/test/components/')({
  component: TestComponentsPage,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      componentId: (search.componentId as string) || undefined,
    }
  },
})

function TestComponentsPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/test/components/' })
  const { isAuthenticated } = useConvexAuth()
  const { components: catalogComponents, isLoading: catalogLoading } = useCatalogComponents()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  
  const projects = useQuery(api.projects?.listUserProjects as any, isAuthenticated ? {} : 'skip')
  const addComponentToProject = useMutation(api.projectComponents?.addComponentToProject as any)

  const {
    componentId,
    config,
    code,
    cssVariables,
    isLoading,
    isDirty,
    handleCodeChange,
    handleCssVariablesChange,
    selectComponent,
    resetToDefaults,
    saveToCache,
  } = useComponentEditor(search.componentId)

  // Auto-select first component if none selected (only on initial load)
  useEffect(() => {
    if (!catalogLoading && catalogComponents.length > 0 && !search.componentId) {
      navigate({
        to: '/test/components',
        search: { componentId: catalogComponents[0].id },
        replace: true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogLoading, catalogComponents.length, search.componentId])

  const handleComponentSelect = (id: string) => {
    navigate({
      to: '/test/components',
      search: { componentId: id },
      replace: false,
    })
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      alert('Code copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('Failed to copy code')
    }
  }

  const handleSaveToProject = async () => {
    if (!isAuthenticated) {
      navigate({
        to: '/auth/sign-in',
        search: {
          redirect: `/test/components?componentId=${componentId}`,
        },
      })
      return
    }

    if (!selectedProjectId) {
      alert('Please select a project')
      return
    }

    if (!componentId) {
      alert('No component selected')
      return
    }

    try {
      // Save current state to cache first
      saveToCache()

      // Prepare cache data to migrate to project
      const cacheData: {
        customCode?: string
        cssVariables?: any
      } = {}

      // Only include modified data
      if (isDirty && code !== config?.code) {
        cacheData.customCode = code
      }

      if (Object.keys(cssVariables).length > 0) {
        cacheData.cssVariables = cssVariables
      }

      const newComponentId = await addComponentToProject({
        projectId: selectedProjectId as any,
        catalogComponentId: componentId,
        ...cacheData,
      })

      alert('Component added to project successfully!')

      // Navigate to project editor
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
  }

  const previewCode = useMemo(() => {
    const catalogComponent = catalogComponents.find(c => c.id === componentId)
    return catalogComponent?.config?.previewCode || null
  }, [catalogComponents, componentId])

  const scopedClassName = componentId ? getScopedClassName(componentId) : ''
  const scopedStyle = cssVariablesToInlineStyle(cssVariables)

  if (catalogLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading components...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Components Editor</h1>
            <p className="text-sm text-muted-foreground">
              Edit components with live preview and scoped CSS variables
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isDirty ? 'default' : 'outline'} className="text-xs">
              {isDirty ? 'Unsaved changes in cache' : 'No changes'}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleCopyCode} disabled={!code}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </Button>
            <Button variant="outline" size="sm" onClick={resetToDefaults} disabled={!config}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            {isAuthenticated && projects && projects.length > 0 && (
              <>
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
                <Button onClick={handleSaveToProject} disabled={!selectedProjectId || !componentId}>
                  <Save className="h-4 w-4 mr-2" />
                  Save to Project
                </Button>
              </>
            )}
            {!isAuthenticated && (
              <Button onClick={handleSaveToProject}>
                <Plus className="h-4 w-4 mr-2" />
                Sign in to Save
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-1/4 border-r flex flex-col">
          <Tabs defaultValue="components" className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="components" className="flex-1">
                Components
              </TabsTrigger>
              <TabsTrigger value="css" className="flex-1">
                Global CSS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="components" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {catalogComponents.map((component) => (
                    <button
                      key={component.id}
                      onClick={() => handleComponentSelect(component.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-colors',
                        componentId === component.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-card hover:bg-accent'
                      )}
                    >
                      <div className="font-medium text-sm">
                        {component.config.metadata.name}
                      </div>
                      {component.config.metadata.description && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {component.config.metadata.description}
                        </div>
                      )}
                      {component.config.metadata.category && (
                        <Badge variant="secondary" className="text-xs mt-2">
                          {component.config.metadata.category}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="css" className="flex-1 m-0 overflow-hidden">
              <GlobalCSSEditor
                variables={cssVariables}
                onChange={handleCssVariablesChange}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview Area - Top Half */}
          <div className="h-1/2 border-b p-6 overflow-auto bg-muted/5">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-sm font-semibold mb-4">
                Preview
                {previewCode && (
                  <span className="text-xs text-muted-foreground ml-2 font-normal">
                    (Live rendering)
                  </span>
                )}
              </h3>
              <div
                className={cn('rounded-lg border bg-background p-8 min-h-[300px]', scopedClassName)}
                style={scopedStyle}
              >
                {isLoading ? (
                  <div className="text-center text-muted-foreground">Loading...</div>
                ) : previewCode ? (
                  <LivePreview 
                    previewCode={previewCode} 
                    componentCode={code}
                    className="w-full"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    No preview available for this component.
                    <div className="text-xs mt-2">
                      Add preview code to enable live rendering.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Code Editor - Bottom Half */}
          <div className="h-1/2 flex flex-col overflow-hidden">
            <div className="px-6 py-3 border-b bg-muted/30">
              <h3 className="text-sm font-semibold">Code Editor</h3>
              <p className="text-xs text-muted-foreground">
                Live edit the component code. Changes are auto-saved to cache.
              </p>
            </div>
            <div className="flex-1 p-6 overflow-hidden">
              <CodeEditor
                value={code}
                onChange={handleCodeChange}
                language="typescript"
                height="100%"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

