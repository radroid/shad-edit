import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { useConvexAuth } from 'convex/react'
import { Search, Plus, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'

type ComponentSelectorProps = {
  selectedComponentId?: string
  onSelectComponent: (componentId: string) => void
}

export default function ComponentSelector({ 
  selectedComponentId, 
  onSelectComponent 
}: ComponentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { isAuthenticated } = useConvexAuth()
  const myComponents = useQuery(api.components.listMyComponents, isAuthenticated ? {} : 'skip')
  const publicComponents = useQuery(api.components.listPublicComponents, {}) ?? []

  const fallback = [
    { _id: 'shadcn-button', name: 'Button', description: 'A clickable button', category: 'Form', isPublic: true },
    { _id: 'shadcn-input', name: 'Input', description: 'Text input field', category: 'Form', isPublic: true },
    { _id: 'shadcn-dialog', name: 'Dialog', description: 'Modal dialog', category: 'Overlay', isPublic: true },
    { _id: 'shadcn-card', name: 'Card', description: 'Content container', category: 'Layout', isPublic: true },
    { _id: 'shadcn-navigation-menu', name: 'Navigation Menu', description: 'Navigation with dropdowns', category: 'Navigation', isPublic: true },
  ] as any[]

  const source = (myComponents && myComponents.length > 0)
    ? myComponents
    : (publicComponents && publicComponents.length > 0)
      ? publicComponents
      : fallback
  const filteredComponents = source?.filter((comp) =>
    comp.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          {filteredComponents?.map((component) => (
            <button
              key={component._id}
              onClick={() => onSelectComponent(component._id)}
              className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent ${
                selectedComponentId === component._id
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
                    <Badge
                      variant={component.isPublic ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {component.isPublic ? 'Public' : 'Draft'}
                    </Badge>
                  </div>
                </div>
              </div>
            </button>
          ))}

          {!filteredComponents || filteredComponents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {searchQuery ? 'No components found' : 'No components yet'}
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  )
}



