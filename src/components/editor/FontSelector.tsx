import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ALL_FONTS, loadGoogleFont, getFontFamilyValue, parseFontFamily, type GoogleFont } from '@/lib/google-fonts'

type FontSelectorProps = {
  value: string
  onChange: (value: string) => void
  category?: 'sans-serif' | 'serif' | 'monospace'
  placeholder?: string
}

export default function FontSelector({ value, onChange, category, placeholder }: FontSelectorProps) {
  const [selectedFont, setSelectedFont] = useState<GoogleFont | null>(null)

  // Filter fonts by category if specified
  const availableFonts = category 
    ? ALL_FONTS.filter(f => f.category === category)
    : ALL_FONTS

  // Parse current value to find selected font
  useEffect(() => {
    const font = parseFontFamily(value)
    setSelectedFont(font)
  }, [value])

  const handleFontChange = (fontName: string) => {
    const font = ALL_FONTS.find(f => f.name === fontName)
    if (!font) return

    // Load the font if it's a Google Font
    if (font.name !== 'System UI') {
      loadGoogleFont(font.name)
    }

    // Update the CSS value
    const cssValue = getFontFamilyValue(font)
    onChange(cssValue)
    setSelectedFont(font)
  }

  return (
    <Select 
      value={selectedFont?.name || ''} 
      onValueChange={handleFontChange}
    >
      <SelectTrigger className="w-full text-xs font-mono">
        <SelectValue placeholder={placeholder || 'Select a font'}>
          {selectedFont ? (
            <span style={{ fontFamily: selectedFont.name === 'System UI' ? undefined : `'${selectedFont.displayName}'` }}>
              {selectedFont.displayName}
            </span>
          ) : (
            placeholder || 'Select a font'
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {availableFonts.map((font) => (
          <SelectItem 
            key={font.name} 
            value={font.name}
            onSelect={() => {
              // Preload font when hovering/selecting
              if (font.name !== 'System UI') {
                loadGoogleFont(font.name)
              }
            }}
          >
            <span 
              style={{ 
                fontFamily: font.name === 'System UI' ? undefined : `'${font.displayName}'`,
              }}
              className="text-sm"
            >
              {font.displayName}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

