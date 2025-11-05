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
  extractPropertiesFromConfig,
  getDefaultPropertyValues,
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
  const { componentId } = Route.useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useConvexAuth()
  const { config: catalogConfig, isLoading: catalogLoading } = useCatalogComponent(componentId)
  
  const [name, setName] = useState('Untitled Component')
  const [description, setDescription] = useState('')
  
  // State management
  const [selectedComponentId, setSelectedComponentId] = useState<Id<'components'> | undefined>()
  const [selectedElementId, setSelectedElementId] = useState<string | undefined>()
  const [propertyValues, setPropertyValues] = useState<Record<string, any>>({})
  const [componentStructure, setComponentStructure] = useState<ComponentStructure | undefined>()
  const [componentCode, setComponentCode] = useState<string>('')
  const [config, setConfig] = useState<ComponentConfig | null>(catalogConfig)
  
  // History for undo/redo
  const [history, setHistory] = useState<Record<string, any>[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const saveComponent = useMutation(api.components.saveComponent)
  const publishComponent = useMutation(api.components.publishComponent)
  // Only query if authenticated
  const myComponents = useQuery(api.components.listMyComponents, isAuthenticated ? {} : 'skip')

  // Load component from catalog or database
  useEffect(() => {
    // Priority: 1. Catalog config (from Convex), 2. Database component
    if (catalogConfig && !catalogLoading) {
      loadCatalogComponentConfig(catalogConfig)
    } else if (isAuthenticated && selectedComponentId && myComponents && !catalogConfig) {
      loadDatabaseComponent(selectedComponentId, myComponents)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId, catalogConfig, catalogLoading, isAuthenticated, selectedComponentId, myComponents])

  // Load component from catalog config
  const loadCatalogComponentConfig = (catalogConfig: ComponentConfig) => {
    setConfig(catalogConfig)
    setName(catalogConfig.metadata.name)
    setDescription(catalogConfig.metadata.description || '')
    
    // Extract properties from config
    const structure = extractPropertiesFromConfig(catalogConfig)
    setComponentStructure(structure)
    
    // Initialize property values with defaults
    const defaults: Record<string, any> = {}
    catalogConfig.properties.forEach((prop) => {
      defaults[prop.name] = prop.defaultValue
    })
    setPropertyValues(defaults)
    
    // Set initial code
    setComponentCode(catalogConfig.code)
    
    // Select first element by default
    if (structure.elements.length > 0) {
      setSelectedElementId(structure.elements[0].id)
    }
  }

  // Load component from database (user's saved components)
  const loadDatabaseComponent = async (
    componentDbId: Id<'components'>,
    myComponents: any[]
  ) => {
    const component = myComponents.find((c) => c._id === componentDbId)
    if (!component) return

    setName(component.name)
    setDescription(component.description || '')
    
    // Try to load from catalog if sourceComponent is specified
    // Note: Catalog config is already loaded via useCatalogComponent hook
    if (catalogConfig) {
      // Use catalog config as base
      loadCatalogComponentConfig(catalogConfig)
      
      // Apply saved customizations
      const saved = component.customizations || {}
      setPropertyValues({ ...propertyValues, ...saved })
      
      // Use saved code if available, otherwise use catalog code with applied properties
      if (component.registryData?.code) {
        setComponentCode(component.registryData.code)
      } else {
        const renderedCode = applyPropertiesToCode(
          catalogConfig.code,
          { ...propertyValues, ...saved },
          catalogConfig.variableMappings
        )
        setComponentCode(renderedCode)
      }
    } else {
      // Fallback: use component name and saved code
      const code = component.registryData?.code || ''
      if (code) {
        setComponentCode(code)
        // Create minimal config for extraction
        const fallbackConfig: ComponentConfig = {
          metadata: { 
            name: component.name, 
            description: component.description || '' 
          },
          code,
          properties: [],
        }
        const structure = extractPropertiesFromConfig(fallbackConfig)
        setComponentStructure(structure)
        
        const defaults = getDefaultPropertyValues(structure)
        const saved = component.customizations || {}
        setPropertyValues({ ...defaults, ...saved })
        
        if (structure.elements.length > 0) {
          setSelectedElementId(structure.elements[0].id)
        }
      }
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
        sourceComponent: componentId, // Reference to catalog component
        componentId: selectedComponentId, // For updates
      })
      
      // Update selectedComponentId if this was a new save
      if (!selectedComponentId) {
        setSelectedComponentId(savedId as Id<'components'>)
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



