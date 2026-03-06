const express = require('express');
const router = express.Router();
const newsService = require('../services/newsService');
const { generalLimiter, strictLimiter } = require('../services/rateLimit');

// Apply rate limiting
router.use(generalLimiter);

// Get latest news
router.get('/latest', async (req, res) => {
  try {
    const { limit = 10, category = 'all' } = req.query;
    const limitNum = Math.min(parseInt(limit) || 10, 50); // Cap at 50
    
    const news = await newsService.getLatestNews(limitNum, category);
    
    res.json({
      success: true,
      data: news,
      total: news.length,
      timestamp: new Date().toISOString(),
      cached: true // Indicates data may be cached to manage rate limits
    });
    
  } catch (error) {
    console.error('Error fetching latest news:', error);
    
    if (error.message.includes('rate limit')) {
      res.status(429).json({ 
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: '10 minutes'
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch news',
        message: 'Service temporarily unavailable'
      });
    }
  }
});

// Get news by symbol/instrument  
router.get('/symbol/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit) || 10, 20);
    
    const news = await newsService.getNewsBySymbol(symbol, limitNum);
    
    res.json({
      success: true,
      data: news,
      symbol: symbol.toUpperCase(),
      total: news.length,
      timestamp: new Date().toISOString(),
      cached: true
    });
    
  } catch (error) {
    console.error(`Error fetching news for symbol ${req.params.symbol}:`, error);
    
    if (error.message.includes('rate limit')) {
      res.status(429).json({ 
        success: false,
        error: 'Rate limit exceeded for news requests',
        retryAfter: '15 minutes'
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch symbol news'
      });
    }
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'news',
    status: 'operational',
    timestamp: new Date().toISOString(),
    rateLimits: {
      general: '100 requests per 15 minutes',
      marketMoving: '10 requests per minute'
    }
  });
});

module.exports = router;