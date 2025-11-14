import { trackCacheOperation } from './sentry'

const STORAGE_KEY = 'guestEdits'
const CACHE_VERSION = '1.0.0'

export type GuestEditRecord = {
  version: string
  updatedAt: string
  properties: Record<string, any>
  metadata?: Record<string, any>
}

type GuestEditStore = Record<string, GuestEditRecord>

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readStore(): GuestEditStore {
  if (!isBrowser()) return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed as GuestEditStore
    }
    return {}
  } catch (error) {
    console.warn('Failed to read guest edit cache', error)
    return {}
  }
}

function writeStore(store: GuestEditStore) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch (error) {
    console.warn('Failed to persist guest edit cache', error)
  }
}

export function loadGuestEdit(componentId: string): GuestEditRecord | undefined {
  try {
    const store = readStore()
    const result = store[componentId]
    trackCacheOperation('read', componentId)
    return result
  } catch (error) {
    trackCacheOperation('read', componentId, error as Error)
    return undefined
  }
}

export function saveGuestEdit(
  componentId: string,
  payload: Omit<GuestEditRecord, 'version' | 'updatedAt'> & {
    updatedAt?: string
  }
) {
  try {
    const store = readStore()
    store[componentId] = {
      version: CACHE_VERSION,
      updatedAt: payload.updatedAt ?? new Date().toISOString(),
      properties: payload.properties ?? {},
      metadata: payload.metadata ?? {},
    }
    writeStore(store)
    trackCacheOperation('write', componentId)
  } catch (error) {
    trackCacheOperation('write', componentId, error as Error)
    throw error
  }
}

export function clearGuestEdit(componentId: string) {
  try {
    const store = readStore()
    if (store[componentId]) {
      delete store[componentId]
      writeStore(store)
      trackCacheOperation('clear', componentId)
    }
  } catch (error) {
    trackCacheOperation('clear', componentId, error as Error)
  }
}

export function clearAllGuestEdits() {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    trackCacheOperation('clear')
  } catch (error) {
    trackCacheOperation('clear', undefined, error as Error)
    console.warn('Failed to clear guest edit cache', error)
  }
}

export function listGuestEdits(): Array<{ componentId: string; record: GuestEditRecord }> {
  const store = readStore()
  return Object.entries(store).map(([componentId, record]) => ({
    componentId,
    record,
  }))
}

export function getGuestCacheVersion() {
  return CACHE_VERSION
}

/**
 * Get all guest edits that can be migrated to a project
 * Returns array of componentIds with their cached properties
 */
export function getGuestEditsForMigration(): Array<{
  componentId: string
  properties: Record<string, any>
  metadata?: Record<string, any>
}> {
  const edits = listGuestEdits()
  return edits.map(({ componentId, record }) => ({
    componentId,
    properties: record.properties,
    metadata: record.metadata,
  }))
}

/**
 * Clear guest edits after successful migration to project
 */
export function clearGuestEditsAfterMigration(componentIds: string[]) {
  componentIds.forEach((componentId) => {
    clearGuestEdit(componentId)
  })
}


