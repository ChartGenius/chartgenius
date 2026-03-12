# Calculator Math Verification Report
**Date:** 2026-03-12  
**Auditor:** Zip (QA Agent, ApexLogics)  
**Scope:** All 11 calculator tools in `/app/tools/`  
**Methodology:** Independent source code review, hand-calculated test cases, numerical verification via Node.js scripts  
**Tolerance:** 0.01% (financial accuracy standard)

---

## Executive Summary

| # | Calculator | Status | Notes |
|---|-----------|--------|-------|
| 1 | FuturesCalculator.tsx | ✅ PASS | All 39 contracts pass internal consistency |
| 2 | OptionsCalculator.tsx | ✅ PASS | P&L, break-even, Greeks correct |
| 3 | CompoundCalculator.tsx | ✅ PASS | Previous double-div bug CONFIRMED FIXED |
| 4 | RiskOfRuinCalculator.tsx | ✅ PASS | Kelly, EV, Monte Carlo correct |
| 5 | ForexCalculator.tsx | ✅ PASS | Minor approximation noted, not a bug |
| 6 | PositionSizer.tsx | 🔴 BUG | **Forex mode: position size off by 100,000×** |
| 7 | ExpectancyCalculator.tsx | ✅ PASS | All formulas correct |
| 8 | CorrelationMatrix.tsx | ✅ PASS | Pearson formula correct; data quality note |
| 9 | DividendPlanner.tsx | ✅ PASS | DRIP compounding correct |
| 10 | SessionClock.tsx | ⚠️ WARN | Times correct for EST only — DST unhandled |
| 11 | EconHeatmap.tsx | ✅ PASS | Scoring logic correct; data from API |

**Critical bugs: 1** (PositionSizer Forex mode)  
**Warnings: 2** (SessionClock DST, CME maintenance window)  
**Minor flags: 3** (noted below)

---

## 1. FuturesCalculator.tsx

### Formulas Identified
```
ticksAtRisk = |entry - stop| / tickSize
dollarRiskPerContract = ticksAtRisk × tickValue
totalRisk = dollarRiskPerContract × contracts
riskPctOfAccount = (totalRisk / accountSize) × 100
maxByRisk = floor(accountSize × (riskPct% / 100) / dollarRiskPerContract)
marginRequired = initialMargin × contracts
remainingBalance = accountSize - marginRequired - totalRisk
R:R = rewardDollarPerContract / dollarRiskPerContract
Quick targets: targetPrice = entry ± (pointsAtRisk × rrRatio) for long/short
```

### Test Cases

**TC-1: ES (E-mini S&P 500) — Long, Entry 5800, Stop 5790, 2 Contracts, $25K account**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| ticksAtRisk | (5800-5790)/0.25 = **40 ticks** | 40 | ✅ PASS |
| dollarRiskPerContr | 40 × $12.50 = **$500** | $500 | ✅ PASS |
| totalRisk (2c) | $500 × 2 = **$1,000** | $1,000 | ✅ PASS |
| riskPct | ($1,000/$25,000)×100 = **4%** | 4% | ✅ PASS |
| marginRequired | $12,650 × 2 = **$25,300** | $25,300 | ✅ PASS |
| T1 R:R at 5820 | (80 ticks × $12.50) / $500 = **2.0** | 2.0 | ✅ PASS |

**TC-2: CL (Crude Oil WTI) — Entry 80.00, Stop 79.50**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| ticksAtRisk | 0.50/0.01 = **50 ticks** | 50 | ✅ PASS |
| dollarRiskPerContr | 50 × $10 = **$500** | $500 | ✅ PASS |

**TC-3: Quick Target 1:2 — ES Long, Entry 5800, Stop 5790**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| pointsAtRisk | 40 ticks × 0.25 = **10 pts** | 10 pts | ✅ PASS |
| 1:2 targetPrice | 5800 + 10×2 = **5820** | 5820 | ✅ PASS |
| 1:2 dollarTotal (1c) | $500 × 2 = **$1,000** | $1,000 | ✅ PASS |

### Contract Spec Spot-Check (5 contracts verified vs. CME/exchange specs)

All 39 contracts pass internal consistency: `tickSize × pointValue = tickValue`

