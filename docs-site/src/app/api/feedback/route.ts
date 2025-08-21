import { NextRequest } from 'next/server'
import { 
  withErrorHandler, 
  createSuccessResponse,
  createErrorResponse,
  addSecurityHeaders,
  validateHttpMethod,
  parseRequestBody,
  applyRateLimit,
  handleCors,
  validateRequired,
  validateEmail,
  validateLength,
  validateEnum,
  ApiException
} from '@/lib/api-utils'
import { Feedback } from '@/types/api'

// In-memory storage for demo purposes
// In production, this would be stored in a database
const feedbackStorage: Feedback[] = []
let nextFeedbackId = 1

async function POST(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  // Validate method
  validateHttpMethod(request, ['POST'])

  // Apply stricter rate limiting for feedback submission
  const rateLimitInfo = applyRateLimit(request, { windowMs: 60000, maxRequests: 5 })
  if (rateLimitInfo?.retryAfter) {
    throw new ApiException(
      `Rate limit exceeded. You can only submit 5 feedback items per minute. Try again in ${rateLimitInfo.retryAfter} seconds.`,
      429,
      'RATE_LIMIT_EXCEEDED'
    )
  }

  try {
    // Parse request body
    const body = await parseRequestBody<Partial<Feedback>>(request)

    // Validate required fields
    validateRequired(body.type, 'type')
    validateRequired(body.subject, 'subject')
    validateRequired(body.message, 'message')
    validateRequired(body.severity, 'severity')

    // Validate enum values
    validateEnum(body.type as string, ['bug', 'feature', 'improvement', 'question', 'other'], 'type')
    validateEnum(body.severity as string, ['low', 'medium', 'high', 'critical'], 'severity')

    // Validate field lengths
    validateLength(body.subject as string, 5, 200, 'subject')
    validateLength(body.message as string, 20, 2000, 'message')

    // Validate email if provided
    if (body.email) {
      validateEmail(body.email, 'email')
      validateLength(body.email, 5, 100, 'email')
    }

    // Validate page URL if provided
    if (body.page) {
      validateLength(body.page, 1, 500, 'page')
    }

    // Get client information
    const userAgent = request.headers.get('user-agent') || undefined
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                    request.headers.get('x-real-ip') || 'unknown'

    // Create feedback object
    const feedback: Feedback = {
      id: `feedback-${nextFeedbackId++}`,
      type: body.type as Feedback['type'],
      subject: body.subject as string,
      message: body.message as string,
      email: body.email,
      page: body.page,
      userAgent,
      severity: body.severity as Feedback['severity'],
      metadata: {
        clientIP,
        timestamp: new Date().toISOString(),
        ...body.metadata
      },
      status: 'open',
      createdAt: new Date().toISOString()
    }

    // Store feedback (in production, this would go to a database)
    feedbackStorage.push(feedback)

    // Log feedback for monitoring (in production, you might want to use a proper logging service)
    console.log('New feedback received:', {
      id: feedback.id,
      type: feedback.type,
      severity: feedback.severity,
      subject: feedback.subject.substring(0, 50) + '...',
      hasEmail: !!feedback.email,
      clientIP
    })

    // Send notification for critical feedback (in production, integrate with alerting system)
    if (feedback.severity === 'critical') {
      console.warn('CRITICAL FEEDBACK RECEIVED:', {
        id: feedback.id,
        subject: feedback.subject,
        message: feedback.message.substring(0, 100) + '...'
      })
    }

    // Prepare response (don't include sensitive information)
    const responseData = {
      id: feedback.id,
      type: feedback.type,
      subject: feedback.subject,
      severity: feedback.severity,
      status: feedback.status,
      createdAt: feedback.createdAt,
      estimatedResponse: getEstimatedResponseTime(feedback.severity, feedback.type)
    }

    // Create response
    let response = createSuccessResponse(responseData, 'Feedback submitted successfully. Thank you!')
    response = addSecurityHeaders(response)

    // Add rate limit headers
    if (rateLimitInfo) {
      response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString())
    }

    // Add feedback tracking header
    response.headers.set('X-Feedback-ID', feedback.id)
    response.headers.set('X-Feedback-Status', feedback.status)

    return response

  } catch (error) {
    console.error('Error processing feedback:', error)
    
    // Return appropriate error response
    if (error instanceof ApiException) {
      return createErrorResponse(error.message, error.statusCode)
    }
    
    return createErrorResponse('Failed to process feedback. Please try again later.', 500)
  }
}

async function GET(request: NextRequest) {
  // Handle CORS
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  // This endpoint would typically be admin-only
  // For demo purposes, we'll return basic statistics
  
  validateHttpMethod(request, ['GET'])

  const rateLimitInfo = applyRateLimit(request)
  if (rateLimitInfo?.retryAfter) {
    throw new ApiException(
      `Rate limit exceeded. Try again in ${rateLimitInfo.retryAfter} seconds.`,
      429,
      'RATE_LIMIT_EXCEEDED'
    )
  }

  // Generate statistics
  const stats = {
    total: feedbackStorage.length,
    byType: {
      bug: feedbackStorage.filter(f => f.type === 'bug').length,
      feature: feedbackStorage.filter(f => f.type === 'feature').length,
      improvement: feedbackStorage.filter(f => f.type === 'improvement').length,
      question: feedbackStorage.filter(f => f.type === 'question').length,
      other: feedbackStorage.filter(f => f.type === 'other').length
    },
    bySeverity: {
      low: feedbackStorage.filter(f => f.severity === 'low').length,
      medium: feedbackStorage.filter(f => f.severity === 'medium').length,
      high: feedbackStorage.filter(f => f.severity === 'high').length,
      critical: feedbackStorage.filter(f => f.severity === 'critical').length
    },
    byStatus: {
      open: feedbackStorage.filter(f => f.status === 'open').length,
      in_progress: feedbackStorage.filter(f => f.status === 'in_progress').length,
      resolved: feedbackStorage.filter(f => f.status === 'resolved').length,
      closed: feedbackStorage.filter(f => f.status === 'closed').length
    },
    recent: feedbackStorage
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(f => ({
        id: f.id,
        type: f.type,
        severity: f.severity,
        subject: f.subject,
        createdAt: f.createdAt,
        status: f.status
      }))
  }

  let response = createSuccessResponse(stats)
  response = addSecurityHeaders(response)

  if (rateLimitInfo) {
    response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString())
  }

  return response
}

// Helper function to estimate response time based on feedback attributes
function getEstimatedResponseTime(severity: Feedback['severity'], type: Feedback['type']): string {
  if (severity === 'critical') {
    return 'Within 2 hours'
  } else if (severity === 'high') {
    return 'Within 24 hours'
  } else if (type === 'bug') {
    return 'Within 3-5 business days'
  } else if (type === 'question') {
    return 'Within 2-3 business days'
  } else {
    return 'Within 1-2 weeks'
  }
}

export { 
  withErrorHandler(POST) as POST,
  withErrorHandler(GET) as GET
}