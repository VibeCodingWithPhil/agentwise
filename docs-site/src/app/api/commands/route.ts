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
import { commands } from '@/lib/markdown'
import { getCachedOrFetch, CacheKeys, CacheTTLs, CacheTags } from '@/lib/cache'
import { Command } from '@/types/api'

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
  const search = getQueryParam(searchParams, 'search')
  const sortBy = getQueryParam(searchParams, 'sort', 'category')
  const limit = getQueryParamAsNumber(searchParams, 'limit', 100)
  const offset = getQueryParamAsNumber(searchParams, 'offset', 0)
  const includeExamples = getQueryParam(searchParams, 'examples') === 'true'

  // Build cache key based on filters
  const cacheKey = `${CacheKeys.COMMANDS_LIST}:${category || 'all'}:${search || 'none'}:${sortBy}:${limit}:${offset}:${includeExamples}`

  // Get commands with caching
  const result = await getCachedOrFetch(
    cacheKey,
    async () => {
      let filteredCommands = [...commands]

      // Apply category filter
      if (category) {
        filteredCommands = filteredCommands.filter(cmd => 
          cmd.category.toLowerCase() === category.toLowerCase()
        )
      }

      // Apply search filter
      if (search) {
        const searchTerm = search.toLowerCase()
        filteredCommands = filteredCommands.filter(cmd =>
          cmd.name.toLowerCase().includes(searchTerm) ||
          cmd.description.toLowerCase().includes(searchTerm) ||
          cmd.syntax.toLowerCase().includes(searchTerm) ||
          (cmd.tags && cmd.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        )
      }

      // Sort commands
      switch (sortBy) {
        case 'name':
          filteredCommands.sort((a, b) => a.name.localeCompare(b.name))
          break
        case 'category':
        default:
          filteredCommands.sort((a, b) => {
            const categoryCompare = a.category.localeCompare(b.category)
            if (categoryCompare === 0) {
              return a.name.localeCompare(b.name)
            }
            return categoryCompare
          })
          break
      }

      // Apply pagination
      const total = filteredCommands.length
      const paginatedCommands = filteredCommands.slice(offset, offset + limit)

      // Transform commands for response
      const transformedCommands = paginatedCommands.map(cmd => {
        const baseCommand = {
          name: cmd.name,
          syntax: cmd.syntax,
          description: cmd.description,
          category: cmd.category,
          tags: cmd.tags || [],
          version: cmd.version,
          deprecated: cmd.deprecated || false
        }

        if (includeExamples) {
          return {
            ...baseCommand,
            examples: cmd.examples,
            options: cmd.options || []
          }
        }

        return {
          ...baseCommand,
          exampleCount: cmd.examples.length,
          optionCount: cmd.options?.length || 0
        }
      })

      // Get categories and statistics
      const categories = [...new Set(commands.map(c => c.category))].sort()
      const stats = {
        totalCommands: commands.length,
        coreCommands: commands.filter(c => c.category === 'Core Commands').length,
        categories: categories.map(cat => ({
          name: cat,
          count: commands.filter(c => c.category === cat).length
        }))
      }

      return {
        commands: transformedCommands,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          offset,
          total,
          totalPages: Math.ceil(total / limit)
        },
        meta: {
          categories,
          stats,
          filters: {
            category: category || null,
            search: search || null
          }
        }
      }
    },
    CacheTTLs.LONG, // Commands change infrequently
    [CacheTags.COMMANDS]
  )

  // Create response with caching headers
  let response: any = createSuccessResponse(result)
  response = addCacheHeaders(response, 3600, 300) // 1 hour cache
  response = addSecurityHeaders(response)

  // Add rate limit headers
  if (rateLimitInfo) {
    response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString())
  }

  // Add commands metadata headers
  response.headers.set('X-Commands-Total', result.meta.stats.totalCommands.toString())
  response.headers.set('X-Commands-Categories', result.meta.categories.length.toString())

  return response
}

export const GET = withErrorHandler(handler)