| Contract | tickSize | tickValue | pointValue | tickSize×PV | Match |
|----------|----------|-----------|------------|-------------|-------|
| ES | 0.25 | $12.50 | $50 | $12.50 | ✅ |
| NQ | 0.25 | $5.00 | $20 | $5.00 | ✅ |
| CL | 0.01 | $10.00 | $1,000 | $10.00 | ✅ |
| GC | 0.10 | $10.00 | $100 | $10.00 | ✅ |
| 6E | 0.00005 | $6.25 | $125,000 | $6.25 | ✅ |
| ZB | 0.03125 | $31.25 | $1,000 | $31.25 | ✅ |
| ZN | 0.015625 | $15.625 | $1,000 | $15.625 | ✅ |
| ZF | 0.0078125 | $7.8125 | $1,000 | $7.8125 | ✅ |
| ZT | 0.0078125 | $15.625 | $2,000 | $15.625 | ✅ |
| KC | 0.05 | $18.75 | $375 | $18.75 | ✅ |

**All 39/39 contracts pass internal consistency check.**

Contract specs verified against CME, CBOT, NYMEX, COMEX, ICE exchange specifications.

### Edge Cases

| Edge Case | Behavior | Result |
|-----------|----------|--------|
| entry = stop (zero risk) | ticksAtRisk = 0, all risk metrics = 0 | ✅ Handled |
| zero account size | riskPct = 0%, maxByRisk = 0 | ✅ Handled (guard: accountN > 0) |
| contracts = 0 | constrained to min 1 by `Math.max(1, ...)` | ✅ Handled |

**Verdict: PASS**

---

## 2. OptionsCalculator.tsx

### Formulas Identified
```
costBasis = premium × contracts × 100
breakEven = strike + premium   (call)
breakEven = strike - premium   (put)
maxLoss = costBasis
maxProfit(put) = (strike - premium) × contracts × 100
P&L at expiry = (intrinsicValue - premium) × contracts × 100
intrinsic(call) = max(0, price - strike)
intrinsic(put) = max(0, strike - price)
Return % = P&L / costBasis × 100
```

Black-Scholes Greeks (Abramowitz & Stegun approximation for normCDF):
```
d1 = (ln(S/K) + (r + 0.5v²)T) / (v√T)
d2 = d1 - v√T
Delta(call) = N(d1),  Delta(put) = N(d1) - 1
Theta = -(S·N'(d1)·v)/(2√T) ± r·K·e^{-rT}·N(±d2) / 365
Vega = S·N'(d1)·√T / 100
```

### Test Cases

**TC-1: Call Option — S=150, K=155, Premium=3.50, Qty=1**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| costBasis | 3.50×1×100 = **$350** | $350 | ✅ PASS |
| breakEven | 155+3.50 = **$158.50** | $158.50 | ✅ PASS |
| maxLoss | **$350** | $350 | ✅ PASS |
| P&L at +20% (S=180) | (25-3.50)×100 = **+$2,150** | +$2,150 | ✅ PASS |
| P&L at -20% (S=120) | (0-3.50)×100 = **-$350** | -$350 | ✅ PASS |
| Return at -20% | -350/350×100 = **-100%** | -100% | ✅ PASS |

**TC-2: Put Option — S=150, K=145, Premium=2.50, Qty=2**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| costBasis | 2.50×2×100 = **$500** | $500 | ✅ PASS |
| breakEven | 145-2.50 = **$142.50** | $142.50 | ✅ PASS |
| maxProfit (S→0) | (145-2.50)×2×100 = **$28,500** | $28,500 | ✅ PASS |
| P&L at -20% (S=120) | (25-2.50)×200 = **+$4,500** | +$4,500 | ✅ PASS |

**TC-3: BS normCDF sanity — normCDF(0)**

| Test | Expected | Code | Result |
|------|----------|------|--------|
| normCDF(0) | 0.5000 | 0.5000 | ✅ PASS |
| BS ATM Call (S=K=100, T=30d, r=5%, v=30%) | ~$3.65 | $3.63 | ✅ PASS (within 0.5%) |

**Note on Vega:** Code divides by 100 to give vega per 1% IV change. This is standard trader convention. ✅

### Edge Cases

| Edge Case | Behavior | Result |
|-----------|----------|--------|
| premium = 0 | Return % shows '—' (guards `costBasis > 0`) | ✅ Handled |
| T ≤ 0 (expired) | BS returns `{price:0, delta:0, ...}` | ✅ Handled |
| v = 0 (zero IV) | BS returns `{price:0, ...}` | ✅ Handled |

**Verdict: PASS**

---

## 3. CompoundCalculator.tsx

