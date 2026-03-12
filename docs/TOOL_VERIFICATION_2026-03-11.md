# Tool Verification Report — 2026-03-11

**Auditor:** Zip (QA Agent)  
**Project:** TradVue Frontend — `/Users/mini1/.openclaw/workspace/tradingplatform/frontend`  
**Method:** Independent source-code read + hand-calculation verification  
**Status:** READ-ONLY AUDIT — No code changes made

---

## Summary

| # | Tool | Status | Issues |
|---|------|--------|--------|
| 1 | FuturesCalculator | ✅ PASS | None |
| 2 | OptionsCalculator | ✅ PASS | None |
| 3 | CompoundCalculator | ❌ FAIL | **Critical bug: rate divided by 12 extra time** |
| 4 | RiskOfRuinCalculator | ✅ PASS | Minor: simplified ruin formula (documented) |
| 5 | ForexCalculator | ✅ PASS | Minor: JPY approximate rate ($6.60 vs $6.67) |
| 6 | PositionSizer | ✅ PASS | None |
| 7 | ExpectancyCalculator | ✅ PASS | None |
| 8 | CorrelationMatrix | ✅ PASS | Flag: custom mode uses synthetic data |
| 9 | DividendPlanner | ✅ PASS | None |
| 10 | SessionClock | ✅ PASS | Minor: session open/close times ±30min off |
| 11 | EconHeatmap | ✅ PASS | None |

**1 critical bug found. 10 of 11 tools pass.**

---

## 1. FuturesCalculator — ✅ PASS

### Formula Verification

Core formulas (all correct):
```
ticksAtRisk = |entry - stop| / tickSize
dollarRiskPerContract = ticksAtRisk × tickValue
totalRisk = dollarRiskPerContract × contracts
rewardPerTarget = |target - entry| / tickSize × tickValue
R:R = rewardPerTarget / dollarRiskPerContract
```

### Test Cases (hand-calculated vs code)

| Test | Expected | Code Output | ✓/✗ |
|------|----------|-------------|------|
| ES: 5000→4990, 5030 T1, 1c — Risk | $500 | $500 | ✓ |
| ES: 5000→4990, 5030 T1, 1c — Reward | $1,500 | $1,500 | ✓ |
| ES: R:R | 1:3 | 1:3.00 | ✓ |
| NQ: 17500→17480, 17560 T, 2c — Risk | $800 | $800 | ✓ |
| NQ: 2c — Reward | $2,400 | $2,400 | ✓ |
| MES: 5000→4990, 5030 T, 5c — Risk | $250 | $250 | ✓ |
| MES: 5c — Reward | $750 | $750 | ✓ |
| GC: 2000→1990, 2030 T, 1c — Risk | $1,000 | $1,000 | ✓ |
| GC: 1c — Reward | $3,000 | $3,000 | ✓ |

### Contract Spec Cross-Check (tickSize × pointValue = tickValue)

| Contract | tickSize | pointValue | Expected tickValue | Code tickValue | ✓/✗ |
|----------|----------|------------|-------------------|----------------|------|
| ES | 0.25 | $50 | $12.50 | $12.50 | ✓ |
| NQ | 0.25 | $20 | $5.00 | $5.00 | ✓ |
| MES | 0.25 | $5 | $1.25 | $1.25 | ✓ |
| MNQ | 0.25 | $2 | $0.50 | $0.50 | ✓ |
| GC | 0.10 | $100 | $10.00 | $10.00 | ✓ |
| RTY | 0.10 | $50 | $5.00 | $5.00 | ✓ |
| BTC (5 BTC) | 5 | $5 | $25.00 | $25.00 | ✓ |
| ZB (T-Bond) | 0.03125 | $1,000 | $31.25 | $31.25 | ✓ |
| ZT (2-Yr) | 0.0078125 | $2,000 | $15.625 | $15.625 | ✓ |

### Edge Case Handling
- Division by zero: `stopN > 0 && entryN > 0 ? ... : 0` ✓
- Minimum contracts: `Math.max(1, parseInt(...) || 1)` ✓
- Margin floor: `Math.floor(accountN × riskPct / dollarRisk)` ✓

---

## 2. OptionsCalculator — ✅ PASS

### Formula Verification

```
costBasis = premium × contracts × 100
breakEven (call) = strikePrice + premium
breakEven (put) = strikePrice − premium
maxLoss = costBasis
maxProfit (call) = Unlimited (Infinity)
maxProfit (put) = (strikePrice − premium) × contracts × 100
P&L at price = (intrinsicValue − premium) × contracts × 100
intrinsic (call) = max(0, price − strike)
intrinsic (put) = max(0, strike − price)
```

