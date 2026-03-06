const rateLimit = require('express-rate-limit');
const Redis = require('redis');

// Redis client for distributed rate limiting
const redisClient = Redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for expensive operations
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Only 10 requests per minute
  message: {
    error: 'Rate limit exceeded. Please wait before making more requests.',
    retryAfter: '1 minute'
  }
});

// External API rate limiting helper
class ExternalAPILimiter {
  constructor() {
    this.requestCounts = new Map();
    this.resetTimes = new Map();
  }

  async canMakeRequest(apiName, maxRequests = 60, windowMs = 60000) {
    const now = Date.now();
    const resetTime = this.resetTimes.get(apiName) || now;
    
    if (now >= resetTime) {
      // Reset window
      this.requestCounts.set(apiName, 0);
      this.resetTimes.set(apiName, now + windowMs);
    }
    
    const currentCount = this.requestCounts.get(apiName) || 0;
    
    if (currentCount >= maxRequests) {
      const waitTime = this.resetTimes.get(apiName) - now;
      throw new Error(`API rate limit exceeded for ${apiName}. Wait ${Math.ceil(waitTime/1000)} seconds.`);
    }
    
    this.requestCounts.set(apiName, currentCount + 1);
    return true;
  }
}

const externalAPILimiter = new ExternalAPILimiter();

module.exports = {
  generalLimiter,
  strictLimiter,
  externalAPILimiter
};