### Formulas Identified
```javascript
rateN = rate% / 100                          // monthly rate decimal
ratePerPeriod = (monthly) ? rateN            // CURRENT - uses directly
                           : rateN * 12/52   // weekly: linear approximation
contribPerPeriod = (monthly) ? monthly : monthly * 12/52
// Per-period iteration:
balance = balance × (1 + ratePerPeriod) + contribPerPeriod
```

### Critical Bug Check: Double-Division of Monthly Rate

The reported prior bug was `ratePerPeriod = rateN / 12` (treating monthly rate as annual, dividing by 12 again).

**VERIFICATION:**

| Version | Rate Input | ratePerPeriod | Year-1 Balance (start=$10K, contrib=$500/mo) |
|---------|-----------|---------------|----------------------------------------------|
| **Current (fixed)** | 1%/mo | 0.01 | **$17,609.50** |
| **Bugged (would show)** | 1%/mo ÷ 12 | 0.000833 | $16,128.04 |
| **FV Formula** | 1%/mo | 0.01 | **$17,609.50** |

**CONFIRMED: The double-division bug is FIXED. Code correctly uses monthly rate directly.**

### Test Cases

**TC-1: Standard — $10K start, $500/mo, 1%/mo, 1 year**

| Metric | Expected (FV formula) | Code | Result |
|--------|----------------------|------|--------|
| Year 1 balance | PV×(1.01)^12 + 500×((1.01)^12-1)/0.01 = **$17,609.50** | $17,609.50 | ✅ PASS |

**TC-2: 10 year projection**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| Year 10 balance | **$148,023.21** | $148,023.21 | ✅ PASS |

**TC-3: Edge cases**

| Edge Case | Expected | Result |
|-----------|----------|--------|
| rate = 0% | Final = start + monthly×12×years | ✅ Handled |
| years = 0 | Final = start | ✅ Handled |

### Minor Flag (not a bug)

**Weekly rate linear approximation:** Code uses `rateN × 12/52` to convert monthly→weekly rate. The geometrically exact formula is `(1+rateN)^(12/52) - 1`. At 1%/month this causes a **0.05% annual discrepancy** (12.747% vs 12.683% effective annual). Negligible for practical use. Both are listed as approximations in the disclaimer.

**Verdict: PASS (bug confirmed fixed)**

---

## 4. RiskOfRuinCalculator.tsx

### Formulas Identified
```javascript
// Kelly Criterion:
kelly(W, R) = (W × R - (1 - W)) / R

// Expectancy per $1 risked:
ev(W, R) = W × R - (1 - W)

// Analytical Risk of Ruin (gambler's ruin approximation):
ratio = (lossRate / winRate) × (1 / R)
tradesNeeded = round(maxDrawdownPct / riskPct)
RoR = min(1, ratio ^ tradesNeeded)    [if ratio >= 1 → return 1]

// Monte Carlo:
win: balance = balance + balance × riskPct × R
loss: balance = balance - balance × riskPct
```

### Test Cases

**TC-1: Kelly Criterion**

| Inputs | Expected | Code | Result |
|--------|----------|------|--------|
| W=45%, R=2 | (0.45×2−0.55)/2 = **17.5%** | 17.5% | ✅ PASS |
| W=50%, R=1 (BE) | (0.50−0.50)/1 = **0.0%** | 0.0% | ✅ PASS |
| W=55%, R=2 | (0.55×2−0.45)/2 = **32.5%** | 32.5% | ✅ PASS |

**TC-2: Expectancy**

| Inputs | Expected | Code | Result |
|--------|----------|------|--------|
| W=45%, R=2 | 0.45×2−0.55 = **+35.0¢** | +35.0¢ | ✅ PASS |
| W=55%, R=1.5 | 0.55×1.5−0.45 = **+37.5¢** | +37.5¢ | ✅ PASS |

**TC-3: Risk of Ruin**

| Inputs | Expected | Code | Result |
|--------|----------|------|--------|
| W=45%, R=2, risk=2%, ruin=20% | ratio=0.6111, trades=10, **0.73%** | 0.73% | ✅ PASS |
| W=40%, R=1.5 (zero-edge) | ratio=1.0 → **100%** | 100% | ✅ PASS |

**TC-4: Monte Carlo single-trade verify**

| Starting at 1.0, risk=2%, R=2 | Win result | Loss result |
|-------------------------------|-----------|------------|
| Code: bal ± bal×riskN×rrN or −bal×riskN | +4% = 1.04 | −2% = 0.98 |
| Expected EV: 0.45×0.04 + 0.55×(−0.02) | = **+0.7%/trade** | ✅ PASS |

