import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { Plus, Copy, Check } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import LivePreview from '@/components/editor/LivePreview'
import CodeEditor from '@/components/editor/CodeEditor'
import { useCatalogComponent } from '@/lib/catalog-hooks'
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
  const [isCopied, setIsCopied] = useState(false)
  const [showProjectSelector, setShowProjectSelector] = useState(false)
  
  const projects = useQuery(api.projects?.listUserProjects as any, isAuthenticated ? {} : 'skip')
  const addComponentToProject = useMutation(api.projectComponents?.addComponentToProject as any)
  
  // Set project from URL search params if available
  useEffect(() => {
    if (search?.projectId) {
      setSelectedProjectId(search.projectId)
    }
  }, [search])

  const handleCopyCode = () => {
    if (!config) return
    navigator.clipboard.writeText(config.code).then(() => {
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
      }, 5000)
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
  }

  const handleEditClick = () => {
    if (!isAuthenticated) {
      // Redirect to sign in with return URL
      navigate({
        to: '/auth/sign-in',
        search: {
          redirect: `/test/marketplace?componentId=${componentId}`,
        },
      })
    } else {
      // Show project selector
      setShowProjectSelector(true)
    }
  }

  const handleAddAndEdit = async () => {
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
  }

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
        <div className="flex flex-col flex-1 min-h-0 space-y-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-shrink-0">
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
            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  title={isCopied ? "Copied!" : "Copy code"}
                >
                  {isCopied ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Code
                    </>
                  )}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEditClick}
                >
                  Edit in Project
                </Button>
              </div>
              {showProjectSelector && isAuthenticated && (
                <>
                  {projects && projects.length > 0 ? (
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
                        onClick={handleAddAndEdit}
                        disabled={!selectedProjectId}
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add & Edit
                      </Button>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      You don't have any projects yet.{' '}
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => {
                          onOpenChange(false)
                          navigate({ to: '/projects' })
                        }}
                      >
                        Create a project first
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Split View: Preview Top, Code Bottom */}
          <div className="flex-1 flex flex-col min-h-0 gap-4 overflow-hidden">
            {/* Preview - Top Half */}
            <div className="flex-1 min-h-0 flex flex-col border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/30 flex-shrink-0">
                <h3 className="text-sm font-semibold">Preview</h3>
              </div>
              <div className="flex-1 min-h-0 overflow-auto p-6 bg-muted/5">
                <div className="max-w-5xl mx-auto">
                  <div className="rounded-lg border bg-background p-8 min-h-[200px] flex items-center justify-center">
                    {config.previewCode ? (
                      <LivePreview 
                        previewCode={config.previewCode} 
                        componentCode={config.code}
                        className="w-full"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        No preview available for this component
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Code - Bottom Half */}
            <div className="flex-1 min-h-0 flex flex-col border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/30 flex-shrink-0">
                <h3 className="text-sm font-semibold">Code</h3>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <CodeEditor
                  value={config.code}
                  onChange={() => {}}
                  language="typescript"
                  height="100%"
                  readOnly={true}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

