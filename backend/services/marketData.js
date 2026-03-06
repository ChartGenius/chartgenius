const axios = require('axios');
const cache = require('./cache');
const { externalAPILimiter } = require('./rateLimit');

class MarketDataService {
  constructor() {
    this.alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.coinGeckoBaseUrl = 'https://api.coingecko.com/api/v3';
    this.exchangeRatesKey = process.env.EXCHANGE_RATES_API_KEY;
    
    // Fallback mock data when APIs are unavailable
    this.mockData = {
      forex: {
        'EUR/USD': { price: 1.0875, change: 0.0012, changePercent: 0.11 },
        'GBP/USD': { price: 1.2654, change: -0.0023, changePercent: -0.18 },
        'USD/JPY': { price: 149.85, change: 0.45, changePercent: 0.30 },
        'AUD/USD': { price: 0.6789, change: 0.0034, changePercent: 0.50 }
      },
      crypto: {
        'bitcoin': { price: 67234.50, change: 1234.75, changePercent: 1.87 },
        'ethereum': { price: 3456.78, change: -123.45, changePercent: -3.45 },
        'cardano': { price: 0.4567, change: 0.0234, changePercent: 5.40 },
        'solana': { price: 123.45, change: 8.90, changePercent: 7.76 }
      },
      stocks: {
        'AAPL': { price: 182.31, change: 2.15, changePercent: 1.19 },
        'GOOGL': { price: 2734.56, change: -15.67, changePercent: -0.57 },
        'TSLA': { price: 234.67, change: 12.34, changePercent: 5.56 },
        'MSFT': { price: 378.90, change: 4.56, changePercent: 1.22 }
      }
    };
  }

  async getForexRates(symbols = ['EUR/USD', 'GBP/USD', 'USD/JPY']) {
    const cacheKey = `forex:${symbols.join(',')}`;
    
    return await cache.cacheAPICall(cacheKey, async () => {
      try {
        await externalAPILimiter.canMakeRequest('alpha_vantage', 5, 60000); // 5 calls per minute
        
        if (!this.alphaVantageKey) {
          console.warn('No Alpha Vantage API key, using mock data');
          return this.getMockForexData(symbols);
        }

        const results = {};
        for (const symbol of symbols) {
          const [from, to] = symbol.split('/');
          
          const response = await axios.get('https://www.alphavantage.co/query', {
            params: {
              function: 'CURRENCY_EXCHANGE_RATE',
              from_currency: from,
              to_currency: to,
              apikey: this.alphaVantageKey
            },
            timeout: 10000
          });

          if (response.data['Realtime Currency Exchange Rate']) {
            const data = response.data['Realtime Currency Exchange Rate'];
            results[symbol] = {
              price: parseFloat(data['5. Exchange Rate']),
              change: 0, // Would need historical data for this
              changePercent: 0,
              lastUpdate: data['6. Last Refreshed']
            };
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        return Object.keys(results).length > 0 ? results : this.getMockForexData(symbols);
      } catch (error) {
        console.error('Forex API error:', error.message);
        return this.getMockForexData(symbols);
      }
    }, 300); // Cache for 5 minutes
  }

  async getCryptoData(coins = ['bitcoin', 'ethereum', 'cardano', 'solana']) {
    const cacheKey = `crypto:${coins.join(',')}`;
    
    return await cache.cacheAPICall(cacheKey, async () => {
      try {
        await externalAPILimiter.canMakeRequest('coingecko', 10, 60000); // 10 calls per minute
        
        const response = await axios.get(`${this.coinGeckoBaseUrl}/simple/price`, {
          params: {
            ids: coins.join(','),
            vs_currencies: 'usd',
            include_24hr_change: 'true'
          },
          timeout: 10000
        });

        const results = {};
        for (const coin of coins) {
          if (response.data[coin]) {
            const data = response.data[coin];
            results[coin] = {
              price: data.usd,
              change: data.usd_24h_change || 0,
              changePercent: data.usd_24h_change || 0,
              lastUpdate: new Date().toISOString()
            };
          }
        }
        
        return Object.keys(results).length > 0 ? results : this.getMockCryptoData(coins);
      } catch (error) {
        console.error('Crypto API error:', error.message);
        return this.getMockCryptoData(coins);
      }
    }, 180); // Cache for 3 minutes
  }

  async getStockData(symbols = ['AAPL', 'GOOGL', 'TSLA', 'MSFT']) {
    const cacheKey = `stocks:${symbols.join(',')}`;
    
    return await cache.cacheAPICall(cacheKey, async () => {
      try {
        await externalAPILimiter.canMakeRequest('alpha_vantage_stocks', 5, 60000);
        
        if (!this.alphaVantageKey) {
          console.warn('No Alpha Vantage API key, using mock stock data');
          return this.getMockStockData(symbols);
        }

        // For demo, using mock data as Alpha Vantage has strict limits
        // In production, would implement proper stock API integration
        return this.getMockStockData(symbols);
      } catch (error) {
        console.error('Stock API error:', error.message);
        return this.getMockStockData(symbols);
      }
    }, 300);
  }

  getMockForexData(symbols) {
    const result = {};
    symbols.forEach(symbol => {
      if (this.mockData.forex[symbol]) {
        result[symbol] = {
          ...this.mockData.forex[symbol],
          lastUpdate: new Date().toISOString()
        };
      }
    });
    return result;
  }

  getMockCryptoData(coins) {
    const result = {};
    coins.forEach(coin => {
      if (this.mockData.crypto[coin]) {
        result[coin] = {
          ...this.mockData.crypto[coin],
          lastUpdate: new Date().toISOString()
        };
      }
    });
    return result;
  }

  getMockStockData(symbols) {
    const result = {};
    symbols.forEach(symbol => {
      if (this.mockData.stocks[symbol]) {
        result[symbol] = {
          ...this.mockData.stocks[symbol],
          lastUpdate: new Date().toISOString()
        };
      }
    });
    return result;
  }

  async getAllMarketData() {
    try {
      const [forex, crypto, stocks] = await Promise.all([
        this.getForexRates(),
        this.getCryptoData(),
        this.getStockData()
      ]);

      return {
        forex,
        crypto,
        stocks,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching all market data:', error);
      throw error;
    }
  }
}

module.exports = new MarketDataService();