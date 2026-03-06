const express = require('express');
const axios = require('axios');
const router = express.Router();

// Mock market data (replace with real API calls later)
const mockInstruments = [
  { id: 1, symbol: 'EUR/USD', name: 'Euro/US Dollar', type: 'forex', exchange: 'FOREX' },
  { id: 2, symbol: 'GBP/USD', name: 'British Pound/US Dollar', type: 'forex', exchange: 'FOREX' },
  { id: 3, symbol: 'BTC/USD', name: 'Bitcoin/US Dollar', type: 'crypto', exchange: 'BINANCE' },
  { id: 4, symbol: 'ETH/USD', name: 'Ethereum/US Dollar', type: 'crypto', exchange: 'BINANCE' },
  { id: 5, symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ' },
  { id: 6, symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', exchange: 'NASDAQ' },
  { id: 7, symbol: 'GOLD', name: 'Gold Spot', type: 'commodity', exchange: 'COMEX' },
  { id: 8, symbol: 'OIL', name: 'Crude Oil WTI', type: 'commodity', exchange: 'NYMEX' }
];

const mockPriceData = {
  'EUR/USD': { price: 1.0875, change: 0.0012, change_percent: 0.11 },
  'GBP/USD': { price: 1.2634, change: -0.0023, change_percent: -0.18 },
  'BTC/USD': { price: 67234.50, change: 1234.75, change_percent: 1.87 },
  'ETH/USD': { price: 3421.80, change: -87.20, change_percent: -2.49 },
  'AAPL': { price: 182.31, change: 2.15, change_percent: 1.19 },
  'GOOGL': { price: 138.92, change: -1.23, change_percent: -0.88 },
  'GOLD': { price: 2018.50, change: 12.30, change_percent: 0.61 },
  'OIL': { price: 78.45, change: -1.12, change_percent: -1.41 }
};

// Get all available instruments
router.get('/instruments', (req, res) => {
  try {
    const { type, search } = req.query;
    let instruments = mockInstruments;

    // Filter by type if specified
    if (type) {
      instruments = instruments.filter(inst => inst.type === type);
    }

    // Filter by search term if specified
    if (search) {
      const searchTerm = search.toLowerCase();
      instruments = instruments.filter(inst => 
        inst.symbol.toLowerCase().includes(searchTerm) || 
        inst.name.toLowerCase().includes(searchTerm)
      );
    }

    res.json({
      instruments,
      total: instruments.length
    });

  } catch (error) {
    console.error('Error fetching instruments:', error);
    res.status(500).json({ error: 'Failed to fetch instruments' });
  }
});

// Get current price for a specific symbol
router.get('/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const symbolUpper = symbol.toUpperCase();

    // Check if instrument exists
    const instrument = mockInstruments.find(inst => inst.symbol === symbolUpper);
    if (!instrument) {
      return res.status(404).json({ error: 'Symbol not found' });
    }

    // Get mock price data
    const priceData = mockPriceData[symbolUpper];
    if (!priceData) {
      return res.status(404).json({ error: 'Price data not available' });
    }

    res.json({
      symbol: symbolUpper,
      name: instrument.name,
      type: instrument.type,
      exchange: instrument.exchange,
      price: priceData.price,
      change: priceData.change,
      change_percent: priceData.change_percent,
      timestamp: new Date().toISOString(),
      source: 'MOCK_DATA'
    });

  } catch (error) {
    console.error('Error fetching price:', error);
    res.status(500).json({ error: 'Failed to fetch price data' });
  }
});

// Get historical price data
router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1h', limit = 100 } = req.query;
    const symbolUpper = symbol.toUpperCase();

    // Check if instrument exists
    const instrument = mockInstruments.find(inst => inst.symbol === symbolUpper);
    if (!instrument) {
      return res.status(404).json({ error: 'Symbol not found' });
    }

    // Generate mock historical data
    const currentPrice = mockPriceData[symbolUpper]?.price || 100;
    const historyData = [];
    const now = new Date();

    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 3600000); // 1 hour intervals
      const randomVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
      const price = currentPrice * (1 + randomVariation);
      
      historyData.push({
        timestamp: timestamp.toISOString(),
        price: parseFloat(price.toFixed(4)),
        volume: Math.random() * 1000000 // Mock volume
      });
    }

    res.json({
      symbol: symbolUpper,
      interval,
      data: historyData
    });

  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// Get market movers (top gainers and losers)
router.get('/movers', (req, res) => {
  try {
    const pricesWithSymbols = Object.entries(mockPriceData).map(([symbol, data]) => {
      const instrument = mockInstruments.find(inst => inst.symbol === symbol);
      return {
        symbol,
        name: instrument?.name || symbol,
        type: instrument?.type || 'unknown',
        price: data.price,
        change: data.change,
        change_percent: data.change_percent
      };
    });

    // Sort by change percentage
    const gainers = pricesWithSymbols
      .filter(item => item.change_percent > 0)
      .sort((a, b) => b.change_percent - a.change_percent)
      .slice(0, 5);

    const losers = pricesWithSymbols
      .filter(item => item.change_percent < 0)
      .sort((a, b) => a.change_percent - b.change_percent)
      .slice(0, 5);

    res.json({
      gainers,
      losers,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching market movers:', error);
    res.status(500).json({ error: 'Failed to fetch market movers' });
  }
});

module.exports = router;