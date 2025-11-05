import { Dialog, DialogContent } from '@/components/ui/dialog'

export default function ComponentOverlay({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <div className="h-80 rounded bg-slate-900/50 border border-slate-700 mb-4" />
        <div className="text-sm text-slate-300">Component details...</div>
      </DialogContent>
    </Dialog>
  )
}


