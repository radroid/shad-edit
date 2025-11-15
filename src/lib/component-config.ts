/**
 * Component Configuration System
 * Defines the schema and utilities for component configuration files
 */

import type { PropertyDefinition } from './property-extractor'

/**
 * Tailwind property definition for editable properties
 */
export type TailwindProperty = {
  name: string
  type: 'color' | 'spacing' | 'size' | 'radius' | 'custom'
  tailwindPrefix: string // e.g., 'text-', 'bg-', 'p-'
  cssProperty: string // e.g., 'color', 'backgroundColor', 'padding'
  defaultValue: string
  variants?: string[] // Tailwind values: ['sm', 'md', 'lg']
}

/**
 * Component variant configuration
 */
export type ComponentVariant = {
  name: string // 'default', 'outline', 'ghost'
  displayName: string
  properties: Record<string, any> // Property overrides for this variant
}

/**
 * Component metadata for marketplace display
 */
export type ComponentMetadata = {
  name: string
  description: string
  category?: string
  tags?: string[]
  author?: string
  version?: string
  previewImage?: string
}

/**
 * Variable mapping - maps hardcoded values to property variables
 * Used to replace hardcoded styles/content with editable properties
 */
export type VariableMapping = {
  /**
   * The property name that will control this variable
   */
  propertyName: string
  
  /**
   * The type of replacement
   * - 'style': CSS property (e.g., backgroundColor, color)
   * - 'attribute': HTML/React attribute (e.g., placeholder, href)
   * - 'content': Text content inside elements
   * - 'className': CSS class name
   */
  type: 'style' | 'attribute' | 'content' | 'className'
  
  /**
   * The target selector - which element(s) to apply this to
   * - Element ID: '#element-id'
   * - Element type: 'button', 'input', etc.
   * - CSS selector: '.my-class', '#my-id'
   * - 'root': The root component element
   */
  target: string
  
  /**
   * The property path to replace
   * - For style: 'backgroundColor', 'color', 'fontSize'
   * - For attribute: 'placeholder', 'href', 'type'
   * - For content: 'text' (will replace children)
   * - For className: 'className' or specific class name
   */
  path: string
  
  /**
   * Default value if property is not set
   */
  defaultValue?: any
}

/**
 * Tailwind element configuration for fine-grained class management
 */
export type TailwindElementConfig = {
  /**
   * Which Tailwind class groups this element can edit
   * e.g., ['bg', 'text', 'p', 'rounded']
   */
  editableGroups: string[]
  
  /**
   * Base classes that should never be removed
   * e.g., ['flex', 'items-center', 'justify-between']
   */
  preserveClasses?: string[]
  
  /**
   * Class groups that should be replaced (not merged)
   * When a new class in this group is added, old ones are removed
   * e.g., ['bg', 'text'] - only one background/text color at a time
   */
  replaceGroups?: string[]
  
  /**
   * Class groups that should be merged intelligently
   * Multiple classes in these groups can coexist
   * e.g., ['rounded', 'border'] - can have rounded-md and border-2
   */
  mergeGroups?: string[]
}

/**
 * Strategy for applying property changes to elements
 */
export type ApplyStrategy = 'className' | 'style' | 'attribute' | 'cssVariable'

/**
 * Editable element definition - explicitly defines which elements can be edited
 */
export type EditableElement = {
  /**
   * Unique identifier for this element
   * e.g., "button-0", "card-header-1"
   */
  id: string
  
  /**
   * How to find this element in the code
   * - Element tag: "button", "div"
   * - Element ID: "#myId"
   * - CSS class: ".myClass"
   * - Component name: "Button", "Card"
   * - Occurrence index: "button-0" (0th button in code)
   */
  selector: string
  
  /**
   * Element tag name (for display and validation)
   */
  tag?: string
  
  /**
   * Display name for the property panel
   * e.g., "Primary Button", "Card Header"
   */
  name: string
  
  /**
   * Explicit property definitions for this element
   */
  properties: PropertyDefinition[]
  
  /**
   * How to apply changes to this element
   */
  applyStrategy: ApplyStrategy
  
  /**
   * Tailwind class management configuration
   */
  tailwindConfig?: TailwindElementConfig
}

/**
 * Component configuration schema
 */
export type ComponentConfig = {
  /**
   * Component metadata for marketplace display
   */
  metadata: ComponentMetadata
  
  /**
   * The component code template
   * Use placeholders like {{propertyName}} for variable substitution
   * Example: style={{ backgroundColor: '{{backgroundColor}}' }}
   */
  code: string
  
  /**
   * Explicit editable element definitions
   * When provided, this takes precedence over auto-discovery
   */
  editableElements?: EditableElement[]
  
  /**
   * Property definitions for the property editor
   * @deprecated Use editableElements[].properties instead
   * Kept for backward compatibility
   */
  properties: PropertyDefinition[]
  
  /**
   * Global properties that apply to the whole component
   * (e.g., layout properties like width, height)
   */
  globalProperties?: PropertyDefinition[]
  
  /**
   * Variable mappings - how to replace hardcoded values with properties
   * This is used to transform the code template based on property values
   */
  variableMappings?: VariableMapping[]
  
  /**
   * Component variants (e.g., 'default', 'outline', 'ghost')
   */
  variants?: ComponentVariant[]
  
  /**
   * Dependencies required for this component
   * Maps import paths to actual module paths
   */
  dependencies?: Record<string, string>
  
  /**
   * Files that need to be included (e.g., styles, utilities)
   */
  files?: Array<{
    path: string
    content: string
  }>
}


/**
 * @deprecated Use Convex queries directly
 * Component configs are now stored in Convex database
 */
export async function getAllComponentIds(): Promise<string[]> {
  console.warn('getAllComponentIds is deprecated. Use Convex queries instead.')
  return []
}

/**
 * Apply property values to component code using variable mappings
 */
export function applyPropertiesToCode(
  code: string,
  properties: Record<string, any>,
  mappings?: VariableMapping[]
): string {
  let result = code
  
  if (!mappings || !Array.isArray(mappings)) {
    // Fallback: simple template replacement
    Object.entries(properties).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      result = result.replace(new RegExp(placeholder, 'g'), String(value))
    })
    return result
  }
  
  // Apply variable mappings
  mappings.forEach((mapping) => {
    const value = properties[mapping.propertyName] ?? mapping.defaultValue
    if (value === undefined) return
    
    // Replace placeholders in code
    const placeholder = `{{${mapping.propertyName}}}`
    result = result.replace(new RegExp(placeholder, 'g'), String(value))
  })
  
  return result
}

/**
 * Extract variable placeholders from code template
 */
export function extractPlaceholders(code: string): string[] {
  const regex = /\{\{(\w+)\}\}/g
  const matches = code.matchAll(regex)
  const placeholders = new Set<string>()
  
  for (const match of matches) {
    placeholders.add(match[1])
  }
  
  return Array.from(placeholders)
}