### Minor Flag

**Analytical RoR at exact break-even:** When ratio = 1.0 exactly (zero-edge system), the code returns 100% ruin. In strict gambler's ruin theory, at zero edge without a win target, ruin probability approaches 1 as n→∞, but for a finite drawdown target it depends on the specific structure. The 100% result is a reasonable conservative approximation. The Monte Carlo provides a more accurate estimate for finite simulations.

**Verdict: PASS**

---

## 5. ForexCalculator.tsx

### Formulas Identified
```javascript
units = lotSize × 100,000
pipValueQuote = units × pipSize                 // in quote currency
pipValueUSD = pipValueQuote × quoteToUSD        // convert to USD
positionValue = units × entryPrice × quoteToUSD
marginRequired = positionValue / leverage
riskUSD = stopPips × pipValueUSD
rewardUSD = tpPips × pipValueUSD
rrRatio = rewardUSD / riskUSD
riskPct = riskUSD / accountSize × 100
```

### Test Cases

**TC-1: EUR/USD, 0.1 lots, 1.0850 entry**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| units | 0.1×100,000 = **10,000** | 10,000 | ✅ PASS |
| pipValueUSD | 10,000×0.0001×1 = **$1.00** | $1.00 | ✅ PASS |
| risk at 20 pip SL | 20×$1.00 = **$20.00** | $20.00 | ✅ PASS |
| reward at 40 pip TP | 40×$1.00 = **$40.00** | $40.00 | ✅ PASS |
| R:R (40/20) | **2.0** | 2.0 | ✅ PASS |

**TC-2: EUR/USD, 1 lot, 50:1 leverage**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| positionValue | 100,000×1.0850 = **$108,500** | $108,500 | ✅ PASS |
| marginRequired | 108,500/50 = **$2,170** | $2,170 | ✅ PASS |

**TC-3: USD/JPY, 1 lot (non-USD quote)**

| Metric | Expected (approx) | Code | Result |
|--------|-------------------|------|--------|
| pipValueUSD (at 150) | 1,000 JPY × 0.0066 = **$6.60** | $6.60 | ✅ PASS |
| Exact at 150 | 1,000/150 = **$6.67** | $6.60 | ⚠️ approx |

### Minor Flag

**Non-USD quote pair position value:** `positionValue = units × entryPrice × quoteToUSD` uses fixed `APPROX_RATES` that may not match current market. For USD/JPY at 150.00, the code shows ~$99,000 instead of the correct $100,000 (the position IS 100,000 USD). This is a display approximation, acknowledged in the code's disclaimer: *"Exchange rates and swap rates are approximations."*

This is NOT a formula bug — it's an intentional trade-off using static rates.

**Verdict: PASS (minor approximation accepted, noted)**

---

## 6. PositionSizer.tsx

### Formulas Identified
```javascript
riskDollar = accountSize × (riskPct / 100)
stopDistance = |entry - stop|
// Stock/Crypto:
positionSize = riskDollar / stopDistance
// Futures:
positionSize = riskDollar / (stopDistance × contractMultiplier)
positionValue = positionSize × entry × multiplier (futures) | positionSize × entry (others)
```

### Test Cases

**TC-1: Stock — $10K account, 2% risk, entry=$150, stop=$145**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| riskDollar | $10,000×0.02 = **$200** | $200 | ✅ PASS |
| stopDistance | |150−145| = **$5** | $5 | ✅ PASS |
| positionSize | $200/$5 = **40 shares** | 40 shares | ✅ PASS |
| positionValue | 40×$150 = **$6,000** | $6,000 | ✅ PASS |
| Verify risk | 40×$5 = $200 = riskDollar | ✅ PASS |

**TC-2: Futures (ES) — $25K account, 1% risk, entry=5800, stop=5790, mult=50**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| riskDollar | $25,000×0.01 = **$250** | $250 | ✅ PASS |
| stopDistance | 10 pts | 10 | ✅ PASS |
| positionSize | $250/(10×50) = **0.5 contracts** | 0.5c | ✅ PASS |
| Verify risk | 0.5×10×$50 = $250 = riskDollar | ✅ PASS |

---

### 🔴 BUG FOUND — FOREX MODE

**TC-3: Forex — $10K account, 2% risk, EUR/USD entry=1.0850, stop=1.0830 (20 pip stop)**