### Test Cases

| Test | Expected | Calculated | ✓/✗ |
|------|----------|------------|------|
| AAPL Call (175 stock, 180 strike, $3.50 prem, 1c): costBasis | $350 | $350 | ✓ |
| AAPL Call: break-even | $183.50 | $183.50 | ✓ |
| AAPL Call: max loss | $350 | $350 | ✓ |
| AAPL Call: max profit | Unlimited | Unlimited | ✓ |
| AAPL Call at $190: P&L | +$650 | +$650 | ✓ |
| AAPL Call at $170: P&L | −$350 | −$350 | ✓ |
| SPY Put (550/540/$5/2c): costBasis | $1,000 | $1,000 | ✓ |
| SPY Put: break-even | $535 | $535 | ✓ |
| SPY Put at $520: P&L | +$3,000 | +$3,000 | ✓ |

### Black-Scholes Greeks
The Black-Scholes implementation uses the Abramowitz & Stegun normal CDF approximation. Formulas for delta, gamma, theta, vega are standard and correct. Theta divided by 365 (daily) is conventional. Vega divided by 100 (per 1% IV) is non-standard but the label "per 1% IV" makes this clear.

---

## 3. CompoundCalculator — ❌ FAIL

### ⚠️ CRITICAL BUG: Rate Divided by 12 Twice

**File:** `CompoundCalculator.tsx`  
**Line:** `const ratePerPeriod = rateN / periodsPerYear * (freq === 'monthly' ? 1 : 12 / 52)`

**The problem:** The input label says "Monthly Return %" and the tooltip confirms "S&P 500 averages ~0.83%/month (10%/year)". The user enters a **monthly** rate. However the code then divides by `periodsPerYear` (12 for monthly), reducing the effective rate to `monthly_rate / 12` per period.

**Effect:** For a 2% monthly rate input, the code applies only 0.167% per month — understating returns by ~12×.

**Proof:**
```
User enters: 2% monthly
Code ratePerPeriod = 0.02 / 12 = 0.001667 per month (wrong)
Correct ratePerPeriod = 0.02 per month
```

### Test Case: $10,000 start, $500/mo, 2% monthly, 5 years

| | Value |
|--|--|
| Code output (buggy) | **$42,574** |
| Correct output (2%/month) | **$89,836** |
| Error | **-$47,262 (−53% shortfall)** |

**Verification formula:** `FV = 10000 × (1.02)^60 + 500 × ((1.02)^60 − 1)/0.02`
= `10000 × 3.281 + 500 × 114.05 = 32,810 + 57,025 = **$89,836**`

### Second Test: $25,000 start, $0/mo, 1% monthly, 10 years

| | Value |
|--|--|
| Spec expects | ~$81,000 |
| Correct output (1%/month) | $82,510 ✓ |
| Code output (buggy) | **$27,628** (wrong) |

### Fix Required
```typescript
// CURRENT (wrong):
const ratePerPeriod = rateN / periodsPerYear * (freq === 'monthly' ? 1 : 12 / 52)

// CORRECT:
const ratePerPeriod = freq === 'monthly' ? rateN : rateN * 12 / 52
```

### ⚠️ SPEC ALSO HAS INCORRECT EXPECTED VALUE

The verification spec says the expected output for "$10K start, $500/mo, 2% monthly, 5yr" is "$131,000–$135,000". This is **mathematically wrong** for any standard interpretation:
- Correct calculation at 2% monthly → **$89,836**
- $131K corresponds to approximately **2.8% monthly**, not 2%

Both the code AND the spec expected value for this test are incorrect. The spec expected values need to be corrected to match actual 2% monthly compounding (~$89,836).

---

## 4. RiskOfRuinCalculator — ✅ PASS

### Kelly Criterion
Formula: `f* = (p × R − q) / R` where p = win rate, q = loss rate, R = reward ratio

```
Test: 60% win, 1:1 R:R
kelly(0.60, 1.0) = (0.60 × 1 − 0.40) / 1 = 0.20 = 20% ✓
```

### Analytical Ruin Formula
```
ratio = (q/p) × (1/R)
tradesNeeded = round(maxDrawdown% / riskPerTrade%)
P(ruin) = ratio ^ tradesNeeded
```

