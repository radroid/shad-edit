import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import {
  getGuestEditsForMigration,
  clearGuestEditsAfterMigration,
} from '@/lib/guest-cache'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

/**
 * Component that detects guest edits after authentication and prompts user to migrate them
 */
export function GuestEditMigration() {
  const { isAuthenticated } = useConvexAuth()
  const navigate = useNavigate()
  const [showDialog, setShowDialog] = useState(false)
  const [pendingEdits, setPendingEdits] = useState<
    Array<{ componentId: string; properties: Record<string, any> }>
  >([])
  const projects = useQuery(api.projects?.listUserProjects as any, isAuthenticated ? {} : 'skip')
  const addComponentToProject = useMutation(api.projectComponents?.addComponentToProject as any)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [isMigrating, setIsMigrating] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      setShowDialog(false)
      return
    }

    const edits = getGuestEditsForMigration()
    if (edits.length > 0) {
      setPendingEdits(edits)
      setShowDialog(true)
      // Pre-select first project if available
      if (projects && projects.length > 0) {
        setSelectedProjectId(projects[0]._id)
      }
    }
  }, [isAuthenticated, projects])

  const handleMigrate = async () => {
    if (!selectedProjectId || pendingEdits.length === 0) {
      alert('Please select a project')
      return
    }

    setIsMigrating(true)
    const migratedIds: string[] = []

    try {
      for (const edit of pendingEdits) {
        try {
          const newComponentId = await addComponentToProject({
            projectId: selectedProjectId as any,
            catalogComponentId: edit.componentId,
          })
          migratedIds.push(edit.componentId)
        } catch (error) {
          console.error(`Failed to migrate component ${edit.componentId}:`, error)
        }
      }

      if (migratedIds.length > 0) {
        clearGuestEditsAfterMigration(migratedIds)
        setShowDialog(false)
        // Navigate to the project
        navigate({
          to: '/projects/$projectId',
          params: { projectId: selectedProjectId },
        })
      }
    } catch (error) {
      console.error('Migration error:', error)
      alert('Failed to migrate some edits. Please try again.')
    } finally {
      setIsMigrating(false)
    }
  }

  const handleDismiss = () => {
    setShowDialog(false)
  }

  if (!showDialog || pendingEdits.length === 0) {
    return null
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Your Guest Edits</DialogTitle>
          <DialogDescription>
            You have {pendingEdits.length} component{pendingEdits.length > 1 ? 's' : ''} with
            unsaved edits in your browser cache. Would you like to import them into a project?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Project</label>
            {projects && projects.length > 0 ? (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {projects.map((project: any) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-muted-foreground">
                No projects found. Please create a project first.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Components to Import</label>
            <div className="flex flex-wrap gap-2">
              {pendingEdits.map((edit) => (
                <Badge key={edit.componentId} variant="secondary">
                  {edit.componentId}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleDismiss} disabled={isMigrating}>
            Dismiss
          </Button>
          <Button onClick={handleMigrate} disabled={!selectedProjectId || isMigrating}>
            {isMigrating ? 'Importing...' : 'Import to Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