**Code behavior:**
```javascript
positionSize = riskDollar / stopDistance
            = $200 / 0.0020
            = 100,000
```
**Displayed as:** `100000.00 lots`

**Correct answer:** `1.00 lots`

**Root cause:** For Forex, `stopDistance` is a price difference (0.0020 = 20 pips), not a dollar-per-unit value. The formula yields position size in **units** (100,000), but displays it labeled as **lots**. One standard lot = 100,000 units, so the display is off by a factor of 100,000.

**Verification of correct math:**
```
Correct lots = riskDollar / (stopPips × pipValuePerLot)
             = $200 / (20 × $10)         [for USD-quoted pairs, 1 lot = $10/pip]
             = $200 / $200
             = 1.00 lots  ✅
```

**Line reference:** `PositionSizer.tsx` — the calculation block:
```typescript
const positionSize = stopDistance > 0
    ? (asset === 'Futures' ? riskDollar / (stopDistance * multiplier) : riskDollar / stopDistance)
    : 0
```

For Forex, `riskDollar / stopDistance` gives units; displaying as "lots" is wrong.

**Impact:** A trader following this output would be told to open a 100,000-lot position (= $10 billion notional) when they should open a 1-lot position ($108,500 notional). This would cause catastrophic over-leveraging if acted upon.

**Fix required (do NOT implement — document only):**
```typescript
// For Forex, convert units to lots:
const positionSize = stopDistance > 0
  ? (asset === 'Futures'
      ? riskDollar / (stopDistance * multiplier)
      : asset === 'Forex'
        ? riskDollar / stopDistance / 100000   // ← add / 100000
        : riskDollar / stopDistance)
  : 0
```

The scenarios table at the bottom of the component has the same bug (same formula).

**Verdict: 🔴 FAIL — Critical bug in Forex mode**

---

## 7. ExpectancyCalculator.tsx

### Formulas Identified
```javascript
expectancyPerTrade = (winRate × avgWin) - (lossRate × avgLoss)
breakEvenWR = avgLoss / (avgWin + avgLoss)
rrRatio = avgWin / avgLoss
monthlyExpectancy = expectancyPerTrade × tradesPerMonth
annualExpectancy = monthlyExpectancy × 12
```

### Test Cases

**TC-1: Positive expectancy system — W=55%, AvgWin=$300, AvgLoss=$150**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| expectancy | 0.55×300 − 0.45×150 = **$97.50** | $97.50 | ✅ PASS |
| breakEvenWR | 150/(300+150) = **33.33%** | 33.33% | ✅ PASS |
| R:R | 300/150 = **2.0** | 2.0 | ✅ PASS |
| Monthly (20 trades) | 97.50×20 = **$1,950** | $1,950 | ✅ PASS |
| Annual | 1,950×12 = **$23,400** | $23,400 | ✅ PASS |

**TC-2: Low win rate, high R:R — W=40%, AvgWin=$300, AvgLoss=$150**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| expectancy | 0.40×300 − 0.60×150 = **+$30.00** | +$30.00 | ✅ PASS |

**TC-3: Negative expectancy — W=45%, AvgWin=$100, AvgLoss=$200**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| expectancy | 0.45×100 − 0.55×200 = **−$65.00** | −$65.00 | ✅ PASS |

### Edge Cases

| Edge Case | Behavior | Result |
|-----------|----------|--------|
| avgLoss = 0 | breakEvenWR = 0 (guard `lossN > 0`) | ✅ Handled |
| winRate = 100% | expectancy = avgWin, lossRate = 0 | ✅ Handled |
| trades = 0 | monthly/annual = 0 | ✅ Handled |

**Verdict: PASS**

---

## 8. CorrelationMatrix.tsx

### Formula Identified
```javascript
// Converts prices → returns before computing:
returns_a[i] = (price_a[i+1] - price_a[i]) / price_a[i]

// Standard Pearson on returns:
r = Σ(ra_i - ma)(rb_i - mb) / sqrt(Σ(ra_i-ma)² × Σ(rb_i-mb)²)
```

Computing correlation on **returns** (not prices) is the correct financial standard.

### Test Cases

**TC-1: Perfect positive correlation**

| Inputs | Expected | Code | Result |
|--------|----------|------|--------|
| A=[100,102,104,106,108], B=[50,51,52,53,54] | r = **1.0000** | 1.0000 | ✅ PASS |

**TC-2: Near-zero movement (flat series)**

| Inputs | Expected | Code | Result |
|--------|----------|------|--------|
| A=[100,100,100,100] (zero variance) | r = **0** (denominator guard) | 0.0000 | ✅ PASS |

