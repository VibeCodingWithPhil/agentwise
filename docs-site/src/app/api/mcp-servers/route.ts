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
import { mcpServers, getMCPServersByStatus, searchMCPServers } from '@/lib/data'
import { getCachedOrFetch, CacheKeys, CacheTTLs, CacheTags } from '@/lib/cache'
import { MCPServer } from '@/types/api'

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
  const status = getQueryParam(searchParams, 'status')
  const search = getQueryParam(searchParams, 'search')
  const sortBy = getQueryParam(searchParams, 'sort', 'name')
  const limit = getQueryParamAsNumber(searchParams, 'limit', 50)
  const offset = getQueryParamAsNumber(searchParams, 'offset', 0)
  const includeDetails = getQueryParam(searchParams, 'details') === 'true'
  const includeHealth = getQueryParam(searchParams, 'health') === 'true'

  // Validate enum values
  if (status) {
    validateEnum(status, ['active', 'inactive', 'error'], 'status')
  }

  if (sortBy) {
    validateEnum(sortBy, ['name', 'status', 'requests', 'responseTime', 'version'], 'sort')
  }

  // Build cache key based on filters
  const cacheKey = `${CacheKeys.MCP_SERVERS}:${status || 'all'}:${search || 'none'}:${sortBy}:${limit}:${offset}:${includeDetails}:${includeHealth}`

  // Get MCP servers with caching
  const result = await getCachedOrFetch(
    cacheKey,
    async () => {
      let filteredServers = [...mcpServers]

      // Apply status filter
      if (status) {
        filteredServers = getMCPServersByStatus(status as MCPServer['status'])
      }

      // Apply search filter
      if (search) {
        filteredServers = searchMCPServers(search)
      }

      // Sort servers
      switch (sortBy) {
        case 'status':
          filteredServers.sort((a, b) => {
            const statusOrder = { active: 0, inactive: 1, error: 2 }
            const statusCompare = statusOrder[a.status] - statusOrder[b.status]
            if (statusCompare === 0) {
              return a.name.localeCompare(b.name)
            }
            return statusCompare
          })
          break
        case 'requests':
          filteredServers.sort((a, b) => (b.metrics?.requests || 0) - (a.metrics?.requests || 0))
          break
        case 'responseTime':
          filteredServers.sort((a, b) => (a.metrics?.averageResponseTime || 0) - (b.metrics?.averageResponseTime || 0))
          break
        case 'version':
          filteredServers.sort((a, b) => a.version.localeCompare(b.version))
          break
        case 'name':
        default:
          filteredServers.sort((a, b) => a.name.localeCompare(b.name))
          break
      }

      // Apply pagination
      const total = filteredServers.length
      const paginatedServers = filteredServers.slice(offset, offset + limit)

      // Transform servers for response
      const transformedServers = paginatedServers.map(server => {
        const baseServer = {
          id: server.id,
          name: server.name,
          description: server.description,
          version: server.version,
          status: server.status,
          url: server.url
        }

        // Add health check info if requested
        if (includeHealth && server.healthCheck) {
          (baseServer as any).healthCheck = server.healthCheck
        }

        // Add metrics if available
        if (server.metrics) {
          (baseServer as any).metrics = server.metrics
        }

        if (includeDetails) {
          return {
            ...baseServer,
            capabilities: server.capabilities,
            configuration: server.configuration,
            documentation: server.documentation,
            examples: server.examples
          }
        }

        return {
          ...baseServer,
          capabilityCount: server.capabilities.length,
          exampleCount: server.examples?.length || 0,
          hasDocumentation: !!server.documentation
        }
      })

      // Generate statistics
      const stats = {
        total: mcpServers.length,
        active: mcpServers.filter(s => s.status === 'active').length,
        inactive: mcpServers.filter(s => s.status === 'inactive').length,
        error: mcpServers.filter(s => s.status === 'error').length,
        totalCapabilities: mcpServers.reduce((sum, s) => sum + s.capabilities.length, 0),
        averageResponseTime: mcpServers
          .filter(s => s.healthCheck && s.status === 'active')
          .reduce((sum, s) => sum + (s.healthCheck?.responseTime || 0), 0) / 
          mcpServers.filter(s => s.healthCheck && s.status === 'active').length || 0,
        totalRequests: mcpServers.reduce((sum, s) => sum + (s.metrics?.requests || 0), 0),
        totalErrors: mcpServers.reduce((sum, s) => sum + (s.metrics?.errors || 0), 0)
      }

      // Group capabilities by type
      const capabilityTypes = mcpServers
        .flatMap(s => s.capabilities)
        .reduce((acc, cap) => {
          acc[cap.type] = (acc[cap.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)

      return {
        servers: transformedServers,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          offset,
          total,
          totalPages: Math.ceil(total / limit)
        },
        meta: {
          stats,
          capabilityTypes,
          filters: {
            status: status || null,
            search: search || null
          },
          lastHealthCheck: new Date().toISOString()
        }
      }
    },
    CacheTTLs.MEDIUM, // MCP servers update moderately frequently
    [CacheTags.MCP]
  )

  // Create response with caching headers
  let response = createSuccessResponse(result)
  response = addCacheHeaders(response, 600, 120) // 10 min cache, 2 min stale-while-revalidate
  response = addSecurityHeaders(response)

  // Add rate limit headers
  if (rateLimitInfo) {
    response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString())
  }

  // Add MCP metadata headers
  response.headers.set('X-MCP-Total', result.meta.stats.total.toString())
  response.headers.set('X-MCP-Active', result.meta.stats.active.toString())
  response.headers.set('X-MCP-Capabilities', result.meta.stats.totalCapabilities.toString())

  return response
}

export { withErrorHandler(GET) as GET }