| Test | Expected | Result | ✓/✗ |
|------|----------|--------|------|
| 50% win, 2:1 RR, 2% risk, 20% ruin | <5% | **0.10%** | ✓ |
| 40% win, 1:1 RR, 5% risk, 20% ruin | >50% | **100%** (ratio≥1 = certain ruin) | ✓ |

**Note:** This is a simplified gambler's ruin approximation. It's a valid and commonly used heuristic in trading literature, though not a closed-form actuarial formula. Appropriately documented in the UI.

### Monte Carlo Logic
```typescript
// Win: balance increases by risk% × R:R
bal = win ? bal + bal * riskN * rrN : bal - bal * riskN
```
- Win $2 on $1 at 2% risk → balance × 1.04 ✓
- Loss at 2% risk → balance × 0.98 ✓
- Ruin threshold = `1 − ruinLevel%` ✓

---

## 5. ForexCalculator — ✅ PASS

### Pip Value Formula
```
pipValueQuote = units × pipSize
pipValueUSD = pipValueQuote × quoteToUSD
```

### Test Cases

| Test | Expected | Code Output | ✓/✗ |
|------|----------|-------------|------|
| EUR/USD, 1 lot → pip value | $10.00 | $10.00 | ✓ |
| GBP/USD, 0.1 lot, 30-pip SL → risk | $30.00 | $30.00 | ✓ |
| EUR/USD margin (1 lot, 50:1, 1.0850) | $2,170 | $2,170 | ✓ |

### USD/JPY Pip Value Approximation
| | Value |
|--|--|
| Code (APPROX_RATES[JPY] = 0.0066) | **$6.60/pip** |
| Exact at 150.00 (1/150 = 0.006667) | **$6.667/pip** |
| Difference | $0.067 (1.0% error) |

This is a minor approximation in the static rate table, acceptable given the disclaimer ("Exchange rates are approximations"). However, the table could be improved to use 0.00667 for JPY (difference of 7¢ per lot).

---

## 6. PositionSizer — ✅ PASS

### Formula
```
riskDollar = accountBalance × (riskPct / 100)
stopDistance = |entry − stop|
positionSize = riskDollar / stopDistance   (stocks)
positionSize = riskDollar / (stopDistance × multiplier)   (futures)
```

### Test Cases

| Test | Expected | Calculated | ✓/✗ |
|------|----------|------------|------|
| $50K acct, 2% risk, $100→$95 | 200 shares | 200 shares | ✓ |
| $10K acct, 1% risk, $50→$48 | 50 shares | 50 shares | ✓ |

**Walkthrough ($50K, 2%, entry $100, stop $95):**
- riskDollar = $50,000 × 0.02 = **$1,000**
- stopDistance = |$100 − $95| = **$5**
- positionSize = $1,000 / $5 = **200 shares** ✓

### Edge Cases
- Zero stop distance: `stopDistance > 0 ? ... : 0` ✓ (no division by zero)
- Stock position uses `Math.floor()` for whole shares ✓
- Futures sizing uses contract multiplier correctly ✓

---

## 7. ExpectancyCalculator — ✅ PASS

### Formula
```
expectancy = (winRate × avgWin) − (lossRate × avgLoss)
lossRate = 1 − winRate
breakEvenWR = avgLoss / (avgWin + avgLoss)
```

### Test Cases

| Test | Expected | Calculated | ✓/✗ |
|------|----------|------------|------|
| 55% win, $500 avg win, $300 avg loss | $140/trade | $140/trade | ✓ |
| 40% win, $1000 avg win, $400 avg loss | $160/trade | $160/trade | ✓ |
| Break-even WR at $500/$300 | 37.5% | 37.50% | ✓ |

**Walkthrough (55% win, $500, $300):**
- Expectancy = 0.55 × $500 − 0.45 × $300 = $275 − $135 = **$140/trade** ✓
- Break-even: $300 / ($500 + $300) = 300/800 = **37.5%** ✓
- Verification: 37.5% × $500 − 62.5% × $300 = $187.50 − $187.50 = **$0** ✓

---

## 8. CorrelationMatrix — ✅ PASS

### Pearson Correlation Formula
```typescript
// Returns-based Pearson: correct implementation
const ra = a.slice(1).map((v, i) => (v - a[i]) / a[i])  // price returns
// r = Σ(x-x̄)(y-ȳ) / √(Σ(x-x̄)² × Σ(y-ȳ)²)
```

