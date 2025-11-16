import { useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import FieldMappingEditor, {
  type FieldMapping,
} from './FieldMappingEditor'
import type { ComponentConfig } from '@/lib/component-config'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

interface AddComponentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'code-input' | 'loading' | 'mapping' | 'success' | 'error'

export default function AddComponentDialog({
  open,
  onOpenChange,
}: AddComponentDialogProps) {
  const navigate = useNavigate()
  const importComponent = useAction(api.importComponent.importComponentFromCode)
  const [step, setStep] = useState<Step>('code-input')
  const [componentName, setComponentName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [componentConfig, setComponentConfig] = useState<ComponentConfig | null>(null)
  const [componentId, setComponentId] = useState<string | null>(null)
  const [mappings, setMappings] = useState<FieldMapping[]>([])

  const getTrimmedCode = () => code.trim()

  const validateCode = () => {
    const trimmed = getTrimmedCode()
    if (!trimmed) {
      setCodeError('Paste the component code from shadcn/ui.')
      return false
    }
    if (trimmed.length < 80) {
      setCodeError('Please paste the entire component, not just a snippet.')
      return false
    }
    if (!trimmed.includes('<') || !trimmed.includes('>')) {
      setCodeError('The pasted content does not appear to contain JSX.')
      return false
    }
    setCodeError(null)
    return true
  }

  const handleCodeSubmit = async () => {
    if (!validateCode()) {
      return
    }

    setStep('loading')
    setLoadingMessage('Analyzing component code...')

    try {
      const result = await importComponent({
        code: getTrimmedCode(),
        metadata: {
          name: componentName.trim() || undefined,
          category: category.trim() || undefined,
          description: description.trim() || undefined,
          sourceUrl: sourceUrl.trim() || undefined,
        },
      })

      if (result.componentConfig) {
        setComponentConfig(result.componentConfig)
        setComponentId(result.componentId)
        setStep('mapping')
        setLoadingMessage('')
      } else {
        throw new Error('No component config returned')
      }
    } catch (error: any) {
      setErrorMessage(
        error.message || 'Failed to import component. Please check the URL and try again.'
      )
      setStep('error')
      setLoadingMessage('')
    }
  }

  const handleMappingSave = async () => {
    // For now, we'll just navigate to the component
    // In the future, we could save the mappings to the component config
    if (componentId) {
      onOpenChange(false)
      // Navigate to the component page
      navigate({
        to: '/marketplace/$componentId',
        params: { componentId },
      })
      // Reset state
      resetDialog()
    }
  }

  const handleCancel = () => {
    resetDialog()
    onOpenChange(false)
  }

  const resetDialog = () => {
    setStep('code-input')
    setComponentName('')
    setCategory('')
    setDescription('')
    setSourceUrl('')
    setCode('')
    setCodeError(null)
    setLoadingMessage('')
    setErrorMessage(null)
    setComponentConfig(null)
    setComponentId(null)
    setMappings([])
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetDialog()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === 'code-input' && (
          <>
            <DialogHeader>
              <DialogTitle>Add Component from Code</DialogTitle>
              <DialogDescription>
                Follow the manual install instructions on shadcn/ui, copy the generated code,
                and paste it below. We'll analyze the component and make its props editable.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-sm text-muted-foreground font-medium">
                  Manual Install Checklist
                </p>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>Open the desired component on ui.shadcn.com.</li>
                  <li>Select <span className="font-medium text-foreground">Manual Install</span> and follow the prompts.</li>
                  <li>When the site shows the full component code, copy it.</li>
                  <li>Paste the exact code below and optionally provide metadata.</li>
                </ol>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="component-name">Component Name</Label>
                  <Input
                    id="component-name"
                    placeholder="Button, Card, etc."
                    value={componentName}
                    onChange={(e) => setComponentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="component-category">Category</Label>
                  <Input
                    id="component-category"
                    placeholder="e.g., Forms, Navigation"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="component-description">Description</Label>
                  <Input
                    id="component-description"
                    placeholder="Optional short description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="component-source-url">Reference URL (optional)</Label>
                  <Input
                    id="component-source-url"
                    type="url"
                    placeholder="https://ui.shadcn.com/docs/components/..."
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="component-code">
                  Pasted Component Code{' '}
                  <span className="text-muted-foreground text-xs">
                    ({getTrimmedCode().length} characters)
                  </span>
                </Label>
                <textarea
                  id="component-code"
                  className="w-full min-h-[240px] rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Paste the component code copied from shadcn/ui..."
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value)
                    if (codeError) {
                      setCodeError(null)
                    }
                  }}
                  onBlur={validateCode}
                />
                {codeError && (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {codeError}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleCodeSubmit} disabled={!getTrimmedCode()}>
                Analyze Code
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'loading' && (
          <>
            <DialogHeader>
              <DialogTitle>Importing Component</DialogTitle>
              <DialogDescription>{loadingMessage || 'Processing...'}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{loadingMessage}</p>
            </div>
          </>
        )}

        {step === 'mapping' && componentConfig && (
          <>
            <DialogHeader>
              <DialogTitle>Configure Field Mappings</DialogTitle>
              <DialogDescription>
                Choose how each extracted field should be displayed in the property editor.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <FieldMappingEditor
                editableElements={componentConfig.editableElements || []}
                mappings={mappings}
                onMappingsChange={setMappings}
                onSave={handleMappingSave}
                onCancel={() => handleOpenChange(false)}
              />
            </div>
          </>
        )}

        {step === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle>Import Failed</DialogTitle>
              <DialogDescription>
                {errorMessage || 'An error occurred while importing the component.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {errorMessage}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setStep('code-input')}>Try Again</Button>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'success' && (
          <>
            <DialogHeader>
              <DialogTitle>Component Imported Successfully</DialogTitle>
              <DialogDescription>
                The component has been added to your marketplace.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-sm text-muted-foreground">
                  Component is ready to use!
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

