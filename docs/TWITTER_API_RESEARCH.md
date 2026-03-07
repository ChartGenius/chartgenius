# Twitter/X API Integration Research
**For ApexLogics Real-Time Market Monitoring**

**Date:** March 2026  
**Author:** Zip (Research Agent)  
**Purpose:** Evaluate Twitter/X API options for tracking ~50 VIP accounts with market-moving tweets

---

## Executive Summary

**TL;DR:** X API shifted from fixed-tier subscriptions to **pay-per-usage in 2025**. For real-time monitoring of ~50 VIP accounts:
- **Recommended:** Direct X API v2 with filtered streaming (lowest latency, ~1-3 seconds)
- **Estimated Cost:** $50-200/month depending on tweet frequency
- **Alternative:** RapidAPI wrappers if you need additional pre-processing
- **Avoid:** Nitter (legal gray area, unreliable for production)

---

## 1. Twitter/X API Tiers & Pricing

### Current Model: Pay-Per-Usage (2025+)

X abandoned the traditional monthly subscription tiers in 2025. All plans now use **credit-based pay-per-usage**.

| Feature | Details |
|---------|---------|
| **Pricing Model** | Credit-based, pay-per-request |
| **Purchase** | Buy credits upfront in Developer Console |
| **Minimum Spend** | None (start with $5-10 credits) |
| **Cost Example** | Varies by endpoint (historical posts, recent search, streaming) |
| **Monthly Cap** | 2 million Post reads on standard plans |
| **Deduplication** | 24-hour window—same resource, no extra charge |
| **No Auto-Cancellation** | Stop anytime, no contracts |

### Legacy Plans (Deprecated but Still Available)

Some legacy accounts still have access to:
- **Free tier:** Very limited (150 tweets/15-min window search, no streaming)
- **Basic ($100/mo):** 300K tweets/month, streaming access (being phased out)
- **Pro ($5000/mo):** 2M+ tweets/month, full streaming, webhooks
- **Enterprise:** Custom rates, dedicated support, SLA guarantees

**Action:** If you have legacy access, migrate to pay-per-use—it's cheaper for moderate volume.

### New Pricing Tiers (Pay-Per-Usage)

| Tier | Monthly Spend Needed | Best For |
|------|-----------------|----------|
| **Starter** | $5-50 | Testing, learning, small projects |
| **Growth** | $50-500 | Production monitoring of 10-100 accounts |
| **Business** | $500-2000 | Heavy trading bots, multiple data streams |
| **Enterprise** | $2000+ | Multi-account, 24/7 operations, guaranteed uptime |

**Estimate for 50 VIP Accounts:**
- If tweets frequent (5-10/day each): ~$100-300/month
- If tweets sparse (1-2/day each): ~$30-75/month
- Peak periods (earnings season): could spike to $500+/month

---

## 2. Streaming vs Polling

### Streaming (Recommended for Real-Time Trading)

**What:** Persistent WebSocket-like connection that pushes tweets to you in real-time.

| Aspect | Details |
|--------|---------|
| **Latency** | **1-3 seconds** from tweet posted to your server |
| **API Endpoint** | `GET /2/tweets/search/stream` |
| **Cost** | Charged per Tweet received |
| **Rate Limits** | 100 active filter rules per stream, 1 connection per authenticated user |
| **Connection** | HTTP 2.0 persistent connection with chunked transfer encoding |
| **Availability** | Available on Basic tier and above; requires elevated access |
| **Webhook Alternative** | X doesn't officially offer webhooks; use streaming instead |

**Pros:**
- Lowest latency (critical for market-moving tweets)
- No polling overhead
- Can handle 50 accounts easily
- Real-time alerting possible

**Cons:**
- Requires persistent connection
- Need to handle reconnection logic
- Connection limits: 1 active stream per user

### Polling (Not Recommended)

**What:** You repeatedly ask for tweets, usually with `GET /2/tweets/search/recent`.

