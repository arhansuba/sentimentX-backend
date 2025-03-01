import { Injectable, Logger } from '@nestjs/common';
import NodeCache from 'node-cache';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cache: NodeCache;

  constructor() {
    // Create in-memory cache with default settings
    this.cache = new NodeCache({
      stdTTL: 300, // 5 minutes default TTL
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false, // Don't use clones for performance
    });

    this.logger.log('Cache service initialized');
  }

  /**
   * Get a value from the local cache
   */
  async getLocal<T>(key: string): Promise<T | undefined> {
    try {
      return this.cache.get<T>(key);
    } catch (error) {
      this.logger.error(`Error getting from cache: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Set a value in the local cache
   * @param ttl Time to live in seconds, 0 for no expiration
   */
  async setLocal<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      if (value === undefined || value === null) {
        return;
      }
      
      this.cache.set(key, value, ttl);
    } catch (error) {
      this.logger.error(`Error setting cache: ${error.message}`);
    }
  }

  /**
   * Delete a value from the local cache
   */
  async deleteLocal(key: string): Promise<void> {
    try {
      this.cache.del(key);
    } catch (error) {
      this.logger.error(`Error deleting from cache: ${error.message}`);
    }
  }

  /**
   * Get a value from the cache or compute it if not present
   */
  async getOrSetLocal<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = 300
  ): Promise<T | undefined> {
    try {
      // Check if in cache
      const cached = await this.getLocal<T>(key);
      if (cached !== undefined) {
        return cached;
      }
      
      // Not in cache, compute value
      const value = await factory();
      
      // Only cache non-null values
      if (value !== undefined && value !== null) {
        await this.setLocal(key, value, ttl);
      }
      
      return value;
    } catch (error) {
      this.logger.error(`Error in getOrSet: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Clear all items from cache
   */
  async clearCache(): Promise<void> {
    try {
      this.cache.flushAll();
      this.logger.log('Cache cleared');
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      ksize: this.cache.getStats().ksize,
      vsize: this.cache.getStats().vsize,
    };
  }
}