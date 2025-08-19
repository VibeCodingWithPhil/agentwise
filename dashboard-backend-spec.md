# Dashboard Backend Architecture Specification

## 1. API Structure

### RESTful API Design

#### Core Dashboard Endpoints

**Dashboard Data Retrieval**
```
GET /api/v1/dashboards
GET /api/v1/dashboards/:id
GET /api/v1/dashboards/:id/widgets
GET /api/v1/dashboards/:id/data?timerange=7d&filters=category:sales
```

**Widget Management**
```
GET /api/v1/widgets/:id/data
POST /api/v1/widgets
PUT /api/v1/widgets/:id
DELETE /api/v1/widgets/:id
```

**Data Aggregation**
```
GET /api/v1/data/metrics?aggregation=sum&groupBy=date&timerange=30d
GET /api/v1/data/analytics?metric=revenue&dimension=region
POST /api/v1/data/query (Custom queries with filters)
```

**User Preferences**
```
GET /api/v1/users/:id/preferences
PUT /api/v1/users/:id/preferences
GET /api/v1/users/:id/dashboards
POST /api/v1/users/:id/dashboards/:id/clone
```

**Export Functionality**
```
POST /api/v1/exports/dashboard/:id
GET /api/v1/exports/:exportId/status
GET /api/v1/exports/:exportId/download
```

**Real-time Endpoints**
```
WebSocket: /ws/dashboard/:id
Server-Sent Events: /api/v1/dashboard/:id/stream
```

### GraphQL Alternative Schema

```graphql
type Dashboard {
  id: ID!
  name: String!
  widgets: [Widget!]!
  layout: Layout!
  filters: [Filter!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Widget {
  id: ID!
  type: WidgetType!
  title: String!
  config: JSON!
  data(timeRange: TimeRange, filters: [FilterInput]): WidgetData!
}

type Query {
  dashboard(id: ID!): Dashboard
  dashboards(limit: Int, offset: Int): [Dashboard!]!
  metrics(aggregation: AggregationType!, groupBy: GroupByType!): [Metric!]!
  analytics(metric: String!, dimension: String!): [AnalyticsData!]!
}

type Mutation {
  createDashboard(input: DashboardInput!): Dashboard!
  updateWidget(id: ID!, input: WidgetInput!): Widget!
  exportDashboard(id: ID!, format: ExportFormat!): ExportJob!
}

type Subscription {
  dashboardUpdates(id: ID!): DashboardUpdate!
  widgetData(widgetId: ID!): WidgetData!
}
```

## 2. Authentication & Authorization

### JWT-Based Authentication

**Token Structure**
```typescript
interface JWTPayload {
  sub: string; // User ID
  email: string;
  roles: string[];
  permissions: string[];
  exp: number;
  iat: number;
}
```

**Auth Endpoints**
```
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

### Role-Based Access Control (RBAC)

**Role Definitions**
```typescript
enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  ANALYST = 'analyst',
  VIEWER = 'viewer'
}

interface Permission {
  resource: string; // 'dashboard', 'widget', 'data'
  actions: string[]; // ['read', 'write', 'delete', 'export']
}
```

**Authorization Middleware**
```typescript
const authorize = (resource: string, action: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userPermissions = req.user.permissions;
    if (hasPermission(userPermissions, resource, action)) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};
```

### API Key Management

**API Key Structure**
```
GET /api/v1/api-keys
POST /api/v1/api-keys
DELETE /api/v1/api-keys/:id
PUT /api/v1/api-keys/:id/rotate
```

**Rate Limiting by API Key**
```typescript
interface APIKeyLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  allowedEndpoints: string[];
}
```

## 3. Data Flow & Business Logic

### Data Processing Pipeline

```typescript
interface DataPipeline {
  source: DataSource;
  transformations: Transformation[];
  aggregations: Aggregation[];
  cache: CacheStrategy;
}

