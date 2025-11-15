/**
 * Property Extractor - Analyzes React component code and extracts editable properties
 */

import type { ComponentConfig } from './component-config'
import {
  applyAttributeUpdate,
  applyContentUpdate,
  applyTailwindClassUpdate,
} from './tailwind-modifier'

export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'color'
  | 'select'
  | 'slider'
  | 'textarea'

export type PropertyDefinition = {
  name: string
  label: string
  type: PropertyType
  defaultValue?: any
  options?: { label: string; value: any }[]
  min?: number
  max?: number
  step?: number
  description?: string
  category?: string
  /**
   * How the property should be applied during code transformation.
   * - 'class' replaces Tailwind utility classes
   * - 'content' updates inner text/content
   * - 'attribute' writes to a JSX attribute
   */
  apply?: 'class' | 'content' | 'attribute'
  /**
   * Tailwind utility group to replace (e.g., 'bg', 'text', 'p').
   */
  classGroup?: string
  /**
   * Optional class prefix used when constructing Tailwind utilities (e.g., 'bg-', 'text-').
   */
  classPrefix?: string
  /**
   * Attribute name when `apply` equals 'attribute'.
   */
  attributeName?: string
}

export type ComponentElement = {
  id: string
  tag?: string
  type: string
  name: string
  properties: PropertyDefinition[]
  children?: ComponentElement[]
}

export type ComponentStructure = {
  name: string
  elements: ComponentElement[]
  globalProperties: PropertyDefinition[]
}

/**
 * Extract properties from component config
 * This is the preferred method - uses the component's configuration
 * Now supports the enhanced schema with editableElements
 */
