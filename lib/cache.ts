import fs from 'fs/promises';
import path from 'path';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  type?: 'recent' | 'albums'; // Track cache type for different TTLs
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number; // Maximum number of entries
}

class LocalCache {
  private cache = new Map<string, CacheEntry<any>>();
  private cacheFile: string;
  private options: Required<CacheOptions>;

  constructor(cacheDir = '.cache', options: CacheOptions = {}) {
    this.cacheFile = path.join(process.cwd(), cacheDir, 'lastfm-cache.json');
    this.options = {
      ttl: options.ttl || 300, // 5 minutes default
      maxSize: options.maxSize || 100,
    };
    this.loadCache();
  }

  private async loadCache(): Promise<void> {
    try {
      // Ensure cache directory exists
      const cacheDir = path.dirname(this.cacheFile);
      await fs.mkdir(cacheDir, { recursive: true });

      const data = await fs.readFile(this.cacheFile, 'utf-8');
      const entries = JSON.parse(data);
      
      // Only load non-expired entries
      const now = Date.now();
      for (const [key, entry] of Object.entries(entries)) {
        const cacheEntry = entry as CacheEntry<any>;
        if (cacheEntry.expiresAt > now) {
          this.cache.set(key, cacheEntry);
        }
      }
    } catch (error) {
      // File doesn't exist or is invalid, start with empty cache
      console.log('Starting with empty cache');
    }
  }

  private async saveCache(): Promise<void> {
    try {
      const entries: Record<string, CacheEntry<any>> = {};
      for (const [key, entry] of this.cache.entries()) {
        entries[key] = entry;
      }
      
      await fs.writeFile(this.cacheFile, JSON.stringify(entries, null, 2));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      await this.saveCache();
      return null;
    }

    return entry.data;
  }

  async set<T>(key: string, data: T, ttl?: number, type?: 'recent' | 'albums'): Promise<void> {
    const now = Date.now();
    const expiresAt = now + (ttl || this.options.ttl) * 1000;

    // Remove expired entries first
    for (const [cacheKey, entry] of this.cache.entries()) {
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(cacheKey);
      }
    }

    // Check if we need to evict old entries
    if (this.cache.size >= this.options.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
      type,
    });

    await this.saveCache();
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    await this.saveCache();
  }

  // Smart cache invalidation for recent tracks when new scrobbling is detected
  async invalidateRecentTracks(username: string): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (key.includes(username) && entry.type === 'recent') {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
    
    if (keysToDelete.length > 0) {
      await this.saveCache();
      console.log(`Invalidated ${keysToDelete.length} recent track cache entries`);
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    await this.saveCache();
  }

  get size(): number {
    return this.cache.size;
  }

  // Get cache entry metadata for debugging
  getEntryInfo(key: string): { exists: boolean; expiresAt?: number; type?: string } {
    const entry = this.cache.get(key);
    if (!entry) {
      return { exists: false };
    }
    return {
      exists: true,
      expiresAt: entry.expiresAt,
      type: entry.type,
    };
  }
}

// Create a singleton instance
const lastfmCache = new LocalCache('.cache', { ttl: 300 }); // 5 minutes TTL

export { lastfmCache, LocalCache };
export type { CacheEntry, CacheOptions }; 