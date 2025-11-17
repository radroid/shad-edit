import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RotateCcw, Copy, Check, Sun, Moon } from 'lucide-react'
import {
  CSSVariables,
  CSS_VARIABLE_CATEGORIES,
  DEFAULT_CSS_VARIABLES,
  DEFAULT_CSS_VARIABLES_DARK,
  formatCSSVariableName,
  isValidCSSValue,
} from '@/lib/scoped-css'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import FontSelector from './FontSelector'
import { parseFontFamily, loadGoogleFont } from '@/lib/google-fonts'

type GlobalCSSEditorProps = {
  variables: CSSVariables
  onChange: (variables: CSSVariables) => void
  theme: 'light' | 'dark'
  onThemeChange: (theme: 'light' | 'dark') => void
}

// Color conversion utilities
type RGB = { r: number; g: number; b: number }

// Parse different color formats to RGB
function parseColor(color: string): RGB | null {
  if (!color) return null
  
  // HEX format
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16)
    }
  }
  
  // RGB format (supports both comma and space separated)
  const rgbMatch = color.match(/rgb\((\d+)[,\s]+(\d+)[,\s]+(\d+)\)/)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    }
  }
  
  // HSL format (supports decimals and negative values)
  const hslMatch = color.match(/hsl\(([-\d.]+)\s+([-\d.]+)%?\s+([-\d.]+)%?\)/)
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]) / 360
    const s = parseFloat(hslMatch[2]) / 100
    const l = parseFloat(hslMatch[3]) / 100
    return hslToRgb(h, s, l)
  }
  
  // OKLCH format (simplified parsing)
  const oklchMatch = color.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
  if (oklchMatch) {
    const lightness = parseFloat(oklchMatch[1])
    const chroma = parseFloat(oklchMatch[2])
    const hue = parseFloat(oklchMatch[3])
    // Convert oklch back to hsl then to rgb (simplified)
    const h = hue / 360
    const s = chroma / 0.4
    const l = lightness
    return hslToRgb(h, s, l)
  }
  
  return null
}

function hslToRgb(h: number, s: number, l: number): RGB {
  let r, g, b
  
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`
}

function rgbToHsl(rgb: RGB): string {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`
}

function rgbToOklch(rgb: RGB): string {
  // Simplified conversion - convert to HSL first
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  
  const lightness = l
  const chroma = s * 0.4
  const hue = Math.round(h * 360)
  
  return `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue})`
}

function convertColor(color: string, toFormat: 'hex' | 'rgb' | 'hsl' | 'oklch'): string {
  const rgb = parseColor(color)
  if (!rgb) return color
  
  switch (toFormat) {
    case 'hex': return rgbToHex(rgb)
    case 'rgb': return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
    case 'hsl': return rgbToHsl(rgb)
    case 'oklch': return rgbToOklch(rgb)
    default: return color
  }
}

// Helper to check if a value is a color
function isColorValue(value: string): boolean {
  if (!value) return false
  return value.startsWith('#') || 
         value.includes('rgb') || 
         value.includes('hsl') || 
         value.includes('oklch')
}

// Helper to check if a variable is a font variable
function isFontVariable(varName: string): boolean {
  return varName.includes('font')
}

// Get font category for a font variable
function getFontCategory(varName: string): 'sans-serif' | 'serif' | 'monospace' | undefined {
  if (varName.includes('sans')) return 'sans-serif'
  if (varName.includes('serif') && !varName.includes('sans')) return 'serif'
  if (varName.includes('mono')) return 'monospace'
  return undefined
}

