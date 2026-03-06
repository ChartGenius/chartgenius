# ChartGenius 📊

**Real-time market intelligence, AI-powered news analysis, and social sentiment tracking for traders.**

ChartGenius is a comprehensive trading intelligence platform that aggregates market data, financial news, and social sentiment into actionable insights. Track multiple asset classes, set intelligent alerts, and make data-driven trading decisions.

---

## Features

### 🔄 Real-Time Market Data
- Live price feeds for **stocks, forex, cryptocurrencies, and commodities**
- Intraday charts with multiple timeframes
- 20+ years of historical data available
- Top movers (gainers/losers) across markets
- Advanced technical indicators (SMA, EMA, MACD, RSI, Bollinger Bands, etc.)

### 📰 AI-Powered News Aggregation
- Multi-source news collection (NewsAPI, RSS feeds, Reddit, Twitter)
- **Automatic sentiment analysis** (-1 to 1 sentiment score)
- **Impact scoring** (0-10) for news relevance to trading
- AI-generated summaries for quick insights
- Symbol-specific news feeds with relevance filtering

### 🎯 Smart Watchlist & Alerts
- Create unlimited watchlists (Professional+ tier)
- Price-based alerts with threshold configuration
- Volume spike detection
- News impact alerts (when important news breaks)
- Multi-channel notifications (email, push, in-app)

### 👥 Social Sentiment Analysis
- Real-time social media mention tracking
- Sentiment aggregation from multiple platforms
- Influencer tracking (coming soon)
- Community sentiment vs. price correlation

### 📅 Calendar Integration
- Sync earnings announcements to your calendar
- Economic events calendar
- Automatic reminders for key dates
- Custom event creation for trading setups

### 💼 Subscription Tiers

#### Free Tier
- 15-minute delayed data
- 5 news articles per day
- Basic watchlist (10 assets)
- Email alerts only
- Community features

#### Professional Tier ($19/month)
- ✅ Real-time data access
- ✅ Unlimited news + AI summaries
- ✅ Advanced watchlist (unlimited assets)
- ✅ Push notifications
- ✅ Social sentiment scores
- ✅ Calendar integration

#### Enterprise Tier ($99/month)
- ✅ Everything in Professional
- ✅ API access (1000 calls/hour)
- ✅ Custom alert rules and patterns
- ✅ Priority support
- ✅ Advanced analytics dashboard
- ✅ Data export (CSV, JSON)
- ✅ Dedicated account manager

---

## Tech Stack

### Frontend
- **Framework:** React 18 / Next.js 14
- **Styling:** TailwindCSS + Shadcn/ui components
- **State Management:** Zustand
- **Real-time:** WebSocket integration for live price updates
- **Charts:** Recharts for data visualization

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** PostgreSQL (primary) + Redis (cache & real-time)
- **Authentication:** JWT with refresh tokens
- **Job Queue:** Bull for background tasks

### External Services
- **Market Data:** Alpha Vantage, FinnHub, Polygon.io, CoinGecko
- **News:** NewsAPI, RSS feeds, Reddit API, Twitter API
- **NLP/AI:** TextBlob for sentiment, Custom ML models for impact scoring
- **Notifications:** SendGrid (email), Firebase Cloud Messaging (push)
- **Hosting:** Docker + Kubernetes (production)

---

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 13+
- Redis 6+
- API keys for at least one market data provider

### Backend Setup

```bash
# Clone repository
git clone https://github.com/apexlogics/chartgenius.git
cd chartgenius/backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys and database credentials

# Setup database
npm run migrate

# Start development server
npm run dev
```

#### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chartgenius
REDIS_URL=redis://localhost:6379

# API Keys (at least one required)
ALPHA_VANTAGE_KEY=your_key_here
FINNHUB_TOKEN=your_token_here
POLYGON_API_KEY=your_key_here
COINGECKO_API_KEY=your_key_here (optional - free)

# News APIs
NEWSAPI_KEY=your_key_here
TWITTER_API_TOKEN=your_token_here

# Authentication
JWT_SECRET=your_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRY=15m

# Email
SENDGRID_API_KEY=your_key_here

# Environment
NODE_ENV=development
PORT=3001
```

### Frontend Setup

```bash
cd chartgenius/frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with API endpoint

# Start development server
npm run dev
```

#### Required Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## API Endpoints

### Base URL
```
http://localhost:3001/api
```

### Authentication

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "trader@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Trader"
}

Response:
{
  "id": "user_123",
  "email": "trader@example.com",
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "subscriptionTier": "free"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "trader@example.com",
  "password": "SecurePassword123!"
}
```

#### Refresh Token
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### Get Profile
```
GET /auth/profile
Authorization: Bearer {accessToken}
```

### Market Data

#### List Instruments
```
GET /markets/instruments?type=stock&limit=20&offset=0
Authorization: Bearer {accessToken}

Response:
{
  "instruments": [
    {
      "id": 1,
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "type": "stock",
      "exchange": "NASDAQ"
    }
  ],
  "total": 15000,
  "limit": 20,
  "offset": 0
}
```

#### Get Current Price
```
GET /markets/price/AAPL
Authorization: Bearer {accessToken}

Response:
{
  "symbol": "AAPL",
  "price": 182.45,
  "change": 2.15,
  "changePercent": 1.19,
  "volume": 45320000,
  "timestamp": "2026-03-05T14:32:00Z",
  "source": "finnhub"
}
```

