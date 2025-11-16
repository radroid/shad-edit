"use node"

import { action } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'
import { generateConfigFromCode } from '../src/lib/ast-config-generator'
import type { ComponentConfig } from '../src/lib/component-config'

type ValidationResult = { valid: boolean; error?: string }

const MIN_CODE_LENGTH = 80
const MAX_CODE_LENGTH = 60_000

function validateCodeSnippet(code: string): ValidationResult {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Component code is required.' }
  }

  const trimmed = code.trim()
  if (trimmed.length < MIN_CODE_LENGTH) {
        return {
          valid: false,
      error: 'Please paste the full component code (at least a few lines).',
      }
    }

  if (trimmed.length > MAX_CODE_LENGTH) {
      return {
        valid: false,
      error: 'Component code is too large. Please trim unused sections before importing.',
      }
    }

  if (!trimmed.includes('<') || !trimmed.includes('>')) {
    return {
      valid: false,
      error: 'The pasted code does not appear to contain JSX.',
    }
  }

  if (!/return\s*\(/.test(trimmed) && !/=>\s*\(/.test(trimmed)) {
    return {
      valid: false,
      error: 'Unable to find a React component in the pasted code.',
    }
  }

  return { valid: true }
}

function inferComponentName(code: string): string | null {
  const exportFnMatch = code.match(/export\s+(?:default\s+)?function\s+([A-Z][A-Za-z0-9_]*)/)
  if (exportFnMatch?.[1]) {
    return exportFnMatch[1]
  }

  const exportConstMatch = code.match(/export\s+(?:default\s+)?const\s+([A-Z][A-Za-z0-9_]*)\s*=/)
  if (exportConstMatch?.[1]) {
    return exportConstMatch[1]
  }

  const functionMatch = code.match(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/)
  if (functionMatch?.[1]) {
    return functionMatch[1]
  }

  return null
}

function generateComponentIdFromName(name?: string): string {
  const base =
    name
      ?.toLowerCase()
      ?.replace(/[^a-z0-9]+/g, '-')
      ?.replace(/^-+|-+$/g, '') || ''

  if (base) {
    return base.slice(0, 60)
    }

  return `component-${Date.now()}`
}

function sanitizeMetadataValue(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export const importComponentFromCode = action({
  args: {
    code: v.string(),
    metadata: v.optional(
      v.object({
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        category: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        sourceUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (
    ctx,
    { code, metadata }
  ): Promise<{
    componentId: string
    componentConfig: ComponentConfig
    isNew: boolean
    configId: string
  }> => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Not authenticated')
    }

    const validation = validateCodeSnippet(code)
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid component code.')
    }

    const trimmedCode = code.trim()

    const derivedName =
      sanitizeMetadataValue(metadata?.name) ||
      inferComponentName(trimmedCode) ||
      'Custom Component'
    
    const componentId = generateComponentIdFromName(derivedName)

    const metadataPayload = {
      name: derivedName,
      description:
        sanitizeMetadataValue(metadata?.description) ||
        'User-imported shadcn component',
      category: sanitizeMetadataValue(metadata?.category),
      tags: metadata?.tags?.filter(Boolean) ?? [],
      author: identity.email || identity.name || 'Unknown',
      version: '1.0.0',
    }

    let componentConfig: ComponentConfig
    try {
      componentConfig = generateConfigFromCode(trimmedCode, metadataPayload, {
        includeCommonStyles: true,
      })
    } catch (error: any) {
      throw new Error(
        `Failed to analyze component code: ${error?.message || 'Unknown error'}`
      )
    }

    const configId = await ctx.runMutation(
      internal.importComponentMutations.saveImportedComponent,
      {
        componentId,
        componentConfig,
        sourceUrl: sanitizeMetadataValue(metadata?.sourceUrl),
      }
    )

    return {
      componentId,
      componentConfig,
      isNew: true,
      configId,
    }
  },
})
