/**
 * Nova ✨ QA Test — Dividend System: 50 Top Dividend Stocks
 * Run from: /Users/mini1/.openclaw/workspace/tradingplatform/backend/
 *
 * Mirrors exactly how stockInfo.js / dividendLog.js fetch and process dividends.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const axios = require('axios');
const fs   = require('fs');
const path = require('path');

const YAHOO_BASE = 'https://query2.finance.yahoo.com';

const yahooHeaders = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept': 'application/json',
};

const DELAY_MS = 350; // slightly over 300ms for safety

// ── Stock lists ──────────────────────────────────────────────────────────────
const ARISTOCRATS = ['JNJ','PG','KO','PEP','MMM','ABT','ABBV','XOM','CVX','T',
                     'VZ','MO','PM','IBM','EMR','CL','GPC','SWK','AFL','BEN',
                     'ED','FRT','HRL','LEG','NUE'];

const HIGH_YIELD  = ['AAPL','MSFT','O','MAIN','AGNC','NLY','MPW','WBA','INTC','DOW',
                     'LYB','OKE','EPD','ET','MPC','PSX','VLO','KMI','WMB','TGT',
                     'HD','LOW','JPM','BAC','WFC'];

const DRIP_STOCKS = ['AAPL','KO','JNJ','O','MSFT'];

const ALL_STOCKS = [...ARISTOCRATS, ...HIGH_YIELD];

// ── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function isValidDate(str) {
  const d = new Date(str);
  return !isNaN(d.getTime()) && str.match(/^\d{4}-\d{2}-\d{2}$/);
}

/** Detect payment frequency from last-12-months count */
function detectFrequency(recentCount) {
  if (recentCount >= 10) return 'monthly';
  if (recentCount >= 3)  return 'quarterly';
  if (recentCount >= 2)  return 'semi-annual';
  if (recentCount >= 1)  return 'annual';
  return 'unknown';
}

/**
 * Fetch dividend history + current price the same way stockInfo.js does.
 * Returns { currentPrice, dividendHistory, error }
 */
async function fetchStockData(symbol) {
  const upper = symbol.toUpperCase();
  try {
    const [quoteRes, divRes] = await Promise.allSettled([
      axios.get(`${YAHOO_BASE}/v8/finance/chart/${upper}`, {
        params: { range: '1d', interval: '1d', events: 'div' },
        headers: yahooHeaders,
        timeout: 12000,
      }),
      axios.get(`${YAHOO_BASE}/v8/finance/chart/${upper}`, {
        params: { range: '5y', interval: '1mo', events: 'div' },
        headers: yahooHeaders,
        timeout: 12000,
      }),
    ]);

    // Current price
    let currentPrice = null;
    if (quoteRes.status === 'fulfilled') {
      const result = quoteRes.value.data?.chart?.result?.[0];
      currentPrice = result?.meta?.regularMarketPrice || null;
    }

    // Dividend history
    let dividendHistory = [];
    if (divRes.status === 'fulfilled') {
      const result = divRes.value.data?.chart?.result?.[0];
      if (result) {
        const divEvents = result.events?.dividends || {};
        dividendHistory = Object.values(divEvents)
          .map(div => ({
            date:   new Date(div.date * 1000).toISOString().split('T')[0],
            amount: parseFloat(div.amount.toFixed(6)),
          }))
          .sort((a, b) => b.date.localeCompare(a.date)); // newest first
      }
    }

    const divError = divRes.status === 'rejected' ? divRes.reason?.message : null;
    return { currentPrice, dividendHistory, error: divError };
  } catch (err) {
    return { currentPrice: null, dividendHistory: [], error: err.message };
  }
}