export function extractPropertiesFromConfig(
  config: ComponentConfig
): ComponentStructure {
  // If editableElements are provided, use them (new schema-based approach)
  if (config.editableElements && config.editableElements.length > 0) {
    // Infer component type from metadata name as fallback
    const componentNameLower = (config.metadata.name || '').toLowerCase()
    let inferredComponentType: string | undefined
    
    if (componentNameLower.includes('button') || componentNameLower === 'button') {
      inferredComponentType = 'button'
    } else if (componentNameLower.includes('input')) {
      inferredComponentType = 'input'
    } else if (componentNameLower.includes('card')) {
      inferredComponentType = 'card'
    } else if (componentNameLower.includes('dialog')) {
      inferredComponentType = 'dialog'
    } else if (componentNameLower.includes('badge')) {
      inferredComponentType = 'badge'
    } else if (componentNameLower.includes('label')) {
      inferredComponentType = 'label'
    } else if (componentNameLower.includes('navigation')) {
      inferredComponentType = 'navigation-menu'
    }
    
    const elements: ComponentElement[] = config.editableElements.map((el) => {
      // Map component names to supported types
      // The tag should already be mapped by AST generator, but we'll do a final check here
      const tagLower = (el.tag || '').toLowerCase()
      let mappedType = el.tag || el.id
      
      // Map common component names to their type identifiers
      const componentTypeMap: Record<string, string> = {
        'button': 'button',
        'input': 'input',
        'card': 'card',
        'dialog': 'dialog',
        'navigationmenu': 'navigation-menu',
        'navigation-menu': 'navigation-menu',
        'badge': 'badge',
        'label': 'label',
        // Handle shortened names
        'comp': 'button', // Common abbreviation - assume button
        'btn': 'button',
        'inp': 'input',
      }
      
      // Check if tag matches a known component type
      if (tagLower in componentTypeMap) {
        mappedType = componentTypeMap[tagLower]
      } else if (el.tag && el.tag[0] === el.tag[0].toUpperCase()) {
        // It's a component name (capitalized), try to map it
        const normalized = el.tag.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase()
        if (normalized in componentTypeMap) {
          mappedType = componentTypeMap[normalized]
        } else {
          // Try to infer from name patterns
          const nameLower = (el.name || '').toLowerCase()
          if (nameLower.includes('button') || nameLower === 'button') {
            mappedType = 'button'
          } else if (nameLower.includes('input')) {
            mappedType = 'input'
          } else if (nameLower.includes('card')) {
            mappedType = 'card'
          } else if (nameLower.includes('dialog')) {
            mappedType = 'dialog'
          } else if (nameLower.includes('badge')) {
            mappedType = 'badge'
          } else if (nameLower.includes('label')) {
            mappedType = 'label'
          } else if (inferredComponentType && (tagLower === 'comp' || nameLower === 'comp' || nameLower.includes('comp'))) {
            // If we can't determine from element, use inferred type from component name
            mappedType = inferredComponentType
          }
        }
      } else if (tagLower === 'comp' && inferredComponentType) {
        // "comp" tag with inferred type from component name
        mappedType = inferredComponentType
      }
      
      return {
        id: el.id,
        tag: el.tag,
        type: mappedType,
        name: el.name,
        properties: el.properties,
      }
    })
    
    return {
      name: config.metadata.name,
      elements,
      globalProperties: config.globalProperties || [],
    }
  }
  
  // Fallback to legacy approach: extract from code
  const elements = extractElementsFromCode(config.code)
  
  // Infer component type from metadata name for legacy components
  const componentNameLower = (config.metadata.name || '').toLowerCase()
  let inferredComponentType: string | undefined
  
  if (componentNameLower.includes('button') || componentNameLower === 'button') {
    inferredComponentType = 'button'
  } else if (componentNameLower.includes('input')) {
    inferredComponentType = 'input'
  } else if (componentNameLower.includes('card')) {
    inferredComponentType = 'card'
  } else if (componentNameLower.includes('dialog')) {
    inferredComponentType = 'dialog'
  } else if (componentNameLower.includes('badge')) {
    inferredComponentType = 'badge'
  } else if (componentNameLower.includes('label')) {
    inferredComponentType = 'label'
  } else if (componentNameLower.includes('navigation')) {
    inferredComponentType = 'navigation-menu'
  }
  
  // Map element types using inferred type
  const mappedElements = elements.map((el) => {
    const typeLower = (el.type || '').toLowerCase()
    
    // If type is "comp" or similar ambiguous name, use inferred type
    if ((typeLower === 'comp' || typeLower.includes('comp')) && inferredComponentType) {
      return {
        ...el,
        type: inferredComponentType,
      }
    }
    
    // Map common types
    const typeMap: Record<string, string> = {
      'button': 'button',
      'input': 'input',
      'card': 'card',
      'dialog': 'dialog',
      'navigation-menu': 'navigation-menu',
      'navigationmenu': 'navigation-menu',
      'badge': 'badge',
      'label': 'label',
      'comp': inferredComponentType || 'button', // Default to button if no inference
      'btn': 'button',
    }
    
    if (typeLower in typeMap) {
      return {
        ...el,
        type: typeMap[typeLower],
      }
    }
    
    return el
  })
  
  // If no elements found from code parsing, create a root element from config properties
  // This handles cases where the component is a function component without JSX elements in the template
  if (mappedElements.length === 0 && config.properties.length > 0) {
    // Create a root element with all non-layout properties
    const rootProperties = config.properties.filter(
      (prop) => !prop.category || prop.category !== 'Layout'
    )
    
    if (rootProperties.length > 0) {
      mappedElements.push({
        id: 'root',
        tag: inferredComponentType || 'div',
        type: inferredComponentType || config.metadata.name.toLowerCase().replace(/\s+/g, '-'),
        name: config.metadata.name,
        properties: rootProperties,
      })
    }
  }
  
  return {
    name: config.metadata.name,
    elements: mappedElements,
    globalProperties: config.globalProperties || config.properties.filter(
      (prop) => !prop.category || prop.category === 'Layout'
    ),
  }
}

/**
 * Extract properties from component code (legacy method)
 * This is a simplified property extraction
 * In a real implementation, you'd use a proper AST parser like @babel/parser
 */
