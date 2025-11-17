/**
 * Google Fonts integration utilities
 */

export type GoogleFont = {
  name: string
  displayName: string
  category: 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting'
  variants: string[]
}

// Curated list of popular Google Fonts
export const POPULAR_GOOGLE_FONTS: GoogleFont[] = [
  // Sans-serif fonts
  { name: 'Inter', displayName: 'Inter', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'Roboto', displayName: 'Roboto', category: 'sans-serif', variants: ['100', '300', '400', '500', '700', '900'] },
  { name: 'Open+Sans', displayName: 'Open Sans', category: 'sans-serif', variants: ['300', '400', '500', '600', '700', '800'] },
  { name: 'Lato', displayName: 'Lato', category: 'sans-serif', variants: ['100', '300', '400', '700', '900'] },
  { name: 'Montserrat', displayName: 'Montserrat', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'Poppins', displayName: 'Poppins', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'Raleway', displayName: 'Raleway', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'Ubuntu', displayName: 'Ubuntu', category: 'sans-serif', variants: ['300', '400', '500', '700'] },
  { name: 'Nunito', displayName: 'Nunito', category: 'sans-serif', variants: ['200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'Work+Sans', displayName: 'Work Sans', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'DM+Sans', displayName: 'DM Sans', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'Outfit', displayName: 'Outfit', category: 'sans-serif', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
  
  // Serif fonts
  { name: 'Merriweather', displayName: 'Merriweather', category: 'serif', variants: ['300', '400', '700', '900'] },
  { name: 'Playfair+Display', displayName: 'Playfair Display', category: 'serif', variants: ['400', '500', '600', '700', '800', '900'] },
  { name: 'Lora', displayName: 'Lora', category: 'serif', variants: ['400', '500', '600', '700'] },
  { name: 'PT+Serif', displayName: 'PT Serif', category: 'serif', variants: ['400', '700'] },
  { name: 'Source+Serif+4', displayName: 'Source Serif 4', category: 'serif', variants: ['200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'Crimson+Text', displayName: 'Crimson Text', category: 'serif', variants: ['400', '600', '700'] },
  { name: 'EB+Garamond', displayName: 'EB Garamond', category: 'serif', variants: ['400', '500', '600', '700', '800'] },
  
  // Monospace fonts
  { name: 'JetBrains+Mono', displayName: 'JetBrains Mono', category: 'monospace', variants: ['100', '200', '300', '400', '500', '600', '700', '800'] },
  { name: 'Fira+Code', displayName: 'Fira Code', category: 'monospace', variants: ['300', '400', '500', '600', '700'] },
  { name: 'Source+Code+Pro', displayName: 'Source Code Pro', category: 'monospace', variants: ['200', '300', '400', '500', '600', '700', '800', '900'] },
  { name: 'IBM+Plex+Mono', displayName: 'IBM Plex Mono', category: 'monospace', variants: ['100', '200', '300', '400', '500', '600', '700'] },
  { name: 'Roboto+Mono', displayName: 'Roboto Mono', category: 'monospace', variants: ['100', '200', '300', '400', '500', '600', '700'] },
  { name: 'Space+Mono', displayName: 'Space Mono', category: 'monospace', variants: ['400', '700'] },
]

// System fonts (no Google Fonts loading needed)
export const SYSTEM_FONTS: GoogleFont[] = [
  { 
    name: 'System UI', 
    displayName: 'System UI (Default)', 
    category: 'sans-serif', 
    variants: ['400']
  },
]

export const ALL_FONTS = [...SYSTEM_FONTS, ...POPULAR_GOOGLE_FONTS]

// Loaded fonts cache to avoid reloading
const loadedFonts = new Set<string>()

/**
 * Load a Google Font dynamically
 */
export function loadGoogleFont(fontName: string): void {
  // Skip if already loaded or if it's a system font
  if (loadedFonts.has(fontName) || fontName === 'System UI') {
    return
  }

  // Create link element for Google Fonts
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@100;200;300;400;500;600;700;800;900&display=swap`
  
  document.head.appendChild(link)
  loadedFonts.add(fontName)
}

/**
 * Get font family CSS value for a Google Font
 */
export function getFontFamilyValue(font: GoogleFont): string {
  if (font.name === 'System UI') {
    return "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'"
  }
  
  // Convert URL-encoded name back to display name with proper quotes
  const displayName = font.displayName
  
  // Add fallback based on category
  let fallback = 'sans-serif'
  if (font.category === 'serif') {
    fallback = 'serif'
  } else if (font.category === 'monospace') {
    fallback = 'monospace'
  }
  
  return `'${displayName}', ${fallback}`
}

/**
 * Parse a CSS font-family value to find matching Google Font
 */
export function parseFontFamily(cssValue: string): GoogleFont | null {
  if (!cssValue) return null
  
  // Check for System UI
  if (cssValue.includes('ui-sans-serif') || cssValue.includes('system-ui')) {
    return SYSTEM_FONTS[0]
  }
  
  // Extract first font name from the CSS value
  const match = cssValue.match(/['"]?([^'",]+)['"]?/)
  if (!match) return null
  
  const fontName = match[1].trim()
  
  // Find matching font in our list
  return ALL_FONTS.find(f => 
    f.displayName.toLowerCase() === fontName.toLowerCase() ||
    f.name.replace(/\+/g, ' ').toLowerCase() === fontName.toLowerCase()
  ) || null
}

/**
 * Get fonts by category
 */
export function getFontsByCategory(category: GoogleFont['category']): GoogleFont[] {
  return ALL_FONTS.filter(f => f.category === category)
}

