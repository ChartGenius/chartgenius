# TradVue Email Onboarding Sequence

**Status:** Ready for automation  
**Audience:** New TradVue signups  
**Goal:** Activate new users quickly, build review habits, and move qualified users toward paid usage  
**Core Product Positioning:** TradVue is a practical trading journal built to help traders review performance, spot patterns, and improve consistency.

---

## 1) Sequence Overview

### Primary activation goals
1. Get the user back into the product after signup
2. Get them to log or import their first trades
3. Teach the review mindset early
4. Introduce TradingView workflow/automation
5. Push qualified users toward paid conversion

### Suggested automation schedule
- **Email 1:** Immediately after signup
- **Email 2:** Day 1
- **Email 3:** Day 3
- **Email 4:** Day 5
- **Email 5:** Day 7

### Default sender
- **From:** TradVue <hello@tradvue.com>
- **Reply-to:** support@tradvue.com

---

## 2) Sequence Map

| Email | Timing | Goal | Primary CTA |
|---|---|---|---|
| 1 | Day 0 | Welcome + first action | Open your journal |
| 2 | Day 1 | Teach review mindset | Log or import your first trades |
| 3 | Day 3 | Show value from analytics | Review your performance |
| 4 | Day 5 | Introduce TradingView workflow | Set up TradingView workflow |
| 5 | Day 7 | Convert qualified users | Upgrade / keep building your process |

---

## 3) Email 1 — Welcome

### Subject line options
- Welcome to TradVue — start with your journal
- You’re in. Let’s build your review process.
- Start here: your first step in TradVue

### Preview text
Open your journal, log your first trades, and start building a cleaner trading process.

### Primary CTA
**Open my journal**

### Body copy
Hi {{first_name | default: "there"}},

Welcome to TradVue.

Most traders know they should review their trades more seriously — but end up with messy spreadsheets, screenshots, or a process they never stick to.

TradVue is built to make review easier.

With it, you can:
- track trades in one place
- review P&L, win rate, and setups
- spot repeat mistakes and stronger patterns
- build consistency over time

**Best first step:** open your journal and log your first trade.

Even a small amount of clean data is better than relying on memory.

**CTA:** Open my journal

If you reply to this email, a real person will read it.

— TradVue

---

## 4) Email 2 — Log or Import First Trades

### Subject line options
- Don’t just trade — review what actually happened
- Your first 10 trades can teach you a lot
- Start with a few trades, not a perfect setup

### Preview text
The goal isn’t perfect journaling on day one. It’s getting real trade data into your process.

### Primary CTA
**Log or import my trades**

### Body copy
Hi {{first_name | default: "there"}},

A lot of traders overcomplicate journaling.

You do **not** need the perfect process before you start.
You just need real trade data in one place.

That’s why your next move is simple:
- log a few trades manually, or
- import your existing trades if you already have them

Once your trades are in TradVue, you can start seeing:
- what setups are working
- where you keep breaking process
- whether your results match your memory

**Aim for your first 10 trades.**
That’s enough to start seeing patterns.

**CTA:** Log or import my trades

The traders who improve fastest usually aren’t the ones with the fanciest strategy — they’re the ones who review honestly.

— TradVue

---

## 5) Email 3 — Analytics / Review Value

### Subject line options
- Your edge is probably hidden in your review data
- What your journal should be teaching you
- Great traders don’t guess — they review

### Preview text
Your journal becomes useful when it helps you see patterns, not just store trades.

### Primary CTA
**Review my performance**

### Body copy
Hi {{first_name | default: "there"}},

A trading journal is only useful if it helps you make better decisions.

That means going beyond “I won” or “I lost.”

You want to review things like:
- win rate by setup
- average P&L
- recurring mistakes
- which assets or trade types suit you best
- whether your best trades have something in common

TradVue is designed to help with exactly that.

The goal is simple:
**find what works, cut what doesn’t, and tighten your process over time.**

If you already added trades, now’s a good time to review what they’re saying.

**CTA:** Review my performance

Even one honest review session can reveal something you’ve been missing.

— TradVue

---

## 6) Email 4 — TradingView Workflow / Automation

### Subject line options
- Still logging trades manually? Fix that.
- A cleaner TradingView workflow in minutes
- Save time with a better journaling workflow

### Preview text
If TradingView is already part of your process, TradVue can help reduce manual journaling friction.

### Primary CTA
**Set up TradingView workflow**

### Body copy
Hi {{first_name | default: "there"}},

One reason traders stop journaling is friction.

If it takes too long to record what happened, the review habit breaks.

That’s why we’ve been improving the TradingView workflow inside TradVue.

If TradingView is part of your process, you can use it to make journaling cleaner and faster — especially if you want to reduce manual entry and keep your records more consistent.

This is especially useful if you:
- review setups from TradingView
- use alerts as part of your workflow
- want cleaner trade capture over time

**CTA:** Set up TradingView workflow

Less friction = more consistency.
And more consistency = better review data.

— TradVue

---

## 7) Email 5 — Conversion / Upgrade

### Subject line options
- Ready to build a real trading process?
- If you’re serious about improving, here’s the next step
- Outgrowing spreadsheets? This is for you.

### Preview text
TradVue is built for traders who want structure, better review habits, and cleaner performance feedback loops.

### Primary CTA
**Upgrade to TradVue Pro**

### Body copy
Hi {{first_name | default: "there"}},

By now, you’ve seen the main idea behind TradVue:

**better review leads to better decisions.**

If you’re serious about improving your trading process, the next step is building a workflow you’ll actually stick to.

TradVue Pro is for traders who want:
- deeper performance visibility
- better workflow support
- less manual friction
- a more consistent review habit

This is especially useful if you’re actively trading, reviewing regularly, or trying to get away from spreadsheets and scattered notes.

If that sounds like you, upgrade and keep building a process you can trust.

**CTA:** Upgrade to TradVue Pro

And if you’re not ready yet, keep journaling — the habit still matters.

— TradVue

---

## 8) Segmentation Recommendations

### Segment by behavior
- **No journal activity:** resend activation-focused emails
- **Logged trades but no review activity:** push analytics/review content
- **Used TradingView integration page:** emphasize workflow automation
- **High activity free users:** send stronger upgrade CTA
- **Inactive after signup:** move to reactivation sequence after Day 10–14

### Segment by user type if available
- Day trader
- Prop firm trader
- Futures trader
- Forex trader
- Crypto trader
- TradingView-heavy user

---

## 9) Implementation Notes

### Required variables
- `{{first_name}}`
- `{{journal_url}}`
- `{{import_url}}`
- `{{analytics_url}}`
- `{{tradingview_url}}`
- `{{upgrade_url}}`
- `{{unsubscribe_url}}`

### Automation logic
- Stop the sequence early if user becomes highly activated and enters a more relevant lifecycle flow
- Suppress upgrade-heavy messaging for users who have not completed basic activation
- If user upgrades before Email 5, move them into paid-user onboarding instead

---

## 10) Success Metrics

| Metric | Target |
|---|---|
| Email 1 open rate | 55%+ |
| Email 2 CTR | 12%+ |
| First journal action within 7 days | 35%+ |
| First trade logged/imported within 7 days | 25%+ |
| Trial/free-to-paid conversion from sequence | 8–12% |

---

## 11) Immediate Next Actions

- Load sequence into email platform
- Map actual product URLs to CTAs
- Add behavior-based branching
- A/B test Email 1 and Email 5 subject lines
- Review metrics after first 2 weeks and tighten weak steps
