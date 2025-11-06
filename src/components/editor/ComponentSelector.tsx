import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useState, useMemo } from 'react'
import { Search, Plus, FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCatalogComponents } from '@/lib/catalog-hooks'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ComponentSelectorProps = {
  selectedComponentId?: string // Catalog componentId (string) or database ID
  onSelectComponent: (componentId: string) => void // Catalog componentId (string)
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
  const [addComponentDialogOpen, setAddComponentDialogOpen] = useState(false)
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('')
  const { components: catalogComponents } = useCatalogComponents()
  // Note: ComponentSelector is deprecated - components are now managed within projects
  // This component is kept for backward compatibility but may not be fully functional

  // Combine catalog components (public) and user's private components
  const allComponents = useMemo<ComponentItem[]>(() => {
    const items: ComponentItem[] = []

    // Add catalog components (publicly available) - these use catalog componentId (string)
    catalogComponents.forEach(({ id, config }) => {
      items.push({
        id, // This is catalog componentId (string like 'button', 'input')
        name: config.metadata.name,
        description: config.metadata.description,
        category: config.metadata.category,
        isPublic: true,
        isCatalog: true,
        isMine: false,
      })
    })

    // Note: User's private components are now managed within projects
    // Only showing catalog components here
    
    return items.sort((a, b) => a.name.localeCompare(b.name))
  }, [catalogComponents])

  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return allComponents
    
    const query = searchQuery.toLowerCase()
    return allComponents.filter((comp) =>
      comp.name.toLowerCase().includes(query) ||
      comp.description?.toLowerCase().includes(query) ||
      comp.category?.toLowerCase().includes(query)
    )
  }, [allComponents, searchQuery])

  const filteredCatalogComponents = useMemo(() => {
    if (!catalogSearchQuery.trim()) return catalogComponents
    
    const query = catalogSearchQuery.toLowerCase()
    return catalogComponents.filter(({ config }) =>
      config.metadata.name.toLowerCase().includes(query) ||
      config.metadata.description?.toLowerCase().includes(query) ||
      config.metadata.category?.toLowerCase().includes(query)
    )
  }, [catalogComponents, catalogSearchQuery])

  const handleAddComponent = (componentId: string) => {
    onSelectComponent(componentId)
    setAddComponentDialogOpen(false)
    setCatalogSearchQuery('')
  }

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Components</h2>
          <Button 
            size="icon-sm" 
            variant="ghost"
            onClick={() => setAddComponentDialogOpen(true)}
            title="Add component from catalog"
          >
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
                    {component.isCatalog && (
                      <Badge variant="outline" className="text-xs">
                        Public Catalog
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

      {/* Add Component Dialog */}
      <Dialog open={addComponentDialogOpen} onOpenChange={setAddComponentDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Component from Catalog</DialogTitle>
            <DialogDescription>
              Select a component from the public catalog to add to your project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search catalog components..."
                value={catalogSearchQuery}
                onChange={(e) => setCatalogSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-2">
                {filteredCatalogComponents.map(({ id, config }) => (
                  <button
                    key={id}
                    onClick={() => handleAddComponent(id)}
                    className="w-full text-left p-3 rounded-lg border transition-colors hover:bg-accent border-transparent"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <FileCode className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {config.metadata.name}
                        </div>
                        {config.metadata.description && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {config.metadata.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            Public Catalog
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredCatalogComponents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {catalogSearchQuery ? 'No components found' : 'No components in catalog'}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}



