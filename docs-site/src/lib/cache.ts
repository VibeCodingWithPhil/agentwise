import { CacheEntry } from '@/types/api'

// In-memory cache implementation
// In production, this could be replaced with Redis or another caching solution
class MemoryCache {
  private cache = new Map<string, CacheEntry>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry < now) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key)
    })

    if (expiredKeys.length > 0) {
      console.log(`Cache cleanup: removed ${expiredKeys.length} expired entries`)
    }
  }

  set<T>(key: string, data: T, ttlMs: number = 300000, tags?: string[]): void {
    const entry: CacheEntry<T> = {
      key,
      data,
      expiry: Date.now() + ttlMs,
      tags
    }

    this.cache.set(key, entry)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (entry.expiry < Date.now()) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    if (entry.expiry < Date.now()) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  invalidateByTag(tag: string): number {
    let count = 0
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.includes(tag)) {
        keysToDelete.push(key)
        count++
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key)
    })

    return count
  }

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  stats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const entry of this.cache.values()) {
      if (entry.expiry < now) {
        expiredEntries++
      } else {
        validEntries++
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
      memoryUsage: process.memoryUsage().heapUsed
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.clear()
  }
}

// Global cache instance
let cacheInstance: MemoryCache | null = null

export function getCache(): MemoryCache {
  if (!cacheInstance) {
    cacheInstance = new MemoryCache()
  }
  return cacheInstance
}

// Helper functions for common caching patterns
export function cacheKey(...parts: (string | number)[]): string {
  return parts.join(':')
}

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 300000,
  tags?: string[]
): Promise<T> {
  const cache = getCache()
  
  // Try to get from cache first
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Not in cache, fetch the data
  const data = await fetcher()
  
  // Store in cache
  cache.set(key, data, ttlMs, tags)
  
  return data
}

export function invalidateCache(keyOrTag: string, isTag: boolean = false): number {
  const cache = getCache()
  
  if (isTag) {
    return cache.invalidateByTag(keyOrTag)
  } else {
    return cache.delete(keyOrTag) ? 1 : 0
  }
}

// Cache middleware for API responses
export function withCache<T>(
  key: string,
  ttlMs: number = 300000,
  tags?: string[]
) {
  return async (fetcher: () => Promise<T>): Promise<T> => {
    return getCachedOrFetch(key, fetcher, ttlMs, tags)
  }
}

// Common cache keys and TTLs
export const CacheKeys = {
  DOCS_LIST: 'docs:list',
  DOC_CONTENT: (slug: string) => `doc:content:${slug}`,
  COMMANDS_LIST: 'commands:list',
  AGENTS_LIST: 'agents:list',
  SEARCH_RESULTS: (query: string) => `search:${Buffer.from(query).toString('base64')}`,
  METRICS: 'metrics:current',
  MCP_SERVERS: 'mcp:servers'
} as const

export const CacheTTLs = {
  SHORT: 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 60 * 60 * 1000,  // 1 hour
  VERY_LONG: 24 * 60 * 60 * 1000 // 24 hours
} as const

export const CacheTags = {
  DOCS: 'docs',
  COMMANDS: 'commands',
  AGENTS: 'agents',
  METRICS: 'metrics',
  SEARCH: 'search',
  MCP: 'mcp'
} as const

// Pre-warm cache function for frequently accessed data
export async function preWarmCache(): Promise<void> {
  const cache = getCache()
  
  try {
    console.log('Pre-warming cache...')
    
    // You would implement actual data fetching here
    // This is just a placeholder structure
    
    console.log('Cache pre-warming completed')
  } catch (error) {
    console.error('Error pre-warming cache:', error)
  }
}