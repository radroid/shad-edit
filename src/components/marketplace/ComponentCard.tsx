import { Card } from '@/components/ui/card'
import { renderComponentPreview, ComponentType, getComponentInfo } from '@/lib/component-renderer'

export default function ComponentCard({ 
  title, 
  description,
  category,
  componentType, 
  onClick 
}: { 
  title: string
  description?: string
  category?: string
  componentType?: ComponentType
  onClick?: () => void 
}) {
  // Try to derive component type from title if not provided
  const derivedType = componentType || deriveComponentType(title)
  const componentInfo = derivedType ? getComponentInfo(derivedType) : null
  const displayCategory = category || componentInfo?.category

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <Card className="p-4 hover:border-cyan-500/50 transition-all cursor-pointer group hover:shadow-lg hover:shadow-cyan-500/10">
        <div className="h-36 rounded-lg bg-linear-to-br from-slate-900 to-slate-800 border border-slate-700 mb-3 flex items-center justify-center p-4 overflow-hidden relative group-hover:border-cyan-500/30 transition-colors">
          {derivedType ? (
            <div className="scale-90 pointer-events-none relative z-10">
              {renderComponentPreview({ 
                type: derivedType,
                props: {} 
              })}
            </div>
          ) : (
            <div className="text-slate-500 text-sm">No preview available</div>
          )}
          
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-5" 
               style={{
                 backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(255 255 255) 1px, transparent 0)',
                 backgroundSize: '20px 20px'
               }}
          />
        </div>
        <div className="space-y-1">
          <div className="text-sm text-slate-200 font-medium group-hover:text-cyan-400 transition-colors">
            {title}
          </div>
          {description && (
            <div className="text-xs text-slate-400 line-clamp-2">{description}</div>
          )}
          {displayCategory && (
            <div className="text-xs text-slate-500">{displayCategory}</div>
          )}
        </div>
      </Card>
    </button>
  )
}

function deriveComponentType(title: string): ComponentType | undefined {
  const titleLower = title.toLowerCase().replace(/\s+/g, '-')
  const typeMap: Record<string, ComponentType> = {
    'button': 'button',
    'input': 'input',
    'card': 'card',
    'dialog': 'dialog',
    'navigation-menu': 'navigation-menu',
    'badge': 'badge',
    'label': 'label',
  }
  return typeMap[titleLower]
}



