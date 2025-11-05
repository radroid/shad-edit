import { useMemo, useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import ComponentCard from './ComponentCard'
import { Link } from '@tanstack/react-router'
import { getAllCatalogComponents } from '@/lib/catalog-loader'
import type { ComponentConfig } from '@/lib/component-config'

type ComponentItem = {
  id: string
  name: string
  description?: string
  category?: string
  isCatalog: boolean
}

export default function ComponentsList() {
  const components = useQuery(api.components.listPublicComponents) ?? []
  const [catalogComponents, setCatalogComponents] = useState<Array<{ id: string; config: ComponentConfig }>>([])

  // Load catalog components
  useEffect(() => {
    getAllCatalogComponents().then(setCatalogComponents).catch(console.error)
  }, [])

  const items = useMemo(() => {
    // Combine database components and catalog components
    const dbItems: ComponentItem[] = components.map((c) => ({ 
      id: c._id, 
      name: c.name,
      description: c.description,
      category: c.category,
      isCatalog: false
    }))
    
    const catalogItems: ComponentItem[] = catalogComponents.map(({ id, config }) => ({
      id,
      name: config.metadata.name,
      description: config.metadata.description,
      category: config.metadata.category,
      isCatalog: true
    }))
    
    // Combine and deduplicate (prefer catalog over DB if same ID)
    const allItems = [...catalogItems, ...dbItems]
    const uniqueItems = Array.from(
      new Map(allItems.map(item => [item.id, item])).values()
    )
    
    return uniqueItems.length > 0 ? uniqueItems : []
  }, [components, catalogComponents])

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
          to={item.isCatalog ? "/editor/$componentId" : "/marketplace/$componentId"}
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


