import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import ThemeEditor from '@/components/projects/ThemeEditor'
import ProjectThemeProvider from '@/components/projects/ProjectThemeProvider'
import { useDebouncedCallback } from '@/hooks/useDebounce'
import { useState, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Id } from '../../../../convex/_generated/dataModel'
import { renderComponentPreview, ComponentType } from '@/lib/component-renderer'
import { useConvexAuth } from 'convex/react'

export const Route = createFileRoute('/projects/$projectId/')({
  component: ProjectDetailPage,
})

function ProjectDetailPage() {
  const { projectId } = Route.useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useConvexAuth()
  const project = useQuery(
    api.projects.getProject,
    isAuthenticated ? { projectId: projectId as Id<'projects'> } : 'skip'
  )
  const components = useQuery(
    api.projectComponents.listProjectComponents,
    isAuthenticated ? { projectId: projectId as Id<'projects'> } : 'skip'
  )
  const updateTheme = useMutation(api.projects.updateProjectTheme)
  
  // Load catalog components for previews
  const catalogComponents = useQuery(api.catalogComponents.listCatalogComponents, {})
  const catalogMap = new Map(catalogComponents?.map(c => [c.componentId, c]) || [])
  
  const [localTheme, setLocalTheme] = useState(project?.globalTheme)

  // Debounced save to database
  const debouncedSaveTheme = useDebouncedCallback(
    async (theme: any) => {
      try {
        await updateTheme({
          projectId: projectId as Id<'projects'>,
          globalTheme: theme,
        })
      } catch (error) {
        console.error('Error updating theme:', error)
      }
    },
    500
  )

  // Update local theme when project loads
  useEffect(() => {
    if (project?.globalTheme) {
      setLocalTheme(project.globalTheme)
    }
  }, [project?.globalTheme])

  // Update local theme immediately for UI responsiveness
  const handleThemeChange = (newTheme: any) => {
    setLocalTheme(newTheme)
    debouncedSaveTheme(newTheme)
  }

  if (project === undefined) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 text-muted-foreground">
          Loading project...
        </div>
      </div>
    )
  }

  if (project === null) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <Link to="/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  const theme = localTheme || project.globalTheme

  return (
    <ProjectThemeProvider theme={theme}>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        {/* Sidebar - Component List */}
        <div className="w-64 shrink-0 border-r border-border bg-card text-card-foreground">
          <div className="border-b border-border bg-card/80 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-card-foreground">{project.name}</h2>
              <Link to="/projects">
                <Button size="sm" variant="ghost">
                  Back
                </Button>
              </Link>
            </div>
            <Button
              size="sm"
              className="w-full shadow-sm"
              onClick={() => navigate({ to: '/marketplace', search: { projectId: projectId as string } })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Component
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="space-y-2 p-2">
              {components?.map((component) => {
                const catalogComp = catalogMap.get(component.catalogComponentId)
                const componentType = catalogComp?.componentId.toLowerCase() as ComponentType | undefined
                const variantProps = component.variantProperties || {}
                
                return (
                  <Link
                    key={component._id}
                    to="/projects/$projectId/components/$componentId"
                    params={{ projectId, componentId: component._id }}
                  >
                    <Card className="hover:border-primary transition-colors cursor-pointer">
                      <CardHeader className="bg-card p-3">
                        <CardTitle className="text-sm text-card-foreground">{component.name}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          {component.selectedVariant}
                        </CardDescription>
                        {componentType && (
                          <div className="mt-2 flex min-h-[60px] items-center justify-center rounded border border-border bg-muted/40 p-2">
                            {renderComponentPreview({
                              type: componentType,
                              props: variantProps,
                            })}
                          </div>
                        )}
                      </CardHeader>
                    </Card>
                  </Link>
                )
              })}
              {components?.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No components yet. Add one from the marketplace.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content - Theme Editor */}
        <div className="flex-1 overflow-auto bg-muted/30">
          <div className="container mx-auto max-w-4xl space-y-6 py-8 px-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Theme Editor</h1>
              <p className="text-muted-foreground">
                Customize your project's global theme. Changes apply to all components in real-time.
              </p>
            </div>
            <ThemeEditor
              theme={theme}
              onThemeChange={(newTheme) => {
                handleThemeChange(newTheme)
                debouncedSaveTheme(newTheme)
              }}
            />
          </div>
        </div>
      </div>
    </ProjectThemeProvider>
  )
}

