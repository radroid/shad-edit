import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { Copy, Plus, RotateCcw, Save, GripVertical, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { SidebarProvider, Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar'
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
  const [previewHeight, setPreviewHeight] = useState(50) // Percentage
  const [sidebarWidth, setSidebarWidth] = useState(256) // pixels (16rem = 256px)
  const [isDraggingVertical, setIsDraggingVertical] = useState(false)
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false)
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light')
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  
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

  // Vertical resize (preview/code)
  const handleVerticalMouseDown = useCallback(() => {
    setIsDraggingVertical(true)
  }, [])

  const handleVerticalMouseUp = useCallback(() => {
    setIsDraggingVertical(false)
  }, [])

  const handleVerticalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingVertical || !containerRef.current) return

      const container = containerRef.current
      const containerRect = container.getBoundingClientRect()
      const newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100

      // Constrain between 20% and 80%
      if (newHeight >= 20 && newHeight <= 80) {
        setPreviewHeight(newHeight)
      }
    },
    [isDraggingVertical]
  )

  useEffect(() => {
    if (isDraggingVertical) {
      window.addEventListener('mousemove', handleVerticalMouseMove)
      window.addEventListener('mouseup', handleVerticalMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleVerticalMouseMove)
        window.removeEventListener('mouseup', handleVerticalMouseUp)
      }
    }
  }, [isDraggingVertical, handleVerticalMouseMove, handleVerticalMouseUp])

  // Horizontal resize (sidebar)
  const handleHorizontalMouseDown = useCallback(() => {
    setIsDraggingHorizontal(true)
  }, [])

  const handleHorizontalMouseUp = useCallback(() => {
    setIsDraggingHorizontal(false)
  }, [])

  const handleHorizontalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingHorizontal || !pageRef.current) return

      const pageRect = pageRef.current.getBoundingClientRect()
      const newWidth = e.clientX - pageRect.left

      // Constrain between 200px and 600px
      if (newWidth >= 200 && newWidth <= 600) {
        setSidebarWidth(newWidth)
      }
    },
    [isDraggingHorizontal]
  )

  useEffect(() => {
    if (isDraggingHorizontal) {
      window.addEventListener('mousemove', handleHorizontalMouseMove)
      window.addEventListener('mouseup', handleHorizontalMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleHorizontalMouseMove)
        window.removeEventListener('mouseup', handleHorizontalMouseUp)
      }
    }
  }, [isDraggingHorizontal, handleHorizontalMouseMove, handleHorizontalMouseUp])

  const scopedClassName = componentId ? getScopedClassName(componentId) : ''
  const scopedStyle = cssVariablesToInlineStyle(cssVariables)

  if (catalogLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <p className="text-muted-foreground">Loading components...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={true} className="absolute inset-0 !min-h-0">
      <div ref={pageRef} className="w-full h-full flex overflow-hidden">
        {/* Left Sidebar using shadcn Sidebar */}
        <Sidebar collapsible="none" className="h-full flex-shrink-0" style={{ width: `${sidebarWidth}px` }}>
          <Tabs defaultValue="components" className="flex-1 flex flex-col h-full min-h-0">
            <div className="flex-shrink-0 border-b bg-background">
              <TabsList className="w-full h-auto p-2 bg-transparent rounded-none">
                <TabsTrigger 
                  value="components" 
                  className="flex-1 data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground"
                >
                  Components
                </TabsTrigger>
                <TabsTrigger 
                  value="css" 
                  className="flex-1 data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground"
                >
                  Global CSS
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="components" className="flex-1 m-0 overflow-hidden min-h-0 mt-0">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {catalogComponents.map((component) => (
                        <SidebarMenuItem key={component.id}>
                          <SidebarMenuButton
                            onClick={() => handleComponentSelect(component.id)}
                            isActive={componentId === component.id}
                            tooltip={component.config.metadata.description}
                            className="w-full"
                          >
                            <div className="flex flex-col items-start w-full">
                              <span className="font-medium text-sm">
                                {component.config.metadata.name}
                              </span>
                              {component.config.metadata.description && (
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                  {component.config.metadata.description}
                                </span>
                              )}
                            </div>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </TabsContent>

            <TabsContent value="css" className="flex-1 m-0 overflow-hidden min-h-0 mt-0 flex flex-col">
              <div className="flex-1 min-h-0 overflow-hidden">
                <GlobalCSSEditor
                  variables={cssVariables}
                  onChange={handleCssVariablesChange}
                  theme={previewTheme}
                  onThemeChange={setPreviewTheme}
                />
              </div>
            </TabsContent>
          </Tabs>
        </Sidebar>

        {/* Horizontal Resize Handle */}
        <div
          className={cn(
            "w-1 bg-border hover:bg-primary cursor-col-resize flex items-center justify-center group relative flex-shrink-0",
            isDraggingHorizontal && "bg-primary"
          )}
          onMouseDown={handleHorizontalMouseDown}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden h-full min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b flex-shrink-0">
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

        {/* Editor Area with resizable preview/code */}
        <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden relative min-h-0">
          {/* Preview Area */}
          <div 
            className="border-b overflow-auto bg-muted/5 flex flex-col" 
            style={{ height: `${previewHeight}%` }}
          >
            <div className="px-6 pt-4 pb-2 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-semibold">
                Preview
                {previewCode && (
                  <span className="text-xs text-muted-foreground ml-2 font-normal">
                    (Live rendering)
                  </span>
                )}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPreviewTheme(previewTheme === 'light' ? 'dark' : 'light')}
                title={`Switch to ${previewTheme === 'light' ? 'dark' : 'light'} theme`}
              >
                {previewTheme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex-1 overflow-auto px-6 pb-6">
              <div className="max-w-5xl mx-auto">
                <div
                  className={cn('rounded-lg border p-8 min-h-[300px] bg-background text-foreground', previewTheme === 'dark' && 'dark', scopedClassName)}
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
          </div>

          {/* Vertical Resize Handle */}
          <div
            className={cn(
              "h-1 bg-border hover:bg-primary cursor-row-resize flex items-center justify-center group relative",
              isDraggingVertical && "bg-primary"
            )}
            onMouseDown={handleVerticalMouseDown}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary rotate-90" />
            </div>
          </div>

          {/* Code Editor */}
          <div 
            className="flex flex-col overflow-hidden"
            style={{ height: `${100 - previewHeight}%` }}
          >
            <div className="px-6 py-3 border-b bg-muted/30">
              <h3 className="text-sm font-semibold">Code Editor</h3>
              <p className="text-xs text-muted-foreground">
                Live edit the component code. Changes are auto-saved to cache.
              </p>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {!code && !isLoading && (
                <div className="text-sm text-muted-foreground p-4">
                  No code loaded. ComponentId: {componentId || 'none'}, Config: {config ? 'loaded' : 'not loaded'}
                </div>
              )}
              <div className="flex-1">
                <CodeEditor
                  value={code || '// Loading code...'}
                  onChange={handleCodeChange}
                  language="typescript"
                  height="100%"
                />
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </SidebarProvider>
  )
}

