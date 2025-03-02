import { Injectable, Logger } from '@nestjs/common';
import * as NodeCache from 'node-cache'; // Correct import for CommonJS

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache: NodeCache;

  constructor() {
    // Initialize the cache with standard settings
    this.cache = new NodeCache({
      stdTTL: 600, // Default TTL of 10 minutes
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Don't clone objects when getting/setting
    });
    this.logger.log('Cache service initialized');
  }

  // Get value from cache
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  // Set value in cache with optional TTL
  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, value, ttl ?? 0);
  }

  // Delete a key from cache
  delete(key: string): void {
    this.cache.del(key);
  }

  // Check if key exists in cache
  has(key: string): boolean {
    return this.cache.has(key);
  }

  // Get or set cache value
  getOrSet<T>(key: string, fetch: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = this.get<T>(key);
    if (cachedValue !== undefined) {
      return Promise.resolve(cachedValue);
    }
    
    return fetch().then(value => {
      this.set(key, value, ttl);
      return value;
    });
  }

  // Flush all cache
  flush(): void {
    this.cache.flushAll();
  }

  /**
   * Sets a value in the cache with a specified key and time-to-live (TTL).
   * @param key The cache key
   * @param value The value to cache
   * @param ttl Time-to-live in seconds
   */
  async setLocal(key: string, value: any, ttl: number): Promise<void> {
    const success = this.cache.set(key, value, ttl);
    if (!success) {
      throw new Error(`Failed to set cache for key: ${key}`);
    }
  }

  /**
   * Retrieves a value from the cache by key.
   * @param key The cache key
   * @returns The cached value or undefined if not found
   */
  async getLocal<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  /**
   * Returns statistics about the cache.
   * @returns Cache statistics object
   */
  async getCacheStats(): Promise<object> {
    return this.cache.getStats();
  }
}