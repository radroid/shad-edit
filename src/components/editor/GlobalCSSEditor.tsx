import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RotateCcw } from 'lucide-react'
import {
  CSSVariables,
  CSS_VARIABLE_CATEGORIES,
  DEFAULT_CSS_VARIABLES,
  formatCSSVariableName,
  isValidCSSValue,
} from '@/lib/scoped-css'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type GlobalCSSEditorProps = {
  variables: CSSVariables
  onChange: (variables: CSSVariables) => void
}

export default function GlobalCSSEditor({
  variables,
  onChange,
}: GlobalCSSEditorProps) {
  const [editMode, setEditMode] = useState<'visual' | 'code'>('visual')

  const handleVariableChange = (name: string, value: string) => {
    const formattedName = formatCSSVariableName(name)
    
    if (isValidCSSValue(value) || value === '') {
      onChange({
        ...variables,
        [formattedName]: value,
      })
    }
  }

  const handleReset = (name: string) => {
    const formattedName = formatCSSVariableName(name)
    const defaultValue = DEFAULT_CSS_VARIABLES[formattedName]
    
    if (defaultValue) {
      onChange({
        ...variables,
        [formattedName]: defaultValue,
      })
    }
  }

  const handleResetAll = () => {
    onChange(DEFAULT_CSS_VARIABLES)
  }

  const handleCodeChange = (code: string) => {
    // Parse code into variables
    const lines = code.split('\n')
    const newVariables: CSSVariables = {}

    lines.forEach((line) => {
      const match = line.match(/^\s*(--[\w-]+)\s*:\s*([^;]+);?\s*$/)
      if (match) {
        const [, name, value] = match
        if (isValidCSSValue(value)) {
          newVariables[name] = value.trim()
        }
      }
    })

    onChange(newVariables)
  }

  const generateCodeView = () => {
    return Object.entries(variables)
      .map(([name, value]) => `${name}: ${value};`)
      .join('\n')
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Global CSS Variables</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetAll}
            className="h-8"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset All
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          These variables are scoped to the current component preview only
        </p>
      </div>

      <Tabs value={editMode} onValueChange={(v: any) => setEditMode(v)} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {Object.entries(CSS_VARIABLE_CATEGORIES).map(([key, category]) => (
                <div key={key} className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {category.label}
                  </h4>
                  {category.variables.map((varName) => (
                    <div key={varName} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={varName} className="text-xs">
                          {varName}
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReset(varName)}
                          className="h-6 px-2 text-xs"
                        >
                          Reset
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        {key === 'colors' && (
                          <div
                            className="w-8 h-8 rounded border shrink-0"
                            style={{
                              backgroundColor: variables[varName] || DEFAULT_CSS_VARIABLES[varName],
                            }}
                          />
                        )}
                        <Input
                          id={varName}
                          value={variables[varName] || DEFAULT_CSS_VARIABLES[varName] || ''}
                          onChange={(e) =>
                            handleVariableChange(varName, e.target.value)
                          }
                          className="text-xs font-mono"
                          placeholder={DEFAULT_CSS_VARIABLES[varName] || ''}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
          <div className="h-full p-4">
            <textarea
              value={generateCodeView()}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full font-mono text-xs p-4 bg-muted/50 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              spellCheck={false}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

