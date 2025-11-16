/**
 * AST-Based Component Config Generator
 * Uses Babel AST parsing to extract editable elements and properties from component code
 */

import * as parser from '@babel/parser'
// @ts-ignore - @babel/traverse has complex export structure
import traverse from '@babel/traverse'
import type * as t from '@babel/types'
import type { NodePath } from '@babel/traverse'
import type {
  ComponentConfig,
  ComponentPropSection,
  ComponentPropOption,
  EditableElement,
  ComponentVariant,
  TailwindElementConfig,
} from './component-config'
import type { PropertyDefinition } from './property-extractor'
import {
  analyzeTailwindClasses,
  splitClassString,
  toClassGroup,
  type TailwindClassMetadata,
} from './tailwind-utils'

/**
 * Options for config generation
 */
export type ConfigGenerationOptions = {
  /**
   * Component name for generating element IDs
   */
  componentName?: string
  
  /**
   * Whether to include common style properties by default
   */
  includeCommonStyles?: boolean
  
  /**
   * Custom property definitions to add to elements
   */
  customProperties?: Record<string, PropertyDefinition[]>
}

/**
 * Extract Tailwind classes from a className string or expression
 */
function extractTailwindClasses(
  classNameValue: string | t.Expression | t.PrivateName | null | undefined
): string[] {
  if (!classNameValue) return []
  
  if (typeof classNameValue === 'string') {
    return classNameValue.split(/\s+/).filter(Boolean)
  }
  
  // Handle template literals
  if (
    classNameValue.type === 'TemplateLiteral' &&
    classNameValue.quasis.length > 0
  ) {
    return classNameValue.quasis
      .map((q) => q.value.raw)
      .join('')
      .split(/\s+/)
      .filter(Boolean)
  }
  
  // Handle string literals
  if (classNameValue.type === 'StringLiteral') {
    return classNameValue.value.split(/\s+/).filter(Boolean)
  }
  
  // Handle binary expressions (e.g., className + " " + otherClass)
  if (classNameValue.type === 'BinaryExpression' && classNameValue.operator === '+') {
    const left = extractTailwindClasses(classNameValue.left)
    const right = extractTailwindClasses(classNameValue.right)
    return [...left, ...right]
  }
  
  return []
}

/**
 * Infer Tailwind config from classes
 */
function inferTailwindConfig(classes: string[]): TailwindElementConfig {
  const editableGroups = new Set<string>()
  const replaceGroups = new Set<string>()
  const mergeGroups = new Set<string>()
  
  for (const className of classes) {
    const group = toClassGroup(className)
    if (group) {
      editableGroups.add(group)
      
      // Background and text colors should replace, not merge
      if (group === 'bg' || group === 'text') {
        replaceGroups.add(group)
      } else {
        // Spacing, borders, etc. can merge
        mergeGroups.add(group)
      }
    }
  }
  
  return {
    editableGroups: Array.from(editableGroups),
    replaceGroups: Array.from(replaceGroups),
    mergeGroups: Array.from(mergeGroups),
  }
}

/**
 * Generate properties from Tailwind classes
 */
