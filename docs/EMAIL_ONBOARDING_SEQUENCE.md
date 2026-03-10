# TradVue Email Onboarding Sequence

*Prepared by Zip | March 9, 2026*

---

## Overview

3-email welcome sequence for new TradVue signups. Goal: activate users from signup → first watchlist → first trade import → sharing/referral.

**Sending schedule:**
- Email 1: Day 0 (immediately after signup)
- Email 2: Day 2
- Email 3: Day 5

**From:** TradVue Team <hello@tradvue.com>
**Reply-to:** support@tradvue.com

---

## Email 1 — Welcome (Day 0)

### Subject Lines

1. **Primary:** Welcome to TradVue — let's set up your edge 🎯
2. **Alt A:** You're in! Here's your quick-start guide
3. **Alt B:** Welcome aboard — your trading toolkit is ready

### Preview Text
Your free trading platform is ready. Here's how to get started in 2 minutes.

### CTA Button Text
**Set Up My First Watchlist →**

### Body Copy

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">

  <div style="text-align: center; padding: 32px 0;">
    <img src="{{LOGO_URL}}" alt="TradVue" width="160" />
  </div>

  <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">
    Welcome to TradVue, {{FIRST_NAME}} 👋
  </h1>

  <p style="font-size: 16px; line-height: 1.6; color: #333;">
    You just unlocked a complete trading platform — portfolio tracking, market analysis, a trading journal, and AI-powered stock scoring. All free. No catch.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #333;">
    Here's what's waiting for you:
  </p>

  <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #eee;">
        <strong>📊 Portfolio Tracker</strong><br/>
        <span style="color: #666;">Monitor all your holdings in real time. See performance, allocation, and dividends at a glance.</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #eee;">
        <strong>📓 Trading Journal</strong><br/>
        <span style="color: #666;">Log every trade. Import from any broker via CSV. Spot patterns in your wins and losses.</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px; border-bottom: 1px solid #eee;">
        <strong>🤖 AI Stock Scoring</strong><br/>
        <span style="color: #666;">Get data-driven scores on any stock — fundamentals, technicals, and sentiment combined.</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px;">
        <strong>📅 Economic Calendar</strong><br/>
        <span style="color: #666;">Never miss earnings, FOMC meetings, CPI releases, or other market-moving events.</span>
      </td>
    </tr>
  </table>

  <h2 style="font-size: 20px; font-weight: 600; margin-top: 32px;">
    Your first move? Build a watchlist.
  </h2>

  <p style="font-size: 16px; line-height: 1.6; color: #333;">
    A good watchlist is the foundation of good trading. Add the tickers you're tracking and TradVue will keep you updated with real-time data, AI scores, and upcoming events.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #333;">
    It takes about 30 seconds. Seriously.
  </p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="{{WATCHLIST_URL}}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">
      Set Up My First Watchlist →
    </a>
  </div>

  <p style="font-size: 14px; line-height: 1.6; color: #888; margin-top: 40px;">
    Questions? Just reply to this email — a real person will get back to you.
  </p>

  <div style="border-top: 1px solid #eee; padding-top: 24px; margin-top: 32px; text-align: center; color: #999; font-size: 13px;">
    <p>TradVue — Trade Smarter, Not Harder</p>
    <p>
      <a href="{{TWITTER_URL}}" style="color: #999; text-decoration: none;">Twitter</a> · 
      <a href="{{YOUTUBE_URL}}" style="color: #999; text-decoration: none;">YouTube</a> · 
      <a href="{{BLOG_URL}}" style="color: #999; text-decoration: none;">Blog</a>
    </p>
    <p><a href="{{UNSUBSCRIBE_URL}}" style="color: #999;">Unsubscribe</a></p>
  </div>

