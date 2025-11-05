export type RegistryItem = {
  name: string
  files: Array<{ path: string; content: string }>
  dependencies?: Record<string, string>
}

export function toShadcnRegistry(item: RegistryItem) {
  return {
    name: item.name,
    files: item.files.map((f) => ({ path: f.path })),
    dependencies: item.dependencies ?? {},
  }
}


