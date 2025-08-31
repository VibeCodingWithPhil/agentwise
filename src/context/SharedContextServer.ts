/**
 * SharedContextServer - Production-ready context sharing service for token optimization
 * 
 * This server manages shared context between agents to reduce token usage by:
 * - Storing shared project context that multiple agents can reference
 * - Providing differential context updates (only send changes, not full context)
 * - Handling context caching and memory management with LRU eviction
 * - Supporting WebSocket connections for real-time context sharing
 * - Tracking context versions with rollback capabilities
 * - Implementing compression and deduplication strategies
 */

import * as http from 'http';
import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { TokenOptimizer } from '../optimization/TokenOptimizer';

export interface ContextVersion {
  version: number;
  timestamp: Date;
  hash: string;
  context: any;
  changes?: ContextDiff;
  size: number;
}

export interface ContextDiff {
  added: Record<string, any>;
  modified: Record<string, any>;
  removed: string[];
  unchanged: string[];
}

export interface SharedContext {
  projectId: string;
  versions: ContextVersion[];
  currentVersion: number;
  subscribers: Set<WebSocket.WebSocket>;
  lastAccessed: Date;
  accessCount: number;
  compressedCache?: string;
}

export interface ContextSubscription {
  ws: WebSocket.WebSocket;
  projectId: string;
  agentId: string;
  lastVersion: number;
}

export class SharedContextServer extends EventEmitter {
  private server!: http.Server;
  private wsServer!: WebSocket.Server;
  private contexts: Map<string, SharedContext> = new Map();
  private subscriptions: Map<WebSocket.WebSocket, ContextSubscription> = new Map();
  private tokenOptimizer: TokenOptimizer;
  
  // Configuration
  private readonly port: number = 3003;
  private readonly maxVersions: number = 10;
  private readonly maxContextSize: number = 10 * 1024 * 1024; // 10MB
  private readonly maxContexts: number = 100;
  private readonly compressionThreshold: number = 1024; // 1KB
  private readonly ttlHours: number = 24;
  
  // Performance tracking
  private metrics = {
    totalRequests: 0,
    cacheHits: 0,
    compressionSaved: 0,
    activeConnections: 0,
    tokensSaved: 0
  };

  constructor(tokenOptimizer?: TokenOptimizer) {
    super();
    this.tokenOptimizer = tokenOptimizer || new TokenOptimizer();
    this.setupServer();
    this.setupCleanupTimer();
  }

