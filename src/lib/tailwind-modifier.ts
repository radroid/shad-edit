import {
  joinClassNames,
  mergeTailwindClasses,
  normalizeTailwindValue,
  removeGroupClasses,
  splitClassString,
  toClassGroup,
} from './tailwind-utils'

type ClassUpdateArgs = {
  code: string
  tag: string
  elementId: string
  nextClass: string
  classGroup?: string
  classPrefix?: string
}

type AttributeUpdateArgs = {
  code: string
  tag: string
  elementId: string
  attribute: string
  value: any
}

type ContentUpdateArgs = {
  code: string
  tag: string
  elementId: string
  value: any
}

export function applyTailwindClassUpdate(args: ClassUpdateArgs): string | null {
  const candidates = getTagCandidates(args.tag, args.elementId)

  for (const candidate of candidates) {
    const result = updateClassForTag({ ...args, tag: candidate })
    if (result !== null) {
      return result
    }
  }

  return null
}

export function applyAttributeUpdate(args: AttributeUpdateArgs): string | null {
  const candidates = getTagCandidates(args.tag, args.elementId)

  for (const candidate of candidates) {
    const result = updateAttributeForTag({ ...args, tag: candidate })
    if (result !== null) {
      return result
    }
  }

  return null
}

export function applyContentUpdate(args: ContentUpdateArgs): string | null {
  const candidates = getTagCandidates(args.tag, args.elementId)

  for (const candidate of candidates) {
    const result = updateContentForTag({ ...args, tag: candidate })
    if (result !== null) {
      return result
    }
  }

  return null
}

