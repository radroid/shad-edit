/**
 * Utility functions for scoping CSS variables to specific components
 */

export type CSSVariables = Record<string, string>

/**
 * Default shadcn/ui CSS variables
 */
export const DEFAULT_CSS_VARIABLES: CSSVariables = {
  '--background': 'oklch(1 0 0)',
  '--foreground': 'oklch(0.145 0 0)',
  '--card': 'oklch(1 0 0)',
  '--card-foreground': 'oklch(0.145 0 0)',
  '--popover': 'oklch(1 0 0)',
  '--popover-foreground': 'oklch(0.145 0 0)',
  '--primary': 'oklch(0.205 0 0)',
  '--primary-foreground': 'oklch(0.985 0 0)',
  '--secondary': 'oklch(0.97 0 0)',
  '--secondary-foreground': 'oklch(0.205 0 0)',
  '--muted': 'oklch(0.97 0 0)',
  '--muted-foreground': 'oklch(0.556 0 0)',
  '--accent': 'oklch(0.97 0 0)',
  '--accent-foreground': 'oklch(0.205 0 0)',
  '--destructive': 'oklch(0.577 0.245 27.325)',
  '--border': 'oklch(0.922 0 0)',
  '--input': 'oklch(0.922 0 0)',
  '--ring': 'oklch(0.708 0 0)',
  '--radius': '0.625rem',
}

/**
 * Parse CSS variables from a string (e.g., from styles.css)
 */
export function parseCSSVariables(cssText: string): CSSVariables {
  const variables: CSSVariables = {}
  
  // Match CSS variable declarations like --variable-name: value;
  const regex = /--([\w-]+)\s*:\s*([^;]+);/g
  let match
  
  while ((match = regex.exec(cssText)) !== null) {
    const [, name, value] = match
    variables[`--${name}`] = value.trim()
  }
  
  return variables
}

/**
 * Generate CSS text from variables object
 */
export function generateCSSText(variables: CSSVariables): string {
  return Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')
}

/**
 * Apply CSS variables to a DOM element
 */
export function applyScopedCSS(
  element: HTMLElement,
  variables: CSSVariables
): void {
  Object.entries(variables).forEach(([key, value]) => {
    element.style.setProperty(key, value)
  })
}

/**
 * Remove scoped CSS variables from a DOM element
 */
export function removeScopedCSS(
  element: HTMLElement,
  variables: CSSVariables
): void {
  Object.keys(variables).forEach((key) => {
    element.style.removeProperty(key)
  })
}

/**
 * Generate a scoped class name for a component
 */
export function getScopedClassName(componentId: string): string {
  return `component-preview-${componentId}`
}

/**
 * Generate inline style object from CSS variables
 */
export function cssVariablesToInlineStyle(
  variables: CSSVariables
): React.CSSProperties {
  const style: Record<string, string> = {}
  Object.entries(variables).forEach(([key, value]) => {
    style[key] = value
  })
  return style as React.CSSProperties
}

/**
 * Merge CSS variables with defaults
 */
export function mergeCSSVariables(
  base: CSSVariables,
  overrides: CSSVariables
): CSSVariables {
  return { ...base, ...overrides }
}

/**
 * Extract only the modified CSS variables (different from defaults)
 */
export function getModifiedCSSVariables(
  variables: CSSVariables,
  defaults: CSSVariables = DEFAULT_CSS_VARIABLES
): CSSVariables {
  const modified: CSSVariables = {}
  
  Object.entries(variables).forEach(([key, value]) => {
    if (defaults[key] !== value) {
      modified[key] = value
    }
  })
  
  return modified
}

/**
 * Validate CSS variable value
 */
export function isValidCSSValue(value: string): boolean {
  // Basic validation - checks if value is not empty and doesn't contain dangerous characters
  if (!value || value.trim() === '') return false
  
  // Prevent script injection
  if (value.includes('<script') || value.includes('javascript:')) return false
  
  return true
}

/**
 * Format CSS variable name (ensure it starts with --)
 */
export function formatCSSVariableName(name: string): string {
  if (name.startsWith('--')) return name
  return `--${name}`
}

/**
 * CSS variable categories for organization
 */
export const CSS_VARIABLE_CATEGORIES = {
  colors: {
    label: 'Colors',
    variables: [
      '--background',
      '--foreground',
      '--card',
      '--card-foreground',
      '--popover',
      '--popover-foreground',
      '--primary',
      '--primary-foreground',
      '--secondary',
      '--secondary-foreground',
      '--muted',
      '--muted-foreground',
      '--accent',
      '--accent-foreground',
      '--destructive',
      '--border',
      '--input',
      '--ring',
    ],
  },
  radius: {
    label: 'Border Radius',
    variables: ['--radius'],
  },
} as const