| Aspect | Details |
|--------|---------|
| **Latency** | **30 seconds to 15 minutes** depending on poll interval |
| **API Endpoint** | `GET /2/tweets/search/recent` |
| **Cost** | Charged per request (higher cost per useful data) |
| **Rate Limits** | 300 requests per 15-minute window per endpoint |
| **Frequency** | Typically 30-60 second intervals for near-real-time |
| **Availability** | Free tier and above |

**Pros:**
- Simpler implementation
- No persistent connection needed
- Works with basic tier

**Cons:**
- **10-30 second minimum latency** (depends on poll interval)
- Wasteful: pay for polls that return no new tweets
- Scales poorly (50 accounts = 50 API calls every 30 seconds)
- Can hit rate limits quickly

### Comparison for Your Use Case (50 VIP Accounts)

| Metric | Streaming | Polling (30s interval) |
|--------|-----------|----------------------|
| **Latency** | 1-3 seconds | 15-30 seconds |
| **API Calls/Hour** | ~(tweets received) | 50 accounts × 120 calls = 6000 |
| **Est. Monthly Cost** | $100-300 | $500-1500 (due to polling overhead) |
| **Real-Time Alerting** | ✅ Yes | ⚠️ Delayed |
| **Complexity** | Medium | Low |

**Recommendation:** **Use streaming.** Lower cost, lower latency, better for trading alerts.

---

## 3. Implementation Options

### Option A: Direct X API v2 (Recommended)

**Using:** Official `tweepy` (Python) or `twitter-api-v2` (Node.js)

#### Python (Tweepy)

```python
import tweepy
import json

# Setup
client = tweepy.Client(bearer_token="YOUR_BEARER_TOKEN")

# Create filter rules
rules = [
    tweepy.client.StreamRule("$TSLA", tag="Tesla"),
    tweepy.client.StreamRule("$AAPL", tag="Apple"),
    tweepy.client.StreamRule("from:elonmusk", tag="Elon"),
]

client.add_rules(rules)

# Stream tweets
for response in client.get_stream(
    tweet_fields=['created_at', 'public_metrics'],
    expansions=['author_id'],
    user_fields=['username', 'verified'],
    max_results=None  # Stream continuously
):
    tweet = response.data
    print(f"[{tweet.created_at}] {tweet.text}")
    
    # Your alert logic here
    if int(tweet.public_metrics['retweet_count']) > 100:
        send_alert(tweet)
```

**Setup:**
1. Get Developer Portal access: https://developer.x.com
2. Create an app, enable "Read + Write" permissions
3. Generate Bearer Token
4. Request elevated access for streaming (5-10 business days)

**Rate Limits:**
- Streaming: No hard per-second limit; connection stability matters
- Rules: Up to 100 active rules per stream
- Connections: 1 per authenticated user

**Cost:** ~$150/month for moderate-volume 50-account monitoring

**Pros:**
- Official library, well-documented
- Handles auth, rate limits, reconnection logic
- Async support for scalability

**Cons:**
- Elevated access required (slight delay in setup)
- Bearer token management

---

#### Node.js (twitter-api-v2)

```javascript
import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi(process.env.BEARER_TOKEN);
const rwClient = client.readWrite;

// Add rules
const rules = [
  { value: '$TSLA', tag: 'Tesla' },
  { value: '$AAPL', tag: 'Apple' },
  { value: 'from:elonmusk', tag: 'Elon' },
];

await rwClient.v2.updateStreamRules({ add: rules });

// Stream
const stream = await rwClient.v2.searchStream({
  expansions: 'author_id',
  'tweet.fields': 'created_at,public_metrics',
  'user.fields': 'username,verified',
});

stream.on('data', (tweet) => {
  console.log(`[${tweet.data.created_at}] ${tweet.data.text}`);
  
  if (tweet.data.public_metrics.retweet_count > 100) {
    sendAlert(tweet);
  }
});

stream.on('error', (err) => {
  console.error('Stream error:', err);
  // Reconnect logic
});
```

