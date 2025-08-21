import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, ApiError, RateLimit, RateLimitInfo, ValidationRule } from '@/types/api'

// Error Handling
export class ApiException extends Error {
  public statusCode: number
  public code: string

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.name = 'ApiException'
  }
}

export function createApiResponse<T>(
  data?: T,
  success: boolean = true,
  message?: string,
  error?: string
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    message,
    timestamp: new Date().toISOString()
  }
}

export function createErrorResponse(
  error: string | ApiError | Error,
  statusCode: number = 500
): NextResponse<ApiResponse> {
  let errorMessage: string
  let errorCode: string = 'INTERNAL_ERROR'

  if (typeof error === 'string') {
    errorMessage = error
  } else if (error instanceof ApiException) {
    errorMessage = error.message
    errorCode = error.code
    statusCode = error.statusCode
  } else if (error instanceof Error) {
    errorMessage = error.message
  } else {
    errorMessage = (error as ApiError).message
    errorCode = (error as ApiError).code
  }

  return NextResponse.json(
    createApiResponse(null, false, undefined, errorMessage),
    { status: statusCode }
  )
}

// Validation
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ApiException(`${fieldName} is required`, 400, 'VALIDATION_ERROR')
  }
}

export function validateEmail(email: string, fieldName: string = 'email'): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ApiException(`${fieldName} must be a valid email address`, 400, 'VALIDATION_ERROR')
  }
}

export function validateLength(
  value: string,
  min: number,
  max: number,
  fieldName: string
): void {
  if (value.length < min || value.length > max) {
    throw new ApiException(
      `${fieldName} must be between ${min} and ${max} characters`,
      400,
      'VALIDATION_ERROR'
    )
  }
}

export function validateEnum<T extends string>(
  value: string,
  validValues: T[],
  fieldName: string
): value is T {
  if (!validValues.includes(value as T)) {
    throw new ApiException(
      `${fieldName} must be one of: ${validValues.join(', ')}`,
      400,
      'VALIDATION_ERROR'
    )
  }
  return true
}

export function validateFields(data: any, rules: ValidationRule[]): void {
  for (const rule of rules) {
    const value = data[rule.field]

    for (const ruleType of rule.rules) {
      switch (ruleType) {
        case 'required':
          validateRequired(value, rule.field)
          break
        case 'email':
          if (value) validateEmail(value, rule.field)
          break
        case 'minLength':
          // This would need additional parameters in a real implementation
          break
        case 'maxLength':
          // This would need additional parameters in a real implementation
          break
        case 'pattern':
          // This would need additional parameters in a real implementation
          break
      }
    }
  }
}

// Request parsing
export async function parseRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json()
    return body as T
  } catch (error) {
    throw new ApiException('Invalid JSON in request body', 400, 'INVALID_JSON')
  }
}

export function parseQueryParams(request: NextRequest): URLSearchParams {
  return new URL(request.url).searchParams
}

export function getQueryParam(
  searchParams: URLSearchParams,
  key: string,
  defaultValue?: string
): string | undefined {
  return searchParams.get(key) || defaultValue
}

export function getQueryParamAsNumber(
  searchParams: URLSearchParams,
  key: string,
  defaultValue?: number
): number {
  const value = searchParams.get(key)
  if (!value) return defaultValue || 0

  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    throw new ApiException(`${key} must be a valid number`, 400, 'VALIDATION_ERROR')
  }

  return parsed
}

// Rate Limiting (simple in-memory implementation)
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  identifier: string,
  config: RateLimit
): RateLimitInfo | null {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now > entry.resetTime) {
    // Reset or create new entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs
    })

    return {
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: now + config.windowMs
    }
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      limit: config.maxRequests,
      remaining: 0,
      reset: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(identifier, entry)

  return {
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    reset: entry.resetTime
  }
}

export function applyRateLimit(
  request: NextRequest,
  config: RateLimit = { windowMs: 60000, maxRequests: 100 }
): RateLimitInfo | null {
  // Get client identifier (IP address or other)
  const identifier = getClientIdentifier(request)
  return checkRateLimit(identifier, config)
}

export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  
  return ip.trim()
}

// Response helpers
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  headers?: HeadersInit
): NextResponse<ApiResponse<T>> {
  const response = NextResponse.json(createApiResponse(data, true, message))
  
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value.toString())
    })
  }

  return response
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

export function addCacheHeaders(
  response: NextResponse,
  maxAge: number = 300,
  staleWhileRevalidate: number = 60
): NextResponse {
  response.headers.set(
    'Cache-Control',
    `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  )
  
  return response
}

// Method validation
export function validateHttpMethod(
  request: NextRequest,
  allowedMethods: string[]
): void {
  if (!allowedMethods.includes(request.method)) {
    throw new ApiException(
      `Method ${request.method} not allowed`,
      405,
      'METHOD_NOT_ALLOWED'
    )
  }
}

// Async error handler wrapper
export function withErrorHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request)
    } catch (error) {
      console.error('API Error:', error)
      return createErrorResponse(error as Error)
    }
  }
}

// CORS headers
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  return response
}

export function handleCors(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    return addCorsHeaders(response)
  }
  return null
}