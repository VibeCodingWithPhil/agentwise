import { NextRequest } from 'next/server'
import { 
  withErrorHandler, 
  createSuccessResponse, 
  addCacheHeaders, 
  addSecurityHeaders,
  validateHttpMethod,
  parseQueryParams,
  getQueryParam,
  applyRateLimit,
  handleCors,
  validateEnum
} from '@/lib/api-utils'
import { generateMockMetrics, enhanceMetrics } from '@/lib/data'
import { getCachedOrFetch, CacheKeys, CacheTTLs, CacheTags, getCache } from '@/lib/cache'
import { PerformanceMetrics } from '@/types/api'

async function GET(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  // Validate method
  validateHttpMethod(request, ['GET'])

  // Apply rate limiting
  const rateLimitInfo = applyRateLimit(request, { windowMs: 60000, maxRequests: 60 })
  if (rateLimitInfo?.retryAfter) {
    return createSuccessResponse(
      null,
      `Rate limit exceeded. Try again in ${rateLimitInfo.retryAfter} seconds.`
    )
  }

  // Parse query parameters
  const searchParams = parseQueryParams(request)
  const category = getQueryParam(searchParams, 'category', 'all')
  const timeRange = getQueryParam(searchParams, 'range', 'current')

  // Validate enum values
  if (category) {
    validateEnum(category, ['all', 'system', 'api', 'agents', 'cache'], 'category')
  }

  if (timeRange) {
    validateEnum(timeRange, ['current', '1h', '24h', '7d'], 'range')
  }

  // Build cache key
  const cacheKey = `${CacheKeys.METRICS}:${category}:${timeRange}`

  // Get metrics with caching
  const result = await getCachedOrFetch(
    cacheKey,
    async () => {
      // Generate base metrics
      let metrics = generateMockMetrics()
      metrics = enhanceMetrics(metrics)

      // Get cache statistics
      const cache = getCache()
      const cacheStats = cache.stats()
      
      // Update cache metrics with real data
      metrics.cache = {
        hits: cacheStats.valid * 10, // Mock multiplier for demo
        misses: cacheStats.expired * 2,
        hitRate: cacheStats.valid > 0 ? (cacheStats.valid / (cacheStats.valid + cacheStats.expired)) * 100 : 0,
        size: cacheStats.memoryUsage
      }

      // Filter by category if specified
      if (category !== 'all') {
        const filteredMetrics: Partial<PerformanceMetrics> = {
          timestamp: metrics.timestamp
        }

        switch (category) {
          case 'system':
            filteredMetrics.system = metrics.system
            break
          case 'api':
            filteredMetrics.api = metrics.api
            break
          case 'agents':
            filteredMetrics.agents = metrics.agents
            break
          case 'cache':
            filteredMetrics.cache = metrics.cache
            break
        }

        return {
          metrics: filteredMetrics,
          meta: {
            category,
            timeRange,
            generatedAt: new Date().toISOString(),
            uptime: metrics.uptime
          }
        }
      }

      // Add historical data simulation for different time ranges
      const historicalData = generateHistoricalData(timeRange, metrics)

      return {
        metrics,
        historical: historicalData,
        meta: {
          category,
          timeRange,
          generatedAt: new Date().toISOString(),
          dataPoints: historicalData.length,
          uptime: metrics.uptime
        }
      }
    },
    CacheTTLs.SHORT, // Metrics need frequent updates
    [CacheTags.METRICS]
  )

  // Create response with caching headers
  let response = createSuccessResponse(result)
  response = addCacheHeaders(response, 30, 15) // 30 sec cache, 15 sec stale-while-revalidate
  response = addSecurityHeaders(response)

  // Add rate limit headers
  if (rateLimitInfo) {
    response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString())
  }

  // Add metrics metadata headers
  response.headers.set('X-Metrics-Category', category)
  response.headers.set('X-Metrics-Range', timeRange)
  response.headers.set('X-Metrics-Generated', result.meta.generatedAt)

  return response
}

// Generate historical data for different time ranges
function generateHistoricalData(timeRange: string, currentMetrics: PerformanceMetrics) {
  const dataPoints: Array<{
    timestamp: string
    cpu: number
    memory: number
    requests: number
    errors: number
    responseTime: number
  }> = []

  let intervals: number
  let intervalMs: number

  switch (timeRange) {
    case '1h':
      intervals = 12 // Every 5 minutes
      intervalMs = 5 * 60 * 1000
      break
    case '24h':
      intervals = 24 // Every hour
      intervalMs = 60 * 60 * 1000
      break
    case '7d':
      intervals = 7 // Every day
      intervalMs = 24 * 60 * 60 * 1000
      break
    default:
      return []
  }

  const now = Date.now()

  for (let i = intervals - 1; i >= 0; i--) {
    const timestamp = new Date(now - (i * intervalMs))
    
    // Generate realistic variations around current metrics
    const variation = 0.3 // 30% variation
    const cpuBase = currentMetrics.system.cpu.usage
    const memoryBase = currentMetrics.system.memory.percentage
    const requestsBase = currentMetrics.api.requests.perMinute
    const errorsBase = currentMetrics.api.requests.errors
    const responseTimeBase = currentMetrics.api.requests.averageResponseTime

    dataPoints.push({
      timestamp: timestamp.toISOString(),
      cpu: Math.max(0, Math.min(100, cpuBase + (Math.random() - 0.5) * variation * cpuBase)),
      memory: Math.max(0, Math.min(100, memoryBase + (Math.random() - 0.5) * variation * memoryBase)),
      requests: Math.max(0, requestsBase + (Math.random() - 0.5) * variation * requestsBase),
      errors: Math.max(0, errorsBase + (Math.random() - 0.5) * variation * errorsBase),
      responseTime: Math.max(0, responseTimeBase + (Math.random() - 0.5) * variation * responseTimeBase)
    })
  }

  return dataPoints
}

export { withErrorHandler(GET) as GET }