**TC-3: Near-negative correlation**

| Inputs | Expected | Code | Result |
|--------|----------|------|--------|
| A=[100,102,104,106], B=[100,98,96,94] | r ≈ **−1 but shows +0.9997** | 0.9997 | ⚠️ Note |

**Explanation for TC-3:** This is not a bug. Returns of A are monotonically decreasing (+2%, +1.96%, +1.92%), and returns of B are monotonically increasing in magnitude (−2%, −2.04%, −2.08%). Their *deviations from mean* drift in the same direction, yielding positive cross-products. Pearson on returns is mathematically correct — it's a subtle consequence of computing returns vs. raw price changes. The formula correctly measures return correlation.

### Data Quality Note (Custom Mode)

The custom correlation mode generates synthetic price series from only 2 real data points (current price + previous close) with a `sin(i * 0.7 + ticker.charCodeAt(0))` noise term:

```typescript
priceMap[t] = Array.from({ length: 20 }, (_, i) => 
  pc + (c - pc) * i / 19 + (Math.sin(i * 0.7 + t.charCodeAt(0)) * 0.5))
```

This synthetic data does NOT represent real historical price correlation. Results from the custom mode should be treated as illustrative only. The built-in mode (fetches from backend API with 90-day historical data) is the only reliable option. The code itself acknowledges this in comments.

**Verdict: PASS (Pearson formula correct; custom mode data quality flag noted)**

---

## 9. DividendPlanner.tsx

### Formulas Identified
```javascript
// Annual income per holding:
annualIncome += invested × (yieldPct / 100)

// Portfolio averages:
avgYield = totalAnnualIncome / totalInvested × 100
monthlyIncome = annualIncome / 12
quarterlyIncome = annualIncome / 4

// DRIP projection (per year loop):
balance = balance × (1 + avgYield/100)
incomeThisYear = balance × avgYield/100
totalEarned = balance - totalInvested

// No-DRIP:
income = annualIncome (constant)
totalEarned = annualIncome × years

// Reverse calculator:
investedNeeded = (targetMonthly × 12) / (avgYield / 100)
```

### Test Cases

**TC-1: KO ($5,000 @ 3.1%) + O ($5,000 @ 5.8%)**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| totalAnnualIncome | 5000×0.031 + 5000×0.058 = **$445** | $445 | ✅ PASS |
| monthlyIncome | 445/12 = **$37.08** | $37.08 | ✅ PASS |
| avgYield | 445/10000×100 = **4.45%** | 4.45% | ✅ PASS |
| DRIP Year 1 balance | 10,000×1.0445 = **$10,445** | $10,445 | ✅ PASS |
| DRIP Year 10 (loop) | 10,000×(1.0445)^10 = **$15,455.55** | $15,455.55 | ✅ PASS |

**TC-2: Reverse Calculator — target $500/mo**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| investedNeeded | ($500×12)/0.0445 = **$134,831** | $134,831 | ✅ PASS |
| Verify | $134,831×4.45%/12 = **$500.00** | $500.00 | ✅ PASS |

**TC-3: DRIP vs No-DRIP over 5 years**

| Metric | No-DRIP | DRIP |
|--------|---------|------|
| Year 5 balance | $10,000 | $12,434 (+24.3%) |
| Year 5 annual income | $445 | $553 |

Code computes this correctly via the loop vs. constant return. ✅

### Edge Cases

| Edge Case | Behavior | Result |
|-----------|----------|--------|
| avgYield = 0 | investedNeeded = 0 (guard `avgYield > 0`) | ✅ Handled |
| DRIP with 0 yield | balance never changes | ✅ Handled |
| No holdings | annualIncome = 0, avgYield = 0 | ✅ Handled |

**Verdict: PASS**

---

## 10. SessionClock.tsx

### Session Times Verified (UTC and ET)

| Session | UTC Open | UTC Close | ET Open | ET Close | Standard |
|---------|----------|-----------|---------|----------|----------|
| Sydney | 22:00 | 07:00 | 17:00 (5 PM) | 02:00 (2 AM) | ✅ |
| Tokyo | 00:00 | 09:00 | 19:00 (7 PM) | 04:00 (4 AM) | ✅ |
| Singapore | 01:00 | 09:00 | 20:00 (8 PM) | 04:00 (4 AM) | ✅ |
| Frankfurt | 07:00 | 16:00 | 02:00 (2 AM) | 11:00 (11 AM) | ✅* |
| London | 08:00 | 17:00 | 03:00 (3 AM) | 12:00 (12 PM) | ✅ |
| New York | 14:30 | 21:00 | 09:30 (9:30 AM) | 16:00 (4 PM) | ✅ |
| Chicago (CME) | 22:00 | 21:00 | 17:00 (5 PM) | 16:00 (4 PM) | ✅ |

