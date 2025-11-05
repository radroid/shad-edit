import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'

export default function ComponentOverlay({ open, onOpenChange, componentId }: { open: boolean; onOpenChange: (v: boolean) => void; componentId: string }) {
  const navigate = useNavigate()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-300">Interact with the component</div>
          <Button
            onClick={() => navigate({ to: `/editor/${componentId}` })}
            className="ml-auto"
          >
            Edit Component
          </Button>
        </div>
        <div className="h-80 rounded bg-slate-900/50 border border-slate-700" />
      </DialogContent>
    </Dialog>
  )
}



