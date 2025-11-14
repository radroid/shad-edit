import { describe, expect, it } from 'vitest'
import {
  applyPropertyChanges,
  extractPropertiesFromCode,
} from '@/lib/property-extractor'

describe('tailwind modifier integration', () => {
  it('replaces tailwind class within the same group', () => {
    const code = `<div className="bg-white text-base p-4">Hello world</div>`
    const structure = extractPropertiesFromCode(code, 'TestComponent')
    const element = structure.elements[0]
    const backgroundProp =
      element.properties.find((prop) => prop.name === 'backgroundColor')!

    const updated = applyPropertyChanges(
      code,
      element,
      backgroundProp,
      'bg-slate-900'
    )

    expect(updated).toContain('bg-slate-900')
    expect(updated).not.toContain('bg-white')
    expect(updated).toContain('text-base')
  })

  it('adds className when missing', () => {
    const code = `<div>Sample</div>`
    const structure = extractPropertiesFromCode(code, 'TestComponent')
    const element = structure.elements[0]
    const paddingProp =
      element.properties.find((prop) => prop.name === 'padding')!

    const updated = applyPropertyChanges(code, element, paddingProp, 'p-6')

    expect(updated).toContain('className="p-6"')
  })

  it('updates attributes for attribute-mapped properties', () => {
    const code = `<input type="text" placeholder="Search" />`
    const structure = extractPropertiesFromCode(code, 'TestComponent')
    const element = structure.elements.find((el) => el.type === 'input')!
    const placeholderProp =
      element.properties.find((prop) => prop.name === 'placeholder')!

    const updated = applyPropertyChanges(
      code,
      element,
      placeholderProp,
      'Filter...'
    )

    expect(updated).toContain('placeholder="Filter..."')
  })

  it('updates element content for content-mapped properties', () => {
    const code = `<button className="bg-blue-500 text-white">Click me</button>`
    const structure = extractPropertiesFromCode(code, 'TestComponent')
    const element = structure.elements.find((el) => el.type === 'button')!
    const textProp = element.properties.find((prop) => prop.name === 'text')!

    const updated = applyPropertyChanges(code, element, textProp, 'Submit')

    expect(updated).toContain('Submit</button>')
    expect(updated).not.toContain('Click me</button>')
  })
})



