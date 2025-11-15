/**
 * Component Config Validation Utilities
 * Validates component configurations to ensure they are correct and complete
 */

import type { ComponentConfig, EditableElement } from './component-config'
import parser from '@babel/parser'
import traverse from '@babel/traverse'
import type * as t from '@babel/types'

/**
 * Validation result
 */
export type ValidationResult = {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Check if an element can be found in the code using its selector
 */
function canFindElement(code: string, selector: string): boolean {
  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })
    
    let found = false
    const parts = selector.split('-')
    const tag = parts[0]
    const index = parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : 0
    
    if (isNaN(index)) {
      // Try to find by exact selector match
      traverse(ast, {
        JSXElement(path) {
          const openingElement = path.node.openingElement
          const elementTag = getTagName(openingElement)
          
          if (elementTag && elementTag.toLowerCase() === selector.toLowerCase()) {
            found = true
            path.stop()
          }
        },
      })
      return found
    }
    
    // Find by tag and occurrence index
    let currentIndex = 0
    traverse(ast, {
      JSXElement(path) {
        const openingElement = path.node.openingElement
        const elementTag = getTagName(openingElement)
        
        if (elementTag && elementTag.toLowerCase() === tag.toLowerCase()) {
          if (currentIndex === index) {
            found = true
            path.stop()
          }
          currentIndex++
        }
      },
    })
    
    return found
  } catch {
    return false
  }
}

/**
 * Get tag name from JSX element
 */
function getTagName(node: t.JSXOpeningElement): string | undefined {
  const name = node.name
  
  if (name.type === 'JSXIdentifier') {
    return name.name
  }
  
  if (name.type === 'JSXMemberExpression') {
    return name.property.name
  }
  
  return undefined
}

/**
 * Validate component configuration
 */
export function validateComponentConfig(
  config: ComponentConfig
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validate metadata
  if (!config.metadata.name) {
    errors.push('Component metadata must have a name')
  }
  
  // Validate code exists
  if (!config.code || config.code.trim().length === 0) {
    errors.push('Component code is required')
  }
  
  // Validate editable elements if provided
  if (config.editableElements) {
    // Check for duplicate element IDs
    const elementIds = config.editableElements.map((el) => el.id)
    const duplicateIds = elementIds.filter(
      (id, index) => elementIds.indexOf(id) !== index
    )
    
    if (duplicateIds.length > 0) {
      errors.push(
        `Duplicate element IDs found: ${duplicateIds.join(', ')}`
      )
    }
    
    // Validate each element
    for (const element of config.editableElements) {
      // Validate element ID
      if (!element.id || element.id.trim().length === 0) {
        errors.push('All editable elements must have an ID')
      }
      
      // Validate selector
      if (!element.selector || element.selector.trim().length === 0) {
        errors.push(`Element ${element.id} must have a selector`)
      }
      
      // Validate name
      if (!element.name || element.name.trim().length === 0) {
        errors.push(`Element ${element.id} must have a name`)
      }
      
      // Validate properties
      if (!element.properties || element.properties.length === 0) {
        warnings.push(
          `Element ${element.id} has no properties defined`
        )
      }
      
      // Check for duplicate property names within element
      const propertyNames = element.properties.map((p) => p.name)
      const duplicateProps = propertyNames.filter(
        (name, index) => propertyNames.indexOf(name) !== index
      )
      
      if (duplicateProps.length > 0) {
        errors.push(
          `Element ${element.id} has duplicate property names: ${duplicateProps.join(', ')}`
        )
      }
      
      // Validate selector can find element in code
      if (config.code) {
        const canFind = canFindElement(config.code, element.selector)
        if (!canFind) {
          warnings.push(
            `Element ${element.id} with selector "${element.selector}" may not be found in code`
          )
        }
      }
      
      // Validate Tailwind config if provided
      if (element.tailwindConfig) {
        if (
          !element.tailwindConfig.editableGroups ||
          element.tailwindConfig.editableGroups.length === 0
        ) {
          warnings.push(
            `Element ${element.id} has empty editableGroups in tailwindConfig`
          )
        }
      }
    }
  }
  
  // Validate properties (backward compatibility)
  if (config.properties && config.properties.length > 0) {
    // Check for duplicate property names
    const propertyNames = config.properties.map((p) => p.name)
    const duplicateProps = propertyNames.filter(
      (name, index) => propertyNames.indexOf(name) !== index
    )
    
    if (duplicateProps.length > 0) {
      warnings.push(
        `Duplicate property names in legacy properties: ${duplicateProps.join(', ')}`
      )
    }
  }
  
  // Validate code is parseable
  if (config.code) {
    try {
      parser.parse(config.code, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      })
    } catch (error) {
      errors.push(`Code is not valid JSX/TSX: ${error instanceof Error ? error.message : 'Parse error'}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate editable element
 */
export function validateEditableElement(
  element: EditableElement,
  code?: string
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!element.id) {
    errors.push('Element must have an ID')
  }
  
  if (!element.selector) {
    errors.push('Element must have a selector')
  }
  
  if (!element.name) {
    errors.push('Element must have a name')
  }
  
  if (!element.properties || element.properties.length === 0) {
    warnings.push('Element has no properties')
  }
  
  if (code && element.selector) {
    const canFind = canFindElement(code, element.selector)
    if (!canFind) {
      warnings.push(`Element with selector "${element.selector}" may not be found in code`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