class DataProcessor {
  async processMetrics(query: MetricQuery): Promise<MetricResult[]> {
    // 1. Validate query parameters
    // 2. Apply security filters based on user permissions
    // 3. Check cache for existing results
    // 4. Execute query against data source
    // 5. Apply transformations and aggregations
    // 6. Cache results with TTL
    // 7. Return formatted data
  }
}
```

### Aggregation Strategies

**Time-based Aggregations**
```typescript
enum AggregationType {
  SUM = 'sum',
  AVG = 'avg',
  COUNT = 'count',
  MIN = 'min',
  MAX = 'max',
  PERCENTILE = 'percentile'
}

interface TimeSeriesAggregation {
  metric: string;
  aggregation: AggregationType;
  interval: '1m' | '5m' | '1h' | '1d' | '1w';
  groupBy?: string[];
}
```

### Caching Strategy

**Multi-Level Caching**
```typescript
interface CacheConfig {
  redis: {
    host: string;
    port: number;
    ttl: {
      dashboardData: 300; // 5 minutes
      widgetData: 60;     // 1 minute
      userPreferences: 3600; // 1 hour
      aggregations: 1800; // 30 minutes
    }
  };
  
  memoryCache: {
    maxSize: string; // '100MB'
    ttl: number;     // 60 seconds
  };
}
```

### Real-time Data Handling

**WebSocket Implementation**
```typescript
class DashboardWebSocketHandler {
  private connections: Map<string, WebSocket[]> = new Map();
  
  async handleConnection(ws: WebSocket, dashboardId: string, userId: string) {
    // Authenticate and authorize user
    // Subscribe to dashboard updates
    // Handle real-time data streaming
  }
  
  async broadcastUpdate(dashboardId: string, update: DashboardUpdate) {
    const connections = this.connections.get(dashboardId) || [];
    connections.forEach(ws => ws.send(JSON.stringify(update)));
  }
}
```

**Server-Sent Events Alternative**
```typescript
app.get('/api/v1/dashboard/:id/stream', authorize('dashboard', 'read'), (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const sendUpdate = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  // Subscribe to dashboard updates
  const unsubscribe = subscribeToUpdates(req.params.id, sendUpdate);
  
  req.on('close', () => {
    unsubscribe();
  });
});
```

## 4. Technology Stack

### Recommended Stack: Node.js + TypeScript

**Core Framework**
```typescript
// Express.js with TypeScript
import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new SocketServer(server);
```

**Database Layer**
```typescript
// PostgreSQL with Prisma ORM
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});
```

**Message Queue: Redis + Bull**
```typescript
import Bull from 'bull';

const dataProcessingQueue = new Bull('data processing', {
  redis: { host: 'localhost', port: 6379 }
});

dataProcessingQueue.process('aggregateMetrics', async (job) => {
  const { dashboardId, timeRange } = job.data;
  return await aggregateMetricsForDashboard(dashboardId, timeRange);
});
```

**Background Job Processing**
```typescript
interface JobTypes {
  'export-dashboard': { dashboardId: string; format: string; userId: string };
  'aggregate-metrics': { metric: string; timeRange: string };
  'send-alert': { alertId: string; recipients: string[] };
}

class JobProcessor {
  async scheduleExport(dashboardId: string, format: string, userId: string) {
    return await dataProcessingQueue.add('export-dashboard', {
      dashboardId,
      format,
      userId
    }, {
      delay: 0,
      attempts: 3,
      backoff: 'exponential'
    });
  }
}
```

### Alternative Stack: Python + FastAPI

```python
from fastapi import FastAPI, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis
from celery import Celery

app = FastAPI(title="Dashboard API", version="1.0.0")

# Background tasks with Celery
celery_app = Celery('dashboard', broker='redis://localhost:6379')

@celery_app.task
def process_dashboard_export(dashboard_id: str, format: str):
    # Export processing logic
    pass
```

## 5. Integration Points

### External Data Sources

```typescript
interface DataSource {
  id: string;
  type: 'database' | 'api' | 'file' | 'stream';
  connection: ConnectionConfig;
  schema: DataSchema;
}

class DataSourceManager {
  private sources: Map<string, DataSource> = new Map();
  
