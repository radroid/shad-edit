import { createFileRoute } from '@tanstack/react-router'
import ComponentsList from '@/components/marketplace/ComponentsList'

export const Route = createFileRoute('/marketplace/')({
  component: Marketplace,
})

function Marketplace() {
  return (
    <div className="px-6 py-8 md:px-8 md:py-10">
      <div className="space-y-2 mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Components</h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Here you can find all the components available in the library. We are
          working on adding more components.
        </p>
      </div>

      <ComponentsList />
    </div>
  )
}