function updateClassForTag({
  code,
  tag,
  elementId,
  nextClass,
  classGroup,
  classPrefix,
}: ClassUpdateArgs & { tag: string }): string | null {
  const occurrence = getOccurrenceIndex(elementId)
  const startTag = findNthStartTag(code, tag, occurrence)
  if (!startTag) return null

  const { source, start, end } = startTag
  const classMatch = source.match(/className\s*=\s*(\{)?(["'`])([\s\S]*?)(\2)(\})?/)

  const nextClasses = normalizeTailwindValue(nextClass, classPrefix)

  let newClassString: string
  if (classMatch) {
    const existing = splitClassString(classMatch[3])
    let merged: string[]
    if (nextClasses.length > 0) {
      merged = mergeTailwindClasses(
        existing,
        nextClasses,
        classGroup || (nextClasses[0] ? toClassGroup(nextClasses[0]) : undefined)
      )
    } else if (classGroup) {
      merged = removeGroupClasses(existing, classGroup)
    } else {
      merged = existing
    }

    newClassString = joinClassNames(merged)

    const before = source.slice(0, classMatch.index)
    const after = source.slice((classMatch?.index ?? 0) + (classMatch[0]?.length ?? 0))
    const quote = classMatch[2]
    const usesBraces = Boolean(classMatch[1] && classMatch[5])
    const replacement = usesBraces
      ? `className={${quote}${newClassString}${quote}}`
      : `className=${quote}${newClassString}${quote}`

    const updatedSource = `${before}${replacement}${after}`
    return replaceSlice(code, start, end, updatedSource)
  }

  if (nextClasses.length === 0) {
    return code
  }

  const closing = source.endsWith('/>') ? '/>' : '>'
  const insertionPoint = source.lastIndexOf(closing)
  if (insertionPoint === -1) return null

  const before = source.slice(0, insertionPoint)
  const updatedSource = `${before} className="${joinClassNames(nextClasses)}"${closing}`
  return replaceSlice(code, start, end, updatedSource)
}

function updateAttributeForTag({
  code,
  tag,
  elementId,
  attribute,
  value,
}: AttributeUpdateArgs & { tag: string }): string | null {
  const occurrence = getOccurrenceIndex(elementId)
  const startTag = findNthStartTag(code, tag, occurrence)
  if (!startTag) return null

  const { source, start, end } = startTag
  const attrPattern =
    escapeRegExp(attribute) + "\\s*=\\s*(\\{)?([\"'`])([\\s\\S]*?)(\\2)(\\})?"
  const attrRegex = new RegExp(attrPattern)
  const attrMatch = source.match(attrRegex)

  const valueString =
    value === undefined || value === null ? '' : String(value).trim()

  if (attrMatch) {
    const before = source.slice(0, (attrMatch?.index ?? 0))
    const after = source.slice((attrMatch?.index ?? 0) + (attrMatch[0]?.length ?? 0))

    if (!valueString) {
      const updatedSource = `${before}${after}`
      return replaceSlice(code, start, end, updatedSource)
    }

    const quote = attrMatch[2]
    const usesBraces = Boolean(attrMatch[1] && attrMatch[5])
    const replacement = usesBraces
      ? `${attribute}={${quote}${valueString}${quote}}`
      : `${attribute}=${quote}${valueString}${quote}`

    const updatedSource = `${before}${replacement}${after}`
    return replaceSlice(code, start, end, updatedSource)
  }

  if (!valueString) {
    return code
  }

  const closing = source.endsWith('/>') ? '/>' : '>'
  const insertionPoint = source.lastIndexOf(closing)
  if (insertionPoint === -1) return null

  const before = source.slice(0, insertionPoint)
  const updatedSource = `${before} ${attribute}="${valueString}"${closing}`
  return replaceSlice(code, start, end, updatedSource)
}

function updateContentForTag({
  code,
  tag,
  elementId,
  value,
}: ContentUpdateArgs & { tag: string }): string | null {
  const occurrence = getOccurrenceIndex(elementId)
  const bounds = findElementBounds(code, tag, occurrence)
  if (!bounds) return null

  const content = value === undefined || value === null ? '' : String(value)
  const updated = replaceSlice(code, bounds.contentStart, bounds.contentEnd, content)
  return updated
}

function getOccurrenceIndex(elementId: string): number {
  const parts = elementId.split('-')
  const last = parts[parts.length - 1]
  const index = Number.parseInt(last, 10)
  if (Number.isFinite(index)) {
    return index
  }
  return 0
}

function getTagCandidates(tag: string, elementId: string): string[] {
  const candidates = new Set<string>()
  if (tag) {
    candidates.add(tag)
    candidates.add(tag.toLowerCase())
    candidates.add(capitalize(tag))
  }

  const inferred = elementId.split('-')[0]
  if (inferred) {
    candidates.add(inferred)
    candidates.add(capitalize(inferred))
  }

  return Array.from(candidates).filter(Boolean)
}

function findNthStartTag(code: string, tag: string, occurrence: number) {
  const pattern = new RegExp(`<${escapeRegExp(tag)}\\b[^>]*>`, 'g')
  let match: RegExpExecArray | null
  let index = -1

  while ((match = pattern.exec(code))) {
    index += 1
    if (index === occurrence) {
      return {
        start: match.index,
        end: pattern.lastIndex,
        source: match[0],
      }
    }
  }

  return null
}

function findElementBounds(code: string, tag: string, occurrence: number) {
  const startTag = findNthStartTag(code, tag, occurrence)
  if (!startTag) return null

  const source = startTag.source.trimEnd()
  if (source.endsWith('/>')) {
    // Self-closing, nothing to replace
    return null
  }

  const openPattern = new RegExp(`<${escapeRegExp(tag)}\\b[^>]*>`, 'g')
  const closePattern = new RegExp(`</${escapeRegExp(tag)}>`, 'g')

  openPattern.lastIndex = startTag.end
  closePattern.lastIndex = startTag.end

  let depth = 1
  let nextOpen = openPattern.exec(code)
  let nextClose = closePattern.exec(code)
  let contentStart = startTag.end

  while (depth > 0 && nextClose) {
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth += 1
      nextOpen = openPattern.exec(code)
      continue
    }

    depth -= 1
    if (depth === 0) {
      return {
        start: startTag.start,
        end: nextClose.index + (nextClose[0]?.length ?? 0),
        contentStart,
        contentEnd: nextClose.index,
      }
    }

    nextClose = closePattern.exec(code)
  }

  return null
}

function replaceSlice(source: string, start: number, end: number, insert: string) {
  return `${source.slice(0, start)}${insert}${source.slice(end)}`
}

function capitalize(value: string) {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