export function extractPropertiesFromCode(
  code: string,
  componentName: string = 'Component',
  config?: ComponentConfig
): ComponentStructure {
  // If config is provided, use it
  if (config) {
    return extractPropertiesFromConfig(config)
  }

  const globalProperties: PropertyDefinition[] = []
  const elements: ComponentElement[] = extractElementsFromCode(code)

  // If no elements found, add some default ones
  if (elements.length === 0) {
    elements.push({
      id: 'root-container',
      type: 'div',
      name: 'Root Container',
      properties: getCommonStyleProps(),
    })
  }

  // Add global component properties
  globalProperties.push({
    name: 'width',
    label: 'Component Width',
    type: 'string',
    defaultValue: '100%',
    category: 'Layout',
  })
  globalProperties.push({
    name: 'height',
    label: 'Component Height',
    type: 'string',
    defaultValue: 'auto',
    category: 'Layout',
  })
  globalProperties.push({
    name: 'maxWidth',
    label: 'Max Width',
    type: 'string',
    defaultValue: 'none',
    category: 'Layout',
  })

  return {
    name: componentName,
    elements,
    globalProperties,
  }
}

/**
 * Extract elements from code (helper function)
 */
function extractElementsFromCode(code: string): ComponentElement[] {
  return detectElementTypes(code)
}

/**
 * Get common style properties (shared helper)
 */
function getCommonStyleProps(): PropertyDefinition[] {
  return [
    {
      name: 'padding',
      label: 'Padding',
      type: 'string',
      defaultValue: 'p-0',
      category: 'Spacing',
      description: 'Inner spacing of the element',
      apply: 'class',
      classGroup: 'p',
      classPrefix: 'p-',
    },
    {
      name: 'margin',
      label: 'Margin',
      type: 'string',
      defaultValue: 'm-0',
      category: 'Spacing',
      description: 'Outer spacing of the element',
      apply: 'class',
      classGroup: 'm',
      classPrefix: 'm-',
    },
    {
      name: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: 'bg-white',
      category: 'Colors',
      apply: 'class',
      classGroup: 'bg',
      classPrefix: 'bg-',
    },
    {
      name: 'color',
      label: 'Text Color',
      type: 'color',
      defaultValue: 'text-slate-900',
      category: 'Colors',
      apply: 'class',
      classGroup: 'text',
      classPrefix: 'text-',
    },
    {
      name: 'fontSize',
      label: 'Font Size',
      type: 'select',
      defaultValue: 'text-base',
      category: 'Typography',
      apply: 'class',
      classGroup: 'text',
      classPrefix: 'text-',
      options: [
        { label: 'Small', value: 'text-sm' },
        { label: 'Medium', value: 'text-base' },
        { label: 'Large', value: 'text-lg' },
        { label: 'X-Large', value: 'text-xl' },
      ],
    },
    {
      name: 'fontWeight',
      label: 'Font Weight',
      type: 'select',
      defaultValue: 'font-normal',
      category: 'Typography',
      apply: 'class',
      classGroup: 'font',
      classPrefix: 'font-',
      options: [
        { label: 'Normal', value: 'font-normal' },
        { label: 'Medium', value: 'font-medium' },
        { label: 'Semibold', value: 'font-semibold' },
        { label: 'Bold', value: 'font-bold' },
      ],
    },
    {
      name: 'borderRadius',
      label: 'Border Radius',
      type: 'string',
      defaultValue: 'rounded-none',
      category: 'Border',
      apply: 'class',
      classGroup: 'rounded',
      classPrefix: 'rounded',
    },
    {
      name: 'borderWidth',
      label: 'Border Width',
      type: 'string',
      defaultValue: 'border-0',
      category: 'Border',
      apply: 'class',
      classGroup: 'border',
      classPrefix: 'border-',
    },
    {
      name: 'borderColor',
      label: 'Border Color',
      type: 'color',
      defaultValue: 'border-transparent',
      category: 'Border',
      apply: 'class',
      classGroup: 'border',
      classPrefix: 'border-',
    },
  ]
}