function generatePropertiesFromClasses(
  classes: string[],
  includeCommonStyles: boolean = true
): PropertyDefinition[] {
  const properties: PropertyDefinition[] = []
  const seen = new Set<string>()
  const classMetadata = analyzeTailwindClasses(classes)
  const metadataByGroup = new Map<string, TailwindClassMetadata>()
  classMetadata.forEach((meta) => {
    if (meta.group && !metadataByGroup.has(meta.group)) {
      metadataByGroup.set(meta.group, meta)
    }
  })
  
  // Extract properties from classes
  for (const className of classes) {
    // Background color
    if (className.startsWith('bg-') && !seen.has('backgroundColor')) {
      seen.add('backgroundColor')
      const value = className.replace('bg-', '')
      properties.push({
        name: 'backgroundColor',
        label: 'Background Color',
        type: 'color',
        defaultValue: `bg-${value}`,
        apply: 'class',
        classGroup: 'bg',
        classPrefix: 'bg-',
        category: 'Colors',
        classMetadata: metadataByGroup.get('bg'),
      })
    }
    
    // Text color
    if (className.startsWith('text-') && !className.match(/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/) && !seen.has('color')) {
      seen.add('color')
      const value = className.replace('text-', '')
      properties.push({
        name: 'color',
        label: 'Text Color',
        type: 'color',
        defaultValue: `text-${value}`,
        apply: 'class',
        classGroup: 'text',
        classPrefix: 'text-',
        category: 'Colors',
        classMetadata: metadataByGroup.get('text'),
      })
    }
    
    // Padding
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
          label: propName === 'padding' ? 'Padding' :
                 propName === 'paddingTop' ? 'Padding Top' :
                 propName === 'paddingBottom' ? 'Padding Bottom' :
                 propName === 'paddingLeft' ? 'Padding Left' :
                 propName === 'paddingRight' ? 'Padding Right' :
                 propName === 'paddingX' ? 'Padding X' :
                 'Padding Y',
          type: 'string',
          defaultValue: className,
          apply: 'class',
          classGroup: className.match(/^p[tblrxy]?-/)?.[0]?.replace('-', '') || 'p',
          classPrefix: className.match(/^p[tblrxy]?-/)?.[0] || 'p-',
          category: 'Spacing',
          classMetadata: metadataByGroup.get(
            className.match(/^p[tblrxy]?-/)?.[0]?.replace('-', '') || 'p'
          ),
        })
      }
    }
    
    // Margin
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
          label: propName === 'margin' ? 'Margin' :
                 propName === 'marginTop' ? 'Margin Top' :
                 propName === 'marginBottom' ? 'Margin Bottom' :
                 propName === 'marginLeft' ? 'Margin Left' :
                 propName === 'marginRight' ? 'Margin Right' :
                 propName === 'marginX' ? 'Margin X' :
                 'Margin Y',
          type: 'string',
          defaultValue: className,
          apply: 'class',
          classGroup: className.match(/^m[tblrxy]?-/)?.[0]?.replace('-', '') || 'm',
          classPrefix: className.match(/^m[tblrxy]?-/)?.[0] || 'm-',
          category: 'Spacing',
          classMetadata: metadataByGroup.get(
            className.match(/^m[tblrxy]?-/)?.[0]?.replace('-', '') || 'm'
          ),
        })
      }
    }
    
    // Border radius
    if (className.startsWith('rounded') && !seen.has('borderRadius')) {
      seen.add('borderRadius')
      const value = className.replace('rounded', '') || 'default'
      properties.push({
        name: 'borderRadius',
        label: 'Border Radius',
        type: 'string',
        defaultValue: className,
        apply: 'class',
        classGroup: 'rounded',
        classPrefix: 'rounded',
        category: 'Border',
        classMetadata: metadataByGroup.get('rounded'),
      })
    }
    
    // Font size
    const fontSizeMatch = className.match(/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/)
    if (fontSizeMatch && !seen.has('fontSize')) {
      seen.add('fontSize')
      properties.push({
        name: 'fontSize',
        label: 'Font Size',
        type: 'select',
        defaultValue: className,
        apply: 'class',
        classGroup: 'text',
        classPrefix: 'text-',
        category: 'Typography',
        options: [
          { label: 'Extra Small', value: 'text-xs' },
          { label: 'Small', value: 'text-sm' },
          { label: 'Base', value: 'text-base' },
          { label: 'Large', value: 'text-lg' },
          { label: 'XL', value: 'text-xl' },
          { label: '2XL', value: 'text-2xl' },
          { label: '3XL', value: 'text-3xl' },
          { label: '4XL', value: 'text-4xl' },
        ],
        classMetadata: metadataByGroup.get('text'),
      })
    }
    
    // Font weight
    if (className.match(/^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/) && !seen.has('fontWeight')) {
      seen.add('fontWeight')
      const value = className.replace('font-', '')
      properties.push({
        name: 'fontWeight',
        label: 'Font Weight',
        type: 'select',
        defaultValue: className,
        apply: 'class',
        classGroup: 'font',
        classPrefix: 'font-',
        category: 'Typography',
        options: [
          { label: 'Thin', value: 'font-thin' },
          { label: 'Extra Light', value: 'font-extralight' },
          { label: 'Light', value: 'font-light' },
          { label: 'Normal', value: 'font-normal' },
          { label: 'Medium', value: 'font-medium' },
          { label: 'Semibold', value: 'font-semibold' },
          { label: 'Bold', value: 'font-bold' },
          { label: 'Extra Bold', value: 'font-extrabold' },
          { label: 'Black', value: 'font-black' },
        ],
        classMetadata: metadataByGroup.get('font'),
      })
    }
  }
  
  // Add common style properties if requested
  if (includeCommonStyles) {
    // Only add if not already present
    if (!seen.has('backgroundColor')) {
      properties.push({
        name: 'backgroundColor',
        label: 'Background Color',
        type: 'color',
        defaultValue: 'bg-white',
        apply: 'class',
        classGroup: 'bg',
        classPrefix: 'bg-',
        category: 'Colors',
        classMetadata: metadataByGroup.get('bg'),
      })
    }
    
    if (!seen.has('color')) {
      properties.push({
        name: 'color',
        label: 'Text Color',
        type: 'color',
        defaultValue: 'text-slate-900',
        apply: 'class',
        classGroup: 'text',
        classPrefix: 'text-',
        category: 'Colors',
        classMetadata: metadataByGroup.get('text'),
      })
    }
  }
  
  return properties
}