**Verified mathematically correct:**
- Perfect positive correlation (identical returns): **1.000000** ✓
- Perfect negative correlation (exact opposite returns): **−1.000000** ✓
- Division by zero guard: `denom === 0 ? 0 : num / denom` ✓
- Minimum length check: `a.length < 2` returns 0 ✓

### ⚠️ FLAG: Custom Mode Uses Synthetic Data

In custom ticker mode, correlations are calculated from a **synthetically generated** price series:
```typescript
priceMap[t] = Array.from({ length: 20 }, (_, i) =>
  pc + (c - pc) * i / 19 + (Math.sin(i * 0.7 + t.charCodeAt(0)) * 0.5))
```
This is a linear interpolation between `prevClose` and `close` with a ticker-name-seeded sinusoidal noise term. The resulting "correlations" are not based on historical price data and can produce misleading results for portfolio diversification analysis.

The built-in mode fetches real data from the backend API — that is fine.

**Recommendation:** Add a more prominent disclaimer in custom mode: "⚠️ Custom correlations are synthetic estimates, not based on historical data."

---

## 9. DividendPlanner — ✅ PASS

### Formula Verification
```
annualIncome = invested × (yieldPct / 100)
monthlyIncome = annualIncome / 12
quarterlyIncome = annualIncome / 4
```

### Test Cases

| Test | Expected | Calculated | ✓/✗ |
|------|----------|------------|------|
| $10,000 at 4% yield: annual income | $400 | $400 | ✓ |
| Quarterly income | $100 | $100 | ✓ |
| Monthly income | $33.33 | $33.33 | ✓ |
| DRIP 10yr at 4% (no price appreciation) | ~$14,800 | $14,802 | ✓ |

### DRIP Compounding (verified)
```
Year 1: 10,000 × 1.04 = 10,400
Year 2: 10,400 × 1.04 = 10,816
...
Year 10: 10,000 × (1.04)^10 = $14,802.44 ✓
```
Code: `bal += bal * wAvgYield` each year — correct. ✓

### Reverse Calculator
```
investedNeeded = (targetMonthly × 12) / (avgYield / 100)
```
For $500/month at 4%: $6,000 / 0.04 = **$150,000** ✓

---

## 10. SessionClock — ✅ PASS (with minor timing notes)

### Midnight-Crossing Logic (verified)
The `isActive()` function correctly handles sessions that cross midnight UTC:
```typescript
if (openHour < closeHour) return utcHour >= openHour && utcHour < closeHour
return utcHour >= openHour || utcHour < closeHour  // crosses midnight ✓
```
- Sydney at 23:00 UTC: active ✓
- Sydney at 03:00 UTC: active ✓
- Sydney at 10:00 UTC: inactive ✓

### Session Time Accuracy

| Session | Code (UTC) | Industry Standard (UTC) | Difference |
|---------|-----------|------------------------|------------|
| Sydney / ASX | 21:00–06:00 | Forex: 22:00–07:00 | 1hr offset |
| Tokyo / TSE | 00:00–09:00 | Forex: 00:00–09:00 | ✓ |
| Singapore / SGX | 01:00–09:00 | 01:00–09:00 | ✓ |
| Frankfurt / XETRA | 07:00–15:00 | 08:00–17:30 (CET) / 07:00–16:30 (CEST) | DST-dependent |
| London / LSE | 08:00–16:00 | 08:00–16:30 | Close 30min early |
| New York / NYSE | 13:00–20:00 | 13:30–20:00 (EDT) | Open 30min early |
| Chicago / CME | 13:00–22:00 | Varies by product | Approximate |

**Assessment:** These are **approximations**, which is common in session-clock tools due to DST complexity. The existing disclaimer "Actual hours may vary due to DST and holidays" covers this. No mathematical bugs — only minor timing approximations acceptable for a planning tool.

---

## 11. EconHeatmap — ✅ PASS

### Heat Score Weighting
```
High = 3, Medium = 2, Low = 1
```
Test: 2 High + 1 Medium + 1 Low = 3+3+2+1 = **9** ✓

### Week Date Calculation
```typescript
monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7)
```
- Sunday (day=0): subtract 6 → correct Monday ✓
- Wednesday (day=3): subtract 2 → correct Monday ✓
- Friday (day=5): subtract 4 → correct Monday ✓

The `toLocaleDateString('en-CA', { timeZone: 'America/New_York' })` ensures consistent ET-based dates ✓

