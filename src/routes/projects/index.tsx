import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useConvexAuth } from 'convex/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/projects/')({
  component: ProjectsPage,
})

function ProjectsPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useConvexAuth()
  const projects = useQuery(api.projects.listUserProjects, isAuthenticated ? {} : 'skip')
  const createProject = useMutation(api.projects.createProject)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-2xl font-bold">Sign in required</h2>
          <p className="text-muted-foreground">
            Please sign in to view and manage your projects.
          </p>
          <Link to="/auth/sign-in">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return
    
    try {
      const projectId = await createProject({
        name: newProjectName.trim(),
        description: newProjectDescription.trim() || undefined,
      })
      setCreateDialogOpen(false)
      setNewProjectName('')
      setNewProjectDescription('')
      navigate({ to: '/projects/$projectId', params: { projectId } })
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground">
            Manage your component projects and themes
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {projects === undefined ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No projects found' : 'No projects yet'}
          </p>
          {!searchQuery && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <Link
              key={project._id}
              to="/projects/$projectId"
              params={{ projectId: project._id }}
              className="block"
            >
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription>{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex gap-2">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: project.globalTheme?.colors?.primary }}
                      />
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: project.globalTheme?.colors?.secondary }}
                      />
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: project.globalTheme?.colors?.accent }}
                      />
                    </div>
                    <span>
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to start adding and customizing components
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="My Awesome Project"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newProjectName.trim()) {
                    handleCreateProject()
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (optional)</Label>
              <Input
                id="project-description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="A brief description of your project"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false)
                setNewProjectName('')
                setNewProjectDescription('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