</div>
```

---

## Email 2 — Value (Day 2)

### Subject Lines

1. **Primary:** Your trading edge starts here 📈
2. **Alt A:** The one habit that separates profitable traders
3. **Alt B:** Most traders skip this — don't be most traders

### Preview Text
Import your first trade and see what your data reveals about your trading.

### CTA Button Text
**Import My First Trade →**

### Body Copy

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">

  <div style="text-align: center; padding: 32px 0;">
    <img src="{{LOGO_URL}}" alt="TradVue" width="160" />
  </div>

  <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">
    Your trading edge starts here
  </h1>

  <p style="font-size: 16px; line-height: 1.6; color: #333;">
    Hey {{FIRST_NAME}},
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #333;">
    Here's something most traders won't tell you: the difference between consistent profitability and guessing isn't a better strategy — it's better data about <em>your own</em> trading.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #333;">
    That's why we built three features that work together to give you an edge:
  </p>

  <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
    <h3 style="margin-top: 0; font-size: 18px;">📓 Trading Journal</h3>
    <p style="color: #555; margin-bottom: 0;">
      Every trade tells a story. Import your trades from any broker via CSV and TradVue automatically calculates your P&L, win rate, average R-multiple, and more. You'll see patterns you never noticed — like which setups actually make you money and which ones just <em>feel</em> like they do.
    </p>
  </div>

  <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
    <h3 style="margin-top: 0; font-size: 18px;">🛠️ Trading Tools</h3>
    <p style="color: #555; margin-bottom: 0;">
      Stock screeners, technical analysis, comparison tools — everything you need to find and evaluate opportunities. No subscription required. No feature gates. The full toolkit, free.
    </p>
  </div>

  <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
    <h3 style="margin-top: 0; font-size: 18px;">🤖 AI Stock Scoring</h3>
    <p style="color: #555; margin-bottom: 0;">
      Cut through the noise. Our AI analyzes fundamentals, technicals, and market sentiment to give every stock a clear, data-driven score. It's like having an analyst on your team — one that doesn't have a hidden agenda.
    </p>
  </div>

  <h2 style="font-size: 20px; font-weight: 600; margin-top: 32px;">
    Ready to see your trading data come alive?
  </h2>

  <p style="font-size: 16px; line-height: 1.6; color: #333;">
    Import your first trade and TradVue will start building your performance profile. Export a CSV from your broker (we support Robinhood, Schwab, IBKR, TD Ameritrade, and more), upload it, and watch the insights roll in.
  </p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="{{IMPORT_URL}}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">
      Import My First Trade →
    </a>
  </div>

  <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0; font-size: 14px; color: #92400e;">
      <strong>💡 Pro tip:</strong> Import at least 20 trades for meaningful analytics. The more data TradVue has, the better the insights get.
    </p>
  </div>

  <p style="font-size: 14px; line-height: 1.6; color: #888; margin-top: 40px;">
    Need help with the import? Check out our <a href="{{IMPORT_GUIDE_URL}}" style="color: #2563eb;">CSV import guide</a> or reply to this email.
  </p>

  <div style="border-top: 1px solid #eee; padding-top: 24px; margin-top: 32px; text-align: center; color: #999; font-size: 13px;">
    <p>TradVue — Trade Smarter, Not Harder</p>
    <p>
      <a href="{{TWITTER_URL}}" style="color: #999; text-decoration: none;">Twitter</a> · 
      <a href="{{YOUTUBE_URL}}" style="color: #999; text-decoration: none;">YouTube</a> · 
      <a href="{{BLOG_URL}}" style="color: #999; text-decoration: none;">Blog</a>
    </p>
    <p><a href="{{UNSUBSCRIBE_URL}}" style="color: #999;">Unsubscribe</a></p>
  </div>

</div>
```

---

## Email 3 — Engagement (Day 5)

### Subject Lines

