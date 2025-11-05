import { useMemo } from 'react'
import ComponentCard from './ComponentCard'
import { Link } from '@tanstack/react-router'
import { useCatalogComponents } from '@/lib/catalog-hooks'

type ComponentItem = {
  id: string
  name: string
  description?: string
  category?: string
}

export default function ComponentsList() {
  const { components: catalogComponents, isLoading: catalogLoading } = useCatalogComponents()

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

  if (!items.length) {
    return (
      <div className="text-sm text-slate-400">No components yet. Check back soon.</div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item) => (
        <Link
          key={String(item.id)}
          to="/editor/$componentId"
          params={{ componentId: String(item.id) }}
          preload="intent"
          className="block"
        >
          <ComponentCard
            title={item.name}
            description={item.description}
            category={item.category}
          />
        </Link>
      ))}
    </div>
  )
}


