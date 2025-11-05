import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import ComponentCard from './ComponentCard'
import { Link } from '@tanstack/react-router'
import { ComponentType } from '@/lib/component-renderer'

export default function ComponentsList() {
  const components = useQuery(api.components.listPublicComponents) ?? []

  const items = useMemo(() => {
    const dbItems = components.map((c) => ({ 
      id: c._id, 
      name: c.name,
      type: c.sourceComponent as ComponentType | undefined
    }))
    if (dbItems.length > 0) return dbItems
    // Fallback: show shadcn components available locally
    return [
      { id: 'shadcn-button', name: 'Button', type: 'button' as ComponentType },
      { id: 'shadcn-input', name: 'Input', type: 'input' as ComponentType },
      { id: 'shadcn-dialog', name: 'Dialog', type: 'dialog' as ComponentType },
      { id: 'shadcn-card', name: 'Card', type: 'card' as ComponentType },
      { id: 'shadcn-navigation-menu', name: 'Navigation Menu', type: 'navigation-menu' as ComponentType },
    ]
  }, [components])

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
          to="/marketplace/$componentId"
          params={{ componentId: String(item.id) }}
          preload="intent"
          className="block"
        >
          <ComponentCard
            title={item.name}
            componentType={item.type}
          />
        </Link>
      ))}
    </div>
  )
}


