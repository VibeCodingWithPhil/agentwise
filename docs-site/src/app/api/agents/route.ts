import { NextRequest } from 'next/server'
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
  validateEnum
} from '@/lib/api-utils'
import { agents, getAgentsByCategory, getAgentsByStatus, searchAgents } from '@/lib/data'
import { getCachedOrFetch, CacheKeys, CacheTTLs, CacheTags } from '@/lib/cache'
import { Agent } from '@/types/api'

async function GET(request: NextRequest) {
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
  const status = getQueryParam(searchParams, 'status')
  const search = getQueryParam(searchParams, 'search')
  const sortBy = getQueryParam(searchParams, 'sort', 'name')
  const limit = getQueryParamAsNumber(searchParams, 'limit', 50)
  const offset = getQueryParamAsNumber(searchParams, 'offset', 0)
  const includeDetails = getQueryParam(searchParams, 'details') === 'true'

  // Validate enum values
  if (status) {
    validateEnum(status, ['active', 'inactive', 'deprecated'], 'status')
  }

  if (sortBy) {
    validateEnum(sortBy, ['name', 'category', 'rating', 'downloads', 'updated'], 'sort')
  }

  // Build cache key based on filters
  const cacheKey = `${CacheKeys.AGENTS_LIST}:${category || 'all'}:${status || 'all'}:${search || 'none'}:${sortBy}:${limit}:${offset}:${includeDetails}`

  // Get agents with caching
  const result = await getCachedOrFetch(
    cacheKey,
    async () => {
      let filteredAgents = [...agents]

      // Apply category filter
      if (category) {
        filteredAgents = getAgentsByCategory(category)
      }

      // Apply status filter
      if (status) {
        filteredAgents = filteredAgents.filter(agent => 
          getAgentsByStatus(status as Agent['status']).includes(agent)
        )
      }

      // Apply search filter
      if (search) {
        filteredAgents = searchAgents(search)
      }

      // Sort agents
      switch (sortBy) {
        case 'category':
          filteredAgents.sort((a, b) => {
            const categoryCompare = a.category.localeCompare(b.category)
            if (categoryCompare === 0) {
              return a.name.localeCompare(b.name)
            }
            return categoryCompare
          })
          break
        case 'rating':
          filteredAgents.sort((a, b) => (b.rating || 0) - (a.rating || 0))
          break
        case 'downloads':
          filteredAgents.sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
          break
        case 'updated':
          filteredAgents.sort((a, b) => 
            new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
          )
          break
        case 'name':
        default:
          filteredAgents.sort((a, b) => a.name.localeCompare(b.name))
          break
      }

      // Apply pagination
      const total = filteredAgents.length
      const paginatedAgents = filteredAgents.slice(offset, offset + limit)

      // Transform agents for response
      const transformedAgents = paginatedAgents.map(agent => {
        const baseAgent = {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          category: agent.category,
          version: agent.version,
          status: agent.status,
          tags: agent.tags,
          rating: agent.rating,
          downloadCount: agent.downloadCount,
          lastUpdated: agent.lastUpdated
        }

        if (includeDetails) {
          return {
            ...baseAgent,
            capabilities: agent.capabilities,
            documentation: agent.documentation,
            examples: agent.examples,
            dependencies: agent.dependencies,
            requirements: agent.requirements
          }
        }

        return {
          ...baseAgent,
          capabilityCount: agent.capabilities.length,
          exampleCount: agent.examples?.length || 0,
          dependencyCount: agent.dependencies?.length || 0
        }
      })

      // Generate statistics
      const categories = [...new Set(agents.map(a => a.category))].sort()
      const stats = {
        total: agents.length,
        active: agents.filter(a => a.status === 'active').length,
        inactive: agents.filter(a => a.status === 'inactive').length,
        deprecated: agents.filter(a => a.status === 'deprecated').length,
        averageRating: agents.reduce((sum, a) => sum + (a.rating || 0), 0) / agents.length,
        totalDownloads: agents.reduce((sum, a) => sum + (a.downloadCount || 0), 0),
        categories: categories.map(cat => ({
          name: cat,
          count: agents.filter(a => a.category === cat).length,
          active: agents.filter(a => a.category === cat && a.status === 'active').length
        }))
      }

      return {
        agents: transformedAgents,
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
            status: status || null,
            search: search || null
          }
        }
      }
    },
    CacheTTLs.MEDIUM, // Agents update moderately frequently
    [CacheTags.AGENTS]
  )

  // Create response with caching headers
  let response = createSuccessResponse(result)
  response = addCacheHeaders(response, 1800, 300) // 30 min cache, 5 min stale-while-revalidate
  response = addSecurityHeaders(response)

  // Add rate limit headers
  if (rateLimitInfo) {
    response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString())
  }

  // Add agents metadata headers
  response.headers.set('X-Agents-Total', result.meta.stats.total.toString())
  response.headers.set('X-Agents-Active', result.meta.stats.active.toString())
  response.headers.set('X-Agents-Categories', result.meta.categories.length.toString())

  return response
}

export { withErrorHandler(GET) as GET }