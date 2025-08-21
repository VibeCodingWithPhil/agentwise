// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Documentation Types
export interface DocMatter {
  title?: string
  description?: string
  date?: string
  tags?: string[]
  category?: string
  order?: number
  slug?: string
  readingTime?: number
}

export interface DocPage {
  slug: string
  content: string
  data: DocMatter
  excerpt?: string
  tableOfContents?: TableOfContentsItem[]
  lastModified?: string
  wordCount?: number
}

export interface TableOfContentsItem {
  id: string
  title: string
  level: number
  children?: TableOfContentsItem[]
}

// Search Types
export interface SearchResult {
  type: 'doc' | 'command' | 'agent'
  title: string
  slug: string
  excerpt: string
  category?: string
  score: number
  highlights: string[]
}

export interface SearchQuery {
  query: string
  type?: 'all' | 'docs' | 'commands' | 'agents'
  limit?: number
  offset?: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  suggestions?: string[]
  facets: {
    categories: Array<{ name: string; count: number }>
    types: Array<{ name: string; count: number }>
  }
}

// Command Types
export interface Command {
  name: string
  syntax: string
  description: string
  examples: Array<{
    command: string
    description: string
  }>
  options?: Array<{
    flag: string
    description: string
  }>
  category: string
  tags?: string[]
  version?: string
  deprecated?: boolean
}

// Agent Types
export interface Agent {
  id: string
  name: string
  description: string
  capabilities: string[]
  category: string
  version: string
  status: 'active' | 'inactive' | 'deprecated'
  tags: string[]
  documentation?: string
  examples?: Array<{
    title: string
    description: string
    usage: string
  }>
  dependencies?: string[]
  requirements?: {
    memory?: string
    cpu?: string
    disk?: string
  }
  lastUpdated: string
  downloadCount?: number
  rating?: number
}

// Performance Metrics Types
export interface PerformanceMetrics {
  system: {
    cpu: {
      usage: number
      cores: number
      model: string
    }
    memory: {
      total: number
      used: number
      free: number
      percentage: number
    }
    disk: {
      total: number
      used: number
      free: number
      percentage: number
    }
  }
  api: {
    requests: {
      total: number
      perMinute: number
      perHour: number
      errors: number
      averageResponseTime: number
    }
    endpoints: Array<{
      path: string
      method: string
      requests: number
      averageResponseTime: number
      errors: number
    }>
  }
  agents: {
    active: number
    total: number
    averageExecutionTime: number
    successRate: number
  }
  cache: {
    hits: number
    misses: number
    hitRate: number
    size: number
  }
  uptime: number
  timestamp: string
}

// MCP Server Types
export interface MCPServer {
  id: string
  name: string
  description: string
  version: string
  status: 'active' | 'inactive' | 'error'
  url: string
  capabilities: Array<{
    name: string
    description: string
    type: 'tool' | 'resource' | 'prompt'
  }>
  configuration?: Record<string, any>
  healthCheck?: {
    lastCheck: string
    status: 'healthy' | 'unhealthy' | 'unknown'
    responseTime: number
  }
  metrics?: {
    requests: number
    errors: number
    averageResponseTime: number
  }
  documentation?: string
  examples?: Array<{
    title: string
    description: string
    request: string
    response: string
  }>
}

// Feedback Types
export interface Feedback {
  id?: string
  type: 'bug' | 'feature' | 'improvement' | 'question' | 'other'
  subject: string
  message: string
  email?: string
  page?: string
  userAgent?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, any>
  status?: 'open' | 'in_progress' | 'resolved' | 'closed'
  createdAt: string
}

// Cache Types
export interface CacheEntry<T = any> {
  key: string
  data: T
  expiry: number
  tags?: string[]
}

// Error Types
export interface ApiError {
  code: string
  message: string
  details?: any
  stack?: string
}

// Validation Types
export interface ValidationRule {
  field: string
  rules: Array<'required' | 'email' | 'minLength' | 'maxLength' | 'pattern'>
  message?: string
}

// Rate Limiting Types
export interface RateLimit {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}