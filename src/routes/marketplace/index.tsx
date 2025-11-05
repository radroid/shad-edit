import { createFileRoute } from '@tanstack/react-router'
import ComponentCard from '@/components/marketplace/ComponentCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

export const Route = createFileRoute('/marketplace/')({
  component: Marketplace,
})

function Marketplace() {
  const demos = [
    {
      id: 'button',
      name: 'Button',
      preview: <Button>Button</Button>,
    },
    {
      id: 'input',
      name: 'Input',
      preview: <Input placeholder="Your name" />,
    },
    {
      id: 'dialog',
      name: 'Dialog',
      preview: (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>Dialog content</DialogContent>
        </Dialog>
      ),
    },
    {
      id: 'kibo-card',
      name: 'Kibo UI - Card (placeholder)',
      preview: <div className="h-24 rounded bg-slate-800/50" />,
    },
  ]
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {demos.map((item) => (
          <div key={item.id}>
            <ComponentCard title={item.name} />
            <div className="mt-3 space-y-2">{item.preview}</div>
          </div>
        ))}
      </div>
    </div>
  )
}