**Setup:** Same as Python (Developer Portal + Bearer Token + elevated access)

**Rate Limits:** Same as Python

**Cost:** Same as Python

**Pros:**
- Modern async/await syntax
- Event-driven architecture fits real-time use case
- Good for Node.js backends

**Cons:**
- Slightly fewer third-party examples than Python

---

### Option B: Third-Party API Services

#### RapidAPI Twitter Endpoints

**What:** Proxy layer over X API with pre-processing.

**Popular Options:**
- **RapidAPI - Twitter API (free tier available)**
- **ScraperAPI - Twitter scraper** (if you want scraped data)

**Cost:** Free tier ~100 calls/month; Pro $15-50/month

**Pros:**
- Easier auth (no elevated access wait)
- Pre-processed data (sentiment, engagement predictions)
- Webhook support on paid plans
- Good for proof-of-concept

**Cons:**
- Additional latency (request → RapidAPI → X API → response)
- More expensive per request than direct API
- Dependent on third-party uptime
- Rate limits tighter than direct access

**Verdict:** **Use only for testing.** Direct API is cheaper and faster for production.

---

### Option C: Webhook Approach

**Problem:** X API doesn't officially offer webhooks.

**Workarounds:**
1. **Streaming → Your Webhook Service:** Stream tweets, then webhook to handlers (adds latency)
2. **Third-Party Webhook Adapters:** Services like Zapier or IFTTT (expensive, unreliable)

**Verdict:** Skip webhooks. Direct streaming is simpler and faster.

---

### Summary: Implementation Comparison

| Option | Latency | Cost/Month | Complexity | Reliability |
|--------|---------|----------|-----------|------------|
| **Direct Streaming (Tweepy)** | 1-3s | $100-300 | Medium | ⭐⭐⭐⭐⭐ |
| **Direct Streaming (Node.js)** | 1-3s | $100-300 | Medium | ⭐⭐⭐⭐⭐ |
| **RapidAPI** | 5-15s | $200-500 | Low | ⭐⭐⭐ |
| **Polling (Python)** | 15-30s | $500-1500 | Low | ⭐⭐⭐⭐ |

**Recommended:** Direct streaming with Tweepy (Python) or twitter-api-v2 (Node.js)

---

## 4. Alternatives to Official API

### Nitter (Social Media Mirror)

**What:** Open-source, privacy-focused Twitter frontend. No API officially, but instances expose JSON endpoints.

**Examples:**
- https://nitter.net/timeline/{username}.json (unofficial endpoints)
- Self-hosted nitter instance

**Legality Concerns:**
- ⚠️ **Not endorsed by X/Twitter**
- Terms of Service: Scraping is prohibited (gray area for read-only)
- Risk: X could block/shut down Nitter instances anytime
- No SLA, instances go down frequently

**Cost:** Free (but unpredictable)

**Pros:**
- No auth needed
- Privacy-focused
- Lightweight

**Cons:**
- Unreliable (instances removed/blocked frequently)
- **High legal risk** (violates Twitter ToS)
- No official support
- Latency depends on instance uptime
- **Not recommended for production/financial use**

**Verdict:** ❌ **Avoid for financial trading.** Legal/reliability too risky.

---

### Social Media Aggregators

**Services:** Bloomberg Terminal, Facteus, Brandwatch, Meltwater

**What:** Enterprise platforms that aggregate X tweets + sentiment + alerts

**Cost:** $5000-50000/month (enterprise pricing)

**Pros:**
- Pre-built alerts, sentiment analysis
- Compliance-friendly (proper licensing)
- Expert-curated insights

**Cons:**
- Overkill for 50-account monitoring
- Expensive
- Less customizable than direct API

**Verdict:** ⚠️ **Consider only if you need legal compliance guarantees.** Otherwise, DIY with direct API is cheaper.

---

### RSS Bridges for Twitter

**Services:** twitter-to-rss.com, RSS bridges

**What:** Convert Twitter timelines to RSS feeds