  async connectToSource(source: DataSource): Promise<Connection> {
    switch (source.type) {
      case 'database':
        return new DatabaseConnection(source.connection);
      case 'api':
        return new APIConnection(source.connection);
      case 'stream':
        return new StreamConnection(source.connection);
    }
  }
}
```

### Third-party API Integration

```typescript
class ThirdPartyAPIClient {
  private httpClient: HttpClient;
  private rateLimiter: RateLimiter;
  
  async fetchData(endpoint: string, params: any): Promise<any> {
    await this.rateLimiter.acquire();
    
    try {
      const response = await this.httpClient.get(endpoint, { params });
      return this.transformResponse(response.data);
    } catch (error) {
      throw new APIIntegrationError(`Failed to fetch from ${endpoint}`, error);
    }
  }
}
```

### Webhook Handling

```typescript
app.post('/api/v1/webhooks/:source', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const payload = req.body;
  
  // Verify webhook signature
  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook data
  await webhookProcessor.process(req.params.source, payload);
  
  res.status(200).json({ received: true });
});
```

## 6. Performance Considerations

### Query Optimization

```typescript
class QueryOptimizer {
  async optimizeQuery(query: Query): Promise<OptimizedQuery> {
    return {
      ...query,
      indexes: this.suggestIndexes(query),
      cacheStrategy: this.determineCacheStrategy(query),
      partitioning: this.suggestPartitioning(query)
    };
  }
  
  private suggestIndexes(query: Query): Index[] {
    // Analyze WHERE clauses, JOIN conditions, ORDER BY
    // Return suggested database indexes
  }
}
```

### Response Caching

```typescript
interface CacheStrategy {
  key: string;
  ttl: number;
  invalidationTriggers: string[];
  compressionEnabled: boolean;
}

class ResponseCache {
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set(key: string, data: any, ttl: number): Promise<void> {
    const serialized = JSON.stringify(data);
    await this.redis.setex(key, ttl, serialized);
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const createRateLimiter = (windowMs: number, max: number) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:'
    }),
    windowMs,
    max,
    message: { error: 'Too many requests' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Apply different rate limits
app.use('/api/v1/auth', createRateLimiter(15 * 60 * 1000, 5)); // 5 requests per 15 minutes
app.use('/api/v1/data', createRateLimiter(60 * 1000, 100)); // 100 requests per minute
app.use('/api/v1/exports', createRateLimiter(60 * 60 * 1000, 10)); // 10 exports per hour
```

### Load Balancing Strategy

```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  
  // Stop accepting new connections
  server.close(() => {
    // Close database connections
    prisma.$disconnect();
    
    // Close Redis connections
    redisClient.quit();
    
    process.exit(0);
  });
});
```

## Security Implementation

### Input Validation & Sanitization

```typescript
import Joi from 'joi';

const dashboardQuerySchema = Joi.object({
  timeRange: Joi.string().valid('1h', '24h', '7d', '30d', '90d').required(),
  filters: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(Joi.string(), Joi.number(), Joi.array())
  ),
  aggregation: Joi.string().valid('sum', 'avg', 'count', 'min', 'max'),
  groupBy: Joi.array().items(Joi.string()).max(3)
});

const validateRequest = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }
    next();
  };
};
```

### SQL Injection Prevention

```typescript
// Using Prisma ORM with parameterized queries
class MetricsService {
  async getMetrics(filters: MetricFilters): Promise<Metric[]> {
    return await prisma.metric.findMany({
      where: {
        timestamp: {
          gte: filters.startDate,
          lte: filters.endDate
        },
        category: {
          in: filters.categories
        }
      },
      orderBy: { timestamp: 'desc' }
    });
  }
}
```

## Error Handling & Logging

```typescript
class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
  }
}

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      timestamp: new Date().toISOString()
    });
  }
  
  // Log unexpected errors
  logger.error('Unexpected error:', err);
  
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};

app.use(errorHandler);
```

This comprehensive backend specification provides a solid foundation for implementing a scalable, secure, and performant dashboard application backend.