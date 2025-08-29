/**
 * Advanced Multi-Layer Cache Manager
 * Production-grade caching with L1 (memory), L2 (disk), L3 (compressed) layers
 */

import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import * as zlib from 'zlib';
import { LRUCache } from 'lru-cache';

export interface CacheConfig {
  l1MaxSize: number; // L1 cache max entries
  l2MaxSizeMB: number; // L2 cache max size in MB
  l3MaxSizeMB: number; // L3 compressed cache max size in MB
  ttlSeconds: number; // Default TTL in seconds
  compressionThreshold: number; // Size threshold for compression in bytes
  similarityThreshold: number; // Similarity threshold for query detection
  enableCompression: boolean;
  enableSimilarityDetection: boolean;
  persistToDisk: boolean;
  cacheDir: string;
  environment: 'development' | 'staging' | 'production';
}

export interface CacheEntry {
  key: string;
  value: any;
  size: number;
  createdAt: Date;
  lastAccessed: Date;
  hitCount: number;
  ttl: number;
  compressed: boolean;
  similarity?: number;
}

export interface CacheStats {
  l1: {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: number;
  };
  l2: {
    sizeMB: number;
    maxSizeMB: number;
    hitRate: number;
    entries: number;
  };
  l3: {
    sizeMB: number;
    maxSizeMB: number;
    hitRate: number;
    entries: number;
    compressionRatio: number;
  };
  overall: {
    totalHits: number;
    totalMisses: number;
    hitRate: number;
    evictions: number;
    similarityDetections: number;
  };
}

export interface SimilarQuery {
  original: string;
  similar: string;
  similarity: number;
  cacheKey: string;
}

export class AdvancedCacheManager extends EventEmitter {
  private config: CacheConfig;
  
  // L1 Cache: In-memory LRU cache
  private l1Cache!: LRUCache<string, CacheEntry>;
  
  // L2 Cache: Disk-based cache
  private l2CacheDir!: string;
  private l2Index: Map<string, { file: string; size: number; createdAt: Date; lastAccessed: Date }> = new Map();
  
  // L3 Cache: Compressed disk cache
  private l3CacheDir!: string;
  private l3Index: Map<string, { file: string; size: number; originalSize: number; createdAt: Date; lastAccessed: Date }> = new Map();
  
  // Query similarity detection
  private queryCache: Map<string, { hash: string; tokens: string[] }> = new Map();
  private similarQueries: SimilarQuery[] = [];
  
  // Statistics
  private stats = {
    l1Hits: 0, l1Misses: 0, l1Evictions: 0,
    l2Hits: 0, l2Misses: 0, l2Evictions: 0,
    l3Hits: 0, l3Misses: 0, l3Evictions: 0,
    similarityDetections: 0,
    totalSets: 0
  };
  
  // Maintenance
  private cleanupInterval: NodeJS.Timeout | null = null;
  private warmupQueue: Array<{ key: string; priority: number }> = [];

  constructor(config: Partial<CacheConfig> = {}) {
    super();
    
    this.config = {
      l1MaxSize: config.l1MaxSize || 1000,
      l2MaxSizeMB: config.l2MaxSizeMB || 500,
      l3MaxSizeMB: config.l3MaxSizeMB || 1000,
      ttlSeconds: config.ttlSeconds || 3600, // 1 hour
      compressionThreshold: config.compressionThreshold || 1024, // 1KB
      similarityThreshold: config.similarityThreshold || 0.8,
      enableCompression: config.enableCompression !== false,
      enableSimilarityDetection: config.enableSimilarityDetection !== false,
      persistToDisk: config.persistToDisk !== false,
      cacheDir: config.cacheDir || path.join(process.cwd(), '.cache'),
      environment: config.environment || 'development'
    };

    this.initializeCaches();
    this.startMaintenance();
  }