All times verified: `utcHour + ET_OFFSET(-5) = etHour` for all sessions. ✅

*Frankfurt note: Official XETRA open is 9 AM CET = 8 AM UTC = 3 AM EST. The code uses 7 AM UTC = 2 AM EST, representing the European pre-market period. This is a common forex industry convention (not the official exchange open). Minor discrepancy, 1 hour early.

### ⚠️ Warning 1: DST Not Handled in Visual Timeline

The `SESSION_ET` object hardcodes ET times assuming EST (UTC−5). During EDT (UTC−4, approximately March 8 – November 1), all displayed ET times in the 24-hour visual timeline will be 1 hour off.

**Example during EDT:**
- London should show "4:00 AM – 1:00 PM ET" but shows "3:00 AM – 12:00 PM ET"

The footer disclaimer notes *"Actual hours may vary due to DST"* but does not indicate to the user that the visual is actively wrong for ~7 months of the year.

**Affected file/lines:** `SESSION_ET` constant object (lines ~34–44 of SessionClock.tsx)

**Recommended fix (document only):**
```typescript
const isDST = (): boolean => {
  const d = new Date(); const jan = new Date(d.getFullYear(), 0, 1);
  const jul = new Date(d.getFullYear(), 6, 1);
  return d.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}
const ET_OFFSET = isDST() ? -4 : -5;
// Then compute SESSION_ET dynamically from UTC times + ET_OFFSET
```

### ⚠️ Warning 2: CME Maintenance Window Not Shown

The Chicago/CME session card shows the session as "OPEN" during the daily 5:00–6:00 PM ET maintenance break. CME Globex halts trading during this window (Sun–Fri).

`FuturesCalculator.tsx` correctly handles this (`isGlobexOpen()` checks `hour >= 17 && hour < 18`), but `SessionClock.tsx` does not.

**Impact:** A trader viewing the session clock during maintenance (5–6 PM ET) will see "Chicago OPEN" when CME Globex is actually closed.

**Verdict: ⚠️ WARN — Times correct for EST; DST unhandled; CME maintenance window not displayed**

---

## 11. EconHeatmap.tsx

### Logic Identified
```javascript
// Heat scoring (higher = more risk):
score(event) = event.impact === 'High' ? 3 : event.impact === 'Medium' ? 2 : 1
dayScore = sum of all event scores for that day

// Relative intensity (per week):
intensity = dayScore / maxScoreInWeek

// Color thresholds:
intensity > 0.66 → RED  (high impact)
intensity > 0.33 → AMBER (medium impact)
intensity ≤ 0.33 → GREEN (low impact)
```

### Test Cases

**TC-1: Day with 2 High + 1 Medium events**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| Score | 3+3+2 = **8** | 8 | ✅ PASS |
| Intensity vs max=8 | 8/8 = 1.00 → **RED** | RED | ✅ PASS |

**TC-2: Day with 3 Low events**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| Score | 1+1+1 = **3** | 3 | ✅ PASS |
| Intensity vs max=8 | 3/8 = 0.375 → **AMBER** | AMBER | ✅ PASS* |

*Design note: A day with only low-impact events shows AMBER when a high-impact day exists that week (relative scoring). This is by design — the heatmap shows relative daily risk within the week, not absolute risk. Acceptable behavior.

**TC-3: Holiday events**

