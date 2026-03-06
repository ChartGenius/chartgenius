const axios = require('axios');
const cache = require('./cache');
const { externalAPILimiter } = require('./rateLimit');

class NewsService {
  constructor() {
    this.newsAPIKey = process.env.NEWS_API_KEY;
    this.rssFeedURLs = [
      'https://feeds.reuters.com/news/economy',
      'https://feeds.reuters.com/news/markets',
      'https://rss.cnn.com/rss/money_latest.rss',
      'https://feeds.bloomberg.com/markets/news.rss'
    ];
    
    // Mock news data for when APIs are rate limited
    this.mockNews = [
      {
        id: 1,
        title: "Federal Reserve Signals Potential Interest Rate Changes",
        summary: "The Federal Reserve indicates possible adjustments to interest rates amid changing economic conditions.",
        content: "Federal Reserve officials are considering policy adjustments as economic indicators show mixed signals...",
        url: "#",
        source: "Reuters",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        impact: 8.5,
        sentiment: "neutral",
        tags: ["federal-reserve", "interest-rates", "monetary-policy"]
      },
      {
        id: 2,
        title: "Bitcoin Reaches New Monthly High Amid Institutional Interest",
        summary: "Bitcoin surges to monthly highs as institutional investors increase cryptocurrency allocations.",
        content: "Bitcoin has reached its highest level this month as major institutional investors continue to expand their cryptocurrency holdings...",
        url: "#",
        source: "CoinDesk",
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        impact: 7.2,
        sentiment: "positive",
        tags: ["bitcoin", "cryptocurrency", "institutional-investment"]
      },
      {
        id: 3,
        title: "Tech Earnings Season Shows Mixed Results",
        summary: "Major technology companies report varied quarterly results with some exceeding expectations.",
        content: "The latest tech earnings season reveals a mixed landscape with some companies surpassing analyst expectations while others face challenges...",
        url: "#",
        source: "Bloomberg",
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        impact: 6.8,
        sentiment: "neutral",
        tags: ["technology", "earnings", "stocks"]
      },
      {
        id: 4,
        title: "Oil Prices Fluctuate on Supply Chain Concerns",
        summary: "Crude oil prices show volatility amid ongoing supply chain disruptions and geopolitical tensions.",
        content: "Oil markets continue to experience volatility as supply chain issues and geopolitical factors create uncertainty...",
        url: "#",
        source: "Energy News",
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        impact: 7.5,
        sentiment: "negative",
        tags: ["oil", "commodities", "supply-chain"]
      },
      {
        id: 5,
        title: "European Markets Open Higher on Economic Data",
        summary: "European stock markets start the day with gains following positive economic indicators from the region.",
        content: "European markets opened with positive momentum after the release of encouraging economic data from key eurozone countries...",
        url: "#",
        source: "Financial Times",
        publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
        impact: 6.3,
        sentiment: "positive",
        tags: ["european-markets", "economic-data", "stocks"]
      }
    ];
  }

  async getLatestNews(limit = 20, category = 'all') {
    const cacheKey = `news:latest:${category}:${limit}`;
    
    return await cache.cacheAPICall(cacheKey, async () => {
      try {
        // Try to fetch from NewsAPI if available
        if (this.newsAPIKey) {
          await externalAPILimiter.canMakeRequest('newsapi', 100, 3600000); // 100 calls per hour
          
          const response = await axios.get('https://newsapi.org/v2/everything', {
            params: {
              q: 'finance OR economics OR trading OR markets OR crypto OR stocks',
              language: 'en',
              sortBy: 'publishedAt',
              pageSize: limit,
              apiKey: this.newsAPIKey
            },
            timeout: 10000
          });

          if (response.data.articles) {
            return response.data.articles.map(this.transformNewsAPIArticle);
          }
        }
        
        // Fallback to mock data with some randomization
        return this.getMockNewsData(limit);
      } catch (error) {
        if (error.message.includes('rate limit')) {
          console.warn('News API rate limit reached, using cached/mock data');
        } else {
          console.error('News API error:', error.message);
        }
        return this.getMockNewsData(limit);
      }
    }, 600); // Cache for 10 minutes
  }

  async getNewsBySymbol(symbol, limit = 10) {
    const cacheKey = `news:symbol:${symbol}:${limit}`;
    
    return await cache.cacheAPICall(cacheKey, async () => {
      try {
        if (this.newsAPIKey) {
          await externalAPILimiter.canMakeRequest('newsapi', 100, 3600000);
          
          const response = await axios.get('https://newsapi.org/v2/everything', {
            params: {
              q: `"${symbol}" OR ${this.getSymbolKeywords(symbol)}`,
              language: 'en',
              sortBy: 'publishedAt',
              pageSize: limit,
              apiKey: this.newsAPIKey
            },
            timeout: 10000
          });

          if (response.data.articles) {
            return response.data.articles.map(this.transformNewsAPIArticle);
          }
        }
        
        // Return mock data filtered by symbol relevance
        return this.getMockNewsData(limit).filter(article => 
          article.tags.some(tag => 
            tag.toLowerCase().includes(symbol.toLowerCase()) ||
            symbol.toLowerCase().includes(tag)
          )
        );
      } catch (error) {
        console.error(`News API error for symbol ${symbol}:`, error.message);
        return this.getMockNewsData(limit);
      }
    }, 900); // Cache for 15 minutes
  }

  transformNewsAPIArticle(article) {
    return {
      id: article.url.split('/').pop() || Math.random().toString(36),
      title: article.title,
      summary: article.description || '',
      content: article.content || '',
      url: article.url,
      source: article.source.name,
      publishedAt: article.publishedAt,
      impact: Math.random() * 10, // Would use sentiment analysis in production
      sentiment: this.analyzeSentiment(article.title + ' ' + article.description),
      tags: this.extractTags(article.title + ' ' + article.description)
    };
  }

  analyzeSentiment(text) {
    // Simple sentiment analysis - would use AI service in production
    const positiveWords = ['gain', 'rise', 'up', 'growth', 'positive', 'surge', 'bull', 'increase'];
    const negativeWords = ['fall', 'drop', 'down', 'decline', 'negative', 'crash', 'bear', 'decrease'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  extractTags(text) {
    // Simple tag extraction - would use NLP in production
    const keywords = [
      'bitcoin', 'ethereum', 'crypto', 'cryptocurrency',
      'forex', 'trading', 'stocks', 'markets',
      'federal-reserve', 'interest-rates', 'inflation',
      'oil', 'gold', 'commodities', 'technology'
    ];
    
    const lowerText = text.toLowerCase();
    return keywords.filter(keyword => lowerText.includes(keyword));
  }

  getSymbolKeywords(symbol) {
    const keywordMap = {
      'EUR/USD': 'euro dollar forex',
      'GBP/USD': 'pound sterling forex',
      'BTC': 'bitcoin cryptocurrency',
      'ETH': 'ethereum cryptocurrency',
      'AAPL': 'apple technology',
      'GOOGL': 'google alphabet technology',
      'TSLA': 'tesla electric vehicle',
      'GOLD': 'gold precious metals',
      'OIL': 'oil crude energy'
    };
    
    return keywordMap[symbol] || symbol;
  }

  getMockNewsData(limit) {
    // Add some randomness to mock data
    const shuffled = [...this.mockNews].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(limit, shuffled.length));
  }

  async getMarketMovingNews(impactThreshold = 7.0) {
    const allNews = await this.getLatestNews(50);
    return allNews.filter(article => article.impact >= impactThreshold)
                 .sort((a, b) => b.impact - a.impact);
  }
}

module.exports = new NewsService();