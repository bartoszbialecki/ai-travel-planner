import type { AIGenerationRequest, AIGenerationResult } from "./types";

export interface CacheEntry {
  result: AIGenerationResult;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  maxSize?: number;
  defaultTtl?: number;
  enableCompression?: boolean;
}

/**
 * Simple in-memory cache for OpenRouter responses
 * In production, consider using Redis or similar distributed cache
 */
class OpenRouterCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly defaultTtl: number;
  private readonly enableCompression: boolean;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTtl = options.defaultTtl || 24 * 60 * 60 * 1000; // 24 hours
    this.enableCompression = options.enableCompression || false;
  }

  /**
   * Generates a cache key from the request parameters
   */
  private generateCacheKey(request: AIGenerationRequest): string {
    // Create a deterministic key from request parameters
    const keyData = {
      destination: request.destination.toLowerCase().trim(),
      start_date: request.start_date,
      end_date: request.end_date,
      adults_count: request.adults_count,
      children_count: request.children_count,
      budget_total: request.budget_total,
      budget_currency: request.budget_currency,
      travel_style: request.travel_style,
    };

    // Use JSON.stringify for consistent key generation
    const keyString = JSON.stringify(keyData);

    if (this.enableCompression) {
      // Simple compression: remove spaces and use base64-like encoding
      return btoa(keyString.replace(/\s/g, "")).substring(0, 50);
    }

    // Use hash for shorter keys
    return this.simpleHash(keyString);
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Checks if a request is cacheable
   */
  private isCacheable(request: AIGenerationRequest): boolean {
    // Don't cache requests with very specific or unique parameters
    if (request.budget_total && request.budget_total < 100) return false;
    if (request.adults_count > 10) return false;
    if (request.children_count > 8) return false;

    // Don't cache very short trips (less than 2 days)
    const start = new Date(request.start_date);
    const end = new Date(request.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 2) return false;

    return true;
  }

  /**
   * Gets a cached result if available and not expired
   */
  get(request: AIGenerationRequest): AIGenerationResult | null {
    if (!this.isCacheable(request)) {
      return null;
    }

    const key = this.generateCacheKey(request);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Return cached result with updated processing time
    return {
      ...entry.result,
      processing_time_ms: 0, // Indicate this was served from cache
    };
  }

  /**
   * Stores a result in the cache
   */
  set(request: AIGenerationRequest, result: AIGenerationResult, ttl?: number): void {
    if (!this.isCacheable(request)) {
      return;
    }

    // Only cache successful results
    if (!result.success) {
      return;
    }

    const key = this.generateCacheKey(request);
    const entry: CacheEntry = {
      result,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    };

    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
  }

  /**
   * Evicts the oldest entry from the cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clears expired entries from the cache
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Gets cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalHits: number;
    totalRequests: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/requests
      totalHits: 0, // Would need to track hits
      totalRequests: 0, // Would need to track requests
    };
  }

  /**
   * Clears all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const openRouterCache = new OpenRouterCache({
  maxSize: 200,
  defaultTtl: 12 * 60 * 60 * 1000, // 12 hours
  enableCompression: true,
});

// Cleanup expired entries every hour
setInterval(
  () => {
    const cleaned = openRouterCache.cleanup();
    if (cleaned > 0) {
      console.log(`🧹 OpenRouter Cache: Cleaned ${cleaned} expired entries`);
    }
  },
  60 * 60 * 1000
);
