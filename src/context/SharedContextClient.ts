/**
 * SharedContextClient - Client library for agents to connect to SharedContextServer
 * 
 * This client provides agents with:
 * - Easy connection to the shared context server
 * - Automatic differential updates
 * - Context caching and synchronization
 * - Real-time context streaming via WebSocket
 * - Token usage optimization
 */

import * as WebSocket from 'ws';
import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';
import { ContextDiff } from './SharedContextServer';

export interface ClientConfig {
  serverUrl?: string;
  projectId: string;
  agentId: string;
  enableStreaming?: boolean;
  cacheTimeout?: number;
  maxRetries?: number;
}

export interface ContextUpdateEvent {
  version: number;
  changes: ContextDiff;
  fullContext: any;
  timestamp: Date;
}

export class SharedContextClient extends EventEmitter {
  private config: Required<ClientConfig>;
  private httpClient: AxiosInstance;
  private wsClient: WebSocket.WebSocket | null = null;
  private localCache: Map<string, any> = new Map();
  private currentVersion: number = 0;
  private reconnectAttempts: number = 0;
  private connected: boolean = false;

  constructor(config: ClientConfig) {
    super();
    
    this.config = {
      serverUrl: config.serverUrl || 'http://localhost:3003',
      projectId: config.projectId,
      agentId: config.agentId,
      enableStreaming: config.enableStreaming !== false,
      cacheTimeout: config.cacheTimeout || 300000, // 5 minutes
      maxRetries: config.maxRetries || 3
    };

    this.httpClient = axios.create({
      baseURL: this.config.serverUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupErrorHandling();
    
    if (this.config.enableStreaming) {
      this.connectWebSocket();
    }
  }

  /**
   * Get shared context for the project
   */
  async getContext(options: {
    version?: number;
    since?: number;
    useCache?: boolean;
  } = {}): Promise<any> {
    const { version, since, useCache = true } = options;

    // Check cache first
    if (useCache && !version && !since) {
      const cached = this.getCachedContext();
      if (cached) {
        this.emit('cache_hit', { projectId: this.config.projectId });
        return cached;
      }
    }

    try {
      const params: any = {};
      if (version) params.version = version;
      if (since) params.since = since;
      if (this.shouldCompress()) params.compress = 'true';

      const response = await this.httpClient.get(
        `/context/${this.config.projectId}`,
        { params }
      );

      const contextData = response.data;

      // Update local state
      if (!since && contextData.version) {
        this.currentVersion = contextData.version;
        this.setCachedContext(contextData.context, contextData.version);
      }

      this.emit('context_received', {
        projectId: this.config.projectId,
        version: contextData.version,
        size: JSON.stringify(contextData).length
      });

      return contextData.context || contextData;
    } catch (error) {
      this.handleError('getContext', error);
      throw error;
    }
  }

  /**
   * Update context with differential changes
   */
  async updateContext(diff: ContextDiff): Promise<any> {
    try {
      const response = await this.httpClient.post(
        `/context/${this.config.projectId}/diff`,
        diff
      );

      const result = response.data;
      
      if (result.version) {
        this.currentVersion = result.version;
      }

      this.emit('context_updated', {
        projectId: this.config.projectId,
        version: result.version,
        tokensSaved: result.tokensSaved
      });

      return result;
    } catch (error) {
      this.handleError('updateContext', error);
      throw error;
    }
  }

  /**
   * Set complete context (will create diff automatically)
   */
  async setContext(context: any): Promise<any> {
    try {
      const payload = {
        context,
        agentId: this.config.agentId
      };

      const response = await this.httpClient.put(
        `/context/${this.config.projectId}`,
        payload
      );

      const result = response.data;
      
      if (result.version) {
        this.currentVersion = result.version;
        this.setCachedContext(context, result.version);
      }

      this.emit('context_set', {
        projectId: this.config.projectId,
        version: result.version,
        optimized: result.optimized,
        sizeSaved: result.size - result.optimizedSize
      });

      return result;
    } catch (error) {
      this.handleError('setContext', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time context updates
   */
  async subscribeToUpdates(): Promise<void> {
    if (!this.config.enableStreaming) {
      throw new Error('Streaming is disabled');
    }

    if (!this.wsClient || this.wsClient.readyState !== WebSocket.OPEN) {
      await this.connectWebSocket();
    }

    if (this.wsClient?.readyState === WebSocket.OPEN) {
      this.wsClient.send(JSON.stringify({
        type: 'subscribe_to_changes',
        fromVersion: this.currentVersion
      }));
    }
  }

  /**
   * Create context diff from old and new contexts
   */
  createDiff(oldContext: any, newContext: any): ContextDiff {
    const diff: ContextDiff = {
      added: {},
      modified: {},
      removed: [],
      unchanged: []
    };

    const oldKeys = new Set(Object.keys(oldContext || {}));
    const newKeys = new Set(Object.keys(newContext || {}));

    // Find added and modified
    for (const key of Array.from(newKeys)) {
      if (!oldKeys.has(key)) {
        diff.added[key] = newContext[key];
      } else if (JSON.stringify(oldContext[key]) !== JSON.stringify(newContext[key])) {
        diff.modified[key] = newContext[key];
      } else {
        diff.unchanged.push(key);
      }
    }

    // Find removed
    for (const key of Array.from(oldKeys)) {
      if (!newKeys.has(key)) {
        diff.removed.push(key);
      }
    }

    return diff;
  }

  /**
   * Apply context diff to current context
   */
  async applyDiff(diff: ContextDiff): Promise<void> {
    const currentContext = this.getCachedContext() || {};
    
    // Apply changes
    Object.assign(currentContext, diff.added, diff.modified);
    
    // Remove deleted keys
    diff.removed.forEach(key => {
      delete currentContext[key];
    });

    // Update cache
    this.setCachedContext(currentContext, this.currentVersion + 1);
    
    this.emit('diff_applied', {
      projectId: this.config.projectId,
      changes: {
        added: Object.keys(diff.added).length,
        modified: Object.keys(diff.modified).length,
        removed: diff.removed.length
      }
    });
  }

  /**
   * Get context changes since last sync
   */
  async getChangesSince(version: number): Promise<ContextDiff> {
    const response = await this.getContext({ since: version });
    return response.changes || {
      added: {},
      modified: {},
      removed: [],
      unchanged: []
    };
  }

  /**
   * Get client statistics
   */
  getStats(): any {
    return {
      projectId: this.config.projectId,
      agentId: this.config.agentId,
      currentVersion: this.currentVersion,
      connected: this.connected,
      cacheSize: this.localCache.size,
      wsConnected: this.wsClient?.readyState === WebSocket.OPEN,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Disconnect from server
   */
  async disconnect(): Promise<void> {
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = null;
    }
    
    this.connected = false;
    this.emit('disconnected');
  }

  /**
   * Setup WebSocket connection for real-time updates
   */
  private async connectWebSocket(): Promise<void> {
    if (this.wsClient) {
      this.wsClient.close();
    }

    const wsUrl = this.config.serverUrl.replace(/^http/, 'ws') + 
      `/context/stream?projectId=${this.config.projectId}&agentId=${this.config.agentId}`;

    try {
      this.wsClient = new (WebSocket as any)(wsUrl);

      this.wsClient!.on('open', () => {
        console.log(`🔗 Connected to SharedContextServer for ${this.config.projectId}`);
        this.connected = true;
        this.reconnectAttempts = 0;
        this.emit('connected');
      });

      this.wsClient!.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      });

      this.wsClient!.on('close', () => {
        this.connected = false;
        this.emit('disconnected');
        
        if (this.reconnectAttempts < this.config.maxRetries) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connectWebSocket();
          }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
        }
      });

      this.wsClient!.on('error', (error: Error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.emit('error', error);
    }
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'context_snapshot':
        this.currentVersion = message.version;
        this.setCachedContext(message.context, message.version);
        this.emit('context_snapshot', message);
        break;

      case 'context_update':
        if (message.version > this.currentVersion) {
          this.currentVersion = message.version;
          
          if (message.changes) {
            this.applyDiff(message.changes);
          } else if (message.context) {
            this.setCachedContext(message.context, message.version);
          }

          this.emit('context_updated_realtime', {
            version: message.version,
            changes: message.changes,
            fullContext: message.context,
            timestamp: new Date(message.timestamp)
          } as ContextUpdateEvent);
        }
        break;

      case 'context_deleted':
        this.localCache.clear();
        this.currentVersion = 0;
        this.emit('context_deleted');
        break;

      case 'pong':
        // Handle ping/pong for keep-alive
        break;

      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.emit('http_error', error);
        return Promise.reject(error);
      }
    );

    // Setup periodic ping for WebSocket
    if (this.config.enableStreaming) {
      setInterval(() => {
        if (this.wsClient?.readyState === WebSocket.OPEN) {
          this.wsClient.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Ping every 30 seconds
    }
  }

  /**
   * Handle errors with retry logic
   */
  private handleError(operation: string, error: any): void {
    console.error(`SharedContextClient ${operation} error:`, error.message);
    this.emit('error', { operation, error });
  }

  /**
   * Check if response should be compressed
   */
  private shouldCompress(): boolean {
    // Compress if we expect large responses
    return true;
  }

  /**
   * Get cached context
   */
  private getCachedContext(): any | null {
    const cached = this.localCache.get('context');
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached context
   */
  private setCachedContext(context: any, version: number): void {
    this.localCache.set('context', {
      data: context,
      version,
      timestamp: Date.now()
    });
  }

  /**
   * Clear local cache
   */
  clearCache(): void {
    this.localCache.clear();
    this.emit('cache_cleared');
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.connected && (
      !this.config.enableStreaming || 
      this.wsClient?.readyState === WebSocket.OPEN
    );
  }
}