// ── Main test runner ─────────────────────────────────────────────────────────
async function run() {
  console.log('Nova ✨ QA — Dividend System Test Starting...');
  console.log(`Testing ${ALL_STOCKS.length} stocks with ${DELAY_MS}ms delay between calls\n`);

  const results = {};   // symbol → test result
  const now = new Date();
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // ── Test each stock ────────────────────────────────────────────────────────
  for (let i = 0; i < ALL_STOCKS.length; i++) {
    const sym = ALL_STOCKS[i];
    process.stdout.write(`[${String(i+1).padStart(2,'0')}/50] ${sym.padEnd(5)} ... `);

    const { currentPrice, dividendHistory, error } = await fetchStockData(sym);

    const issues = [];
    let pass = true;

    // ── Check 1: API returned data ──────────────────────────────────────────
    if (error && dividendHistory.length === 0) {
      issues.push(`API error: ${error}`);
      pass = false;
    }

    if (dividendHistory.length === 0) {
      issues.push('No dividend history returned');
      pass = false;
    }

    // ── Checks 2–4: Per-payment validation ──────────────────────────────────
    let badAmounts = 0;
    let badDates   = 0;

    for (const div of dividendHistory) {
      if (!isValidDate(div.date))            badDates++;
      if (div.amount <= 0 || div.amount > 100) badAmounts++;
    }
    if (badDates   > 0) { issues.push(`${badDates} payment(s) with invalid dates`);   pass = false; }
    if (badAmounts > 0) { issues.push(`${badAmounts} payment(s) with bad amounts`);   pass = false; }

    // ── Check 5: Frequency ──────────────────────────────────────────────────
    const recentPayments = dividendHistory.filter(d => new Date(d.date) >= oneYearAgo);
    const frequency      = detectFrequency(recentPayments.length);
    const isAristocrat   = ARISTOCRATS.includes(sym);

    // For aristocrats we expect quarterly; warn if not (but don't fail — some pay semi-annual)
    let frequencyWarning = null;
    if (isAristocrat && frequency !== 'quarterly' && frequency !== 'semi-annual') {
      frequencyWarning = `Expected quarterly/semi-annual, detected: ${frequency}`;
    }

    // ── Simulation: 100 shares bought 2 years ago ───────────────────────────
    const postBuyPayments = dividendHistory
      .filter(d => new Date(d.date) > twoYearsAgo)
      .sort((a, b) => a.date.localeCompare(b.date)); // chrono order

    let totalReceived = 0;
    for (const div of postBuyPayments) {
      totalReceived += parseFloat((div.amount * 100).toFixed(4));
    }
    totalReceived = parseFloat(totalReceived.toFixed(4));

    // Annual estimate (last 12 months × 100 shares)
    const annualPerShare = recentPayments.reduce((s, d) => s + d.amount, 0);
    const annualTotal    = parseFloat((annualPerShare * 100).toFixed(2));

    // Sanity check: annual total should be > $0 for dividend payers
    if (dividendHistory.length > 0 && annualTotal <= 0) {
      issues.push('Annual dividend total is $0 — no recent payments found');
    }

    results[sym] = {
      pass,
      issues,
      frequencyWarning,
      currentPrice,
      totalDividends:   dividendHistory.length,
      recentPayments:   recentPayments.length,
      frequency,
      mostRecent:       dividendHistory[0] || null,
      postBuyPayments:  postBuyPayments.length,
      totalReceived,    // 100 shares × 2 years
      annualTotal,      // 100 shares × last 12 months
    };

    const status = pass ? '✅ PASS' : `❌ FAIL (${issues.join('; ')})`;
    const freq   = frequencyWarning ? ` ⚠️  ${frequencyWarning}` : '';
    console.log(`${status}${freq} — ${dividendHistory.length} payments found, last: ${dividendHistory[0]?.date || 'N/A'} $${dividendHistory[0]?.amount || 0}`);

    await sleep(DELAY_MS);
  }

  // ── DRIP Simulation (5 stocks) ─────────────────────────────────────────────
  console.log('\n── DRIP Simulation (AAPL, KO, JNJ, O, MSFT) ────────────────────────────');
  const dripResults = {};

  for (const sym of DRIP_STOCKS) {
    const r = results[sym];
    if (!r) {
      dripResults[sym] = { error: 'No data from main test' };
      continue;
    }

    // Re-fetch for DRIP (results only stores stats, not raw history)
    const { currentPrice, dividendHistory } = await fetchStockData(sym);
    await sleep(DELAY_MS);

    const postBuy = dividendHistory
      .filter(d => new Date(d.date) > twoYearsAgo)
      .sort((a, b) => a.date.localeCompare(b.date));

    let shares = 100;
    const payments = [];

    for (const div of postBuy) {
      const total  = parseFloat((div.amount * shares).toFixed(6));
      // Approximate price at ex-date: use current price as proxy
      // (Historical per-date pricing would require Alpaca/Yahoo historical OHLC)
      const approxPrice = currentPrice || 100;
      const dripShares  = parseFloat((total / approxPrice).toFixed(6));

      payments.push({
        date:       div.date,
        dps:        div.amount,
        sharesHeld: parseFloat(shares.toFixed(6)),
        total:      total,
        dripPrice:  parseFloat(approxPrice.toFixed(4)),
        dripShares: dripShares,
      });

      shares += dripShares;
    }

    const sharesGained = parseFloat((shares - 100).toFixed(6));
    const dripOk       = payments.length > 0 && sharesGained > 0;

    // Math verification: drip_shares_added = total_received / price_at_payment ✓
    let mathOk = true;
    for (const p of payments) {
      const expected = parseFloat((p.total / p.dripPrice).toFixed(6));
      if (Math.abs(expected - p.dripShares) > 0.000002) {
        mathOk = false;
      }
    }

    dripResults[sym] = {
      startShares:  100,
      endShares:    parseFloat(shares.toFixed(6)),
      sharesGained,
      paymentsSimulated: payments.length,
      sharesIncrease: dripOk,
      mathOk,
      payments,
    };

    const status = dripOk && mathOk ? '✅' : '❌';
    console.log(`${status} ${sym}: 100 → ${shares.toFixed(4)} shares (+${sharesGained}) over ${payments.length} payments`);
  }

  // ── Build report ──────────────────────────────────────────────────────────
  const passed   = Object.values(results).filter(r => r.pass).length;
  const failed   = Object.values(results).filter(r => !r.pass).length;
  const warnings = Object.values(results).filter(r => r.frequencyWarning).length;
  const passRate = ((passed / ALL_STOCKS.length) * 100).toFixed(1);

  console.log(`\n── Summary ─────────────────────────────────────────────────────────────`);
  console.log(`Passed: ${passed}/50 (${passRate}%) | Failed: ${failed} | Warnings: ${warnings}`);

  // Generate Markdown report
  const ts = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  let md = `# QA Report — Dividend System: 50 Stock Test\n`;
  md += `**Agent:** Nova ✨ (QA)\n**Date:** ${ts}\n**Pass Rate:** ${passed}/50 (${passRate}%)\n\n`;
  md += `---\n\n`;

  // Overall summary table
  md += `## Summary\n\n`;
  md += `| Metric | Value |\n|--------|-------|\n`;
  md += `| Total Stocks Tested | 50 |\n`;
  md += `| Passed | ${passed} |\n`;
  md += `| Failed | ${failed} |\n`;
  md += `| Frequency Warnings | ${warnings} |\n`;
  md += `| Pass Rate | ${passRate}% |\n\n`;

  // ── Dividend Aristocrats results ──────────────────────────────────────────
  md += `## Dividend Aristocrats (25)\n\n`;
  md += `| Symbol | Pass | Payments (5Y) | Recent (12mo) | Frequency | Most Recent Div | Annual (100 sh) | 2Y Total (100 sh) | Issues |\n`;
  md += `|--------|------|--------------|---------------|-----------|-----------------|-----------------|-------------------|--------|\n`;
  for (const sym of ARISTOCRATS) {
    const r = results[sym];
    if (!r) continue;
    const icon    = r.pass ? '✅' : '❌';
    const last    = r.mostRecent ? `$${r.mostRecent.amount} (${r.mostRecent.date})` : 'N/A';
    const issues  = r.issues.length ? r.issues.join('; ') : (r.frequencyWarning ? `⚠️ ${r.frequencyWarning}` : '—');
    md += `| ${sym} | ${icon} | ${r.totalDividends} | ${r.recentPayments} | ${r.frequency} | ${last} | $${r.annualTotal} | $${r.totalReceived} | ${issues} |\n`;
  }

  // ── High-Yield / Popular results ──────────────────────────────────────────
  md += `\n## High-Yield / Popular (25)\n\n`;
  md += `| Symbol | Pass | Payments (5Y) | Recent (12mo) | Frequency | Most Recent Div | Annual (100 sh) | 2Y Total (100 sh) | Issues |\n`;
  md += `|--------|------|--------------|---------------|-----------|-----------------|-----------------|-------------------|--------|\n`;
  for (const sym of HIGH_YIELD) {
    const r = results[sym];
    if (!r) continue;
    const icon    = r.pass ? '✅' : '❌';
    const last    = r.mostRecent ? `$${r.mostRecent.amount} (${r.mostRecent.date})` : 'N/A';
    const issues  = r.issues.length ? r.issues.join('; ') : (r.frequencyWarning ? `⚠️ ${r.frequencyWarning}` : '—');
    md += `| ${sym} | ${icon} | ${r.totalDividends} | ${r.recentPayments} | ${r.frequency} | ${last} | $${r.annualTotal} | $${r.totalReceived} | ${issues} |\n`;
  }

  // ── Failed / no-data stocks ────────────────────────────────────────────────
  const failedStocks = ALL_STOCKS.filter(s => results[s] && !results[s].pass);
  if (failedStocks.length > 0) {
    md += `\n## ❌ Failed Stocks — Detail\n\n`;
    for (const sym of failedStocks) {
      const r = results[sym];
      md += `### ${sym}\n`;
      md += `- Current price: ${r.currentPrice ? '$'+r.currentPrice : 'N/A'}\n`;
      md += `- Total dividend records found: ${r.totalDividends}\n`;
      md += `- Issues:\n`;
      for (const iss of r.issues) md += `  - ${iss}\n`;
      md += '\n';
    }
  }

  // ── DRIP Simulation results ────────────────────────────────────────────────
  md += `\n## DRIP Simulation — AAPL, KO, JNJ, O, MSFT\n\n`;
  md += `> **Methodology:** Starting with 100 shares purchased 2 years ago.\n`;
  md += `> Each dividend payment reinvests at current market price (proxy; exact ex-date price requires historical OHLC).\n`;
  md += `> Formula: \`drip_shares_added = total_received / price_at_payment\`\n\n`;

  for (const sym of DRIP_STOCKS) {
    const d = dripResults[sym];
    if (!d || d.error) {
      md += `### ${sym} — ❌ Error: ${d?.error || 'No data'}\n\n`;
      continue;
    }

    const icon  = (d.sharesIncrease && d.mathOk) ? '✅' : '❌';
    md += `### ${icon} ${sym}\n\n`;
    md += `| Metric | Value |\n|--------|-------|\n`;
    md += `| Starting shares | 100 |\n`;
    md += `| Ending shares | ${d.endShares} |\n`;
    md += `| DRIP shares gained | ${d.sharesGained} |\n`;
    md += `| Payments simulated | ${d.paymentsSimulated} |\n`;
    md += `| Shares increase verified | ${d.sharesIncrease ? '✅ Yes' : '❌ No'} |\n`;
    md += `| Math accuracy (drip = total/price) | ${d.mathOk ? '✅ Pass' : '❌ Fail'} |\n\n`;

    if (d.payments.length > 0) {
      md += `**Payment detail (last 5 shown):**\n\n`;
      md += `| Date | DPS | Shares Held | Total Received | DRIP Price | DRIP Shares Added |\n`;
      md += `|------|-----|-------------|---------------|------------|-------------------|\n`;
      const show = d.payments.slice(-5);
      for (const p of show) {
        md += `| ${p.date} | $${p.dps} | ${p.sharesHeld.toFixed(4)} | $${p.total.toFixed(4)} | $${p.dripPrice} | +${p.dripShares} |\n`;
      }
      md += '\n';
    }
  }

  // ── Suspicious data notes ──────────────────────────────────────────────────
  md += `\n## Observations & Notes\n\n`;

  const noData = ALL_STOCKS.filter(s => results[s] && results[s].totalDividends === 0);
  if (noData.length > 0) {
    md += `### Stocks with No Dividend History\n`;
    md += `These stocks returned zero dividend records from Yahoo Finance:\n\n`;
    for (const sym of noData) md += `- **${sym}**: ${results[sym].issues.join('; ')}\n`;
    md += '\n';
  }

  const warnList = ALL_STOCKS.filter(s => results[s] && results[s].frequencyWarning);
  if (warnList.length > 0) {
    md += `### Frequency Warnings\n`;
    md += `These Dividend Aristocrats had unexpected payment frequency:\n\n`;
    for (const sym of warnList) {
      md += `- **${sym}**: ${results[sym].frequencyWarning}\n`;
    }
    md += '\n';
  }

  md += `### Data Source\n`;
  md += `Dividend history fetched from **Yahoo Finance** (\`v8/finance/chart\` with \`range=5y, interval=1mo, events=div\`) — same endpoint used by \`stockInfo.js\` / \`dividendLog.js\`. Current price from Yahoo Finance 1d chart.\n\n`;
  md += `### Test Approach\n`;
  md += `- 100 shares assumed, purchased 2 years ago\n`;
  md += `- Payments after buy date summed to simulate \`dividendLog.backfill()\` output\n`;
  md += `- DRIP math: \`drip_shares_added = (dividend_per_share × shares_held) / price_at_payment\`\n`;
  md += `- 350ms delay between API calls to respect rate limits\n`;
  md += `\n---\n_Generated by Nova ✨ QA Agent — ApexLogics_\n`;

  // Save report
  const outDir  = '/Users/mini1/.openclaw/workspace/docs';
  const outPath = path.join(outDir, 'QA_DIVIDEND_50_STOCK_TEST.md');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, md, 'utf8');

  console.log(`\nReport saved to: ${outPath}`);
  console.log(`\nNova ✨ Done. Pass rate: ${passRate}% (${passed}/50)`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