  /**
   * Initialize all cache layers
   */
  private async initializeCaches(): Promise<void> {
    // Initialize L1 cache (memory)
    this.l1Cache = new LRUCache({
      max: this.config.l1MaxSize,
      dispose: (entry: CacheEntry, key: string) => {
        this.stats.l1Evictions++;
        this.promoteToL2(key, entry);
        this.emit('l1Eviction', { key, entry });
      }
    });

    if (this.config.persistToDisk) {
      // Initialize L2 cache directory (disk)
      this.l2CacheDir = path.join(this.config.cacheDir, 'l2');
      await fs.ensureDir(this.l2CacheDir);
      
      // Initialize L3 cache directory (compressed)
      this.l3CacheDir = path.join(this.config.cacheDir, 'l3');
      await fs.ensureDir(this.l3CacheDir);
      
      // Load existing cache indexes
      await this.loadCacheIndexes();
    }

    console.log(`💾 Advanced Cache Manager initialized (${this.config.environment})`);
    console.log(`📊 L1: ${this.config.l1MaxSize} entries, L2: ${this.config.l2MaxSizeMB}MB, L3: ${this.config.l3MaxSizeMB}MB`);
  }

  /**
   * Load existing cache indexes from disk
   */
  private async loadCacheIndexes(): Promise<void> {
    try {
      // Load L2 index
      const l2IndexPath = path.join(this.l2CacheDir, 'index.json');
      if (await fs.pathExists(l2IndexPath)) {
        const l2Data = await fs.readJSON(l2IndexPath);
        this.l2Index = new Map(l2Data);
      }
      
      // Load L3 index
      const l3IndexPath = path.join(this.l3CacheDir, 'index.json');
      if (await fs.pathExists(l3IndexPath)) {
        const l3Data = await fs.readJSON(l3IndexPath);
        this.l3Index = new Map(l3Data);
      }
      
      console.log(`📥 Loaded cache indexes: L2(${this.l2Index.size}), L3(${this.l3Index.size})`);
    } catch (error) {
      console.warn('Failed to load cache indexes:', error);
    }
  }

  /**
   * Save cache indexes to disk
   */
  private async saveCacheIndexes(): Promise<void> {
    if (!this.config.persistToDisk) return;
    
    try {
      // Save L2 index
      const l2IndexPath = path.join(this.l2CacheDir, 'index.json');
      await fs.writeJSON(l2IndexPath, Array.from(this.l2Index.entries()));
      
      // Save L3 index
      const l3IndexPath = path.join(this.l3CacheDir, 'index.json');
      await fs.writeJSON(l3IndexPath, Array.from(this.l3Index.entries()));
    } catch (error) {
      console.error('Failed to save cache indexes:', error);
    }
  }

  /**
   * Start maintenance tasks
   */
  private startMaintenance(): void {
    this.cleanupInterval = setInterval(() => {
      this.performMaintenance();
    }, 300000); // Every 5 minutes
  }

  /**
   * Get value from cache (tries L1 -> L2 -> L3)
   */
  async get(key: string): Promise<any | null> {
    const cacheKey = this.generateCacheKey(key);
    
    // Try L1 cache first
    const l1Entry = this.l1Cache.get(cacheKey);
    if (l1Entry && this.isValidEntry(l1Entry)) {
      l1Entry.lastAccessed = new Date();
      l1Entry.hitCount++;
      this.stats.l1Hits++;
      this.emit('cacheHit', { layer: 'L1', key, entry: l1Entry });
      return l1Entry.value;
    }
    this.stats.l1Misses++;

    // Try L2 cache
    if (this.config.persistToDisk) {
      const l2Entry = await this.getFromL2(cacheKey);
      if (l2Entry) {
        // Promote to L1
        this.l1Cache.set(cacheKey, l2Entry);
        this.stats.l2Hits++;
        this.emit('cacheHit', { layer: 'L2', key, entry: l2Entry });
        return l2Entry.value;
      }
      this.stats.l2Misses++;

      // Try L3 cache
      const l3Entry = await this.getFromL3(cacheKey);
      if (l3Entry) {
        // Promote to L1
        this.l1Cache.set(cacheKey, l3Entry);
        this.stats.l3Hits++;
        this.emit('cacheHit', { layer: 'L3', key, entry: l3Entry });
        return l3Entry.value;
      }
      this.stats.l3Misses++;
    }

    // Try similarity detection
    if (this.config.enableSimilarityDetection) {
      const similar = await this.findSimilarQuery(key);
      if (similar) {
        this.stats.similarityDetections++;
        this.similarQueries.push(similar);
        this.emit('similarityDetection', similar);
        return await this.get(similar.similar); // Recursive call with similar query
      }
    }

    this.emit('cacheMiss', { key });
    return null;
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const cacheKey = this.generateCacheKey(key);
    const size = this.calculateSize(value);
    const actualTtl = ttl || this.config.ttlSeconds;
    
    const entry: CacheEntry = {
      key: cacheKey,
      value,
      size,
      createdAt: new Date(),
      lastAccessed: new Date(),
      hitCount: 0,
      ttl: actualTtl,
      compressed: false
    };

    // Store in L1 cache
    this.l1Cache.set(cacheKey, entry);
    this.stats.totalSets++;
    
    // Add to query cache for similarity detection
    if (this.config.enableSimilarityDetection) {
      this.addToQueryCache(key);
    }
    
    this.emit('cacheSet', { layer: 'L1', key, entry });
  }

