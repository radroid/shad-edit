import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Shadcn Component Marketplace
        </h1>
        <p className="text-slate-300">
          Browse, customize, and publish shadcn components powered by TanStack Start and Convex.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/marketplace">
            <Button>Open Marketplace</Button>
          </Link>
          <Link to="/editor/$componentId" params={{ componentId: 'new' }}>
            <Button variant="secondary">New Component</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
