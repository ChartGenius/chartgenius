const Redis = require('redis');

class CacheService {
  constructor() {
    this.client = Redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) return false; // Give up after 3 attempts
          return Math.min(retries * 500, 3000);
        },
      },
    });

    this.client.on('error', (err) => {
      // Only log once to avoid spam when Redis isn't running
      if (!this._redisErrorLogged) {
        console.warn('[Cache] Redis unavailable — using in-memory fallback. Start Redis to enable persistence.');
        this._redisErrorLogged = true;
      }
    });

    this.client.on('connect', () => {
      console.log('[Cache] ✅ Redis connected');
      this._redisErrorLogged = false;
    });

    // Fallback in-memory cache when Redis is unavailable
    this.memoryCache = new Map();
    this.isRedisAvailable = false;
    
    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
      this.isRedisAvailable = true;
    } catch (error) {
      console.warn('Redis unavailable, using memory cache:', error.message);
      this.isRedisAvailable = false;
    }
  }

  async get(key) {
    try {
      if (this.isRedisAvailable) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        const cached = this.memoryCache.get(key);
        if (cached && cached.expiry > Date.now()) {
          return cached.value;
        }
        this.memoryCache.delete(key);
        return null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      if (this.isRedisAvailable) {
        await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      } else {
        // Memory cache with TTL
        this.memoryCache.set(key, {
          value,
          expiry: Date.now() + (ttlSeconds * 1000)
        });
        
        // Clean up expired entries periodically
        if (this.memoryCache.size > 1000) {
          this.cleanupMemoryCache();
        }
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key) {
    try {
      if (this.isRedisAvailable) {
        await this.client.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  cleanupMemoryCache() {
    const now = Date.now();
    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.expiry <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  // Helper method for cached API calls
  async cacheAPICall(key, apiCall, ttlSeconds = 300) {
    const cached = await this.get(key);
    if (cached) {
      return cached;
    }

    const result = await apiCall();
    await this.set(key, result, ttlSeconds);
    return result;
  }
}

module.exports = new CacheService();