1. **Primary:** 3 ways to get more from TradVue (most people miss #2)
2. **Alt A:** You're leaving money on the table — here's how to fix it
3. **Alt B:** The TradVue feature that changes how you pick stocks

### Preview Text
AI stock scoring, smart alerts, and a trick for your weekly review. Plus: share TradVue with a trading buddy.

### CTA Button Text
**Share TradVue with a Friend →**

### Body Copy

```html
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">

  <div style="text-align: center; padding: 32px 0;">
    <img src="{{LOGO_URL}}" alt="TradVue" width="160" />
  </div>

  <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px;">
    Getting the most out of TradVue
  </h1>

  <p style="font-size: 16px; line-height: 1.6; color: #333;">
    Hey {{FIRST_NAME}},
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #333;">
    You've been on TradVue for a few days now. Here are three tips from our most active users that'll help you get way more value from the platform:
  </p>

  <!-- Tip 1 -->
  <div style="margin: 28px 0;">
    <h2 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px;">
      1. Use AI Stock Scoring before every trade
    </h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Before you enter a position, check the AI score. It analyzes fundamentals (revenue growth, margins, debt), technicals (momentum, support/resistance, volume trends), and sentiment (news flow, analyst ratings, social buzz) to give you a single, clear score.
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      It's not a crystal ball — but it's a hell of a gut-check. Traders who use scoring report making more confident entries and fewer impulse trades.
    </p>
    <div style="text-align: center; margin: 16px 0;">
      <a href="{{SCORING_URL}}" style="color: #2563eb; font-weight: 600; text-decoration: none;">Try AI Scoring →</a>
    </div>
  </div>

  <!-- Tip 2 -->
  <div style="margin: 28px 0;">
    <h2 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px;">
      2. Set up your Friday review ritual
    </h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      The best traders we know spend 15 minutes every Friday reviewing their week in the trading journal. Here's the routine:
    </p>
    <ul style="font-size: 16px; line-height: 1.8; color: #333; padding-left: 20px;">
      <li>Review all trades from the week</li>
      <li>Check your win rate and average R-multiple</li>
      <li>Identify your best and worst trade — what made them different?</li>
      <li>Write one thing to improve next week</li>
    </ul>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Compound this habit over a quarter and the improvement is dramatic.
    </p>
  </div>

  <!-- Tip 3 -->
  <div style="margin: 28px 0;">
    <h2 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px;">
      3. Set calendar alerts for events that affect your positions
    </h2>
    <p style="font-size: 16px; line-height: 1.6; color: #333;">
      Got NVDA? Set an alert for their earnings date. Trading SPY around FOMC? You should know the exact time the minutes drop. The economic calendar lets you set alerts so you're never caught off guard.
    </p>
  </div>

  <div style="background: linear-gradient(135deg, #eff6ff, #f0fdf4); border-radius: 12px; padding: 28px; margin: 32px 0; text-align: center;">
    <h2 style="font-size: 22px; font-weight: 700; margin-top: 0; margin-bottom: 8px;">
      Know someone who'd love this?
    </h2>
    <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px;">
      TradVue is better with friends. Share it with a trading buddy and compare notes, strategies, and results. (Plus, they'll thank you — it's free.)
    </p>
    <a href="{{REFERRAL_URL}}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; display: inline-block;">
      Share TradVue with a Friend →
    </a>
  </div>

  <p style="font-size: 16px; line-height: 1.6; color: #333; margin-top: 32px;">
    That's it for our welcome series. From here on out, we'll only email you when we have something genuinely useful — product updates, market insights, and new features.
  </p>

  <p style="font-size: 16px; line-height: 1.6; color: #333;">
    Happy trading,<br/>
    <strong>The TradVue Team</strong>
  </p>

  <div style="border-top: 1px solid #eee; padding-top: 24px; margin-top: 32px; text-align: center; color: #999; font-size: 13px;">
    <p>TradVue — Trade Smarter, Not Harder</p>
    <p>
      <a href="{{TWITTER_URL}}" style="color: #999; text-decoration: none;">Twitter</a> · 
      <a href="{{YOUTUBE_URL}}" style="color: #999; text-decoration: none;">YouTube</a> · 
      <a href="{{BLOG_URL}}" style="color: #999; text-decoration: none;">Blog</a>
    </p>
    <p><a href="{{UNSUBSCRIBE_URL}}" style="color: #999;">Unsubscribe</a></p>
  </div>

</div>
```

---

## Implementation Notes

### Template Variables
| Variable | Description |
|----------|-------------|
| `{{FIRST_NAME}}` | User's first name from signup |
| `{{LOGO_URL}}` | TradVue logo image URL |
| `{{WATCHLIST_URL}}` | Deep link to watchlist setup |
| `{{IMPORT_URL}}` | Deep link to CSV import page |
| `{{IMPORT_GUIDE_URL}}` | Link to import help article |
| `{{SCORING_URL}}` | Deep link to AI scoring |
| `{{REFERRAL_URL}}` | Referral/share link (unique per user if possible) |
| `{{TWITTER_URL}}` | https://twitter.com/TradVue |
| `{{YOUTUBE_URL}}` | TradVue YouTube channel |
| `{{BLOG_URL}}` | https://www.tradvue.com/blog |
| `{{UNSUBSCRIBE_URL}}` | One-click unsubscribe link (required by law) |

### Sending Recommendations

- **ESP:** Resend, Loops, or ConvertKit (all have good free tiers for startups)
- **Send time:** 8:00 AM in user's local timezone (pre-market)
- **Suppression:** If user completes the CTA action before the next email, consider a conditional branch (optional — adds complexity, do later)
- **A/B testing:** Test subject lines with 20% of audience, send winner to 80%
- **Tracking:** UTM parameters on all CTA links (`?utm_source=email&utm_medium=onboarding&utm_campaign=welcome_{{EMAIL_NUMBER}}`)

### Metrics to Track

| Metric | Email 1 Target | Email 2 Target | Email 3 Target |
|--------|----------------|----------------|----------------|
| Open rate | > 60% | > 45% | > 40% |
| Click rate | > 15% | > 10% | > 8% |
| CTA completion | > 25% | > 10% | > 5% |

---

*Last updated: March 9, 2026*