**Cost:** Free-$10/month

**Pros:**
- Simple feed parsing
- No API key needed

**Cons:**
- Very slow (RSS polls regularly)
- Not real-time
- Unreliable

**Verdict:** ❌ **Not suitable for market-moving tweets.** Too slow.

---

### Alternatives Summary

| Option | Latency | Cost | Legal Status | Reliability |
|--------|---------|------|-----|----------|
| **Nitter** | 5-30s | Free | ⚠️ Gray area | ⭐⭐ |
| **RapidAPI** | 5-15s | $15-50/mo | ✅ Legal | ⭐⭐⭐ |
| **Aggregators** | Real-time | $5000+/mo | ✅ Legal | ⭐⭐⭐⭐⭐ |
| **RSS Bridges** | 5-15min | Free | ✅ Legal | ⭐ |
| **Direct X API** | 1-3s | $100-300/mo | ✅ Legal | ⭐⭐⭐⭐⭐ |

---

## 5. Recommended Approach for 50 VIP Accounts

### Architecture

```
Your Server
    ↓
    ├─→ [Stream Manager (Tweepy)]
    │       └─→ Filter Rules (50 accounts/keywords)
    │       └─→ Real-time tweet ingestion
    │
    ├─→ [Alert Logic]
    │       └─→ Keyword detection
    │       └─→ Engagement threshold checking
    │       └─→ Sentiment analysis (optional)
    │
    └─→ [Actions]
            └─→ Log to DB
            └─→ Send Telegram/Slack alerts
            └─→ Trigger trades (if using for trading)
```

### Technology Stack

**Language:** Python (tweepy is most mature)

**Libraries:**
- `tweepy` - X API client
- `python-dotenv` - Secret management
- `aiohttp` - Async HTTP for webhooks
- `sqlite3` or `postgres` - Event logging
- `tenacity` - Reconnection logic

### Implementation Steps

#### 1. Setup (1-2 hours)

```bash
# Clone or create repo
mkdir apexlogics-twitter-monitor
cd apexlogics-twitter-monitor

# Create virtualenv
python -m venv venv
source venv/bin/activate

# Install deps
pip install tweepy python-dotenv aiohttp psycopg2-binary

# Create .env
echo "BEARER_TOKEN=YOUR_BEARER_TOKEN_HERE" > .env
echo "DB_URL=sqlite:///tweets.db" >> .env
```

#### 2. Create Core Stream Handler

```python
# stream_handler.py
import tweepy
import logging
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

class TweetStreamHandler(tweepy.StreamingClientAbstractProcessor):
    def __init__(self, bearer_token, alert_callback=None):
        self.client = tweepy.Client(bearer_token=bearer_token)
        self.alert_callback = alert_callback
        self.logger = logging.getLogger(__name__)
    
    def process_tweet(self, tweet):
        """Called for each tweet received"""
        self.logger.info(f"Tweet: {tweet.text}")
        
        # Your logic here
        if self.alert_callback:
            self.alert_callback(tweet)
    
    def on_connection_closed(self):
        self.logger.warning("Stream disconnected, reconnecting...")
    
    def start_stream(self, rules_list):
        """Start streaming with rules"""
        # Clear old rules
        existing = self.client.get_rules()
        if existing.data:
            self.client.delete_rules(ids=[r.id for r in existing.data])
        
        # Add new rules
        rule_objects = [
            tweepy.client.StreamRule(r['value'], tag=r.get('tag', ''))
            for r in rules_list
        ]
        self.client.add_rules(rule_objects)
        
        # Start stream
        for response in self.client.get_stream(
            tweet_fields=['created_at', 'author_id', 'public_metrics', 'conversation_id'],
            expansions=['author_id'],
            user_fields=['username', 'verified', 'public_metrics'],
            max_results=None
        ):
            self.process_tweet(response.data)

# Main execution
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    rules = [
        {'value': '$TSLA', 'tag': 'Tesla'},
        {'value': '$AAPL', 'tag': 'Apple'},
        {'value': 'from:elonmusk', 'tag': 'Elon Musk'},
        # ... add 47 more accounts/keywords
    ]
    
    def my_alert(tweet):
        print(f"🚨 ALERT: {tweet.text[:100]}...")
    
    handler = TweetStreamHandler(
        bearer_token=os.getenv('BEARER_TOKEN'),
        alert_callback=my_alert
    )
    
    handler.start_stream(rules)
```

