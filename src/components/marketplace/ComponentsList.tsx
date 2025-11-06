import { useMemo, useState } from 'react'
import ComponentCard from './ComponentCard'
import ComponentOverlay from './ComponentOverlay'
import { useCatalogComponents } from '@/lib/catalog-hooks'

type ComponentItem = {
  id: string
  name: string
  description?: string
  category?: string
}

export default function ComponentsList() {
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

  if (catalogLoading) {
    return (
      <div className="text-sm text-slate-400 py-8">Loading components...</div>
    )
  }

  if (!items.length) {
    return (
      <div className="text-sm text-slate-400 py-8">
        No components available. Components need to be seeded in the database.
      </div>
    )
  }

  return (
    <>
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
        />
      )}
    </>
  )
}