/**
 * Detect element types from code (including shadcn components)
 */
function detectElementTypes(code: string): ComponentElement[] {
  const elements: ComponentElement[] = []
  const commonStyleProps = getCommonStyleProps()

  // Detect element types from code (including shadcn components)
  const elementTypes = [
    { tag: 'Button', name: 'Button', isShadcn: true },
    { tag: 'button', name: 'Button' },
    { tag: 'Input', name: 'Input', isShadcn: true },
    { tag: 'input', name: 'Input' },
    { tag: 'Card', name: 'Card', isShadcn: true },
    { tag: 'Dialog', name: 'Dialog', isShadcn: true },
    { tag: 'Badge', name: 'Badge', isShadcn: true },
    { tag: 'Label', name: 'Label', isShadcn: true },
    { tag: 'NavigationMenu', name: 'Navigation Menu', isShadcn: true },
    { tag: 'div', name: 'Container' },
    { tag: 'h1', name: 'Heading 1' },
    { tag: 'h2', name: 'Heading 2' },
    { tag: 'h3', name: 'Heading 3' },
    { tag: 'p', name: 'Paragraph' },
    { tag: 'span', name: 'Span' },
    { tag: 'a', name: 'Link' },
    { tag: 'img', name: 'Image' },
  ]

  elementTypes.forEach((element, index) => {
    const regex = new RegExp(`<${element.tag}[^>]*>`, 'g')
    const matches = code.match(regex)

    if (matches) {
      matches.forEach((match, matchIndex) => {
        const elementProps = element.isShadcn ? [] : [...commonStyleProps]

        // Add element-specific properties
        const tagLower = element.tag.toLowerCase()
        if (tagLower === 'button' || element.tag === 'Button') {
          elementProps.push({
            name: 'text',
            label: 'Text',
            type: 'string',
            defaultValue: 'Click me',
            category: 'Content',
            apply: 'content',
          })
          elementProps.push({
            name: 'variant',
            label: 'Variant',
            type: 'select',
            defaultValue: 'default',
            category: 'Appearance',
            apply: element.tag === 'Button' ? 'attribute' : 'class',
            attributeName: element.tag === 'Button' ? 'variant' : undefined,
            classGroup: element.tag === 'Button' ? undefined : 'bg',
            options: [
              { label: 'Default', value: 'default' },
              { label: 'Secondary', value: 'secondary' },
              { label: 'Outline', value: 'outline' },
              { label: 'Ghost', value: 'ghost' },
              { label: 'Destructive', value: 'destructive' },
              { label: 'Link', value: 'link' },
            ],
          })
          elementProps.push({
            name: 'size',
            label: 'Size',
            type: 'select',
            defaultValue: 'default',
            category: 'Appearance',
            apply: element.tag === 'Button' ? 'attribute' : 'class',
            attributeName: element.tag === 'Button' ? 'size' : undefined,
            options: [
              { label: 'Default', value: 'default' },
              { label: 'Small', value: 'sm' },
              { label: 'Large', value: 'lg' },
              { label: 'Icon', value: 'icon' },
            ],
          })
        } else if (tagLower === 'input') {
          elementProps.push({
            name: 'placeholder',
            label: 'Placeholder',
            type: 'string',
            defaultValue: '',
            category: 'Content',
            apply: 'attribute',
            attributeName: 'placeholder',
          })
          elementProps.push({
            name: 'type',
            label: 'Type',
            type: 'select',
            defaultValue: 'text',
            category: 'Behavior',
            apply: 'attribute',
            attributeName: 'type',
            options: [
              { label: 'Text', value: 'text' },
              { label: 'Email', value: 'email' },
              { label: 'Password', value: 'password' },
              { label: 'Number', value: 'number' },
              { label: 'Date', value: 'date' },
            ],
          })
        } else if (tagLower === 'card') {
          elementProps.push({
            name: 'title',
            label: 'Title',
            type: 'string',
            defaultValue: 'Card Title',
            category: 'Content',
            apply: 'content',
          })
          elementProps.push({
            name: 'description',
            label: 'Description',
            type: 'string',
            defaultValue: 'Card description',
            category: 'Content',
            apply: 'content',
          })
          elementProps.push({
            name: 'content',
            label: 'Content',
            type: 'textarea',
            defaultValue: 'Card content goes here',
            category: 'Content',
            apply: 'content',
          })
        } else if (tagLower === 'badge') {
          elementProps.push({
            name: 'text',
            label: 'Text',
            type: 'string',
            defaultValue: 'Badge',
            category: 'Content',
            apply: 'content',
          })
          elementProps.push({
            name: 'variant',
            label: 'Variant',
            type: 'select',
            defaultValue: 'default',
            category: 'Appearance',
            apply: 'attribute',
            attributeName: 'variant',
            options: [
              { label: 'Default', value: 'default' },
              { label: 'Secondary', value: 'secondary' },
              { label: 'Destructive', value: 'destructive' },
              { label: 'Outline', value: 'outline' },
            ],
          })
        } else if (tagLower === 'dialog') {
          elementProps.push({
            name: 'title',
            label: 'Title',
            type: 'string',
            defaultValue: 'Dialog Title',
            category: 'Content',
            apply: 'content',
          })
          elementProps.push({
            name: 'description',
            label: 'Description',
            type: 'string',
            defaultValue: 'Dialog description',
            category: 'Content',
            apply: 'content',
          })
          elementProps.push({
            name: 'triggerText',
            label: 'Button Text',
            type: 'string',
            defaultValue: 'Open Dialog',
            category: 'Content',
            apply: 'content',
          })
        } else if (tagLower === 'navigationmenu') {
          elementProps.push({
            name: 'triggerText',
            label: 'Trigger Text',
            type: 'string',
            defaultValue: 'Open Menu',
            category: 'Content',
            apply: 'content',
          })
          elementProps.push({
            name: 'items',
            label: 'Menu Items (comma-separated)',
            type: 'textarea',
            defaultValue: 'Item 1, Item 2, Item 3',
            category: 'Content',
            apply: 'content',
          })
          elementProps.push({
            name: 'orientation',
            label: 'Orientation',
            type: 'select',
            defaultValue: 'horizontal',
            category: 'Appearance',
            apply: 'attribute',
            attributeName: 'orientation',
            options: [
              { label: 'Horizontal', value: 'horizontal' },
              { label: 'Vertical', value: 'vertical' },
            ],
          })
        } else if (tagLower === 'label') {
          elementProps.push({
            name: 'text',
            label: 'Text',
            type: 'string',
            defaultValue: 'Label',
            category: 'Content',
            apply: 'content',
          })
        } else if (element.tag === 'img') {
          elementProps.push({
            name: 'src',
            label: 'Source URL',
            type: 'string',
            defaultValue: '',
            category: 'Content',
            apply: 'attribute',
            attributeName: 'src',
          })
          elementProps.push({
            name: 'alt',
            label: 'Alt Text',
            type: 'string',
            defaultValue: '',
            category: 'Content',
            apply: 'attribute',
            attributeName: 'alt',
          })
        } else if (['h1', 'h2', 'h3', 'p', 'span'].includes(element.tag)) {
          elementProps.push({
            name: 'text',
            label: 'Text Content',
            type: 'textarea',
            defaultValue: 'Sample text',
            category: 'Content',
            apply: 'content',
          })
        } else if (element.tag === 'a') {
          elementProps.push({
            name: 'href',
            label: 'Link URL',
            type: 'string',
            defaultValue: '#',
            category: 'Content',
            apply: 'attribute',
            attributeName: 'href',
          })
          elementProps.push({
            name: 'text',
            label: 'Link Text',
            type: 'string',
            defaultValue: 'Link',
            category: 'Content',
            apply: 'content',
          })
        }

        elements.push({
          id: `${element.tag.toLowerCase()}-${index}-${matchIndex}`,
          tag: element.tag,
          type: element.tag.toLowerCase(),
          name: `${element.name} ${matchIndex + 1}`,
          properties: elementProps,
        })
      })
    }
  })

  return elements
}