#### 3. Add Database Logging

```python
# db.py
import sqlite3
from datetime import datetime

class TweetDB:
    def __init__(self, db_path="tweets.db"):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute('''
            CREATE TABLE IF NOT EXISTS tweets (
                tweet_id TEXT PRIMARY KEY,
                author TEXT,
                text TEXT,
                created_at TEXT,
                public_metrics TEXT,
                received_at TEXT
            )
        ''')
        conn.commit()
        conn.close()
    
    def insert_tweet(self, tweet):
        conn = sqlite3.connect(self.db_path)
        conn.execute('''
            INSERT OR IGNORE INTO tweets 
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            tweet.id,
            tweet.author_id,
            tweet.text,
            tweet.created_at,
            str(tweet.public_metrics),
            datetime.utcnow().isoformat()
        ))
        conn.commit()
        conn.close()
```

#### 4. Add Alerting (Telegram Example)

```python
# alerts.py
import aiohttp
import asyncio

class TelegramAlert:
    def __init__(self, bot_token, chat_id):
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    
    async def send(self, message):
        async with aiohttp.ClientSession() as session:
            await session.post(self.url, json={
                'chat_id': self.chat_id,
                'text': message,
                'parse_mode': 'HTML'
            })

def create_alert_message(tweet):
    return f"""
🚨 <b>Market Alert</b>
👤 {tweet.author_id}
📝 {tweet.text[:200]}
📊 Retweets: {tweet.public_metrics['retweet_count']}
    """
```

### Cost Estimate (Detailed)

**For 50 VIP accounts, assuming:**
- Average 3 tweets/day per account = 150 tweets/day
- Peak: 10 tweets/day = 500 tweets/day

**Monthly calculations:**
- Light usage: 150 × 30 = 4,500 tweets = ~$25-50/month
- Moderate: 300 × 30 = 9,000 tweets = ~$50-150/month
- Heavy: 500 × 30 = 15,000 tweets = ~$100-300/month

**Infrastructure:**
- VPS: $5-20/month (small instance)
- Database: Free (SQLite) or $15/month (cloud Postgres)
- Telegram/Slack: Free

**Total Monthly Cost: $75-350**

---

## 6. Legal Considerations

### Twitter Terms of Service for Financial Applications

