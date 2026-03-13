# Reddit FAQ Cheat Sheet
_Quick replies for likely questions after posting. Keep it casual and honest._

---

## About the Product

**Q: How is this different from TradeZella / Tradervue / Edgewonk?**
> Those are great but they're $30-50/mo. TradVue is free — all core features, no paywall. No account needed to start. The tradeoff is we don't have broker auto-import yet (that's coming), so you're manually logging or CSV importing for now. But for the price of free, I think it's pretty competitive.

**Q: Is this really free? What's the catch?**
> No catch. Free tier has everything. We'll add a Pro tier later ($12.99/mo) that removes ads and adds some premium features, but the core tools will always be free. No account required to use anything.

**Q: Do you sell my data?**
> No. Your data is stored locally in your browser by default. If you create an account, it syncs to the cloud (encrypted), but we never sell, share, or monetize user data. Privacy policy is at tradvue.com/legal/privacy.

**Q: Is this open source?**
> Not currently, but we're building in public and very open to feedback. The focus right now is making the best free trading toolkit we can.

---

## Features & Functionality

**Q: Does it support futures / forex / crypto / options?**
> Yes — all of them. The journal auto-detects asset class from the symbol. We have a dedicated futures calculator with 39 contracts, a forex pip calculator, and the options profit calculator handles basic P&L + Greeks.

**Q: Can I import from my broker (Robinhood, IBKR, etc.)?**
> Not yet — that's the #1 feature on our roadmap. Right now you can CSV import or manually log trades. Broker auto-sync is coming.

**Q: Does it work on mobile?**
> Yes, fully responsive. Works on any phone browser — portrait and landscape. No app to download, just go to tradvue.com.

**Q: Can I export my data?**
> Yes — journal and portfolio both export to JSON and CSV. Your data is yours.

**Q: How accurate are the calculators?**
> All 11 calculators have been independently verified with hand-calculated test cases. We take accuracy seriously — people don't like wrong info when it comes to their money.

**Q: Is the market data real-time?**
> It's near real-time on Finnhub's free tier (15-min delay on some data). We're working on upgrading to real-time feeds. The news feed and economic calendar are live.

---

## Technical Questions

**Q: What's the tech stack?**
> Next.js frontend, Node.js/Express backend, Supabase (PostgreSQL) for data, hosted on Vercel + Render. Market data from Finnhub, news from multiple RSS feeds + APIs.

**Q: Where's my data stored?**
> By default, everything is in your browser's localStorage (100% local, never leaves your device). If you create a free account, it syncs to Supabase (PostgreSQL) with encryption in transit. You can export anytime.

**Q: I found a bug / something's broken.**
> There's a feedback button on the site (bottom-right corner) — hit "Bug Report" and describe what happened. Or DM me here. We fix bugs fast.

---

## Business / Trust

**Q: Why should I trust a new platform with my trading data?**
> Fair question. Your data starts 100% local in your browser — we don't even see it unless you create an account. No payment info is collected. The site has a full privacy policy, terms of service, and disclaimer at tradvue.com/legal. We're a registered LLC (Apex Logics LLC, Florida).

**Q: Are you an RIA / financial advisor?**
> No. TradVue is an analytics and journaling tool — we don't provide financial advice, manage money, or make trading recommendations. Everything is clearly disclaimed.

**Q: How do you make money if it's free?**
> We'll have a Pro tier ($12.99/mo) and tasteful, non-intrusive ads on the free tier. No popups, no interruptions. The Pro tier removes ads completely.

**Q: Just you building this?**
> Solo founder with AI development tools. It lets me build and iterate way faster than a traditional dev team. All the math in the calculators is independently verified though — I don't trust AI with people's money.

---

## Engagement Replies (for positive comments)

**"This is cool / nice work"**
> Thanks! If you try it out, I'd love to hear what features you'd want next. Building based on what traders actually need.

**"Bookmarked / saving this"**
> Awesome — let me know what you think after you try it. Feedback button is right on the site.

**"Can you add X feature?"**
> Great idea — adding it to the roadmap. We ship fast so keep an eye out.

---

## Deflection Replies (for negative/skeptical comments)

**"This looks like every other trading tool"**
> Fair — the difference is it's free with no account required. Most tools lock basic features behind a paywall. Try it for 5 minutes and see if the UX works for you.

**"I'll stick with Excel"**
> Excel is great for custom stuff. TradVue is for people who want something purpose-built without the spreadsheet setup. Different tools for different workflows.

**"Looks like an AI-generated site"**
> I use AI tools for development, yeah — but every calculator is manually verified with hand-calculated test cases, and the features are designed based on what I actually needed as a trader. AI helps me build faster, but the product decisions are human.

---

## Posting Strategy

**Best time to post:** Weekday mornings, 8-10 AM ET (pre-market, traders are browsing)
**Subreddits in order:**
1. r/daytrading (most active, most relevant)
2. r/options (1 week later)
3. r/stocks (1 week after that)

**Rules:**
- Don't post to multiple subs the same day
- Respond to EVERY comment within 2 hours
- Upvote helpful feedback
- Don't argue with trolls — thank them and move on
- If a feature request is popular, reply "just shipped this" when it's done (great engagement)