type CvaPropDefinition = {
  name: string
  options: Array<{
    value: string
    classes: string[]
  }>
}

function toTitleCase(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Infer selector from JSX element
 */
function inferSelector(
  node: t.JSXElement | t.JSXOpeningElement,
  occurrenceIndex: number
): string {
  const openingElement = 'openingElement' in node ? node.openingElement : node
  const name = openingElement.name
  
  // Handle JSXIdentifier (e.g., <div>)
  if (name.type === 'JSXIdentifier') {
    return `${name.name}-${occurrenceIndex}`
  }
  
  // Handle JSXMemberExpression (e.g., <Button.Primary>)
  if (name.type === 'JSXMemberExpression') {
    const object = name.object.type === 'JSXIdentifier' ? name.object.name : ''
    const property = name.property.name
    return `${object}.${property}-${occurrenceIndex}`
  }
  
  return `element-${occurrenceIndex}`
}

/**
 * Get element tag name
 */
function getTagName(node: t.JSXElement | t.JSXOpeningElement): string | undefined {
  const openingElement = 'openingElement' in node ? node.openingElement : node
  const name = openingElement.name
  
  if (name.type === 'JSXIdentifier') {
    return name.name
  }
  
  if (name.type === 'JSXMemberExpression') {
    const property = name.property.name
    return property
  }
  
  return undefined
}

/**
 * Get element display name
 */
function getElementDisplayName(
  tag: string | undefined,
  occurrenceIndex: number,
  componentName?: string
): string {
  if (!tag) return `Element ${occurrenceIndex + 1}`
  
  // Capitalize first letter
  const capitalized = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()
  
  if (occurrenceIndex === 0) {
    return capitalized
  }
  
  return `${capitalized} ${occurrenceIndex + 1}`
}

/**
 * Generate component config from code using AST parsing
 */
export function generateConfigFromCode(
  code: string,
  metadata: ComponentConfig['metadata'],
  options: ConfigGenerationOptions = {}
): ComponentConfig {
  const {
    componentName = metadata.name,
    includeCommonStyles = true,
    customProperties = {},
  } = options
  
  // Parse code to AST
  let ast: t.File
  try {
    ast = parser.parse(code, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread',
      ],
    })
  } catch (error) {
    console.error('Failed to parse code:', error)
    // Return minimal config on parse error
    return {
      metadata,
      code,
      properties: [],
      editableElements: [],
      globalProperties: [],
    }
  }
  
  const editableElements: EditableElement[] = []
  const elementCounts = new Map<string, number>()
  const cvaPropDefinitions: CvaPropDefinition[] = []
  
  // Traverse AST to find JSX elements
  // Handle both ESM and CJS exports
  const traverseFn = (traverse as any).default || traverse
  traverseFn(ast, {
    CallExpression(path: NodePath<t.CallExpression>) {
      const node = path.node
      if (
        node.callee &&
        node.callee.type === 'Identifier' &&
        node.callee.name === 'cva'
      ) {
        const parsed = parseCvaCall(node)
        if (parsed.length > 0) {
          cvaPropDefinitions.push(...parsed)
        }
      }
    },
    JSXElement(path: NodePath<t.JSXElement>) {
      const node = path.node
      const openingElement = node.openingElement
      const tag = getTagName(openingElement)
      
      if (!tag) return
      
      // Skip fragments
      if (tag === 'Fragment' || tag === 'React.Fragment') return
      
      // Count occurrences
      const count = elementCounts.get(tag) || 0
      elementCounts.set(tag, count + 1)
      
      // Find className attribute
      let classNameValue: string | t.Expression | null = null
      for (const attr of openingElement.attributes) {
        if (
          attr.type === 'JSXAttribute' &&
          attr.name.name === 'className'
        ) {
          if (attr.value) {
            if (attr.value.type === 'StringLiteral') {
              classNameValue = attr.value.value
            } else if (attr.value.type === 'JSXExpressionContainer' && attr.value.expression.type !== 'JSXEmptyExpression') {
              classNameValue = attr.value.expression
            }
          }
        }
      }
      
      // Extract classes
      const classes = extractTailwindClasses(classNameValue)
      
      // Generate element ID
      const elementId = `${tag.toLowerCase()}-${count}`
      
      // Generate properties
      const baseProperties = generatePropertiesFromClasses(classes, includeCommonStyles)
      const customProps = customProperties[elementId] || []
      const properties = [...baseProperties, ...customProps]
      
      // Infer Tailwind config
      const tailwindConfig = classes.length > 0 ? inferTailwindConfig(classes) : undefined
      
      // Determine apply strategy (default to className)
      let applyStrategy: EditableElement['applyStrategy'] = 'className'
      
      // Check if it's a shadcn component (capitalized)
      if (tag[0] === tag[0].toUpperCase() && tag !== 'Fragment') {
        // For shadcn components, might use attributes for variants
        applyStrategy = 'className'
      }
      
      // Map component tag to proper type identifier
      // This ensures components are correctly identified for preview rendering
      const tagLower = tag.toLowerCase()
      let mappedTag = tagLower
      
      // Map common component names to their type identifiers
      const componentTagMap: Record<string, string> = {
        'button': 'button',
        'input': 'input',
        'card': 'card',
        'dialog': 'dialog',
        'navigationmenu': 'navigation-menu',
        'navigation-menu': 'navigation-menu',
        'badge': 'badge',
        'label': 'label',
      }
      
      // Check direct match
      if (tagLower in componentTagMap) {
        mappedTag = componentTagMap[tagLower]
      } else {
        // Try camelCase to kebab-case conversion (e.g., NavigationMenu -> navigation-menu)
        const kebabCase = tag.replace(/([A-Z])/g, '-$1').toLowerCase()
        if (kebabCase in componentTagMap) {
          mappedTag = componentTagMap[kebabCase]
        } else if (tag[0] === tag[0].toUpperCase()) {
          // It's a component name, try to infer from common patterns
          // Check if it contains known component keywords
          const tagLowerForMatch = tagLower
          if (tagLowerForMatch.includes('button') || tagLowerForMatch === 'btn') {
            mappedTag = 'button'
          } else if (tagLowerForMatch.includes('input') || tagLowerForMatch === 'inp') {
            mappedTag = 'input'
          } else if (tagLowerForMatch.includes('card')) {
            mappedTag = 'card'
          } else if (tagLowerForMatch.includes('dialog') || tagLowerForMatch === 'modal') {
            mappedTag = 'dialog'
          } else if (tagLowerForMatch.includes('badge')) {
            mappedTag = 'badge'
          } else if (tagLowerForMatch.includes('label')) {
            mappedTag = 'label'
          }
        }
      }
      
      // Create editable element
      editableElements.push({
        id: elementId,
        selector: `${tag}-${count}`,
        tag: mappedTag, // Use mapped tag for proper type identification
        name: getElementDisplayName(tag, count, componentName),
        properties,
        applyStrategy,
        tailwindConfig,
      })
    },
  })
  
  // Extract global properties (from root element if it exists)
  const globalProperties: PropertyDefinition[] = []
  
  // If no elements found, create a root element
  if (editableElements.length === 0) {
    editableElements.push({
      id: 'root',
      selector: 'root',
      tag: 'div',
      name: componentName || 'Root',
      properties: includeCommonStyles
        ? generatePropertiesFromClasses([], true)
        : [],
      applyStrategy: 'className',
      tailwindConfig: {
        editableGroups: ['bg', 'text', 'p', 'm', 'rounded'],
        replaceGroups: ['bg', 'text'],
        mergeGroups: ['p', 'm', 'rounded'],
      },
    })
  }
  
  const propSections = buildPropSections(editableElements, cvaPropDefinitions)
  const componentVariants = buildComponentVariants(editableElements, cvaPropDefinitions)
  
  return {
    metadata,
    code,
    editableElements,
    properties: [], // Deprecated, but kept for backward compatibility
    globalProperties,
    propSections,
    variants: componentVariants,
  }
}

