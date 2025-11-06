import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export const Route = createFileRoute('/projects/$projectId/components/')({
  component: ProjectComponentsPage,
})

function ProjectComponentsPage() {
  const { projectId } = Route.useParams()
  const components = useQuery(api.projectComponents.listProjectComponents, { projectId: projectId as any })

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Components</h1>
          <p className="text-muted-foreground">
            Manage components in this project
          </p>
        </div>
        <Link to="/marketplace" search={{ projectId }}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Component
          </Button>
        </Link>
      </div>

      {components === undefined ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading components...
        </div>
      ) : components.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No components yet</p>
          <Link to="/marketplace" search={{ projectId }}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Component
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {components.map((component) => (
            <Link
              key={component._id}
              to="/projects/$projectId/components/$componentId"
              params={{ projectId, componentId: component._id }}
              className="block"
            >
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>{component.name}</CardTitle>
                  <CardDescription>Variant: {component.selectedVariant}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Updated {new Date(component.updatedAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
