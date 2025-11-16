import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import ComponentCard from '@/components/marketplace/ComponentCard'
import ComponentOverlay from '@/components/marketplace/ComponentOverlay'
import { useCatalogComponents } from '@/lib/catalog-hooks'

export const Route = createFileRoute('/test/marketplace/')({
  component: TestMarketplacePage,
})

type ComponentItem = {
  id: string
  name: string
  description?: string
  category?: string
}

function TestMarketplacePage() {
  const navigate = useNavigate()
  const { components: catalogComponents, isLoading: catalogLoading } = useCatalogComponents()
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)

  const items = useMemo(() => {
    if (catalogLoading) return []
    
    // Only show catalog components (publicly available)
    const catalogItems: ComponentItem[] = catalogComponents.map(({ id, config }) => ({
      id,
      name: config.metadata.name,
      description: config.metadata.description,
      category: config.metadata.category,
    }))
    
    return catalogItems
  }, [catalogComponents, catalogLoading])

  const handleEdit = () => {
    if (selectedComponentId) {
      navigate({
        to: '/test/components',
        search: { componentId: selectedComponentId },
      })
      setSelectedComponentId(null)
    }
  }

  if (catalogLoading) {
    return (
      <div className="px-6 py-8 md:px-8 md:py-10">
        <div className="text-sm text-slate-400 py-8">Loading components...</div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="px-6 py-8 md:px-8 md:py-10">
        <div className="text-sm text-slate-400 py-8">
          No components available. Components need to be seeded in the database.
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 md:px-8 md:py-10">
      <div className="space-y-2 mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Marketplace</h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Browse and discover components. Click to view, edit, or add to your projects.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <ComponentCard
            key={String(item.id)}
            title={item.name}
            description={item.description}
            category={item.category}
            onClick={() => setSelectedComponentId(String(item.id))}
          />
        ))}
      </div>

      {selectedComponentId && (
        <ComponentOverlay
          open={!!selectedComponentId}
          onOpenChange={(open) => !open && setSelectedComponentId(null)}
          componentId={selectedComponentId}
          onEdit={handleEdit}
        />
      )}
    </div>
  )
}