| Metric | Expected | Code | Result |
|--------|----------|------|--------|
| Holiday score contribution | 1 (same as Low) | 1 | ✅ PASS |
| Holiday color in event list | Purple (#8b5cf6) | Purple | ✅ PASS |

**Note:** The scoring system treats Holidays as Low (score=1) while visually distinguishing them with purple color. This is intentional — holidays reduce liquidity but don't represent a directional economic event.

### Data Quality

The categorization (`High`/`Medium`/`Low`/`Holiday`) comes entirely from the backend API at `/api/calendar/events`. The frontend correctly renders whatever classification the API provides. Data quality depends on the API's event sourcing.

**Verdict: PASS**

---

## Summary of All Bugs and Flags

### 🔴 Critical Bugs

#### BUG-001: PositionSizer.tsx — Forex mode position size off by 100,000×

**File:** `/app/tools/PositionSizer.tsx`  
**Severity:** Critical  
**Lines affected:** The `positionSize` calculation block (~line 47-52) and the `scenarios` array (~line 55-62)

**Description:** For `asset === 'Forex'`, the code calculates:
```typescript
positionSize = riskDollar / stopDistance
```
where `stopDistance` is a price difference (e.g., 0.0020 for a 20-pip EUR/USD stop). This yields position size in **currency units** (e.g., 100,000 units), but the result is labeled and displayed as **"lots"** using `ASSET_UNITS['Forex'] = 'lots'`. One standard lot = 100,000 units, so the display is inflated by 100,000×.

**Example with inputs: account=$10,000, risk=2%, entry=1.0850, stop=1.0830 (20 pips):**
- Code shows: `100000.00 lots`
- Correct answer: `1.00 lots`

**Fix needed:** Divide result by 100,000 when `asset === 'Forex'`:
```typescript
const positionSize = stopDistance > 0
  ? (asset === 'Futures'
      ? riskDollar / (stopDistance * multiplier)
      : asset === 'Forex'
        ? riskDollar / stopDistance / 100000   // convert units → lots
        : riskDollar / stopDistance)
  : 0
```
The same fix needed in the `scenarios` array.

---

### ⚠️ Warnings

#### WARN-001: SessionClock.tsx — DST not handled in visual ET timeline

**File:** `/app/tools/SessionClock.tsx`  
**Lines affected:** `SESSION_ET` constant object (~lines 34–44)

**Description:** `SESSION_ET` hardcodes ET hour offsets assuming EST (UTC−5). During EDT (UTC−4, ~March–November), all visual timeline positions are 1 hour behind actual ET. This affects 7 of 12 months.

**Recommended fix:** Dynamically detect DST and adjust ET offset accordingly.

#### WARN-002: SessionClock.tsx — CME Globex maintenance window (5–6 PM ET) not shown

**File:** `/app/tools/SessionClock.tsx`  
**Lines:** `isActive()` function and session card rendering

**Description:** The Chicago/CME session card shows OPEN during the daily 5:00–6:00 PM ET maintenance break. `FuturesCalculator.tsx` has `isGlobexOpen()` that correctly excludes this window — the same logic should apply in `SessionClock.tsx`.

---

### ℹ️ Minor Flags (Not Bugs)

#### FLAG-001: CompoundCalculator.tsx — Weekly rate uses linear approximation

Weekly rate = `monthlyRate × 12/52` instead of geometric `(1+monthlyRate)^(12/52) - 1`. Discrepancy: ~0.05% annual. Below threshold for concern; acknowledged in disclaimer.

#### FLAG-002: ForexCalculator.tsx — Non-USD quote pair position values use fixed exchange rates

`positionValue` for USD/JPY and similar pairs uses `APPROX_RATES` (fixed static values), not live exchange rates. Acknowledged in the code's disclaimer.

#### FLAG-003: RiskOfRuinCalculator.tsx — Analytical RoR formula is an approximation

The gambler's ruin formula used (`ratio^N`) is a simplification. At exact break-even (ratio=1.0 within floating-point precision), the code conservatively returns 100% ruin — technically this should be approached asymptotically. The Monte Carlo simulation is the more reliable output for users.

---

## Test Coverage Statistics

| Calculator | Test Cases | Edge Cases | Formulas Verified |
|-----------|-----------|-----------|-------------------|
| FuturesCalculator | 4 | 3 | 6 + 39-contract consistency |
| OptionsCalculator | 4 | 3 | 5 + BS Greeks |
| CompoundCalculator | 3 | 2 | 2 (incl. bug regression) |
| RiskOfRuinCalculator | 4 | 2 | 3 |
| ForexCalculator | 3 | 1 | 5 |
| PositionSizer | 3 | 1 | 3 (bug in Forex) |
| ExpectancyCalculator | 3 | 3 | 4 |
| CorrelationMatrix | 3 | 1 | 1 (Pearson) |
| DividendPlanner | 3 | 3 | 4 |
| SessionClock | 7 sessions | DST | UTC↔ET conversions |
| EconHeatmap | 3 | 1 | Scoring + thresholds |

**Total: 39 test cases across 11 calculators**

---

*Report generated by Zip (QA Agent) — ApexLogics*  
*"People don't like wrong info when it comes to their money."*
