/**
 * Property Extractor - Analyzes React component code and extracts editable properties
 */

import type { ComponentConfig } from './component-config'

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
}

export type ComponentElement = {
  id: string
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
 */
export function extractPropertiesFromConfig(
  config: ComponentConfig
): ComponentStructure {
  const elements = extractElementsFromCode(config.code)
  
  // If no elements found from code parsing, create a root element from config properties
  // This handles cases where the component is a function component without JSX elements in the template
  if (elements.length === 0 && config.properties.length > 0) {
    // Create a root element with all non-layout properties
    const rootProperties = config.properties.filter(
      (prop) => !prop.category || prop.category !== 'Layout'
    )
    
    if (rootProperties.length > 0) {
      elements.push({
        id: 'root',
        type: config.metadata.name.toLowerCase().replace(/\s+/g, '-'),
        name: config.metadata.name,
        properties: rootProperties,
      })
    }
  }
  
  return {
    name: config.metadata.name,
    elements,
    globalProperties: config.properties.filter(
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
      defaultValue: '0',
      category: 'Spacing',
      description: 'Inner spacing of the element',
    },
    {
      name: 'margin',
      label: 'Margin',
      type: 'string',
      defaultValue: '0',
      category: 'Spacing',
      description: 'Outer spacing of the element',
    },
    {
      name: 'backgroundColor',
      label: 'Background Color',
      type: 'color',
      defaultValue: '#ffffff',
      category: 'Colors',
    },
    {
      name: 'color',
      label: 'Text Color',
      type: 'color',
      defaultValue: '#000000',
      category: 'Colors',
    },
    {
      name: 'fontSize',
      label: 'Font Size',
      type: 'select',
      defaultValue: '14px',
      category: 'Typography',
      options: [
        { label: 'Small', value: '12px' },
        { label: 'Medium', value: '14px' },
        { label: 'Large', value: '16px' },
        { label: 'X-Large', value: '18px' },
      ],
    },
    {
      name: 'fontWeight',
      label: 'Font Weight',
      type: 'select',
      defaultValue: 'normal',
      category: 'Typography',
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'Medium', value: '500' },
        { label: 'Semibold', value: '600' },
        { label: 'Bold', value: 'bold' },
      ],
    },
    {
      name: 'borderRadius',
      label: 'Border Radius',
      type: 'string',
      defaultValue: '0',
      category: 'Border',
    },
    {
      name: 'borderWidth',
      label: 'Border Width',
      type: 'string',
      defaultValue: '0',
      category: 'Border',
    },
    {
      name: 'borderColor',
      label: 'Border Color',
      type: 'color',
      defaultValue: '#000000',
      category: 'Border',
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
        if (tagLower === 'button') {
          elementProps.push({
            name: 'text',
            label: 'Text',
            type: 'string',
            defaultValue: 'Click me',
            category: 'Content',
          })
          elementProps.push({
            name: 'variant',
            label: 'Variant',
            type: 'select',
            defaultValue: 'default',
            category: 'Appearance',
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
          })
          elementProps.push({
            name: 'type',
            label: 'Type',
            type: 'select',
            defaultValue: 'text',
            category: 'Behavior',
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
          })
          elementProps.push({
            name: 'description',
            label: 'Description',
            type: 'string',
            defaultValue: 'Card description',
            category: 'Content',
          })
          elementProps.push({
            name: 'content',
            label: 'Content',
            type: 'textarea',
            defaultValue: 'Card content goes here',
            category: 'Content',
          })
        } else if (tagLower === 'badge') {
          elementProps.push({
            name: 'text',
            label: 'Text',
            type: 'string',
            defaultValue: 'Badge',
            category: 'Content',
          })
          elementProps.push({
            name: 'variant',
            label: 'Variant',
            type: 'select',
            defaultValue: 'default',
            category: 'Appearance',
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
          })
          elementProps.push({
            name: 'description',
            label: 'Description',
            type: 'string',
            defaultValue: 'Dialog description',
            category: 'Content',
          })
          elementProps.push({
            name: 'triggerText',
            label: 'Button Text',
            type: 'string',
            defaultValue: 'Open Dialog',
            category: 'Content',
          })
        } else if (tagLower === 'navigationmenu') {
          elementProps.push({
            name: 'triggerText',
            label: 'Trigger Text',
            type: 'string',
            defaultValue: 'Open Menu',
            category: 'Content',
          })
          elementProps.push({
            name: 'items',
            label: 'Menu Items (comma-separated)',
            type: 'textarea',
            defaultValue: 'Item 1, Item 2, Item 3',
            category: 'Content',
          })
          elementProps.push({
            name: 'orientation',
            label: 'Orientation',
            type: 'select',
            defaultValue: 'horizontal',
            category: 'Appearance',
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
          })
        } else if (element.tag === 'img') {
          elementProps.push({
            name: 'src',
            label: 'Source URL',
            type: 'string',
            defaultValue: '',
            category: 'Content',
          })
          elementProps.push({
            name: 'alt',
            label: 'Alt Text',
            type: 'string',
            defaultValue: '',
            category: 'Content',
          })
        } else if (['h1', 'h2', 'h3', 'p', 'span'].includes(element.tag)) {
          elementProps.push({
            name: 'text',
            label: 'Text Content',
            type: 'textarea',
            defaultValue: 'Sample text',
            category: 'Content',
          })
        } else if (element.tag === 'a') {
          elementProps.push({
            name: 'href',
            label: 'Link URL',
            type: 'string',
            defaultValue: '#',
            category: 'Content',
          })
          elementProps.push({
            name: 'text',
            label: 'Link Text',
            type: 'string',
            defaultValue: 'Link',
            category: 'Content',
          })
        }

        elements.push({
          id: `${element.tag.toLowerCase()}-${index}-${matchIndex}`,
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
 */
export function applyPropertyChanges(
  code: string,
  elementId: string,
  propertyName: string,
  value: any
): string {
  // This is a simplified implementation
  // In a real implementation, you'd use a proper AST transformation

  // For now, just return the original code
  // This would need to be implemented properly with AST manipulation
  return code
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

