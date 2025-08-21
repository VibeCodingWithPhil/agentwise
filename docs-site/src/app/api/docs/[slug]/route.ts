import { NextRequest, NextResponse } from 'next/server'
import { 
  withErrorHandler, 
  createSuccessResponse,
  createErrorResponse,
  addCacheHeaders, 
  addSecurityHeaders,
  validateHttpMethod,
  applyRateLimit,
  handleCors,
  ApiException
} from '@/lib/api-utils'
import { getDocBySlug, getAllDocs, getRelatedDocs, generateBreadcrumbs } from '@/lib/markdown'
import { getCachedOrFetch, CacheKeys, CacheTTLs, CacheTags } from '@/lib/cache'

interface RouteParams {
  params: {
    slug: string
  }
}

async function handler(request: NextRequest, { params }: RouteParams) {
  // Handle CORS
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  // Validate method
  validateHttpMethod(request, ['GET'])

  // Apply rate limiting
  const rateLimitInfo = applyRateLimit(request)
  if (rateLimitInfo?.retryAfter) {
    return createErrorResponse(
      `Rate limit exceeded. Try again in ${rateLimitInfo.retryAfter} seconds.`,
      429
    )
  }

  const { slug } = params

  if (!slug) {
    throw new ApiException('Slug parameter is required', 400, 'MISSING_SLUG')
  }

  // Validate slug format
  if (!/^[a-z0-9\-_]+$/.test(slug)) {
    throw new ApiException('Invalid slug format', 400, 'INVALID_SLUG')
  }

  const cacheKey = CacheKeys.DOC_CONTENT(slug)

  // Get document with caching
  const result = await getCachedOrFetch(
    cacheKey,
    async () => {
      const doc = await getDocBySlug(slug)
      
      if (!doc) {
        throw new ApiException('Document not found', 404, 'DOC_NOT_FOUND')
      }

      // Get all docs for related content and breadcrumbs
      const allDocs = await getAllDocs()
      
      // Get related documents
      const relatedDocs = getRelatedDocs(doc, allDocs, 5).map(relatedDoc => ({
        slug: relatedDoc.slug,
        title: relatedDoc.data.title || relatedDoc.slug,
        excerpt: relatedDoc.excerpt,
        category: relatedDoc.data.category,
        readingTime: relatedDoc.data.readingTime
      }))

      // Generate breadcrumbs
      const breadcrumbs = generateBreadcrumbs(slug, allDocs)

      // Get next/previous documents in same category
      const categoryDocs = allDocs
        .filter(d => d.data.category === doc.data.category)
        .sort((a, b) => (a.data.order || 999) - (b.data.order || 999))
      
      const currentIndex = categoryDocs.findIndex(d => d.slug === slug)
      const previousDoc = currentIndex > 0 ? categoryDocs[currentIndex - 1] : null
      const nextDoc = currentIndex < categoryDocs.length - 1 ? categoryDocs[currentIndex + 1] : null

      return {
        ...doc,
        relatedDocs,
        breadcrumbs,
        navigation: {
          previous: previousDoc ? {
            slug: previousDoc.slug,
            title: previousDoc.data.title || previousDoc.slug
          } : null,
          next: nextDoc ? {
            slug: nextDoc.slug,
            title: nextDoc.data.title || nextDoc.slug
          } : null
        }
      }
    },
    CacheTTLs.LONG, // Cache longer for individual docs
    [CacheTags.DOCS]
  )

  // Create response with caching headers
  let response: any = createSuccessResponse(result)
  response = addCacheHeaders(response, 3600, 300) // 1 hour cache, 5 min stale-while-revalidate
  response = addSecurityHeaders(response)

  // Add rate limit headers
  if (rateLimitInfo) {
    response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString())
  }

  // Add document metadata headers
  response.headers.set('X-Doc-Title', encodeURIComponent(result.data?.title || slug))
  response.headers.set('X-Doc-Category', encodeURIComponent(result.data?.category || 'General'))
  response.headers.set('X-Doc-Reading-Time', (result.data?.readingTime || 0).toString())

  return response
}

export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  try {
    return await handler(request, context)
  } catch (error) {
    if (error instanceof ApiException) {
      return createErrorResponse(error.message, error.statusCode)
    }
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    console.error('API Error:', error)
    
    return createErrorResponse(errorMessage, 500)
  }
}