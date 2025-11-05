import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
import { renderComponentPreview, ComponentType, getComponentInfo, getDefaultComponentProps } from '@/lib/component-renderer'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function ComponentOverlay({ 
  open, 
  onOpenChange, 
  componentId 
}: { 
  open: boolean
  onOpenChange: (v: boolean) => void
  componentId: string 
}) {
  const navigate = useNavigate()
  
  // Derive component type from ID (for demo components)
  const componentType = deriveTypeFromId(componentId)
  const componentInfo = componentType ? getComponentInfo(componentType) : null
  const defaultProps = componentType ? getDefaultComponentProps(componentType) : {}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {componentInfo?.name || 'Component Preview'}
              </h2>
              {componentInfo && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {componentInfo.category}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {componentInfo.description}
                  </p>
                </div>
              )}
            </div>
            <Button
              onClick={() => navigate({ to: `/editor/${componentId}` })}
            >
              Edit Component
            </Button>
          </div>

          <div className="rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-8">
            <div className="max-w-3xl mx-auto">
              <div className="bg-background rounded-lg border p-8 min-h-[300px] flex items-center justify-center">
                {componentType ? (
                  <div className="w-full space-y-6">
                    <div className="flex items-center justify-center p-6">
                      <div className="scale-125">
                        {renderComponentPreview({ 
                          type: componentType,
                          props: defaultProps
                        })}
                      </div>
                    </div>
                    
                    {/* Show additional context/info */}
                    <div className="border-t pt-4">
                      <div className="text-sm text-muted-foreground text-center">
                        This is a live preview of the component. Try interacting with it!
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4 py-8">
                    <div className="text-6xl">🎨</div>
                    <div>
                      <div className="font-medium mb-2">Component preview not available</div>
                      <div className="text-sm text-muted-foreground">
                        Click "Edit Component" to customize this component
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Click "Edit Component" to customize this component with your own styles and properties.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function deriveTypeFromId(id: string): ComponentType | undefined {
  const idLower = id.toLowerCase()
  if (idLower.includes('button')) return 'button'
  if (idLower.includes('input')) return 'input'
  if (idLower.includes('card')) return 'card'
  if (idLower.includes('dialog')) return 'dialog'
  if (idLower.includes('navigation') || idLower.includes('menu')) return 'navigation-menu'
  if (idLower.includes('badge')) return 'badge'
  if (idLower.includes('label')) return 'label'
  return undefined
}



