/**
 * Migration Script: Generate AST-based configs for existing components
 * 
 * This script:
 * 1. Loads all existing components from Convex
 * 2. Generates editableElements using AST parsing
 * 3. Updates components with the new schema
 * 
 * Usage:
 *   pnpm generate-ast-configs
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../convex/_generated/api'
import { generateConfigFromCode } from '../src/lib/ast-config-generator'
import { validateComponentConfig } from '../src/lib/config-validator'

// Load environment variables from .env.local, .env, etc.
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL

if (!CONVEX_URL) {
  console.error('Error: VITE_CONVEX_URL or CONVEX_URL environment variable is required')
  process.exit(1)
}

async function main() {
  // CONVEX_URL is guaranteed to be defined here due to the check above
  const client = new ConvexHttpClient(CONVEX_URL!)
  
  console.log('🔍 Loading existing components...')
  
  // Get all catalog components
  const components = await client.query(api.catalogComponents.listCatalogComponents, {})
  
  if (components.length === 0) {
    console.log('No components found. Nothing to migrate.')
    return
  }
  
  console.log(`📦 Found ${components.length} components to migrate\n`)
  
  let successCount = 0
  let errorCount = 0
  let skippedCount = 0
  
  for (const component of components) {
    try {
      console.log(`\n🔄 Processing: ${component.name} (${component.componentId})`)
      
      // Check if already has editableElements
      if (component.editableElements && component.editableElements.length > 0) {
        console.log('  ⏭️  Already has editableElements, skipping...')
        skippedCount++
        continue
      }
      
      // Generate config from code
      const generatedConfig = generateConfigFromCode(
        component.code,
        {
          name: component.name,
          description: component.description || '',
          category: component.category,
          tags: component.tags,
          author: component.author,
          version: component.version,
        },
        {
          componentName: component.name,
          includeCommonStyles: true,
        }
      )
      
      // Validate the generated config
      const validation = validateComponentConfig(generatedConfig)
      
      if (!validation.valid) {
        console.error(`  ❌ Validation failed:`)
        validation.errors.forEach((error) => console.error(`     - ${error}`))
        errorCount++
        continue
      }
      
      if (validation.warnings.length > 0) {
        console.log(`  ⚠️  Warnings:`)
        validation.warnings.forEach((warning) => console.log(`     - ${warning}`))
      }
      
      // Update component in Convex
      // Note: This requires authentication via CONVEX_AUTH_TOKEN environment variable
      console.log(`  ✅ Generated config with ${generatedConfig.editableElements?.length || 0} editable elements`)
      console.log(`     Elements: ${generatedConfig.editableElements?.map(el => el.name).join(', ') || 'none'}`)
      
      // Uncomment to actually update components (requires CONVEX_AUTH_TOKEN)
      try {
        await client.mutation(api.catalogComponents.updateCatalogComponent, {
          componentId: component.componentId,
          editableElements: generatedConfig.editableElements,
          globalProperties: generatedConfig.globalProperties,
        })
        console.log(`  💾 Updated in Convex`)
      } catch (error: any) {
        if (error.message?.includes('authentication') || error.message?.includes('auth')) {
          console.log(`  ⚠️  Skipping update (authentication required). Set CONVEX_AUTH_TOKEN to enable updates.`)
        } else {
          throw error
        }
      }
      
      successCount++
    } catch (error) {
      console.error(`  ❌ Error processing ${component.name}:`, error)
      errorCount++
    }
  }
  
  console.log(`\n\n📊 Migration Summary:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ⏭️  Skipped: ${skippedCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
  
  if (successCount > 0) {
    console.log(`\n💡 To update components in Convex, set the CONVEX_AUTH_TOKEN environment variable:`)
    console.log(`   export CONVEX_AUTH_TOKEN="your-auth-token"`)
    console.log(`   Then run this script again.`)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

