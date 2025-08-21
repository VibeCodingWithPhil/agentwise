import { NextRequest, NextResponse } from 'next/server'
import { 
  withErrorHandler, 
  createSuccessResponse, 
  addCacheHeaders, 
  addSecurityHeaders,
  validateHttpMethod,
  parseQueryParams,
  getQueryParam,
  getQueryParamAsNumber,
  applyRateLimit,
  handleCors,
  validateRequired,
  validateEnum,
  ApiException
} from '@/lib/api-utils'
import { performSearch, getSearchEngine, initializeSearchIndex } from '@/lib/search'
import { getAllDocs, commands } from '@/lib/markdown'
import { agents } from '@/lib/data'
import { getCachedOrFetch, CacheKeys, CacheTTLs, CacheTags } from '@/lib/cache'
import { SearchQuery, SearchResponse } from '@/types/api'

// Initialize search index on first request
let searchIndexInitialized = false

async function initializeSearchIfNeeded() {
  if (!searchIndexInitialized) {
    const docs = await getAllDocs()
    await initializeSearchIndex(docs, commands, agents)
    searchIndexInitialized = true
    console.log('Search index initialized')
  }
}

async function handler(request: NextRequest): Promise<NextResponse<any>> {
  // Handle CORS
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  // Validate method
  validateHttpMethod(request, ['GET'])

  // Apply rate limiting with stricter limits for search
  const rateLimitInfo = applyRateLimit(request, { windowMs: 60000, maxRequests: 30 })
  if (rateLimitInfo?.retryAfter) {
    throw new ApiException(
      `Rate limit exceeded. Try again in ${rateLimitInfo.retryAfter} seconds.`,
      429,
      'RATE_LIMIT_EXCEEDED'
    )
  }

  // Parse query parameters
  const searchParams = parseQueryParams(request)
  const query = getQueryParam(searchParams, 'q')
  const type = getQueryParam(searchParams, 'type', 'all')
  const limit = getQueryParamAsNumber(searchParams, 'limit', 20)
  const offset = getQueryParamAsNumber(searchParams, 'offset', 0)

  // Validate required parameters
  if (!query) {
    throw new ApiException('Query parameter "q" is required', 400, 'MISSING_QUERY')
  }

  if (query.length < 2) {
    throw new ApiException('Query must be at least 2 characters long', 400, 'QUERY_TOO_SHORT')
  }

  if (query.length > 200) {
    throw new ApiException('Query must be less than 200 characters', 400, 'QUERY_TOO_LONG')
  }

  // Validate enum values
  if (type) {
    validateEnum(type, ['all', 'docs', 'commands', 'agents'], 'type')
  }

  // Build cache key
  const cacheKey = CacheKeys.SEARCH_RESULTS(query + type + limit + offset)

  // Initialize search index if needed
  await initializeSearchIfNeeded()

  // Perform search with caching
  const result = await getCachedOrFetch(
    cacheKey,
    async () => {
      const searchQuery: SearchQuery = {
        query,
        type: type as SearchQuery['type'],
        limit: Math.min(limit, 100), // Cap at 100 results
        offset: Math.max(0, offset) // Ensure non-negative
      }

      const searchResults = await performSearch(searchQuery)

      // Add additional metadata
      const enhancedResults = {
        ...searchResults,
        meta: {
          query,
          type,
          limit,
          offset,
          searchTime: Date.now(),
          indexStats: {
            totalIndexed: searchResults.total,
            categories: searchResults.facets.categories.length,
            types: searchResults.facets.types.length
          }
        }
      }

      return enhancedResults
    },
    CacheTTLs.SHORT, // Short cache for search results
    [CacheTags.SEARCH]
  )

  // Create response with caching headers
  let response: any = createSuccessResponse(result)
  response = addCacheHeaders(response, 120, 30) // 2 min cache, 30 sec stale-while-revalidate
  response = addSecurityHeaders(response)

  // Add rate limit headers
  if (rateLimitInfo) {
    response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString())
  }

  // Add search metadata headers
  response.headers.set('X-Search-Query', encodeURIComponent(query))
  response.headers.set('X-Search-Results', result.total.toString())
  response.headers.set('X-Search-Type', type)

  return response
}

export const GET = withErrorHandler(handler)