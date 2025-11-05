/**
 * Script to seed component configs from JSON files to Convex
 * 
 * Usage:
 *   npx tsx scripts/seed-component-configs.ts
 * 
 * Or run from the Convex dashboard:
 *   Call seedComponentConfigs with the configs array
 */

import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import type { ComponentConfig } from '../src/lib/component-config'

const CATALOG_DIR = join(process.cwd(), 'src/components/catalog')

async function loadAllConfigs(): Promise<Array<{ componentId: string; config: ComponentConfig }>> {
  const configs: Array<{ componentId: string; config: ComponentConfig }> = []
  
  try {
    const entries = await readdir(CATALOG_DIR, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const configPath = join(CATALOG_DIR, entry.name, 'config.json')
        try {
          const content = await readFile(configPath, 'utf-8')
          const config = JSON.parse(content) as ComponentConfig
          configs.push({
            componentId: entry.name,
            config,
          })
        } catch (error) {
          console.warn(`Failed to load config for ${entry.name}:`, error)
        }
      }
    }
  } catch (error) {
    console.error('Failed to read catalog directory:', error)
  }
  
  return configs
}

async function main() {
  console.log('Loading component configs from JSON files...')
  const configs = await loadAllConfigs()
  
  console.log(`Found ${configs.length} component configs:`)
  configs.forEach(({ componentId }) => {
    console.log(`  - ${componentId}`)
  })
  
  // Format for Convex mutation
  const formattedConfigs = configs.map(({ componentId, config }) => ({
    componentId,
    name: config.metadata.name,
    description: config.metadata.description,
    category: config.metadata.category,
    tags: config.metadata.tags,
    author: config.metadata.author,
    version: config.metadata.version,
    code: config.code,
    properties: config.properties,
    variableMappings: config.variableMappings,
    dependencies: config.dependencies,
    files: config.files,
    // Note: authorId needs to be provided - this should be your user ID
    // You can get it from the Convex dashboard or from the users table
    authorId: 'YOUR_USER_ID_HERE' as any, // Replace with actual user ID
  }))
  
  console.log('\nFormatted configs for Convex:')
  console.log(JSON.stringify(formattedConfigs, null, 2))
  
  console.log('\nTo seed these configs:')
  console.log('1. Get your user ID from the Convex dashboard (users table)')
  console.log('2. Replace YOUR_USER_ID_HERE in the formatted configs above')
  console.log('3. Call the seedComponentConfigs mutation from the Convex dashboard')
  console.log('   or use the Convex CLI to run this script')
}

if (require.main === module) {
  main().catch(console.error)
}

export { loadAllConfigs }