/**
 * Get default values for all properties in a component
 */
export function getDefaultPropertyValues(
  structure: ComponentStructure
): Record<string, any> {
  const values: Record<string, any> = {}

  // Global properties
  structure.globalProperties.forEach((prop) => {
    values[prop.name] = prop.defaultValue
  })

  // Element properties
  structure.elements.forEach((element) => {
    element.properties.forEach((prop) => {
      values[`${element.id}.${prop.name}`] = prop.defaultValue
    })
  })

  return values
}

/**
 * Apply property changes to component code
 * Now supports schema-based configs with explicit element definitions
 */
export function applyPropertyChanges(
  code: string,
  element: ComponentElement,
  property: PropertyDefinition,
  value: any,
  config?: ComponentConfig
): string {
  try {
    const tag = element.tag || element.type
    if (!tag) return code

    // If config has editableElements, use the element's applyStrategy
    let applyStrategy = property.apply || 'class'
    let tailwindConfig: any = undefined
    
    if (config?.editableElements) {
      const editableElement = config.editableElements.find((el) => el.id === element.id)
      if (editableElement) {
        // Map applyStrategy from editableElement
        switch (editableElement.applyStrategy) {
          case 'className':
            applyStrategy = 'class'
            break
          case 'style':
            applyStrategy = 'class' // For now, style uses class replacement
            break
          case 'attribute':
            applyStrategy = 'attribute'
            break
          case 'cssVariable':
            // CSS variables not yet implemented in tailwind-modifier
            applyStrategy = 'class'
            break
        }
        tailwindConfig = editableElement.tailwindConfig
      }
    }

    switch (applyStrategy) {
      case 'content':
        return replaceElementContent(code, tag, element.id, value)
      case 'attribute':
        return replaceElementAttribute(
          code,
          tag,
          element.id,
          property.attributeName || property.name,
          value
        )
      case 'class':
      default:
        return replaceElementClass(
          code,
          tag,
          element.id,
          typeof value === 'string' ? value : '',
          property,
          tailwindConfig
        )
    }
  } catch (error) {
    console.warn('Failed to apply property change', { element, property, value, error })
    return code
  }
}