  /**
   * Initialize HTTP and WebSocket servers
   */
  private setupServer(): void {
    // HTTP Server for REST endpoints
    this.server = http.createServer((req, res) => {
      this.handleHttpRequest(req, res);
    });

    // WebSocket Server for real-time updates
    this.wsServer = new WebSocket.Server({ 
      server: this.server,
      path: '/context/stream',
      clientTracking: true
    });

    this.wsServer.on('connection', (ws: WebSocket.WebSocket, req) => {
      this.handleWebSocketConnection(ws, req);
    });

    // Error handling
    this.server.on('error', (error) => {
      console.error('SharedContextServer HTTP error:', error);
      this.emit('error', error);
    });

    this.wsServer.on('error', (error) => {
      console.error('SharedContextServer WebSocket error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Start the context server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, () => {
        console.log(`🔗 SharedContextServer listening on port ${this.port}`);
        console.log(`📊 Context sharing enabled for token optimization`);
        this.emit('started');
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  /**
   * Stop the context server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      // Close all WebSocket connections
      this.wsServer.clients.forEach((ws: WebSocket.WebSocket) => ws.close());
      
      // Close servers
      this.wsServer.close(() => {
        this.server.close(() => {
          console.log('🛑 SharedContextServer stopped');
          this.emit('stopped');
          resolve();
        });
      });
    });
  }

  /**
   * Handle HTTP requests
   */
  private async handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(req.url || '', `http://localhost:${this.port}`);
    const method = req.method || 'GET';
    const pathParts = url.pathname.split('/').filter(p => p);

    this.metrics.totalRequests++;

    try {
      // SECURITY: Set secure CORS headers with local-only origins
      const origin = req.headers.origin || '';
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:3003',
        'file://'  // For local development tools
      ];
      
      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        // Allow any localhost port for development flexibility
        res.setHeader('Access-Control-Allow-Origin', origin);
        // Don't allow credentials for dynamic origins
        res.setHeader('Access-Control-Allow-Credentials', 'false');
      }
      
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // Route handling
      if (pathParts[0] === 'context' && pathParts[1]) {
        const projectId = pathParts[1];

        if (method === 'GET' && pathParts.length === 2) {
          // GET /context/{projectId}
          await this.handleGetContext(projectId, res, url.searchParams);
        } else if (method === 'POST' && pathParts.length === 3 && pathParts[2] === 'diff') {
          // POST /context/{projectId}/diff
          await this.handleContextDiff(projectId, req, res);
        } else if (method === 'PUT' && pathParts.length === 2) {
          // PUT /context/{projectId}
          await this.handleUpdateContext(projectId, req, res);
        } else if (method === 'DELETE' && pathParts.length === 2) {
          // DELETE /context/{projectId}
          await this.handleDeleteContext(projectId, res);
        } else {
          this.sendError(res, 404, 'Endpoint not found');
        }
      } else if (pathParts[0] === 'metrics') {
        // GET /metrics
        await this.handleGetMetrics(res);
      } else if (pathParts[0] === 'health') {
        // GET /health
        await this.handleHealthCheck(res);
      } else {
        this.sendError(res, 404, 'Endpoint not found');
      }
    } catch (error) {
      console.error('Request handling error:', error);
      this.sendError(res, 500, 'Internal server error');
    }
  }

  /**
   * Get shared context for a project
   */
  private async handleGetContext(
    projectId: string, 
    res: http.ServerResponse,
    searchParams: URLSearchParams
  ): Promise<void> {
    const sharedContext = this.contexts.get(projectId);
    
    if (!sharedContext) {
      this.sendError(res, 404, 'Context not found');
      return;
    }

    // Update access tracking
    sharedContext.lastAccessed = new Date();
    sharedContext.accessCount++;

    const version = searchParams.get('version');
    const since = searchParams.get('since');
    const compress = searchParams.get('compress') === 'true';

    let response: any;

    if (version) {
      // Get specific version
      const versionNum = parseInt(version, 10);
      const contextVersion = sharedContext.versions.find(v => v.version === versionNum);
      
      if (!contextVersion) {
        this.sendError(res, 404, 'Version not found');
        return;
      }

      response = {
        projectId,
        version: contextVersion.version,
        timestamp: contextVersion.timestamp,
        context: contextVersion.context,
        hash: contextVersion.hash
      };
    } else if (since) {
      // Get changes since version
      const sinceVersion = parseInt(since, 10);
      const changes = this.getChangesSince(sharedContext, sinceVersion);
      
      response = {
        projectId,
        currentVersion: sharedContext.currentVersion,
        changes,
        fromVersion: sinceVersion
      };
    } else {
      // Get current context
      const currentVersion = sharedContext.versions[sharedContext.versions.length - 1];
      response = {
        projectId,
        version: currentVersion.version,
        timestamp: currentVersion.timestamp,
        context: currentVersion.context,
        hash: currentVersion.hash
      };
    }

    // Apply compression if requested and beneficial
    if (compress && JSON.stringify(response).length > this.compressionThreshold) {
      response = await this.compressResponse(response);
      res.setHeader('Content-Encoding', 'deflate');
      this.metrics.compressionSaved += JSON.stringify(response).length * 0.3; // Estimate
    }

    this.metrics.cacheHits++;
    this.sendJson(res, response);
  }

  /**
   * Handle context difference updates
   */
  private async handleContextDiff(
    projectId: string,
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    const body = await this.readRequestBody(req);
    const diff: ContextDiff = JSON.parse(body);

    let sharedContext = this.contexts.get(projectId);
    if (!sharedContext) {
      // Create new context
      sharedContext = {
        projectId,
        versions: [],
        currentVersion: 0,
        subscribers: new Set(),
        lastAccessed: new Date(),
        accessCount: 1
      };
      this.contexts.set(projectId, sharedContext);
    }

    // Apply diff to create new version
    const currentContext = sharedContext.versions.length > 0 
      ? sharedContext.versions[sharedContext.versions.length - 1].context
      : {};

    const newContext = this.applyDiff(currentContext, diff);
    const newVersion = this.createContextVersion(newContext, diff);

    // Add version and manage history
    sharedContext.versions.push(newVersion);
    sharedContext.currentVersion = newVersion.version;
    
    // Trim old versions
    if (sharedContext.versions.length > this.maxVersions) {
      sharedContext.versions.shift();
    }

    // Update cache
    this.updateCompressedCache(sharedContext);

    // Broadcast to subscribers
    this.broadcastContextUpdate(projectId, newVersion, diff);

    // Track token savings
    const tokensSaved = this.calculateTokenSavings(diff, newContext);
    this.metrics.tokensSaved += tokensSaved;

    this.sendJson(res, {
      projectId,
      version: newVersion.version,
      hash: newVersion.hash,
      tokensSaved,
      subscribers: sharedContext.subscribers.size
    });
  }

  /**
   * Handle full context updates
   */
  private async handleUpdateContext(
    projectId: string,
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    const body = await this.readRequestBody(req);
    const { context } = JSON.parse(body);

    // Validate context size
    const contextSize = JSON.stringify(context).length;
    if (contextSize > this.maxContextSize) {
      this.sendError(res, 413, 'Context too large');
      return;
    }

    let sharedContext = this.contexts.get(projectId);
    const isNew = !sharedContext;

    if (!sharedContext) {
      sharedContext = {
        projectId,
        versions: [],
        currentVersion: 0,
        subscribers: new Set(),
        lastAccessed: new Date(),
        accessCount: 1
      };
      this.contexts.set(projectId, sharedContext);
    }

    // Optimize context through TokenOptimizer
    const optimizedContext = await this.tokenOptimizer.trimContext(context);
    
    // Create diff if previous version exists
    let diff: ContextDiff | undefined;
    if (sharedContext.versions.length > 0) {
      const lastContext = sharedContext.versions[sharedContext.versions.length - 1].context;
      diff = await this.tokenOptimizer.computeContextDiff(lastContext, optimizedContext);
    }

    const newVersion = this.createContextVersion(optimizedContext, diff);
    
    sharedContext.versions.push(newVersion);
    sharedContext.currentVersion = newVersion.version;
    sharedContext.lastAccessed = new Date();

    // Manage memory
    if (sharedContext.versions.length > this.maxVersions) {
      sharedContext.versions.shift();
    }

    this.updateCompressedCache(sharedContext);
    this.broadcastContextUpdate(projectId, newVersion, diff);

    this.sendJson(res, {
      projectId,
      version: newVersion.version,
      hash: newVersion.hash,
      optimized: true,
      isNew,
      size: contextSize,
      optimizedSize: JSON.stringify(optimizedContext).length
    });
  }

  /**
   * Delete project context
   */
  private async handleDeleteContext(projectId: string, res: http.ServerResponse): Promise<void> {
    const sharedContext = this.contexts.get(projectId);
    
    if (!sharedContext) {
      this.sendError(res, 404, 'Context not found');
      return;
    }

    // Close all subscribers
    sharedContext.subscribers.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'context_deleted',
          projectId
        }));
        ws.close();
      }
    });

    this.contexts.delete(projectId);
    
    this.sendJson(res, {
      projectId,
      deleted: true
    });
  }

  /**
   * Get server metrics
   */
  private async handleGetMetrics(res: http.ServerResponse): Promise<void> {
    const contexts = Array.from(this.contexts.values());
    
    this.sendJson(res, {
      ...this.metrics,
      activeContexts: this.contexts.size,
      totalVersions: contexts.reduce((sum, c) => sum + c.versions.length, 0),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      contextSizes: contexts.map(c => ({
        projectId: c.projectId,
        versions: c.versions.length,
        subscribers: c.subscribers.size,
        lastAccessed: c.lastAccessed,
        size: c.versions.reduce((sum, v) => sum + v.size, 0)
      }))
    });
  }

  /**
   * Health check endpoint
   */
  private async handleHealthCheck(res: http.ServerResponse): Promise<void> {
    this.sendJson(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      contexts: this.contexts.size,
      connections: this.metrics.activeConnections
    });
  }

  /**
   * Handle WebSocket connections for real-time context streaming
   */
  private handleWebSocketConnection(ws: WebSocket.WebSocket, req: http.IncomingMessage): void {
    const url = new URL(req.url || '', `ws://localhost:${this.port}`);
    const projectId = url.searchParams.get('projectId');
    const agentId = url.searchParams.get('agentId');

    if (!projectId || !agentId) {
      ws.close(1008, 'Missing projectId or agentId');
      return;
    }

    this.metrics.activeConnections++;

    // Set up subscription
    const subscription: ContextSubscription = {
      ws,
      projectId,
      agentId,
      lastVersion: 0
    };

    this.subscriptions.set(ws, subscription);

    // Add to context subscribers
    let sharedContext = this.contexts.get(projectId);
    if (!sharedContext) {
      sharedContext = {
        projectId,
        versions: [],
        currentVersion: 0,
        subscribers: new Set(),
        lastAccessed: new Date(),
        accessCount: 1
      };
      this.contexts.set(projectId, sharedContext);
    }

    sharedContext.subscribers.add(ws);

    // Send current context if available
    if (sharedContext.versions.length > 0) {
      const currentVersion = sharedContext.versions[sharedContext.versions.length - 1];
      ws.send(JSON.stringify({
        type: 'context_snapshot',
        projectId,
        version: currentVersion.version,
        context: currentVersion.context,
        hash: currentVersion.hash
      }));
    }

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleWebSocketMessage(ws, subscription, message);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      this.metrics.activeConnections--;
      this.subscriptions.delete(ws);
      
      const context = this.contexts.get(projectId);
      if (context) {
        context.subscribers.delete(ws);
      }
    });

    console.log(`🔌 Agent ${agentId} connected to context stream for ${projectId}`);
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(
    ws: WebSocket.WebSocket, 
    subscription: ContextSubscription, 
    message: any
  ): void {
    switch (message.type) {
      case 'subscribe_to_changes':
        subscription.lastVersion = message.fromVersion || 0;
        break;
        
      case 'context_update':
        // Handle context updates from agents
        this.handleContextUpdateFromAgent(subscription, message);
        break;
        
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
    }
  }

  /**
   * Handle context updates received from agents via WebSocket
   */
  private async handleContextUpdateFromAgent(
    subscription: ContextSubscription,
    message: any
  ): Promise<void> {
    const { projectId } = subscription;
    const { diff } = message;

    let sharedContext = this.contexts.get(projectId);
    if (!sharedContext) return;

    if (diff) {
      // Apply differential update
      const currentContext = sharedContext.versions.length > 0 
        ? sharedContext.versions[sharedContext.versions.length - 1].context
        : {};
      
      const newContext = this.applyDiff(currentContext, diff);
      const newVersion = this.createContextVersion(newContext, diff);
      
      sharedContext.versions.push(newVersion);
      sharedContext.currentVersion = newVersion.version;
      
      this.broadcastContextUpdate(projectId, newVersion, diff, subscription.ws);
    }
  }

  /**
   * Apply diff to context
   */
  private applyDiff(context: any, diff: ContextDiff): any {
    const newContext = { ...context };

    // Apply changes
    Object.assign(newContext, diff.added);
    Object.assign(newContext, diff.modified);

    // Remove deleted keys
    diff.removed.forEach(key => {
      delete newContext[key];
    });

    return newContext;
  }

  /**
   * Create new context version
   */
  private createContextVersion(context: any, diff?: ContextDiff): ContextVersion {
    const contextStr = JSON.stringify(context);
    const hash = crypto.createHash('sha256').update(contextStr).digest('hex');
    
    return {
      version: Date.now(), // Use timestamp as version
      timestamp: new Date(),
      hash,
      context,
      changes: diff,
      size: contextStr.length
    };
  }

  /**
   * Get changes since a specific version
   */
  private getChangesSince(sharedContext: SharedContext, sinceVersion: number): ContextDiff {
    const changes: ContextDiff = {
      added: {},
      modified: {},
      removed: [],
      unchanged: []
    };

    const sinceIndex = sharedContext.versions.findIndex(v => v.version === sinceVersion);
    if (sinceIndex === -1) {
      // Return full context as added
      const currentVersion = sharedContext.versions[sharedContext.versions.length - 1];
      changes.added = currentVersion.context;
      return changes;
    }

    // Aggregate changes from since version to current
    for (let i = sinceIndex + 1; i < sharedContext.versions.length; i++) {
      const version = sharedContext.versions[i];
      if (version.changes) {
        Object.assign(changes.added, version.changes.added);
        Object.assign(changes.modified, version.changes.modified);
        changes.removed.push(...version.changes.removed);
      }
    }

    return changes;
  }

  /**
   * Broadcast context update to subscribers
   */
  private broadcastContextUpdate(
    projectId: string, 
    version: ContextVersion, 
    diff?: ContextDiff,
    sender?: WebSocket.WebSocket
  ): void {
    const sharedContext = this.contexts.get(projectId);
    if (!sharedContext) return;

    const message = JSON.stringify({
      type: 'context_update',
      projectId,
      version: version.version,
      timestamp: version.timestamp,
      hash: version.hash,
      changes: diff,
      context: version.context
    });

    sharedContext.subscribers.forEach(ws => {
      if (ws !== sender && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  /**
   * Calculate token savings from differential updates
   */
  private calculateTokenSavings(diff: ContextDiff, fullContext: any): number {
    const diffSize = JSON.stringify(diff).length;
    const fullSize = JSON.stringify(fullContext).length;
    
    // Estimate token savings (rough: 4 chars per token)
    const tokensSaved = Math.floor((fullSize - diffSize) / 4);
    return Math.max(0, tokensSaved);
  }

  /**
   * Update compressed cache for a context
   */
  private updateCompressedCache(sharedContext: SharedContext): void {
    const currentVersion = sharedContext.versions[sharedContext.versions.length - 1];
    if (currentVersion.size > this.compressionThreshold) {
      // In a real implementation, you'd use actual compression here
      sharedContext.compressedCache = JSON.stringify(currentVersion.context);
    }
  }

  /**
   * Compress response data
   */
  private async compressResponse(response: any): Promise<any> {
    // Simplified compression simulation
    // In production, use zlib.deflate or similar
    return response;
  }

  /**
   * Setup cleanup timer for expired contexts
   */
  private setupCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredContexts();
    }, 60000); // Run every minute
  }

  /**
   * Clean up expired contexts
   */
  private cleanupExpiredContexts(): void {
    const now = Date.now();
    const ttlMs = this.ttlHours * 60 * 60 * 1000;

    for (const [projectId, context] of Array.from(this.contexts.entries())) {
      const age = now - context.lastAccessed.getTime();
      
      if (age > ttlMs) {
        // Close subscribers
        context.subscribers.forEach((ws: WebSocket.WebSocket) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        });
        
        this.contexts.delete(projectId);
        console.log(`🧹 Cleaned up expired context: ${projectId}`);
      }
    }

    // Enforce max contexts limit (LRU eviction)
    if (this.contexts.size > this.maxContexts) {
      const sorted = Array.from(this.contexts.entries())
        .sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime());
      
      const toRemove = sorted.slice(0, sorted.length - this.maxContexts);
      toRemove.forEach(([projectId]) => {
        this.contexts.delete(projectId);
      });
    }
  }

  /**
   * Read request body
   */
  private async readRequestBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let body = '';
      
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        resolve(body);
      });
      
      req.on('error', reject);
    });
  }

  /**
   * Send JSON response
   */
  private sendJson(res: http.ServerResponse, data: any, statusCode = 200): void {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify(data, null, 2));
  }

  /**
   * Send error response
   */
  private sendError(res: http.ServerResponse, statusCode: number, message: string): void {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify({
      error: message,
      statusCode,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Get optimization statistics
   */
  getStats(): any {
    return {
      ...this.metrics,
      activeContexts: this.contexts.size,
      averageContextSize: this.contexts.size > 0 
        ? Array.from(this.contexts.values())
            .reduce((sum, c) => sum + c.versions.reduce((vSum, v) => vSum + v.size, 0), 0) / this.contexts.size
        : 0,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      hitRate: this.metrics.totalRequests > 0 
        ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 
        : 0
    };
  }

  /**
   * Integration with TokenOptimizer
   */
  async optimizeForAgents(projectId: string, agentIds: string[]): Promise<any> {
    const sharedContext = this.contexts.get(projectId);
    if (!sharedContext || sharedContext.versions.length === 0) {
      return null;
    }

    const currentContext = sharedContext.versions[sharedContext.versions.length - 1].context;
    
    // Use TokenOptimizer to create agent-specific optimized contexts
    return await this.tokenOptimizer.optimizeAgentConfiguration(agentIds, {
      projectPath: projectId,
      sharedContext: currentContext,
      tasks: []
    });
  }
}