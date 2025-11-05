import { createFileRoute } from '@tanstack/react-router'
import ComponentCard from '@/components/marketplace/ComponentCard'

export const Route = createFileRoute('/marketplace/')({
  component: Marketplace,
})

function Marketplace() {
  const items = Array.from({ length: 9 }).map((_, i) => ({ id: i + 1, name: `Component ${i + 1}` }))
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <ComponentCard key={item.id} title={item.name} />
        ))}
      </div>
    </div>
  )
}