/**
 * Get property categories
 */
export function getPropertyCategories(
  properties: PropertyDefinition[]
): string[] {
  const categories = new Set<string>()
  properties.forEach((prop) => {
    if (prop.category) {
      categories.add(prop.category)
    }
  })
  return Array.from(categories).sort()
}

function replaceElementClass(
  code: string,
  tag: string,
  elementId: string,
  value: string,
  property: PropertyDefinition,
  tailwindConfig?: any
): string {
  // Use classGroup from tailwindConfig if available, otherwise from property
  const classGroup = tailwindConfig?.editableGroups?.includes(property.classGroup || '')
    ? property.classGroup
    : property.classGroup
  
  const updated = applyTailwindClassUpdate({
    code,
    tag,
    elementId,
    nextClass: value,
    classGroup,
    classPrefix: property.classPrefix,
  })
  return updated ?? code
}

function replaceElementAttribute(
  code: string,
  tag: string,
  elementId: string,
  attribute: string,
  value: any
): string {
  const updated = applyAttributeUpdate({
    code,
    tag,
    elementId,
    attribute,
    value,
  })
  return updated ?? code
}

function replaceElementContent(
  code: string,
  tag: string,
  elementId: string,
  value: any
): string {
  const updated = applyContentUpdate({
    code,
    tag,
    elementId,
    value,
  })
  return updated ?? code
}

