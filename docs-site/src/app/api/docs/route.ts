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
  handleCors
} from '@/lib/api-utils'
import { getAllDocs } from '@/lib/markdown'
import { getCachedOrFetch, CacheKeys, CacheTTLs, CacheTags } from '@/lib/cache'
import { DocPage } from '@/types/api'

async function handler(request: NextRequest): Promise<NextResponse<any>> {
  // Handle CORS
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  // Validate method
  validateHttpMethod(request, ['GET'])

  // Apply rate limiting
  const rateLimitInfo = applyRateLimit(request)
  if (rateLimitInfo?.retryAfter) {
    return createSuccessResponse(
      null,
      `Rate limit exceeded. Try again in ${rateLimitInfo.retryAfter} seconds.`
    )
  }

  // Parse query parameters
  const searchParams = parseQueryParams(request)
  const category = getQueryParam(searchParams, 'category')
  const tag = getQueryParam(searchParams, 'tag')
  const sortBy = getQueryParam(searchParams, 'sort', 'order')
  const limit = getQueryParamAsNumber(searchParams, 'limit', 50)
  const offset = getQueryParamAsNumber(searchParams, 'offset', 0)

  // Build cache key based on filters
  const cacheKey = `${CacheKeys.DOCS_LIST}:${category || 'all'}:${tag || 'all'}:${sortBy}:${limit}:${offset}`

  // Get docs with caching
  const result = await getCachedOrFetch(
    cacheKey,
    async () => {
      let docs = await getAllDocs()

      // Apply filters
      if (category) {
        docs = docs.filter(doc => 
          doc.data.category?.toLowerCase() === category.toLowerCase()
        )
      }

      if (tag) {
        docs = docs.filter(doc => 
          doc.data.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
        )
      }

      // Sort docs
      switch (sortBy) {
        case 'title':
          docs.sort((a, b) => (a.data.title || a.slug).localeCompare(b.data.title || b.slug))
          break
        case 'date':
          docs.sort((a, b) => {
            const dateA = new Date(a.data.date || '1970-01-01')
            const dateB = new Date(b.data.date || '1970-01-01')
            return dateB.getTime() - dateA.getTime()
          })
          break
        case 'category':
          docs.sort((a, b) => (a.data.category || '').localeCompare(b.data.category || ''))
          break
        case 'order':
        default:
          docs.sort((a, b) => (a.data.order || 999) - (b.data.order || 999))
          break
      }

      // Apply pagination
      const total = docs.length
      const paginatedDocs = docs.slice(offset, offset + limit)

      // Transform docs for API response (remove full content)
      const transformedDocs = paginatedDocs.map(doc => ({
        slug: doc.slug,
        title: doc.data.title || doc.slug,
        description: doc.data.description,
        excerpt: doc.excerpt,
        category: doc.data.category,
        tags: doc.data.tags || [],
        date: doc.data.date,
        readingTime: doc.data.readingTime,
        lastModified: doc.lastModified,
        wordCount: doc.wordCount,
        tableOfContents: doc.tableOfContents?.map(item => ({
          id: item.id,
          title: item.title,
          level: item.level
        })) // Remove nested children for list view
      }))

      return {
        docs: transformedDocs,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          offset,
          total,
          totalPages: Math.ceil(total / limit)
        },
        meta: {
          categories: [...new Set(docs.map(d => d.data.category).filter(Boolean))],
          tags: [...new Set(docs.flatMap(d => d.data.tags || []))].sort(),
          totalDocs: total
        }
      }
    },
    CacheTTLs.MEDIUM,
    [CacheTags.DOCS]
  )

  // Create response with caching headers
  let response: any = createSuccessResponse(result)
  response = addCacheHeaders(response, 300, 60) // 5 min cache, 1 min stale-while-revalidate
  response = addSecurityHeaders(response)

  // Add rate limit headers
  if (rateLimitInfo) {
    response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString())
  }

  return response
}

export const GET = withErrorHandler(handler)