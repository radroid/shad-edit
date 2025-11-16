import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockItem,
} from '@/components/kibo-ui/code-block'
import { useGuestEditor } from '@/hooks/useGuestEditor'
import { useCatalogComponent } from '@/lib/catalog-hooks'
import PropertyManager from '@/components/editor/PropertyManager'
import ComponentCanvas from '@/components/editor/ComponentPreview'

export const Route = createFileRoute('/marketplace/$componentId/edit')({
  component: GuestEditPage,
})

function GuestEditPage() {
  const { componentId } = useParams({ strict: false }) as { componentId: string }
  const navigate = useNavigate()
  const { config, isLoading } = useCatalogComponent(componentId)
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<number | undefined>(undefined)
  
  const {
    structure,
    propertyValues,
    selectedElementId,
    setSelectedElementId,
    handlePropertyChange,
    componentCode,
    isDirty,
    resetToDefaults,
    clearGuestCache,
  } = useGuestEditor(componentId, config)
  const [variantDrafts, setVariantDrafts] = useState(config?.variants || [])

  const elementOptions = useMemo(() => {
    return structure?.elements ?? []
  }, [structure])

  const selectedElement = useMemo(() => {
    if (!structure) return undefined
    return (
      structure.elements.find((element) => element.id === selectedElementId) ??
      structure.elements[0]
    )
  }, [structure, selectedElementId])

  useEffect(() => {
    setVariantDrafts(config?.variants || [])
  }, [config])

  const hasPropSections = Boolean(structure?.propSections && structure.propSections.length > 0)

  const handleCopyCode = async () => {
    if (componentCode) {
      try {
        await navigator.clipboard.writeText(componentCode)
        setCopied(true)
        // Clear any existing timeout
        if (copyTimeoutRef.current) {
          window.clearTimeout(copyTimeoutRef.current)
        }
        copyTimeoutRef.current = window.setTimeout(() => {
          setCopied(false)
          copyTimeoutRef.current = undefined
        }, 2000)
      } catch (error) {
        console.error('Failed to copy code:', error)
      }
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading component...</p>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Component not found</p>
          <Button onClick={() => navigate({ to: '/marketplace' })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/marketplace' })}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{config.metadata.name}</h1>
                {config.metadata.description && (
                  <p className="text-sm text-muted-foreground">
                    {config.metadata.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs uppercase tracking-wide">
                {isDirty ? 'Autosaved to browser cache' : 'No guest edits yet'}
              </Badge>
              <Button variant="outline" size="sm" onClick={resetToDefaults}>
                Reset
              </Button>
              <Button variant="ghost" size="sm" onClick={clearGuestCache}>
                Clear Cache
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleCopyCode}
                disabled={!componentCode}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          {/* Canvas - Takes 2 columns */}
          <div className="lg:col-span-2 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Edits are applied instantly; changes persist locally until cleared.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <ComponentCanvas
                  componentStructure={structure}
                  selectedElementId={selectedElementId}
                  onSelectElement={setSelectedElementId}
                  propertyValues={propertyValues}
                  componentCode={componentCode}
                  componentConfig={config}
                />
              </CardContent>
            </Card>
          </div>

          {/* Property Manager - Takes 1 column */}
          <div className="flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle>Properties</CardTitle>
                <CardDescription>
                  Select an element to edit its properties
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                {hasPropSections ? (
                  <PropertyManager
                    structure={structure}
                    propertyValues={propertyValues}
                    onPropertyChange={handlePropertyChange}
                    variants={variantDrafts}
                    selectedVariant={selectedVariant}
                    onVariantChange={handleVariantChange}
                    propSections={structure?.propSections}
                    onVariantsChange={setVariantDrafts}
                  />
                ) : structure && structure.elements.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Element
                      </Label>
                      <Select
                        value={selectedElement?.id ?? ''}
                        onValueChange={(value) => {
                          setSelectedElementId(value)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose element" />
                        </SelectTrigger>
                        <SelectContent>
                          {elementOptions.map((element) => (
                            <SelectItem key={element.id} value={element.id}>
                              {element.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedElement ? (
                      <PropertyManager
                        structure={structure}
                        selectedElement={selectedElement}
                        propertyValues={propertyValues}
                        onPropertyChange={handlePropertyChange}
                        variants={variantDrafts}
                        propSections={structure?.propSections}
                        onVariantsChange={setVariantDrafts}
                      />
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Select an element to configure its properties.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    This component has no editable properties configured yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Code View Tab */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Generated Code</CardTitle>
              <CardDescription>
                Copy this code to use in your project. Changes are reflected in real-time.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <CodeBlock
                data={[
                  {
                    language: 'tsx',
                    filename: 'component.tsx',
                    code: componentCode || config.code || '',
                  },
                ]}
                defaultValue="tsx"
                className="border-0 rounded-none w-full m-0"
              >
                <div className="flex items-center justify-end border-b bg-secondary/50 p-2 m-0">
                  <CodeBlockCopyButton />
                </div>
                <CodeBlockBody>
                  {(item) => (
                    <CodeBlockItem
                      key={item.language}
                      value={item.language}
                      lineNumbers
                      className="overflow-y-auto overflow-x-hidden max-h-[400px] [&_.shiki]:bg-card [&_code]:whitespace-pre-wrap! [&_code]:wrap-break-word [&_code]:overflow-x-hidden! [&_code]:block! [&_code]:grid-none! [&_.line]:whitespace-pre-wrap! [&_.line]:wrap-break-word [&_pre]:m-0! [&_pre]:py-0! [&_pre]:px-0!"
                    >
                      <CodeBlockContent
                        language="tsx"
                        themes={{
                          light: 'github-light',
                          dark: 'github-dark-default',
                        }}
                      >
                        {item.code}
                      </CodeBlockContent>
                    </CodeBlockItem>
                  )}
                </CodeBlockBody>
              </CodeBlock>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

