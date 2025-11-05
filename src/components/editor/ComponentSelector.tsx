import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useState, useMemo } from 'react'
import { useConvexAuth } from 'convex/react'
import { Search, Plus, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useCatalogComponents } from '@/lib/catalog-hooks'

type ComponentSelectorProps = {
  selectedComponentId?: string
  onSelectComponent: (componentId: string) => void
}

type ComponentItem = {
  id: string
  name: string
  description?: string
  category?: string
  isPublic: boolean
  isCatalog: boolean
  isMine?: boolean
}

export default function ComponentSelector({ 
  selectedComponentId, 
  onSelectComponent 
}: ComponentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { isAuthenticated } = useConvexAuth()
  const { components: catalogComponents } = useCatalogComponents()
  const myComponents = useQuery(api.components.listMyComponents, isAuthenticated ? {} : 'skip')

  // Combine catalog components (public) and user's private components
  const allComponents = useMemo<ComponentItem[]>(() => {
    const items: ComponentItem[] = []

    // Add catalog components (publicly available)
    catalogComponents.forEach(({ id, config }) => {
      items.push({
        id,
        name: config.metadata.name,
        description: config.metadata.description,
        category: config.metadata.category,
        isPublic: true,
        isCatalog: true,
        isMine: false,
      })
    })

    // Add user's private components (drafts)
    if (myComponents) {
      myComponents.forEach((comp) => {
        // Only show unpublished components (drafts)
        if (!comp.isPublic) {
          items.push({
            id: comp._id,
            name: comp.name,
            description: comp.description,
            category: comp.category,
            isPublic: false,
            isCatalog: false,
            isMine: true,
          })
        }
      })
    }

    // Sort: user's drafts first, then catalog components
    return items.sort((a, b) => {
      if (a.isMine && !b.isMine) return -1
      if (!a.isMine && b.isMine) return 1
      return a.name.localeCompare(b.name)
    })
  }, [catalogComponents, myComponents])

  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return allComponents
    
    const query = searchQuery.toLowerCase()
    return allComponents.filter((comp) =>
      comp.name.toLowerCase().includes(query) ||
      comp.description?.toLowerCase().includes(query) ||
      comp.category?.toLowerCase().includes(query)
    )
  }, [allComponents, searchQuery])

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Components</h2>
          <Button size="icon-sm" variant="ghost">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredComponents.map((component) => (
            <button
              key={component.id}
              onClick={() => onSelectComponent(component.id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent ${
                selectedComponentId === component.id
                  ? 'bg-accent border-primary'
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {component.name}
                    {component.isMine && (
                      <span className="ml-2 text-xs text-muted-foreground">(Yours)</span>
                    )}
                  </div>
                  {component.description && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {component.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {component.category && (
                      <Badge variant="secondary" className="text-xs">
                        {component.category}
                      </Badge>
                    )}
                    {component.isCatalog && (
                      <Badge variant="outline" className="text-xs">
                        Catalog
                      </Badge>
                    )}
                    {!component.isCatalog && (
                      <Badge
                        variant={component.isPublic ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {component.isPublic ? 'Public' : 'Draft'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}

          {filteredComponents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? 'No components found' : 'No components yet'}
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  )
}



