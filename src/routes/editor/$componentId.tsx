import { createFileRoute, useNavigate } from '@tanstack/react-router'
import ComponentSelector from '@/components/editor/ComponentSelector'
import ComponentCanvas from '@/components/editor/ComponentPreview'
import PropertyManager from '@/components/editor/PropertyManager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { useState, useEffect, useMemo } from 'react'
import {
  extractPropertiesFromConfig,
  ComponentStructure,
} from '@/lib/property-extractor'
import { Save, Upload, Undo, Redo, LogIn } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'
import { useConvexAuth } from 'convex/react'
import { useCatalogComponent } from '@/lib/catalog-hooks'
import { applyPropertiesToCode } from '@/lib/component-config'
import type { ComponentConfig } from '@/lib/component-config'

export const Route = createFileRoute('/editor/$componentId')({
  component: EditorPage,
})

function EditorPage() {
  const { componentId } = Route.useParams() // This is catalog componentId (string) or "new"
  const navigate = useNavigate()
  const { isAuthenticated } = useConvexAuth()
  
  // Load catalog component if componentId is provided and not "new"
  const { config: catalogConfig, isLoading: catalogLoading } = useCatalogComponent(
    componentId && componentId !== 'new' ? componentId : undefined
  )
  
  const [name, setName] = useState('Untitled Component')
  const [description, setDescription] = useState('')
  
  // State management
  const [selectedDbComponentId, setSelectedDbComponentId] = useState<Id<'components'> | undefined>() // Database ID for saved drafts
  const [selectedElementId, setSelectedElementId] = useState<string | undefined>()
  const [propertyValues, setPropertyValues] = useState<Record<string, any>>({})
  const [componentStructure, setComponentStructure] = useState<ComponentStructure | undefined>()
  const [componentCode, setComponentCode] = useState<string>('')
  const [config, setConfig] = useState<ComponentConfig | null>(null)
  
  // History for undo/redo
  const [history, setHistory] = useState<Record<string, any>[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const saveComponent = useMutation(api.components.saveComponent)
  const publishComponent = useMutation(api.components.publishComponent)

  // Load component from catalog when componentId changes
  useEffect(() => {
    if (componentId === 'new') {
      // Reset to empty state
      setName('Untitled Component')
      setDescription('')
      setConfig(null)
      setComponentStructure(undefined)
      setComponentCode('')
      setPropertyValues({})
      setSelectedElementId(undefined)
      setSelectedDbComponentId(undefined)
      return
    }

    // Skip if still loading
    if (catalogLoading) {
      return
    }

    // Load catalog component config when available
    if (catalogConfig) {
      loadCatalogComponentConfig(catalogConfig)
    } else if (componentId && componentId !== 'new') {
      // Component not found - reset state
      setName('Component Not Found')
      setDescription('')
      setConfig(null)
      setComponentStructure(undefined)
      setComponentCode('')
      setPropertyValues({})
      setSelectedElementId(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, catalogConfig, catalogLoading])

  // Load component from catalog config
  const loadCatalogComponentConfig = (catalogConfig: ComponentConfig) => {
    console.log('Loading catalog config:', catalogConfig)
    
    setConfig(catalogConfig)
    setName(catalogConfig.metadata.name)
    setDescription(catalogConfig.metadata.description || '')
    
    // Extract properties from config
    const structure = extractPropertiesFromConfig(catalogConfig)
    console.log('Extracted structure:', structure)
    setComponentStructure(structure)
    
    // Initialize property values with defaults
    // Key format: elementId.propertyName for element properties, or just propertyName for global
    const defaults: Record<string, any> = {}
    
    // Add global properties
    structure.globalProperties.forEach((prop) => {
      defaults[prop.name] = prop.defaultValue
    })
    
    // Add element properties
    structure.elements.forEach((element) => {
      element.properties.forEach((prop) => {
        const key = `${element.id}.${prop.name}`
        defaults[key] = prop.defaultValue
      })
    })
    
    console.log('Initialized property values:', defaults)
    setPropertyValues(defaults)
    
    // Set initial code with placeholders replaced
    const initialCode = applyPropertiesToCode(
      catalogConfig.code,
      defaults,
      catalogConfig.variableMappings
    )
    setComponentCode(initialCode)
    
    // Select first element by default
    if (structure.elements.length > 0) {
      setSelectedElementId(structure.elements[0].id)
    }
  }

  // Handle component selection from ComponentSelector
  // compId can be catalog componentId (string) or database ID (string)
  const handleSelectComponent = (compId: string) => {
    // Navigate to editor with the componentId
    // If it's a database ID (starts with specific pattern), we need to handle differently
    // For now, treat all as catalog componentIds and navigate
    navigate({ to: '/editor/$componentId', params: { componentId: compId } })
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
    
    // Update rendered code if config is available
    if (config) {
      const renderedCode = applyPropertiesToCode(
        config.code,
        newValues,
        config.variableMappings
      )
      setComponentCode(renderedCode)
    }
  }

  // Undo/Redo functionality
  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousValues = history[historyIndex - 1]
      setHistoryIndex(historyIndex - 1)
      setPropertyValues(previousValues)
      
      // Update code when undoing
      if (config) {
        const renderedCode = applyPropertiesToCode(
          config.code,
          previousValues,
          config.variableMappings
        )
        setComponentCode(renderedCode)
      }
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextValues = history[historyIndex + 1]
      setHistoryIndex(historyIndex + 1)
      setPropertyValues(nextValues)
      
      // Update code when redoing
      if (config) {
        const renderedCode = applyPropertiesToCode(
          config.code,
          nextValues,
          config.variableMappings
        )
        setComponentCode(renderedCode)
      }
    }
  }

  // Save component
  const handleSave = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to save components')
      navigate({ to: '/auth/sign-in' })
      return
    }
    
    if (!config) {
      alert('Component config not loaded')
      return
    }
    
    try {
      // Save with full config and current property values
      const savedId = await saveComponent({
        name,
        description,
        category: config.metadata.category,
        customizations: propertyValues,
        registryData: {
          code: componentCode,
          config: config, // Store full config for publishing
        },
        sourceComponent: componentId !== 'new' ? componentId : undefined, // Reference to catalog component
        componentId: selectedDbComponentId, // For updates (database ID)
      })
      
      // Update selectedDbComponentId if this was a new save
      if (!selectedDbComponentId) {
        setSelectedDbComponentId(savedId as Id<'components'>)
      }
      
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
    
    if (!selectedDbComponentId) {
      // Need to save first
      await handleSave()
      return
    }
    
    try {
      await publishComponent({ componentId: selectedDbComponentId })
      alert('Component published successfully!')
      // Refresh to show updated component
      if (componentId !== 'new') {
        navigate({ to: '/editor/$componentId', params: { componentId }, replace: true })
      }
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
                  disabled={!config}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  onClick={handlePublish}
                  disabled={!config}
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
              selectedComponentId={componentId}
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
            componentConfig={config}
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