export default function GlobalCSSEditor({
  variables,
  onChange,
  theme,
  onThemeChange,
}: GlobalCSSEditorProps) {
  const [editMode, setEditMode] = useState<'visual' | 'code'>('visual')
  const [colorFormat, setColorFormat] = useState<'hex' | 'rgb' | 'hsl' | 'oklch'>('oklch')
  const [isCopied, setIsCopied] = useState(false)
  
  // Get current defaults based on theme
  const currentDefaults = theme === 'dark' ? DEFAULT_CSS_VARIABLES_DARK : DEFAULT_CSS_VARIABLES

  // Update variables when theme changes
  useEffect(() => {
    // When theme changes, update all color/sidebar variables to use the new theme's defaults
    const updatedVariables: CSSVariables = { ...variables }
    let hasChanges = false
    
    Object.keys(currentDefaults).forEach((key) => {
      // Only update color-related variables (not fonts, radius, shadows, etc.)
      const isColorVar = isColorValue(currentDefaults[key])
      if (isColorVar) {
        updatedVariables[key] = currentDefaults[key]
        hasChanges = true
      }
    })
    
    if (hasChanges) {
      onChange(updatedVariables)
    }
  }, [theme]) // eslint-disable-line react-hooks/exhaustive-deps

  // Preload fonts when variables change
  useEffect(() => {
    Object.entries(variables).forEach(([varName, value]) => {
      if (isFontVariable(varName) && value) {
        const font = parseFontFamily(value)
        if (font && font.name !== 'System UI') {
          loadGoogleFont(font.name)
        }
      }
    })
  }, [variables])

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
    const defaultValue = currentDefaults[formattedName]
    
    if (defaultValue) {
      onChange({
        ...variables,
        [formattedName]: defaultValue,
      })
    }
  }

  const handleResetAll = () => {
    onChange(currentDefaults)
  }

  const handleCopy = () => {
    const cssCode = generateCodeView()
    navigator.clipboard.writeText(cssCode).then(() => {
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
      }, 5000)
    }).catch(err => {
      console.error('Failed to copy:', err)
    })
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

      <Tabs value={editMode} onValueChange={(v: any) => setEditMode(v)} className="flex-1 flex flex-col min-h-0">
        <div className="mx-4 mt-4 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <TabsList>
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              onClick={handleCopy}
              title={isCopied ? "Copied!" : "Copy CSS variables"}
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <Select value={colorFormat} onValueChange={(v: any) => setColorFormat(v)}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oklch">OKLCH</SelectItem>
              <SelectItem value="hex">HEX</SelectItem>
              <SelectItem value="rgb">RGB</SelectItem>
              <SelectItem value="hsl">HSL</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="visual" className="flex-1 m-0 overflow-hidden min-h-0 flex flex-col">
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-6 pb-10">
              {Object.entries(CSS_VARIABLE_CATEGORIES).map(([key, category]) => (
                <div key={key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      {category.label}
                    </h4>
                    {key === 'colors' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onThemeChange(theme === 'light' ? 'dark' : 'light')}
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode colors`}
                      >
                        {theme === 'light' ? (
                          <Moon className="h-4 w-4" />
                        ) : (
                          <Sun className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
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
                        {isColorValue(variables[varName] || currentDefaults[varName] || '') && (
                          <div
                            className="w-8 h-8 rounded border shrink-0"
                            style={{
                              backgroundColor: variables[varName] || currentDefaults[varName],
                            }}
                          />
                        )}
                        {isFontVariable(varName) ? (
                          <FontSelector
                            value={variables[varName] || currentDefaults[varName] || ''}
                            onChange={(value) => handleVariableChange(varName, value)}
                            category={getFontCategory(varName)}
                            placeholder={currentDefaults[varName] || 'Select a font'}
                          />
                        ) : (
                          <Input
                            id={varName}
                            value={
                              isColorValue(variables[varName] || currentDefaults[varName] || '')
                                ? convertColor(
                                    variables[varName] || currentDefaults[varName] || '',
                                    colorFormat
                                  )
                                : variables[varName] || currentDefaults[varName] || ''
                            }
                            onChange={(e) =>
                              handleVariableChange(varName, e.target.value)
                            }
                            className="text-xs font-mono"
                            placeholder={currentDefaults[varName] || ''}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="code" className="flex-1 m-0 overflow-hidden min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 p-4">
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