#### Get Price History
```
GET /markets/history/AAPL?interval=daily&start=2026-01-01&end=2026-03-05
Authorization: Bearer {accessToken}

Response:
{
  "symbol": "AAPL",
  "interval": "daily",
  "data": [
    {
      "timestamp": "2026-01-01",
      "open": 180.50,
      "high": 183.20,
      "low": 179.80,
      "close": 182.15,
      "volume": 52340000
    }
  ]
}
```

#### Get Top Movers
```
GET /markets/movers?type=gainers&limit=10
Authorization: Bearer {accessToken}

Response:
{
  "movers": [
    {
      "symbol": "NVDA",
      "name": "NVIDIA Corporation",
      "price": 875.50,
      "change": 45.25,
      "changePercent": 5.45,
      "volume": 32100000
    }
  ]
}
```

### News & Analysis

#### Get Latest News
```
GET /news?limit=20&offset=0&sort=published_at
Authorization: Bearer {accessToken}

Response:
{
  "articles": [
    {
      "id": "article_123",
      "title": "Federal Reserve Signals Rate Cuts Ahead",
      "summary": "The Fed chair indicated potential interest rate cuts...",
      "content": "Full article content...",
      "source": "Reuters",
      "url": "https://...",
      "publishedAt": "2026-03-05T12:00:00Z",
      "sentimentScore": 0.65,
      "impactScore": 8.5,
      "relatedSymbols": ["SPY", "IWM", "UST"]
    }
  ],
  "total": 2340,
  "limit": 20,
  "offset": 0
}
```

#### Search News
```
GET /news/search?q=bitcoin+ethereum&symbols=BTC,ETH&limit=10
Authorization: Bearer {accessToken}
```

#### Get Sentiment Analysis
```
GET /news/sentiment/AAPL?period=7d
Authorization: Bearer {accessToken}

Response:
{
  "symbol": "AAPL",
  "period": "7d",
  "sentimentScore": 0.58,
  "articleCount": 145,
  "positive": 95,
  "neutral": 35,
  "negative": 15,
  "trend": "improving"
}
```

#### Get High-Impact News
```
GET /news/impact?minScore=7.5&limit=5
Authorization: Bearer {accessToken}
```

### Watchlist

#### Get User Watchlist
```
GET /watchlist
Authorization: Bearer {accessToken}

Response:
{
  "watchlists": [
    {
      "id": "wl_123",
      "name": "Tech Stocks",
      "items": [
        {
          "id": "wi_456",
          "symbol": "AAPL",
          "name": "Apple Inc.",
          "alertThresholdUp": 200,
          "alertThresholdDown": 150,
          "currentPrice": 182.45
        }
      ],
      "createdAt": "2026-02-15T10:30:00Z"
    }
  ]
}
```

#### Add to Watchlist
```
POST /watchlist/{watchlistId}/items
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "symbol": "NVDA",
  "alertThresholdUp": 1000,
  "alertThresholdDown": 800
}

Response:
{
  "id": "wi_789",
  "symbol": "NVDA",
  "name": "NVIDIA Corporation",
  "alertThresholdUp": 1000,
  "alertThresholdDown": 800
}
```

#### Remove from Watchlist
```
DELETE /watchlist/{watchlistId}/items/{itemId}
Authorization: Bearer {accessToken}
```

#### Update Alert Thresholds
```
PUT /watchlist/{watchlistId}/items/{itemId}/alerts
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "alertThresholdUp": 1050,
  "alertThresholdDown": 750
}
```

---

## Development

### Project Structure
```
chartgenius/
├── backend/
│   ├── src/
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API endpoints
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Utilities
│   │   └── jobs/            # Background jobs
│   ├── tests/               # Test suites
│   └── migrations/          # Database migrations
├── frontend/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   ├── styles/              # CSS/TailwindCSS
│   └── public/              # Static assets
├── database/
│   └── schema.sql           # Database schema
└── docker-compose.yml       # Container orchestration
```

### Running Tests
```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test
```

### Building for Production
```bash
# Backend
npm run build
npm start

# Frontend
npm run build
npm start
```

---

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Use ESLint for JavaScript/TypeScript
- Use Prettier for code formatting
- Write tests for new features
- Update documentation as needed

---

## Roadmap

### Q1 2026
- ✅ MVP launch with real-time data + news
- ✅ Watchlist & basic alerts
- 🔄 Google Calendar integration
- 🔄 Mobile app (React Native)

### Q2 2026
- Social sentiment dashboard
- Advanced pattern recognition
- API rate limit optimization
- Community features (ideas sharing)

### Q3 2026
- AI trading signals
- Portfolio backtesting
- Risk assessment tools
- Institutional API access

---

## License

ChartGenius is proprietary software. All rights reserved. Unauthorized use, distribution, or modification is prohibited.

---

## Support

- **Documentation:** https://docs.chartgenius.io
- **Email:** support@chartgenius.io
- **Discord:** https://discord.gg/chartgenius
- **Status Page:** https://status.chartgenius.io

---

## Disclaimer

ChartGenius is for informational and educational purposes only. It is not financial advice. Always consult with a qualified financial advisor before making investment decisions. Past performance does not guarantee future results. The creators and contributors are not liable for any losses incurred from using this platform.

---

**Made with ❤️ by ApexLogics**

*Last Updated: March 5, 2026*
