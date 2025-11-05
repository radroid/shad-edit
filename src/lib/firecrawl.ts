// Placeholder Firecrawl client. Wire real API later.
const FIRECRAWL_API_KEY = (import.meta as any).env?.VITE_FIRECRAWL_API_KEY

export async function discoverShadcnSources(): Promise<Array<{ url: string }>> {
  void FIRECRAWL_API_KEY
  return []
}