  /**
   * Get from L2 cache
   */
  private async getFromL2(key: string): Promise<CacheEntry | null> {
    const indexEntry = this.l2Index.get(key);
    if (!indexEntry) return null;
    
    try {
      const filePath = path.join(this.l2CacheDir, indexEntry.file);
      if (!await fs.pathExists(filePath)) {
        this.l2Index.delete(key);
        return null;
      }
      
      const data = await fs.readJSON(filePath);
      const entry: CacheEntry = {
        ...data,
        createdAt: new Date(data.createdAt),
        lastAccessed: new Date()
      };
      
      if (!this.isValidEntry(entry)) {
        await fs.remove(filePath);
        this.l2Index.delete(key);
        return null;
      }
      
      // Update index
      indexEntry.lastAccessed = new Date();
      this.l2Index.set(key, indexEntry);
      
      return entry;
    } catch (error) {
      console.error(`Failed to read L2 cache for key ${key}:`, error);
      this.l2Index.delete(key);
      return null;
    }
  }

  /**
   * Get from L3 cache (compressed)
   */
  private async getFromL3(key: string): Promise<CacheEntry | null> {
    const indexEntry = this.l3Index.get(key);
    if (!indexEntry) return null;
    
    try {
      const filePath = path.join(this.l3CacheDir, indexEntry.file);
      if (!await fs.pathExists(filePath)) {
        this.l3Index.delete(key);
        return null;
      }
      
      const compressed = await fs.readFile(filePath);
      const decompressed = await new Promise<Buffer>((resolve, reject) => {
        zlib.inflate(compressed, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      const data = JSON.parse(decompressed.toString());
      const entry: CacheEntry = {
        ...data,
        createdAt: new Date(data.createdAt),
        lastAccessed: new Date(),
        compressed: false // Decompressed for use
      };
      
      if (!this.isValidEntry(entry)) {
        await fs.remove(filePath);
        this.l3Index.delete(key);
        return null;
      }
      
      // Update index
      indexEntry.lastAccessed = new Date();
      this.l3Index.set(key, indexEntry);
      
      return entry;
    } catch (error) {
      console.error(`Failed to read L3 cache for key ${key}:`, error);
      this.l3Index.delete(key);
      return null;
    }
  }

  /**
   * Promote entry from L1 to L2
   */
  private async promoteToL2(key: string, entry: CacheEntry): Promise<void> {
    if (!this.config.persistToDisk) return;
    
    try {
      const fileName = `${key.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.json`;
      const filePath = path.join(this.l2CacheDir, fileName);
      
      await fs.writeJSON(filePath, entry);
      
      this.l2Index.set(key, {
        file: fileName,
        size: entry.size,
        createdAt: entry.createdAt,
        lastAccessed: new Date()
      });
      
      // Check L2 size limits
      await this.enforceL2SizeLimit();
    } catch (error) {
      console.error(`Failed to promote to L2 cache:`, error);
    }
  }

  /**
   * Promote entry from L2 to L3 (compressed)
   */
  private async promoteToL3(key: string, entry: CacheEntry): Promise<void> {
    if (!this.config.persistToDisk || !this.config.enableCompression) return;
    
    try {
      const data = JSON.stringify(entry);
      const compressed = await new Promise<Buffer>((resolve, reject) => {
        zlib.deflate(data, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      const fileName = `${key.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.gz`;
      const filePath = path.join(this.l3CacheDir, fileName);
      
      await fs.writeFile(filePath, compressed);
      
      this.l3Index.set(key, {
        file: fileName,
        size: compressed.length,
        originalSize: data.length,
        createdAt: entry.createdAt,
        lastAccessed: new Date()
      });
      
      // Check L3 size limits
      await this.enforceL3SizeLimit();
    } catch (error) {
      console.error(`Failed to promote to L3 cache:`, error);
    }
  }

  /**
   * Enforce L2 cache size limit
   */
  private async enforceL2SizeLimit(): Promise<void> {
    const currentSize = this.calculateL2Size();
    if (currentSize <= this.config.l2MaxSizeMB) return;
    
    // Sort by last accessed time (LRU eviction)
    const entries = Array.from(this.l2Index.entries())
      .sort(([,a], [,b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
    
    let freedSize = 0;
    for (const [key, indexEntry] of entries) {
      if (currentSize - freedSize <= this.config.l2MaxSizeMB) break;
      
      try {
        // Promote to L3 if compression is enabled
        if (this.config.enableCompression && indexEntry.size > this.config.compressionThreshold) {
          const filePath = path.join(this.l2CacheDir, indexEntry.file);
          const entry = await fs.readJSON(filePath);
          await this.promoteToL3(key, entry);
        }
        
        // Remove from L2
        await fs.remove(path.join(this.l2CacheDir, indexEntry.file));
        this.l2Index.delete(key);
        freedSize += indexEntry.size / 1024 / 1024;
        this.stats.l2Evictions++;
      } catch (error) {
        console.error(`Failed to evict L2 entry ${key}:`, error);
      }
    }
    
    if (freedSize > 0) {
      console.log(`🗑️ L2 cache freed ${freedSize.toFixed(1)}MB`);
    }
  }

  /**
   * Enforce L3 cache size limit
   */
  private async enforceL3SizeLimit(): Promise<void> {
    const currentSize = this.calculateL3Size();
    if (currentSize <= this.config.l3MaxSizeMB) return;
    
    // Sort by last accessed time (LRU eviction)
    const entries = Array.from(this.l3Index.entries())
      .sort(([,a], [,b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
    
    let freedSize = 0;
    for (const [key, indexEntry] of entries) {
      if (currentSize - freedSize <= this.config.l3MaxSizeMB) break;
      
      try {
        await fs.remove(path.join(this.l3CacheDir, indexEntry.file));
        this.l3Index.delete(key);
        freedSize += indexEntry.size / 1024 / 1024;
        this.stats.l3Evictions++;
      } catch (error) {
        console.error(`Failed to evict L3 entry ${key}:`, error);
      }
    }
    
    if (freedSize > 0) {
      console.log(`🗑️ L3 cache freed ${freedSize.toFixed(1)}MB`);
    }
  }

  /**
   * Calculate L2 cache size in MB
   */
  private calculateL2Size(): number {
    let totalSize = 0;
    for (const [, indexEntry] of Array.from(this.l2Index.entries())) {
      totalSize += indexEntry.size;
    }
    return totalSize / 1024 / 1024;
  }

  /**
   * Calculate L3 cache size in MB
   */
  private calculateL3Size(): number {
    let totalSize = 0;
    for (const [, indexEntry] of Array.from(this.l3Index.entries())) {
      totalSize += indexEntry.size;
    }
    return totalSize / 1024 / 1024;
  }

  /**
   * Add query to similarity detection cache
   */
  private addToQueryCache(query: string): void {
    const tokens = this.tokenizeQuery(query);
    const hash = this.generateCacheKey(query);
    
    this.queryCache.set(query, { hash, tokens });
    
    // Keep cache size manageable
    if (this.queryCache.size > 10000) {
      const entries = Array.from(this.queryCache.entries());
      entries.slice(0, 1000).forEach(([key]) => this.queryCache.delete(key));
    }
  }

  /**
   * Find similar query using token-based similarity
   */
  private async findSimilarQuery(query: string): Promise<SimilarQuery | null> {
    const queryTokens = this.tokenizeQuery(query);
    let bestMatch: SimilarQuery | null = null;
    
    for (const [cachedQuery, data] of Array.from(this.queryCache.entries())) {
      const similarity = this.calculateSimilarity(queryTokens, data.tokens);
      
      if (similarity >= this.config.similarityThreshold && 
          (!bestMatch || similarity > bestMatch.similarity)) {
        
        // Check if we have cached data for this query
        const cachedData = await this.get(cachedQuery);
        if (cachedData) {
          bestMatch = {
            original: query,
            similar: cachedQuery,
            similarity,
            cacheKey: data.hash
          };
        }
      }
    }
    
    return bestMatch;
  }

  /**
   * Tokenize query for similarity comparison
   */
  private tokenizeQuery(query: string): string[] {
    return query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Calculate similarity between two token arrays
   */
  private calculateSimilarity(tokens1: string[], tokens2: string[]): number {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);
    
    return intersection.size / union.size;
  }

  /**
   * Generate cache key from input
   */
  private generateCacheKey(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Calculate size of object in bytes
   */
  private calculateSize(obj: any): number {
    return Buffer.byteLength(JSON.stringify(obj), 'utf8');
  }

  /**
   * Check if cache entry is still valid
   */
  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    const ageSeconds = (now - entry.createdAt.getTime()) / 1000;
    return ageSeconds < entry.ttl;
  }

  /**
   * Perform maintenance tasks
   */
  private async performMaintenance(): Promise<void> {
    console.log('🧹 Performing cache maintenance...');
    
    // Clean expired entries
    await this.cleanExpiredEntries();
    
    // Save indexes to disk
    await this.saveCacheIndexes();
    
    // Emit maintenance event
    this.emit('maintenance', {
      timestamp: new Date(),
      stats: this.getStats()
    });
  }

  /**
   * Clean expired entries from all caches
   */
  private async cleanExpiredEntries(): Promise<void> {
    let cleaned = 0;
    
    // Clean L2 cache
    const l2Entries = Array.from(this.l2Index.entries());
    for (const [key, indexEntry] of l2Entries) {
      try {
        const filePath = path.join(this.l2CacheDir, indexEntry.file);
        if (await fs.pathExists(filePath)) {
          const entry = await fs.readJSON(filePath);
          if (!this.isValidEntry(entry)) {
            await fs.remove(filePath);
            this.l2Index.delete(key);
            cleaned++;
          }
        } else {
          this.l2Index.delete(key);
          cleaned++;
        }
      } catch (error) {
        console.error(`Error cleaning L2 entry ${key}:`, error);
      }
    }
    
    // Clean L3 cache
    const l3Entries = Array.from(this.l3Index.entries());
    for (const [key, indexEntry] of l3Entries) {
      try {
        const filePath = path.join(this.l3CacheDir, indexEntry.file);
        if (await fs.pathExists(filePath)) {
          const compressed = await fs.readFile(filePath);
          const decompressed = zlib.inflateSync(compressed);
          const entry = JSON.parse(decompressed.toString());
          
          if (!this.isValidEntry(entry)) {
            await fs.remove(filePath);
            this.l3Index.delete(key);
            cleaned++;
          }
        } else {
          this.l3Index.delete(key);
          cleaned++;
        }
      } catch (error) {
        console.error(`Error cleaning L3 entry ${key}:`, error);
      }
    }
    
    if (cleaned > 0) {
      console.log(`🗑️ Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * Cache warming - preload frequently accessed data
   */
  async warmCache(keys: Array<{ key: string; priority: number }>): Promise<void> {
    console.log(`🔥 Warming cache with ${keys.length} entries...`);
    
    // Sort by priority
    keys.sort((a, b) => b.priority - a.priority);
    
    let warmed = 0;
    for (const { key } of keys) {
      const cached = await this.get(key);
      if (cached) {
        warmed++;
      }
    }
    
    console.log(`🔥 Cache warming completed: ${warmed}/${keys.length} entries found`);
    this.emit('cacheWarmed', { total: keys.length, found: warmed });
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalHits = this.stats.l1Hits + this.stats.l2Hits + this.stats.l3Hits;
    const totalMisses = this.stats.l1Misses + this.stats.l2Misses + this.stats.l3Misses;
    
    return {
      l1: {
        size: this.l1Cache.size,
        maxSize: this.config.l1MaxSize,
        hitRate: this.stats.l1Hits / (this.stats.l1Hits + this.stats.l1Misses) || 0,
        entries: this.l1Cache.size
      },
      l2: {
        sizeMB: this.calculateL2Size(),
        maxSizeMB: this.config.l2MaxSizeMB,
        hitRate: this.stats.l2Hits / (this.stats.l2Hits + this.stats.l2Misses) || 0,
        entries: this.l2Index.size
      },
      l3: {
        sizeMB: this.calculateL3Size(),
        maxSizeMB: this.config.l3MaxSizeMB,
        hitRate: this.stats.l3Hits / (this.stats.l3Hits + this.stats.l3Misses) || 0,
        entries: this.l3Index.size,
        compressionRatio: this.calculateCompressionRatio()
      },
      overall: {
        totalHits,
        totalMisses,
        hitRate: totalHits / (totalHits + totalMisses) || 0,
        evictions: this.stats.l1Evictions + this.stats.l2Evictions + this.stats.l3Evictions,
        similarityDetections: this.stats.similarityDetections
      }
    };
  }

  /**
   * Calculate compression ratio for L3 cache
   */
  private calculateCompressionRatio(): number {
    let originalSize = 0;
    let compressedSize = 0;
    
    for (const [, indexEntry] of Array.from(this.l3Index.entries())) {
      originalSize += indexEntry.originalSize || indexEntry.size;
      compressedSize += indexEntry.size;
    }
    
    return originalSize > 0 ? compressedSize / originalSize : 1;
  }

  /**
   * Clear specific cache layer or all
   */
  async clear(layer?: 'L1' | 'L2' | 'L3'): Promise<void> {
    if (!layer || layer === 'L1') {
      this.l1Cache.clear();
      console.log('🗑️ L1 cache cleared');
    }
    
    if (!layer || layer === 'L2') {
      await fs.emptyDir(this.l2CacheDir);
      this.l2Index.clear();
      console.log('🗑️ L2 cache cleared');
    }
    
    if (!layer || layer === 'L3') {
      await fs.emptyDir(this.l3CacheDir);
      this.l3Index.clear();
      console.log('🗑️ L3 cache cleared');
    }
    
    this.emit('cacheCleared', { layer: layer || 'all' });
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    console.log('🔧 Cache configuration updated');
    this.emit('configUpdated', { oldConfig, newConfig: this.config });
  }

  /**
   * Get health score (0-100)
   */
  getHealthScore(): number {
    const stats = this.getStats();
    let score = 100;
    
    // Deduct based on hit rate
    score -= (1 - stats.overall.hitRate) * 40;
    
    // Deduct based on cache fullness
    const l1Fullness = stats.l1.entries / stats.l1.maxSize;
    const l2Fullness = stats.l2.sizeMB / stats.l2.maxSizeMB;
    const l3Fullness = stats.l3.sizeMB / stats.l3.maxSizeMB;
    
    score -= Math.max(l1Fullness, l2Fullness, l3Fullness) * 20;
    
    // Bonus for good compression ratio
    if (stats.l3.compressionRatio < 0.7) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Stop cache manager
   */
  async stop(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Save final state
    await this.saveCacheIndexes();
    
    console.log('🛑 Advanced Cache Manager stopped');
    this.emit('stopped');
  }
}

export default AdvancedCacheManager;