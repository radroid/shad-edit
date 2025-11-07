import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { THEME_PRESETS, COLOR_GROUPS } from '@/lib/theme-presets'
import { HexColorPicker } from 'react-colorful'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

type GlobalTheme = {
  colors: Record<string, string>
  typography: {
    fontFamily: string
    fontSize: Record<string, string>
  }
  spacing: {
    scale: number
  }
  borderRadius: Record<string, string>
}

type ThemeEditorProps = {
  theme: GlobalTheme
  onThemeChange: (theme: GlobalTheme) => void
}

export default function ThemeEditor({ theme, onThemeChange }: ThemeEditorProps) {
  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(null)
  const [selectedColorValue, setSelectedColorValue] = useState<string>('')

  const handleColorChange = (key: string, value: string) => {
    onThemeChange({
      ...theme,
      colors: {
        ...theme.colors,
        [key]: value,
      },
    })
  }

  const applyPreset = (preset: typeof THEME_PRESETS.default) => {
    onThemeChange({
      ...theme,
      colors: preset.colors,
    })
  }

  const resetColor = (key: string) => {
    // Reset to default preset
    const defaultPreset = THEME_PRESETS.default
    handleColorChange(key, defaultPreset.colors[key as keyof typeof defaultPreset.colors] || theme.colors[key])
  }

  const hslToHex = (hsl: string): string => {
    // Simple conversion - for production, use a proper HSL to hex converter
    // This is a simplified version
    const match = hsl.match(/hsl\((\d+)\s+([\d.]+)%\s+([\d.]+)%\)/)
    if (!match) return hsl
    
    const h = parseInt(match[1]) / 360
    const s = parseInt(match[2]) / 100
    const l = parseInt(match[3]) / 100
    
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
    const m = l - c / 2
    
    let r = 0, g = 0, b = 0
    
    if (h < 1/6) {
      r = c; g = x; b = 0
    } else if (h < 2/6) {
      r = x; g = c; b = 0
    } else if (h < 3/6) {
      r = 0; g = c; b = x
    } else if (h < 4/6) {
      r = 0; g = x; b = c
    } else if (h < 5/6) {
      r = x; g = 0; b = c
    } else {
      r = c; g = 0; b = x
    }
    
    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    b = Math.round((b + m) * 255)
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="presets" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(THEME_PRESETS).map(([key, preset]) => (
              <Button
                key={key}
                variant="outline"
                onClick={() => applyPreset(preset)}
                className="h-24 flex-col"
              >
                <div className="flex gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: preset.colors.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: preset.colors.secondary }}
                  />
                  <div
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: preset.colors.accent }}
                  />
                </div>
                {preset.name}
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <ScrollArea className="h-[600px]">
            {COLOR_GROUPS.map((group) => (
              <div key={group.name} className="mb-6">
                <h3 className="font-semibold mb-3">{group.name}</h3>
                {group.variables.map((variable) => {
                  const colorValue = theme.colors[variable.key]
                  const hexValue = colorValue?.startsWith('hsl') 
                    ? hslToHex(colorValue) 
                    : colorValue || '#000000'
                  
                  return (
                    <div key={variable.key} className="flex items-center gap-4 mb-3">
                      <Label className="w-40">{variable.label}</Label>
                      <div className="relative">
                        <div
                          className="w-12 h-12 rounded border cursor-pointer"
                          style={{ backgroundColor: colorValue || '#000000' }}
                          onClick={() => {
                            setSelectedColorKey(variable.key)
                            setSelectedColorValue(hexValue)
                          }}
                        />
                        {selectedColorKey === variable.key && (
                          <div className="absolute z-10 mt-2 p-4 bg-background border rounded-lg shadow-lg">
                            <HexColorPicker
                              color={selectedColorValue}
                              onChange={(color) => {
                                setSelectedColorValue(color)
                                handleColorChange(variable.key, color)
                              }}
                            />
                            <Input
                              value={colorValue}
                              onChange={(e) => handleColorChange(variable.key, e.target.value)}
                              className="mt-2"
                              placeholder="hsl(...) or #hex"
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2 w-full"
                              onClick={() => {
                                resetColor(variable.key)
                                setSelectedColorKey(null)
                              }}
                            >
                              Reset
                            </Button>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-1 font-mono">
                        {colorValue}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => resetColor(variable.key)}
                      >
                        Reset
                      </Button>
                    </div>
                  )
                })}
              </div>
            ))}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Input
                value={theme.typography.fontFamily}
                onChange={(e) =>
                  onThemeChange({
                    ...theme,
                    typography: {
                      ...theme.typography,
                      fontFamily: e.target.value,
                    },
                  })
                }
                placeholder="ui-sans-serif, system-ui, sans-serif"
              />
            </div>
            <div className="space-y-2">
              <Label>Font Sizes</Label>
              {Object.entries(theme.typography.fontSize).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <Label className="w-20">{key}</Label>
                  <Input
                    value={value}
                    onChange={(e) =>
                      onThemeChange({
                        ...theme,
                        typography: {
                          ...theme.typography,
                          fontSize: {
                            ...theme.typography.fontSize,
                            [key]: e.target.value,
                          },
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="other" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Spacing Scale</Label>
              <Input
                type="number"
                step="0.1"
                value={theme.spacing.scale}
                onChange={(e) =>
                  onThemeChange({
                    ...theme,
                    spacing: {
                      scale: parseFloat(e.target.value) || 1.0,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Border Radius</Label>
              {Object.entries(theme.borderRadius).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <Label className="w-20">{key}</Label>
                  <Input
                    value={value}
                    onChange={(e) =>
                      onThemeChange({
                        ...theme,
                        borderRadius: {
                          ...theme.borderRadius,
                          [key]: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