### Data Display Logic
- Events grouped by date using object map ✓
- Intensity calculation: `score / maxScore` → normalized [0,1] ✓
- Color thresholds: >0.66 = red (high risk), >0.33 = amber, ≤0.33 = green ✓
- Display max 4 events per day cell, "+N more" overflow ✓
- The component is data-display only; no financial calculations ✓

---

## Issues Summary

### 🔴 Critical
1. **CompoundCalculator.tsx** — `ratePerPeriod` formula applies monthly rate divided by 12, understating returns by ~12x. Code outputs ~$42,574 vs correct ~$89,836 for the 2%/month, 5yr, $10K/$500 test case.

### 🟡 Spec Error
2. **TOOL_VERIFICATION_SPEC.md** — Expected value "$131,000–$135,000" for the compound calculator test case is mathematically incorrect. The correct answer for $10K, $500/mo, 2% monthly, 5 years is **~$89,836**. The spec expected value doesn't correspond to any standard interpretation of the inputs.

### 🟠 Flag (Not Bugs, But Notable)
3. **CorrelationMatrix.tsx** — Custom mode uses synthetic price data; resulting correlations are not meaningful for real portfolio analysis. Disclaimer should be more prominent.

4. **SessionClock.tsx** — NY open shows 13:00 UTC (should be 13:30 EDT), London close shows 16:00 UTC (actual 16:30), Sydney session offset 1hr. All within acceptable approximation range; disclaimer covers these.

5. **ForexCalculator.tsx** — JPY approximate rate 0.0066 gives $6.60/pip instead of $6.67/pip at 150.00. Minor (~1% error), documented as approximate.

---

## Edge Case Audit

| Edge Case | Calculator | Handling | ✓/✗ |
|-----------|------------|----------|------|
| Zero stop distance | FuturesCalc, PositionSizer | Returns 0, no crash | ✓ |
| Zero stop distance | ForexCalc | `rrRatio = 0` guard | ✓ |
| Negative numbers (entry < stop for long) | FuturesCalc | `Math.abs()` used everywhere | ✓ |
| Win rate 0% or 100% | RiskOfRuin | Returns 1 (invalid input guard) | ✓ |
| Win rate 0% or 100% | Expectancy | Handles mathematically (no crash) | ✓ |
| Zero account size | FuturesCalc | Shows "—" via isNaN/!isFinite check | ✓ |
| Zero account size | PositionSizer | riskDollar = 0, positionSize = 0 | ✓ |
| Division by zero (Pearson) | CorrelationMatrix | `denom === 0 ? 0` guard | ✓ |
| Division by zero (dividend) | DividendPlanner | `avgYield > 0` guard before reverse calc | ✓ |
| Very large numbers | Most calculators | JS number precision fine to ~15 sig figs | ✓ |
| Negative premium/yield | Options, Dividend | Math still works but inputs are user error | ~ |

---

## Rounding Assessment

| Calculator | Rounding Method | Standard? |
|------------|----------------|-----------|
| FuturesCalc | `toLocaleString` 2dp for money | ✓ |
| OptionsCalc | `.toFixed(2)` for money | ✓ |
| CompoundCalc | `toLocaleString` 0dp for large values | ✓ |
| PositionSizer | `Math.floor()` for shares | ✓ |
| ForexCalc | `.toFixed(2)` for money | ✓ |
| ExpectancyCalc | `toLocaleString` 0dp | ✓ |
| DividendPlanner | `.toFixed(2)` and `$X.Xk` | ✓ |

---

## Recommendations

1. **[P0 Fix Required]** `CompoundCalculator.tsx` — Change `ratePerPeriod` formula:
   ```typescript
   // Fix for monthly:
   const ratePerPeriod = freq === 'monthly' ? rateN : rateN * 12 / 52
   ```

2. **[P1 Spec Fix]** Update `TOOL_VERIFICATION_SPEC.md` compound test expected value:
   - "$10K, $500/mo, 2%/mo, 5yr" → expected **~$89,836** (not $131K–$135K)

3. **[P2 UX]** `CorrelationMatrix.tsx` — Add prominent warning in custom mode that values are synthetic estimates, not real historical correlations.

4. **[P3 Minor]** `ForexCalculator.tsx` — Update JPY approximate rate from 0.0066 to 0.00667 for better accuracy at ~150 USDJPY.

5. **[P3 Minor]** `SessionClock.tsx` — Adjust NY open from 13:00 to 13:30 UTC (EDT) and London close from 16:00 to 16:30 UTC.

---

*Audit completed 2026-03-11 by Zip (QA Agent). All calculations verified by independent computation. No code changes made.*
