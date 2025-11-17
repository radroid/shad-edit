/**
 * Utility functions for scoping CSS variables to specific components
 */

export type CSSVariables = Record<string, string>

/**
 * Default shadcn/ui CSS variables
 */
export const DEFAULT_CSS_VARIABLES: CSSVariables = {
  // Base colors
  '--background': 'hsl(223.8136 -172.5242% 100.0000%)',
  '--foreground': 'hsl(223.8136 0.0000% 3.9388%)',
  '--card': 'hsl(223.8136 -172.5242% 100.0000%)',
  '--card-foreground': 'hsl(223.8136 0.0000% 3.9388%)',
  '--popover': 'hsl(223.8136 -172.5242% 100.0000%)',
  '--popover-foreground': 'hsl(223.8136 0.0000% 3.9388%)',
  '--primary': 'hsl(223.8136 0.0000% 9.0527%)',
  '--primary-foreground': 'hsl(223.8136 0.0004% 98.0256%)',
  '--secondary': 'hsl(223.8136 0.0002% 96.0587%)',
  '--secondary-foreground': 'hsl(223.8136 0.0000% 9.0527%)',
  '--muted': 'hsl(223.8136 0.0002% 96.0587%)',
  '--muted-foreground': 'hsl(223.8136 0.0000% 45.1519%)',
  '--accent': 'hsl(223.8136 0.0002% 96.0587%)',
  '--accent-foreground': 'hsl(223.8136 0.0000% 9.0527%)',
  '--destructive': 'hsl(351.7303 123.6748% 40.5257%)',
  '--destructive-foreground': 'hsl(223.8136 -172.5242% 100.0000%)',
  '--border': 'hsl(223.8136 0.0001% 89.8161%)',
  '--input': 'hsl(223.8136 0.0001% 89.8161%)',
  '--ring': 'hsl(223.8136 0.0000% 63.0163%)',
  
  // Chart colors
  '--chart-1': 'hsl(211.7880 101.9718% 78.6759%)',
  '--chart-2': 'hsl(217.4076 91.3672% 59.5787%)',
  '--chart-3': 'hsl(221.4336 86.3731% 54.0624%)',
  '--chart-4': 'hsl(223.6587 78.7180% 47.8635%)',
  '--chart-5': 'hsl(226.5426 70.0108% 39.9224%)',
  
  // Sidebar colors
  '--sidebar': 'hsl(223.8136 0.0004% 98.0256%)',
  '--sidebar-foreground': 'hsl(223.8136 0.0000% 3.9388%)',
  '--sidebar-primary': 'hsl(223.8136 0.0000% 9.0527%)',
  '--sidebar-primary-foreground': 'hsl(223.8136 0.0004% 98.0256%)',
  '--sidebar-accent': 'hsl(223.8136 0.0002% 96.0587%)',
  '--sidebar-accent-foreground': 'hsl(223.8136 0.0000% 9.0527%)',
  '--sidebar-border': 'hsl(223.8136 0.0001% 89.8161%)',
  '--sidebar-ring': 'hsl(223.8136 0.0000% 63.0163%)',
  
  // Fonts
  '--font-sans': 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, \'Noto Sans\', sans-serif, \'Apple Color Emoji\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Noto Color Emoji\'',
  '--font-serif': 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  '--font-mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  
  // Border radius
  '--radius': '0.625rem',
  
  // Shadow properties
  '--shadow-x': '0',
  '--shadow-y': '1px',
  '--shadow-blur': '3px',
  '--shadow-spread': '0px',
  '--shadow-opacity': '0.1',
  '--shadow-color': 'oklch(0 0 0)',
  
  // Shadow presets
  '--shadow-2xs': '0 1px 3px 0px hsl(0 0% 0% / 0.05)',
  '--shadow-xs': '0 1px 3px 0px hsl(0 0% 0% / 0.05)',
  '--shadow-sm': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)',
  '--shadow': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 1px 2px -1px hsl(0 0% 0% / 0.10)',
  '--shadow-md': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 2px 4px -1px hsl(0 0% 0% / 0.10)',
  '--shadow-lg': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 4px 6px -1px hsl(0 0% 0% / 0.10)',
  '--shadow-xl': '0 1px 3px 0px hsl(0 0% 0% / 0.10), 0 8px 10px -1px hsl(0 0% 0% / 0.10)',
  '--shadow-2xl': '0 1px 3px 0px hsl(0 0% 0% / 0.25)',
  
  // Typography
  '--tracking-normal': '0em',
  
  // Spacing
  '--spacing': '0.25rem',
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
      '--destructive-foreground',
      '--border',
      '--input',
      '--ring',
    ],
  },
  charts: {
    label: 'Chart Colors',
    variables: [
      '--chart-1',
      '--chart-2',
      '--chart-3',
      '--chart-4',
      '--chart-5',
    ],
  },
  sidebar: {
    label: 'Sidebar',
    variables: [
      '--sidebar',
      '--sidebar-foreground',
      '--sidebar-primary',
      '--sidebar-primary-foreground',
      '--sidebar-accent',
      '--sidebar-accent-foreground',
      '--sidebar-border',
      '--sidebar-ring',
    ],
  },
  typography: {
    label: 'Typography',
    variables: [
      '--font-sans',
      '--font-serif',
      '--font-mono',
      '--tracking-normal',
    ],
  },
  radius: {
    label: 'Border Radius',
    variables: ['--radius'],
  },
  shadows: {
    label: 'Shadows',
    variables: [
      '--shadow-x',
      '--shadow-y',
      '--shadow-blur',
      '--shadow-spread',
      '--shadow-opacity',
      '--shadow-color',
      '--shadow-2xs',
      '--shadow-xs',
      '--shadow-sm',
      '--shadow',
      '--shadow-md',
      '--shadow-lg',
      '--shadow-xl',
      '--shadow-2xl',
    ],
  },
  spacing: {
    label: 'Spacing',
    variables: ['--spacing'],
  },
} as const

