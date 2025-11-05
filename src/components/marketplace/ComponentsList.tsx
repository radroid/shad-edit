import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import ComponentCard from './ComponentCard'
import { useNavigate } from '@tanstack/react-router'

export default function ComponentsList() {
  const components = useQuery(api.components.listPublicComponents) ?? []
  const navigate = useNavigate()

  const items = useMemo(() => {
    const dbItems = components.map((c) => ({ id: c._id, name: c.name }))
    if (dbItems.length > 0) return dbItems
    // Fallback: show five shadcn components available locally
    return [
      { id: 'shadcn-button', name: 'Button' },
      { id: 'shadcn-input', name: 'Input' },
      { id: 'shadcn-dialog', name: 'Dialog' },
      { id: 'shadcn-card', name: 'Card' },
      { id: 'shadcn-navigation-menu', name: 'Navigation Menu' },
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
        <div key={item.id}>
          <ComponentCard
            title={item.name}
            onClick={() => navigate({ to: `/marketplace/${item.id}` })}
          />
        </div>
      ))}
    </div>
  )
}


