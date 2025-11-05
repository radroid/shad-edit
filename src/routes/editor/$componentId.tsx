import { createFileRoute, useNavigate } from '@tanstack/react-router'
import ComponentSelector from '@/components/editor/ComponentSelector'
import ComponentCanvas from '@/components/editor/ComponentPreview'
import PropertyManager from '@/components/editor/PropertyManager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useState, useEffect, useMemo } from 'react'
import {
  extractPropertiesFromCode,
  getDefaultPropertyValues,
  ComponentStructure,
} from '@/lib/property-extractor'
import { Save, Upload, Undo, Redo, LogIn } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'
import { useConvexAuth } from 'convex/react'
import { getComponentInfo, ComponentType } from '@/lib/component-renderer'

export const Route = createFileRoute('/editor/$componentId')({
  component: EditorPage,
})

function EditorPage() {
  const { componentId } = Route.useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useConvexAuth()
  
  const [name, setName] = useState('Untitled Component')
  const [description, setDescription] = useState('')
  
  // State management
  const [selectedComponentId, setSelectedComponentId] = useState<Id<'components'> | undefined>()
  const [selectedElementId, setSelectedElementId] = useState<string | undefined>()
  const [propertyValues, setPropertyValues] = useState<Record<string, any>>({})
  const [componentStructure, setComponentStructure] = useState<ComponentStructure | undefined>()
  const [componentCode, setComponentCode] = useState<string>('')
  
  // History for undo/redo
  const [history, setHistory] = useState<Record<string, any>[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const saveComponent = useMutation(api.components.saveComponent)
  const publishComponent = useMutation(api.components.publishComponent)
  // Only query if authenticated
  const myComponents = useQuery(api.components.listMyComponents, isAuthenticated ? {} : 'skip')

  // Load demo component for unauthenticated users or from componentId
  useEffect(() => {
    if (!isAuthenticated) {
      // Load demo component based on componentId
      loadDemoComponent(componentId)
    }
  }, [componentId, isAuthenticated])

  // Load selected component data (authenticated users)
  useEffect(() => {
    if (isAuthenticated && selectedComponentId && myComponents) {
      const component = myComponents.find((c) => c._id === selectedComponentId)
      if (component) {
        setName(component.name)
        setDescription(component.description || '')
        
        // Extract component code (from registryData or generate minimal sample)
        const source = (component.sourceComponent || 'button').toLowerCase()
        const tag = 
          source.includes('button') ? 'button' :
          source.includes('input') ? 'input' :
          source.includes('card') ? 'Card' :
          source.includes('dialog') ? 'Dialog' :
          source.includes('navigation') ? 'NavigationMenu' :
          source.includes('badge') ? 'Badge' :
          source.includes('label') ? 'Label' : 'div'

        const sampleCode = `
export default function ${component.name.replace(/\s+/g, '')}() {
  return (
    <${tag}${tag==='input' ? ' placeholder=""' : ''}${tag==='button' ? '' : tag==='input' ? ' />' : ' />'}${tag==='button' ? '>Click me</button>' : ''}
  )
}
`
        setComponentCode(component.registryData?.code || sampleCode)
        
        // Extract properties from code
        const structure = extractPropertiesFromCode(
          sampleCode,
          component.name
        )
        setComponentStructure(structure)
        
        // Initialize property values
        const defaults = getDefaultPropertyValues(structure)
        const saved = component.customizations || {}
        setPropertyValues({ ...defaults, ...saved })
        
        // Select first element by default
        if (structure.elements.length > 0) {
          setSelectedElementId(structure.elements[0].id)
        }
      } else {
        // Selected an item not in user's components (likely a public/fallback item)
        loadDemoComponent(String(selectedComponentId))
      }
    }
  }, [selectedComponentId, myComponents, isAuthenticated])

  const loadDemoComponent = (id: string) => {
    // Derive component type from ID
    const idLower = id.toLowerCase()
    let componentType: ComponentType = 'button'
    let componentName = 'Button'
    
    if (idLower.includes('button')) {
      componentType = 'button'
      componentName = 'Button'
    } else if (idLower.includes('input')) {
      componentType = 'input'
      componentName = 'Input'
    } else if (idLower.includes('card')) {
      componentType = 'card'
      componentName = 'Card'
    } else if (idLower.includes('dialog')) {
      componentType = 'dialog'
      componentName = 'Dialog'
    } else if (idLower.includes('navigation') || idLower.includes('menu')) {
      componentType = 'navigation-menu'
      componentName = 'Navigation Menu'
    } else if (idLower.includes('badge')) {
      componentType = 'badge'
      componentName = 'Badge'
    } else if (idLower.includes('label')) {
      componentType = 'label'
      componentName = 'Label'
    }

    const componentInfo = getComponentInfo(componentType)
    setName(componentInfo.name)
    setDescription(componentInfo.description)

    const tag = 
      componentType === 'button' ? 'button' :
      componentType === 'input' ? 'input' :
      componentType === 'card' ? 'Card' :
      componentType === 'dialog' ? 'Dialog' :
      componentType === 'navigation-menu' ? 'NavigationMenu' :
      componentType === 'badge' ? 'Badge' :
      componentType === 'label' ? 'Label' : 'div'

    const sampleCode = `
export default function ${componentName.replace(/\s+/g, '')}() {
  return (
    <${tag}${tag==='input' ? ' placeholder=""' : ''}${tag==='button' ? '' : tag==='input' ? ' />' : ' />'}${tag==='button' ? '>Click me</button>' : ''}
  )
}
`
    setComponentCode(sampleCode)
    
    const structure = extractPropertiesFromCode(sampleCode, componentName)
    setComponentStructure(structure)
    
    const defaults = getDefaultPropertyValues(structure)
    setPropertyValues(defaults)
    
    if (structure.elements.length > 0) {
      setSelectedElementId(structure.elements[0].id)
    }
  }

  // Handle component selection
  const handleSelectComponent = (compId: string) => {
    setSelectedComponentId(compId as Id<'components'>)
  }

  // Handle element selection
  const handleSelectElement = (elementId: string) => {
    setSelectedElementId(elementId)
  }

  // Handle property change with history
  const handlePropertyChange = (propertyName: string, value: any) => {
    const newValues = { ...propertyValues, [propertyName]: value }
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(propertyValues)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    
    setPropertyValues(newValues)
  }

  // Undo/Redo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setPropertyValues(history[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setPropertyValues(history[historyIndex + 1])
    }
  }

  // Save component
  const handleSave = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to save components')
      navigate({ to: '/auth/sign-in' })
      return
    }
    
    if (!selectedComponentId) return
    
    try {
      await saveComponent({
        name,
        description,
        customizations: propertyValues,
        registryData: { code: componentCode },
      })
      alert('Component saved successfully!')
    } catch (error) {
      console.error('Error saving component:', error)
      alert('Failed to save component')
    }
  }

  // Publish component
  const handlePublish = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to publish components')
      navigate({ to: '/auth/sign-in' })
      return
    }
    
    if (!selectedComponentId) return
    
    try {
      await handleSave()
      await publishComponent({ componentId: selectedComponentId })
      alert('Component published successfully!')
    } catch (error) {
      console.error('Error publishing component:', error)
      alert('Failed to publish component')
    }
  }

  const selectedElement = useMemo(() => {
    if (!componentStructure || !selectedElementId) return undefined
    return componentStructure.elements.find((el) => el.id === selectedElementId)
  }, [componentStructure, selectedElementId])

  return (
    <div className="flex flex-col h-screen">
      {/* Top toolbar */}
      <div className="border-b bg-background">
        <div className="flex items-center justify-between p-3 gap-4">
          <div className="flex-1 max-w-md">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Component name"
              className="font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border mx-2" />

            {isAuthenticated ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSave}
                  disabled={!selectedComponentId}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  onClick={handlePublish}
                  disabled={!selectedComponentId}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={() => navigate({ to: '/auth/sign-in' })}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Save
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main editor layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Component list (only for authenticated users) */}
        {isAuthenticated && (
          <div className="w-64 shrink-0 overflow-hidden">
            <ComponentSelector
              selectedComponentId={selectedComponentId}
              onSelectComponent={handleSelectComponent}
            />
          </div>
        )}

        {/* Center canvas */}
        <div className="flex-1 overflow-hidden">
          <ComponentCanvas
            componentStructure={componentStructure}
            selectedElementId={selectedElementId}
            onSelectElement={handleSelectElement}
            propertyValues={propertyValues}
            componentCode={componentCode}
          />
        </div>

        {/* Right sidebar - Property manager */}
        <div className="w-80 shrink-0 overflow-hidden">
          <PropertyManager
            selectedElement={selectedElement}
            propertyValues={propertyValues}
            onPropertyChange={handlePropertyChange}
          />
        </div>
      </div>
    </div>
  )
}



