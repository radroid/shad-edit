/**
 * Utility helpers for working with Tailwind utility classes.
 */

export function splitClassString(value: string | undefined | null): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.flatMap((entry) => splitClassString(String(entry)))
  }
  return String(value)
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function joinClassNames(classes: string[]): string {
  return Array.from(new Set(classes.filter(Boolean))).join(' ').trim()
}

export function toClassGroup(className: string): string {
  const trimmed = className.trim()
  if (!trimmed) return ''

  const segments = trimmed.split(':')
  const base = segments.pop() ?? ''

  const baseGroup = extractBaseGroup(base)
  if (segments.length === 0) return baseGroup
  return `${segments.join(':')}:${baseGroup}`
}

function extractBaseGroup(base: string): string {
  if (!base) return ''

  // Handle negative utilities like -mt-2
  const negative = base.startsWith('-')
  const cleaned = negative ? base.slice(1) : base

  // Extract portion before first '-' or '[' (for arbitrary values)
  const match = cleaned.match(/^([a-zA-Z]+)(?=[-\[]|$)/)
  const group = match ? match[1] : cleaned

  return negative ? `-${group}` : group
}

export function normalizeTailwindValue(
  value: string,
  classPrefix?: string
): string[] {
  const classes = splitClassString(value)

  if (classes.length > 0) {
    return classes
  }

  if (!classPrefix) {
    return value ? [value] : []
  }

  return value ? [`${classPrefix}${value}`] : []
}

export function removeGroupClasses(
  existing: string[],
  group: string
): string[] {
  if (!group) return existing
  return existing.filter((cls) => toClassGroup(cls) !== group)
}

export function mergeTailwindClasses(
  existing: string[],
  next: string[],
  group?: string
): string[] {
  const nextGroups = new Set(
    next.map((cls) => toClassGroup(cls) || group || '')
  )

  const filteredExisting = existing.filter((cls) => {
    const clsGroup = toClassGroup(cls)
    if (group && clsGroup === group) return false
    if (nextGroups.has(clsGroup)) return false
    return true
  })

  return [...filteredExisting, ...next].filter(Boolean)
}
import { twMerge } from 'tailwind-merge'

export type TailwindProperty = {
  name: string
  type: 'color' | 'spacing' | 'size' | 'radius' | 'custom'
  tailwindPrefix: string // e.g., 'text-', 'bg-', 'p-'
  cssProperty: string // e.g., 'color', 'backgroundColor', 'padding'
  defaultValue: string
  variants?: string[] // Tailwind values: ['sm', 'md', 'lg']
}

export type ExtractedClasses = {
  classes: Map<string, string[]> // elementId -> classes
  properties: TailwindProperty[]
}

/**
 * Extract Tailwind classes from component code
 */
export function extractTailwindClasses(code: string): ExtractedClasses {
  const classes = new Map<string, string[]>()
  const properties: TailwindProperty[] = []
  
  // Match className="..." or className={...}
  const classNameRegex = /className\s*=\s*{?["'`]([^"'`]+)["'`]}?/g
  const templateLiteralRegex = /className\s*=\s*{`([^`]+)`}/g
  
  let match
  let elementIndex = 0
  
  // Find all className attributes
  while ((match = classNameRegex.exec(code)) !== null || (match = templateLiteralRegex.exec(code)) !== null) {
    const classString = match[1]
    const elementId = `element-${elementIndex++}`
    const classList = classString.split(/\s+/).filter(Boolean)
    
    classes.set(elementId, classList)
    
    // Extract properties from classes
    const elementProperties = mapClassesToProperties(classList)
    properties.push(...elementProperties.map(prop => ({
      ...prop,
      name: `${elementId}.${prop.name}`,
    })))
  }
  
  return { classes, properties }
}

/**
 * Map Tailwind classes to editable properties
 */
export function mapClassesToProperties(classes: string[]): TailwindProperty[] {
  const properties: TailwindProperty[] = []
  const seen = new Set<string>()
  
  for (const className of classes) {
    // Color classes
    if (className.startsWith('text-')) {
      const color = className.replace('text-', '')
      const propName = 'textColor'
      if (!seen.has(propName)) {
        seen.add(propName)
        properties.push({
          name: propName,
          type: 'color',
          tailwindPrefix: 'text-',
          cssProperty: 'color',
          defaultValue: color,
        })
      }
    }
    
    // Background color classes - handle both direct colors and variant-based (bg-primary, bg-destructive, etc.)
    if (className.startsWith('bg-')) {
      const color = className.replace('bg-', '')
      // Skip hover and focus states, only capture base background
      if (!className.includes('/') && !className.includes('hover:') && !className.includes('focus:')) {
        const propName = 'backgroundColor'
        if (!seen.has(propName)) {
          seen.add(propName)
          // For variant-based colors (bg-primary, bg-destructive), we'll allow override via inline styles
          // The defaultValue helps identify what was originally there
          properties.push({
            name: propName,
            type: 'color',
            tailwindPrefix: 'bg-',
            cssProperty: 'backgroundColor',
            defaultValue: color, // This will be like 'primary', 'destructive', etc. for variant-based
          })
        }
      }
    }
    
    // Spacing classes
    if (className.match(/^p[tblrxy]?-/)) {
      const propName = className.startsWith('pt-') ? 'paddingTop' :
                      className.startsWith('pb-') ? 'paddingBottom' :
                      className.startsWith('pl-') ? 'paddingLeft' :
                      className.startsWith('pr-') ? 'paddingRight' :
                      className.startsWith('px-') ? 'paddingX' :
                      className.startsWith('py-') ? 'paddingY' :
                      'padding'
      if (!seen.has(propName)) {
        seen.add(propName)
        const value = className.replace(/^p[tblrxy]?-/, '')
        properties.push({
          name: propName,
          type: 'spacing',
          tailwindPrefix: className.match(/^p[tblrxy]?-/)?.[0] || 'p-',
          cssProperty: propName.toLowerCase(),
          defaultValue: value,
        })
      }
    }
    
    if (className.match(/^m[tblrxy]?-/)) {
      const propName = className.startsWith('mt-') ? 'marginTop' :
                      className.startsWith('mb-') ? 'marginBottom' :
                      className.startsWith('ml-') ? 'marginLeft' :
                      className.startsWith('mr-') ? 'marginRight' :
                      className.startsWith('mx-') ? 'marginX' :
                      className.startsWith('my-') ? 'marginY' :
                      'margin'
      if (!seen.has(propName)) {
        seen.add(propName)
        const value = className.replace(/^m[tblrxy]?-/, '')
        properties.push({
          name: propName,
          type: 'spacing',
          tailwindPrefix: className.match(/^m[tblrxy]?-/)?.[0] || 'm-',
          cssProperty: propName.toLowerCase(),
          defaultValue: value,
        })
      }
    }
    
    // Border radius
    if (className.startsWith('rounded')) {
      const propName = 'borderRadius'
      if (!seen.has(propName)) {
        seen.add(propName)
        const value = className.replace('rounded', '') || 'default'
        properties.push({
          name: propName,
          type: 'radius',
          tailwindPrefix: 'rounded',
          cssProperty: 'borderRadius',
          defaultValue: value,
        })
      }
    }
    
    // Border width
    if (className.match(/^border(-[tblrxy])?-/)) {
      const propName = 'borderWidth'
      if (!seen.has(propName)) {
        seen.add(propName)
        const value = className.replace(/^border(-[tblrxy])?-/, '')
        properties.push({
          name: propName,
          type: 'custom',
          tailwindPrefix: 'border',
          cssProperty: 'borderWidth',
          defaultValue: value || '1',
        })
      }
    }
    
    // Font size
    if (className.startsWith('text-') && !className.startsWith('text-[')) {
      // Check if it's a size (text-sm, text-lg) not a color
      const sizeMatch = className.match(/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/)
      if (sizeMatch) {
        const propName = 'fontSize'
        if (!seen.has(propName)) {
          seen.add(propName)
          properties.push({
            name: propName,
            type: 'size',
            tailwindPrefix: 'text-',
            cssProperty: 'fontSize',
            defaultValue: sizeMatch[1],
          })
        }
      }
    }
    
    // Font weight
    if (className.match(/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/)) {
      const propName = 'fontWeight'
      if (!seen.has(propName)) {
        seen.add(propName)
        const value = className.replace('font-', '')
        properties.push({
          name: propName,
          type: 'custom',
          tailwindPrefix: 'font-',
          cssProperty: 'fontWeight',
          defaultValue: value,
        })
      }
    }
  }
  
  return properties
}

/**
 * Inject property values as Tailwind classes into code
 */
export function injectTailwindClasses(
  code: string,
  properties: Record<string, any>,
  elementId: string
): string {
  let result = code
  
  // Find the className for this element
  const classNameRegex = new RegExp(
    "(className\\s*=\\s*{?[\"'`])([^\"'`]+)([\"'`]}?)",
    'g'
  )
  
  // Build new class string from properties
  const newClasses: string[] = []
  
  for (const [key, value] of Object.entries(properties)) {
    if (!key.startsWith(`${elementId}.`)) continue
    
    const propName = key.replace(`${elementId}.`, '')
    
    // Map property to Tailwind class
    if (propName === 'textColor' && value) {
      newClasses.push(`text-${value}`)
    } else if (propName === 'backgroundColor' && value) {
      newClasses.push(`bg-${value}`)
    } else if (propName === 'padding' && value) {
      newClasses.push(`p-${value}`)
    } else if (propName === 'margin' && value) {
      newClasses.push(`m-${value}`)
    } else if (propName === 'borderRadius' && value) {
      newClasses.push(`rounded${value === 'default' ? '' : `-${value}`}`)
    } else if (propName === 'fontSize' && value) {
      newClasses.push(`text-${value}`)
    } else if (propName === 'fontWeight' && value) {
      newClasses.push(`font-${value}`)
    }
  }
  
  // Replace first className match (simplified - would need better parsing for production)
  if (newClasses.length > 0) {
    result = result.replace(
      classNameRegex,
      (_match, prefix, existingClasses, suffix) => {
        const existing = existingClasses.split(/\s+/).filter(Boolean)
        const merged = twMerge(...existing, ...newClasses)
        return `${prefix}${merged}${suffix}`
      }
    )
  }
  
  return result
}

/**
 * Generate Tailwind class string from property values
 */
export function generateTailwindClasses(properties: Record<string, any>): string {
  const classes: string[] = []
  
  for (const [key, value] of Object.entries(properties)) {
    if (!value) continue
    
    if (key === 'textColor') {
      classes.push(`text-${value}`)
    } else if (key === 'backgroundColor') {
      classes.push(`bg-${value}`)
    } else if (key === 'padding') {
      classes.push(`p-${value}`)
    } else if (key === 'margin') {
      classes.push(`m-${value}`)
    } else if (key === 'borderRadius') {
      classes.push(`rounded${value === 'default' ? '' : `-${value}`}`)
    } else if (key === 'fontSize') {
      classes.push(`text-${value}`)
    } else if (key === 'fontWeight') {
      classes.push(`font-${value}`)
    }
  }
  
  return twMerge(...classes)
}

/**
 * Merge user overrides with variant classes
 */
export function mergeClassOverrides(
  baseClasses: string,
  overrides: Record<string, string>
): string {
  const baseList = baseClasses.split(/\s+/).filter(Boolean)
  const overrideList = Object.values(overrides)
  
  return twMerge(...baseList, ...overrideList)
}