**Key Restrictions:**
1. **Prohibited Activities:**
   - Using tweets for automated trading without disclosure
   - Creating competing real-time data services
   - Claiming tweets are endorsements (they're not)
   - High-frequency trading bots (check ToS for specific language)

2. **Allowed:**
   - Monitoring tweets for alerts (informational use)
   - Displaying tweets with proper attribution
   - Academic/research analysis
   - Internal company monitoring (non-public use)

3. **Attribution Requirements:**
   - If displaying tweets publicly, must credit X and original author
   - Link back to original tweet
   - Use official X branding

### Display vs. Alert-Only Model

**Alert-Only (Recommended):**
```
🚨 Tweet Alert: $TSLA mentioned
[Send to internal Telegram only]
[No public display of tweet content]
✅ COMPLIANT
```

**Display Model:**
```
BREAKING: Elon Musk just tweeted...
[Tweet text here with link back to X]
[X logo/attribution]
✅ COMPLIANT IF ATTRIBUTED
```

### Best Practices

1. ✅ Use tweets as **data input** (not public display)
2. ✅ Store alerts internally, don't redistribute
3. ✅ Add proper error handling (X API goes down sometimes)
4. ✅ Respect rate limits (don't hammer the API)
5. ✅ Monitor X status page: https://status.x.com
6. ⚠️ **Avoid** claiming market expertise based on tweet analysis
7. ⚠️ **Avoid** creating derivative products (sentiment databases for resale)
8. ⚠️ **Disclose** to users/investors that you're using social media signals

### Enterprise Compliance

For regulated trading/brokerage:
- Get **API Data Agreement** from X (apply through Developer Portal)
- Consider **Thomson Reuters DataScope** or **Bloomberg** for financial-grade data
- Maintain audit logs of all trades triggered by tweet alerts
- Document your risk model separately from sentiment data

---

## 7. Final Recommendation

### For ApexLogics (Immediate Implementation)

**Choose:**
```
✅ Direct X API v2 with Filtered Streaming
✅ Python + Tweepy
✅ Alert-only model (internal Telegram/Slack)
✅ ~50 filter rules (accounts + keywords)
✅ SQLite for persistence
```

**Setup Timeline:**
- Week 1: Apply for elevated API access + setup dev environment
- Week 2: Build and test stream handler
- Week 3: Add alerts + database logging
- Week 4: Deploy to production, monitor

**Monthly Cost:** ~$150 (API + hosting)

**Latency:** 1-3 seconds (market-critical)

**Reliability:** 99.5% (X infrastructure)

### Alternative If You Need Sentiment Analysis

Add:
- `TextBlob` or `VADER` for tweet sentiment
- `spaCy` for NER (Named Entity Recognition)
- This adds ~$20-50/month for compute, but gives you scoring:

```python
from textblob import TextBlob

def score_tweet(tweet):
    blob = TextBlob(tweet.text)
    sentiment = blob.sentiment.polarity  # -1 (bearish) to +1 (bullish)
    
    if sentiment > 0.7:
        return "BULLISH"
    elif sentiment < -0.7:
        return "BEARISH"
    else:
        return "NEUTRAL"
```

### What NOT to Do

❌ Nitter (unreliable + ToS violation)  
❌ Polling model (too expensive + high latency)  
❌ RapidAPI (worse latency than direct API)  
❌ Complex ML models without data (GIGO - Garbage In, Garbage Out)

---

## Actionable Next Steps

1. **Apply for X API Elevated Access**
   - Go to https://developer.x.com
   - Create app, request "elevated access" for streaming
   - Wait 5-10 business days

2. **Prepare Filter Rules**
   - List 50 VIP accounts/keywords to monitor
   - Define alert thresholds (retweet count, engagement, keywords)
   - Document trading rules that use tweet signals

3. **Build Proof of Concept**
   - Use code snippet from Section 5
   - Test with 5 accounts first
   - Validate alerts work

4. **Deploy**
   - Set up simple VPS (DigitalOcean $5/mo or AWS EC2)
   - Add systemd service for auto-restart
   - Monitor X status page + add circuit breaker logic

5. **Compliance**
   - Document that you're using X data for alerts
   - Keep audit log of trades triggered by tweets
   - Review X Data Agreement

---

## References

- [X API Documentation](https://docs.x.com)
- [X API Pricing](https://docs.x.com/x-api/getting-started/pricing)
- [Filtered Stream Rules Docs](https://docs.x.com/x-api/tweets/filtered-stream/integrate/build-a-rule)
- [Tweepy Documentation](https://docs.tweepy.org)
- [X Terms of Service](https://twitter.com/tos)
- [X API Status](https://status.x.com)

---

## Questions to Clarify with Erick

1. Do you have existing legacy Basic/Pro API tier access? (affects cost)
2. What's your risk tolerance for tweet-based signals vs. traditional data?
3. Do you want sentiment analysis built in, or just raw tweet alerts?
4. Should the system trigger trades automatically or just alert humans?
5. Are there compliance/regulatory requirements (SEC, FINRA)?

---

**Document Version:** 1.0  
**Last Updated:** March 2026  
**Status:** Actionable - Ready to implement