/**
 * Generate config from existing ComponentConfig (migration helper)
 */
export function generateConfigFromExisting(
  existing: ComponentConfig,
  options: ConfigGenerationOptions = {}
): ComponentConfig {
  return generateConfigFromCode(existing.code, existing.metadata, {
    ...options,
    componentName: existing.metadata.name,
  })
}

function parseCvaCall(node: t.CallExpression): CvaPropDefinition[] {
  if (node.arguments.length < 2) return []
  const optionsArg = node.arguments[1]
  if (!optionsArg || optionsArg.type !== 'ObjectExpression') return []

  const variantsProp = optionsArg.properties.find(
    (prop): prop is t.ObjectProperty =>
      prop.type === 'ObjectProperty' &&
      ((prop.key.type === 'Identifier' && prop.key.name === 'variants') ||
        (prop.key.type === 'StringLiteral' && prop.key.value === 'variants'))
  )

  if (!variantsProp) return []
  if (variantsProp.value.type !== 'ObjectExpression') return []

  const propDefs: CvaPropDefinition[] = []

  variantsProp.value.properties.forEach((prop) => {
    if (prop.type !== 'ObjectProperty') return
    const key =
      prop.key.type === 'Identifier'
        ? prop.key.name
        : prop.key.type === 'StringLiteral'
          ? prop.key.value
          : undefined
    if (!key) return

    if (prop.value.type !== 'ObjectExpression') return
    const options: CvaPropDefinition['options'] = []
    prop.value.properties.forEach((optProp) => {
      if (optProp.type !== 'ObjectProperty') return
      const optionKey =
        optProp.key.type === 'Identifier'
          ? optProp.key.name
          : optProp.key.type === 'StringLiteral'
            ? optProp.key.value
            : undefined
      if (!optionKey) return

      const classes = extractTailwindClassesFromNode(optProp.value)
      if (classes.length > 0) {
        options.push({
          value: optionKey,
          classes,
        })
      }
    })

    if (options.length > 0) {
      propDefs.push({
        name: key,
        options,
      })
    }
  })

  return propDefs
}

