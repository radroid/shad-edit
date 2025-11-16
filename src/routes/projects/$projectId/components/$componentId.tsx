import { createFileRoute, Link } from '@tanstack/react-router'
import ComponentCanvas from '@/components/editor/ComponentPreview'
import PropertyManager from '@/components/editor/PropertyManager'
import ProjectThemeProvider from '@/components/projects/ProjectThemeProvider'
import { Button } from '@/components/ui/button'
import { Pencil, ArrowLeft } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { useState, useEffect, useMemo } from 'react'
import {
  extractPropertiesFromConfig,
  ComponentStructure,
} from '@/lib/property-extractor'
import type { Id } from '../../../../../convex/_generated/dataModel'
import { useConvexAuth } from 'convex/react'
import { generateCodeWithTheme } from '@/lib/code-transformer'
import { useDebouncedCallback } from '@/hooks/useDebounce'
import { Input } from '@/components/ui/input'
import type { ComponentConfig } from '@/lib/component-config'

export const Route = createFileRoute('/projects/$projectId/components/$componentId')({
  component: ComponentEditorPage,
})

function ComponentEditorPage() {
  const { projectId, componentId } = Route.useParams()
  const { isAuthenticated } = useConvexAuth()
  
  // Load project component
  const projectComponent = useQuery(
    api.projectComponents.getProjectComponent,
    isAuthenticated ? { componentId: componentId as Id<'projectComponents'> } : 'skip'
  )
  
  // Load catalog component for reference
  const catalogComponent = useQuery(
    api.catalogComponents.getCatalogComponent,
    projectComponent?.catalogComponentId ? { componentId: projectComponent.catalogComponentId } : 'skip'
  )
  
  // Load project for theme
  const project = useQuery(
    api.projects.getProject,
    isAuthenticated ? { projectId: projectId as Id<'projects'> } : 'skip'
  )
  
  const [name, setName] = useState('')
  const [isEditingName, setIsEditingName] = useState(false)
  const [selectedElementId, setSelectedElementId] = useState<string | undefined>()
  const [propertyValues, setPropertyValues] = useState<Record<string, any>>({})
  const [componentStructure, setComponentStructure] = useState<ComponentStructure | undefined>()
  const [variantDrafts, setVariantDrafts] = useState(catalogComponent?.variants || [])
  const [componentCode, setComponentCode] = useState<string>('')
  const [selectedVariant, setSelectedVariant] = useState<string>('default')
  const [selectedSize, setSelectedSize] = useState<string>('default')

  const updateComponentVariant = useMutation(api.projectComponents.updateComponentVariant)
  const updateComponentName = useMutation(api.projectComponents.updateComponentName)

  // Initialize name
  useEffect(() => {
    if (projectComponent?.name) {
      setName(projectComponent.name)
    }
  }, [projectComponent?.name])

  // Load component structure from catalog
  useEffect(() => {
    if (!catalogComponent) return

    // Convert catalog component to ComponentConfig format
    const componentConfig: ComponentConfig = {
      metadata: {
        name: catalogComponent.name,
        description: catalogComponent.description || '',
        category: catalogComponent.category,
        tags: catalogComponent.tags,
        author: catalogComponent.author,
        version: catalogComponent.version,
      },
      code: catalogComponent.code,
      properties: catalogComponent.tailwindProperties.map((prop: any) => ({
        name: prop.name,
        label: prop.label || prop.name,
        type: prop.type === 'select' ? 'select' : prop.type === 'color' ? 'color' : 'string',
        defaultValue: prop.defaultValue,
        options: prop.options,
        description: prop.description,
        category: prop.category,
      })),
      variableMappings: [],
      dependencies: catalogComponent.dependencies,
      files: catalogComponent.files,
      propSections: catalogComponent.propSections,
    }

    // Extract structure using property extractor
    const structure = extractPropertiesFromConfig(componentConfig)
    
    // If no elements found, create a root element for the component
    if (structure.elements.length === 0) {
      // Detect component type from componentId
      const componentType = catalogComponent.componentId.toLowerCase()
      structure.elements.push({
        id: 'root',
        type: componentType === 'button' ? 'button' : 'div',
        name: catalogComponent.name,
        properties: structure.globalProperties.length > 0 ? structure.globalProperties : componentConfig.properties,
      })
    }

    setComponentStructure(structure)

    // Initialize property values from project component or variant defaults
    if (projectComponent?.variantProperties) {
      // Map variant properties to element properties (handle both formats)
      const mappedValues: Record<string, any> = {}
      Object.entries(projectComponent.variantProperties).forEach(([key, value]) => {
        // If key already has element prefix, use as-is
        if (key.includes('.')) {
          mappedValues[key] = value
        } else {
          // Map to root element if no prefix
          structure.elements.forEach((el) => {
            if (el.properties.some(p => p.name === key)) {
              mappedValues[`${el.id}.${key}`] = value
            }
          })
        }
      })
      setPropertyValues(mappedValues)
      
      // Extract size from variant properties
      const sizeValue = mappedValues[`${structure.elements[0]?.id}.size`] || projectComponent.variantProperties.size || 'default'
      setSelectedSize(sizeValue)
    } else if (catalogComponent.variants && catalogComponent.variants.length > 0) {
      const defaultVariant = catalogComponent.variants.find((v: any) => v.name === selectedVariant) || catalogComponent.variants[0]
      if (defaultVariant?.properties) {
        // Map variant properties to element properties
        const mappedValues: Record<string, any> = {}
        Object.entries(defaultVariant.properties).forEach(([key, value]) => {
          structure.elements.forEach((el) => {
            if (el.properties.some(p => p.name === key)) {
              mappedValues[`${el.id}.${key}`] = value
            }
          })
        })
        setPropertyValues(mappedValues)
        
        // Extract size from variant properties
        if (defaultVariant.properties.size) {
          setSelectedSize(defaultVariant.properties.size)
        }
      }
    } else {
      // Initialize with default values from properties
      const defaults: Record<string, any> = {}
      structure.elements.forEach((el) => {
        el.properties.forEach((prop) => {
          const key = `${el.id}.${prop.name}`
          if (prop.defaultValue !== undefined) {
            defaults[key] = prop.defaultValue
            // Track size if it exists
            if (prop.name === 'size') {
              setSelectedSize(prop.defaultValue)
            }
          }
        })
      })
      setPropertyValues(defaults)
    }

    // Set initial code - ensure it uses theme tokens
    const initialCode = generateCodeWithTheme(catalogComponent.code)
    setComponentCode(initialCode)
  }, [catalogComponent, projectComponent, selectedVariant])

  useEffect(() => {
    setVariantDrafts(catalogComponent?.variants || [])
  }, [catalogComponent])

  // Initialize variant
  useEffect(() => {
    if (projectComponent?.selectedVariant) {
      setSelectedVariant(projectComponent.selectedVariant)
    }
  }, [projectComponent?.selectedVariant])

  // Debounced property update
  const debouncedPropertyUpdate = useDebouncedCallback(
    async (properties: Record<string, any>) => {
      try {
        await updateComponentVariant({
          componentId: componentId as Id<'projectComponents'>,
          properties,
        })
      } catch (error) {
        console.error('Error updating component:', error)
      }
    },
    500
  )

  // Handle property change
  const handlePropertyChange = (propertyName: string, value: any) => {
    const newValues = { ...propertyValues }
    
    // If value is empty string, undefined, or null, delete the property to fully remove it
    if (value === '' || value === undefined || value === null) {
      delete newValues[propertyName]
    } else {
      newValues[propertyName] = value
    }
    
    setPropertyValues(newValues)
    debouncedPropertyUpdate(newValues)
    
    // Update code display - show base code with theme tokens
    // Overrides are applied via inline styles in the preview, not in the code
    if (catalogComponent) {
      // Generate code that follows theme setup (bg-primary, text-primary-foreground, etc.)
      // This ensures the code block uses theme tokens instead of hardcoded values
      const codeWithTheme = generateCodeWithTheme(
        catalogComponent.code,
        newValues,
        selectedElement?.id
      )
      setComponentCode(codeWithTheme)
    }
  }

  // Handle bulk property reset (for reset button)
  const handleResetOverrides = (elementId: string) => {
    const overrideProperties = [
      'backgroundColor',
      'color',
      'borderColor',
      'padding',
      'margin',
      'fontSize',
      'fontWeight',
      'borderWidth',
      'borderRadius',
    ]
    
    // Create a new values object with all override properties removed
    const newValues = { ...propertyValues }
    overrideProperties.forEach((prop) => {
      const propKey = `${elementId}.${prop}`
      delete newValues[propKey]
    })
    
    // Update state immediately
    setPropertyValues(newValues)
    
    // Update database immediately (not debounced)
    updateComponentVariant({
      componentId: componentId as Id<'projectComponents'>,
      properties: newValues,
    }).catch((error) => {
      console.error('Error resetting component:', error)
    })
    
    // Update code display - show base code with theme tokens
    // Overrides are applied via inline styles in the preview, not in the code
    if (catalogComponent) {
      // Show the original code with theme tokens (bg-primary, text-primary-foreground, etc.)
      setComponentCode(catalogComponent.code)
    }
  }

  // Handle name blur
  const handleNameBlur = async () => {
    setIsEditingName(false)
    if (name.trim() && name !== projectComponent?.name) {
      try {
        await updateComponentName({
          componentId: componentId as Id<'projectComponents'>,
          name: name.trim(),
        })
      } catch (error) {
        console.error('Error updating name:', error)
        // Revert on error
        if (projectComponent?.name) {
          setName(projectComponent.name)
        }
      }
    } else if (projectComponent?.name) {
      setName(projectComponent.name)
    }
  }

  // Handle variant change
  const handleVariantChange = async (variantName: string) => {
    setSelectedVariant(variantName)
    const variant = variantDrafts.find((v) => v.name === variantName)
    if (!variant?.properties) return
    
      const mappedValues: Record<string, any> = {}
      Object.entries(variant.properties).forEach(([key, value]) => {
      mappedValues[key] = value
        })
    
      setPropertyValues((prev) => ({ ...prev, ...mappedValues }))
      await updateComponentVariant({
        componentId: componentId as Id<'projectComponents'>,
        variant: variantName,
        properties: mappedValues,
      })
  }

  // Handle size change
  const handleSizeChange = async (size: string) => {
    setSelectedSize(size)
    if (componentStructure && selectedElement) {
      const sizeKey = `${selectedElement.id}.size`
      const newValues = { ...propertyValues, [sizeKey]: size }
      setPropertyValues(newValues)
      debouncedPropertyUpdate(newValues)
    }
  }

  // Extract size options from catalog component properties
  const sizeProperty = catalogComponent?.tailwindProperties?.find((p: any) => p.name === 'size')
  const sizeOptions = sizeProperty?.options || []

  const selectedElement = useMemo(() => {
    if (!componentStructure || !selectedElementId) return undefined
    return componentStructure.elements.find((el) => el.id === selectedElementId)
  }, [componentStructure, selectedElementId])

  if (projectComponent === undefined || catalogComponent === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading component...</div>
      </div>
    )
  }

  if (projectComponent === null || catalogComponent === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Component not found</h2>
          <Link to="/projects/$projectId" params={{ projectId }}>
            <Button variant="outline">Back to Project</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ProjectThemeProvider theme={project?.globalTheme}>
      <div className="flex h-screen flex-col bg-background text-foreground">
        {/* Top toolbar */}
        <div className="border-b border-border bg-card/80 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-2">
              <Link to="/projects/$projectId" params={{ projectId }}>
                <Button size="sm" variant="ghost" className="text-card-foreground">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              {isEditingName ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleNameBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    }
                  }}
                  autoFocus
                  className="max-w-md font-medium"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-card-foreground">{name}</span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => setIsEditingName(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main editor layout */}
        <div className="flex flex-1 overflow-hidden bg-muted/30">
          {/* Center canvas */}
          <div className="flex-1 overflow-hidden border-r border-border bg-card text-card-foreground">
            <ComponentCanvas
              componentStructure={componentStructure}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              propertyValues={propertyValues}
              componentCode={componentCode}
              componentConfig={catalogComponent as any}
            />
          </div>

          {/* Right sidebar - Property manager */}
          <div className="w-80 shrink-0 overflow-hidden border-l border-border bg-card text-card-foreground">
            <PropertyManager
            structure={componentStructure}
              selectedElement={selectedElement}
              propertyValues={propertyValues}
              onPropertyChange={handlePropertyChange}
            variants={variantDrafts}
              selectedVariant={selectedVariant}
              onVariantChange={handleVariantChange}
              sizeOptions={sizeOptions}
              selectedSize={selectedSize}
              onSizeChange={handleSizeChange}
              onResetOverrides={handleResetOverrides}
            propSections={componentStructure?.propSections}
            onVariantsChange={setVariantDrafts}
            />
          </div>
        </div>
      </div>
    </ProjectThemeProvider>
  )
}
