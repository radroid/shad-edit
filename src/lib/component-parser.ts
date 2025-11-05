export type ParsedComponent = {
  name: string
  code: string
  dependencies: Record<string, string>
}

export function parseFromHtml(_html: string): ParsedComponent | null {
  return null
}