function extractTailwindClassesFromNode(
  node: t.Node
): string[] {
  if (node.type === 'StringLiteral') {
    return splitClassString(node.value)
  }
  if (node.type === 'TemplateLiteral') {
    const combined = node.quasis.map((q) => q.value.raw).join('')
    return splitClassString(combined)
  }
  if (node.type === 'ArrayExpression') {
    return node.elements.flatMap((el) => (el ? extractTailwindClassesFromNode(el) : []))
  }
  if (node.type === 'BinaryExpression' && node.operator === '+') {
    return [
      ...extractTailwindClassesFromNode(node.left),
      ...extractTailwindClassesFromNode(node.right),
    ]
  }
  return []
}

function buildPropSections(
  editableElements: EditableElement[],
  cvaProps: CvaPropDefinition[]
): ComponentPropSection[] {
  const sections: ComponentPropSection[] = []

  editableElements.forEach((element) => {
    const fields = element.properties.map((prop) => ({
      id: `${element.id}.${prop.name}`,
      label: prop.label,
      description: prop.description,
      elementId: element.id,
      propertyName: prop.name,
      propertyPath: `${element.id}.${prop.name}`,
      classGroup: prop.classGroup,
      defaultValue: prop.defaultValue,
      usesCssVariable:
        typeof prop.defaultValue === 'string' && prop.defaultValue.includes('var(') ||
        Boolean(prop.classMetadata?.usesCssVariable),
      cssVariables: prop.classMetadata?.cssVariables,
      dataAttributes: prop.classMetadata?.dataAttributes,
      isAnimation: prop.classMetadata?.isAnimation,
    }))

    if (fields.length > 0) {
      sections.push({
        id: `section-${element.id}`,
        propName: element.name,
        label: element.name,
        description: `Editable styles for ${element.name}`,
        propType: 'custom',
        elements: [element.id],
        fields,
      })
    }
  })

  cvaProps.forEach((prop) => {
    const options: ComponentPropOption[] = prop.options.map((option) => ({
      value: option.value,
      label: toTitleCase(option.value),
      classes: analyzeTailwindClasses(option.classes),
    }))

    sections.push({
      id: `cva-${prop.name}`,
      propName: prop.name,
      label: toTitleCase(prop.name),
      description: `Prop discovered from class-variance definition`,
      propType:
        prop.name === 'variant'
          ? 'variant'
          : prop.name === 'size'
            ? 'size'
            : 'custom',
      elements: editableElements.map((el) => el.id),
      fields: [],
      options,
    })
  })

  return sections
}

function buildComponentVariants(
  editableElements: EditableElement[],
  cvaProps: CvaPropDefinition[]
): ComponentVariant[] {
  const variantProp = cvaProps.find((prop) => prop.name === 'variant')
  if (!variantProp || editableElements.length === 0) {
    return []
  }

  const targetElement = editableElements[0]
  const groupToProperty = new Map<string, PropertyDefinition>()
  targetElement.properties.forEach((prop) => {
    if (prop.classGroup) {
      groupToProperty.set(prop.classGroup, prop)
    }
  })

  return variantProp.options.map((option) => {
    const metadata = analyzeTailwindClasses(option.classes)
    const overrides: Record<string, any> = {}

    metadata.forEach((meta) => {
      if (!meta.group) return
      const property = groupToProperty.get(meta.group)
      if (property) {
        overrides[`${targetElement.id}.${property.name}`] = meta.className
      }
    })

    return {
      name: option.value,
      displayName: toTitleCase(option.value),
      properties: overrides,
      classMetadata: metadata,
    }
  })
}

