import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Options Trading Journal — Track Greeks, Spreads & Multi-Leg P&L',
  description:
    'Options journal with Greeks tracking (delta, gamma, theta, vega), multi-leg strategy support (Iron Condors, spreads, straddles), and P&L by strategy type. Free to start.',
  alternates: {
    canonical: 'https://www.tradvue.com/options-trading-journal',
  },
  openGraph: {
    title: 'Options Trading Journal — Track Greeks, Spreads & Multi-Leg P&L | TradVue',
    description:
      'Track options trades with Greeks, multi-leg strategies, and deep analytics. Iron Condors, spreads, straddles. Free to start.',
    url: 'https://www.tradvue.com/options-trading-journal',
    siteName: 'TradVue',
    images: [{ url: 'https://www.tradvue.com/og-image.png', width: 1200, height: 630, alt: 'Options Trading Journal — TradVue' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Options Trading Journal — Track Greeks, Spreads & P&L | TradVue',
    description:
      'Track options with Greeks, multi-leg strategies, and analytics. Free to start.',
    images: ['/og-image.png'],
  },
}

export default function OptionsTradingJournalPage() {
  return (
    <div style={{ fontFamily: 'var(--font)', background: 'var(--bg-0)', color: 'var(--text-0)', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'FAQPage',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: 'Can TradVue track multi-leg options strategies?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. TradVue supports spreads, straddles, Iron Condors, butterflies, and any multi-leg strategy. Log all legs at once and tag trades by strategy type for deep performance analytics.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Does TradVue calculate options Greeks?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. TradVue tracks delta, gamma, theta, and vega for individual positions and your overall portfolio, helping you understand your total risk exposure.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Which options strategies does TradVue support?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'TradVue supports covered calls, cash-secured puts, vertical spreads, calendar spreads, straddles, strangles, Iron Condors, butterfly spreads, ratio spreads, and any custom multi-leg position.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: 'Can I analyze my P&L by options strategy type?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: 'Yes. TradVue's analytics break down your P&L by strategy type. See whether your Iron Condors are outperforming your spreads, or which strategies perform best in different market conditions.',
                    },
                  },
                ],
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.tradvue.com' },
                  { '@type': 'ListItem', position: 2, name: 'Options Trading Journal', item: 'https://www.tradvue.com/options-trading-journal' },
                ],
              },
            ],
          }),
        }}
      />

      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(10, 10, 12, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0 24px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-header.svg"
              alt="TradVue"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
            />
          </Link>
          <Link
            href="/#signup"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              padding: '9px 20px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      <section style={{ padding: 'clamp(60px, 8vw, 100px) 24px 40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            marginBottom: '20px',
            color: 'var(--text-0)',
          }}
        >
          Journal Your Options Trades with Greeks Tracking
        </h1>
        <p
          style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
            color: 'var(--text-1)',
            lineHeight: 1.6,
            marginBottom: '32px',
            fontWeight: 400,
          }}
        >
          Multi-leg strategies, Greeks analysis, and P&L by strategy type. TradVue lets you understand your options
          portfolio with precision.
        </p>
        <Link
          href="/#signup"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 32px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: 700,
          }}
        >
          Try Options Journaling
        </Link>
      </section>

      <section
        style={{
          padding: 'clamp(60px, 8vw, 100px) 24px',
          background: 'var(--bg-1)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: '40px',
              textAlign: 'center',
              color: 'var(--text-0)',
            }}
          >
            Built for Options Traders
          </h2>

          <div style={{ display: 'grid', gap: '20px' }}>
            {[
              {
                title: 'Multi-Leg Strategies',
                desc: 'Trade spreads, straddles, Iron Condors, Butterflies, and any complex position. Log multiple legs at once.',
              },
              {
                title: 'Greeks Tracking',
                desc: 'View delta, gamma, theta, vega, and rho exposure. Understand your portfolio risk.',
              },
              {
                title: 'P&L by Strategy Type',
                desc: 'See which strategies are profitable. Analyze spreads vs. straddles vs. iron condors separately.',
              },
              {
                title: 'Strike & Expiration Tags',
                desc: 'Organize by strike price, days to expiration, and strategy type. Find patterns that work.',
              },
              {
                title: 'Breakeven Analysis',
                desc: 'TradVue calculates breakeven prices for any multi-leg strategy automatically.',
              },
              {
                title: 'Risk Management',
                desc: 'Max loss, max profit, probability of profit—see your full risk profile before you trade.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    marginBottom: '8px',
                  }}
                >
                  {feature.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(60px, 8vw, 100px) 24px', maxWidth: '800px', margin: '0 auto' }}>
        <h2
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '32px',
            textAlign: 'center',
            color: 'var(--text-0)',
          }}
        >
          Supported Strategies
        </h2>

        <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '24px', textAlign: 'center' }}>
          Log any single or multi-leg strategy. TradVue calculates the math.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {[
            { name: 'Covered Call', legs: 2 },
            { name: 'Cash-Secured Put', legs: 1 },
            { name: 'Vertical Spread', legs: 2 },
            { name: 'Calendar Spread', legs: 2 },
            { name: 'Straddle', legs: 2 },
            { name: 'Strangle', legs: 2 },
            { name: 'Iron Condor', legs: 4 },
            { name: 'Butterfly Spread', legs: 3 },
            { name: 'Ratio Spread', legs: 3 },
            { name: 'Diagonal Spread', legs: 2 },
            { name: 'Backspread', legs: 3 },
            { name: 'Long Call', legs: 1 },
          ].map((strategy) => (
            <div
              key={strategy.name}
              style={{
                background: 'var(--bg-1)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-0)', marginBottom: '4px' }}>
                {strategy.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-2)' }}>
                {strategy.legs} {strategy.legs === 1 ? 'leg' : 'legs'}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          padding: 'clamp(60px, 8vw, 100px) 24px',
          background: 'var(--bg-1)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: '40px',
              textAlign: 'center',
              color: 'var(--text-0)',
            }}
          >
            How It Works
          </h2>

          <div style={{ display: 'grid', gap: '20px' }}>
            {[
              {
                step: '01',
                title: 'Choose Your Strategy',
                desc: 'Select from pre-built strategies or create a custom multi-leg position.',
              },
              {
                step: '02',
                title: 'Log All Legs',
                desc: 'Enter calls, puts, entry prices, and quantities for each leg.',
              },
              {
                step: '03',
                title: 'See Your Greeks',
                desc: 'TradVue calculates delta, gamma, theta, vega for the entire position.',
              },
              {
                step: '04',
                title: 'Analyze & Learn',
                desc: 'See P&L by strategy type. Find what works. Discard what doesn\'t.',
              },
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  display: 'flex',
                  gap: '20px',
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '20px',
                }}
              >
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    color: 'var(--accent)',
                    flexShrink: 0,
                  }}
                >
                  {item.step}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-0)' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'clamp(60px, 8vw, 100px) 24px', maxWidth: '800px', margin: '0 auto' }}>
        <h2
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            marginBottom: '32px',
            textAlign: 'center',
            color: 'var(--text-0)',
          }}
        >
          Why Greeks Matter
        </h2>

        <p style={{ fontSize: '15px', color: 'var(--text-1)', lineHeight: 1.7, marginBottom: '24px' }}>
          Most options traders ignore the Greeks and trade by feel. The Greeks tell you exactly what you're risking:
        </p>

        <div style={{ display: 'grid', gap: '16px' }}>
          {[
            {
              greek: 'Delta',
              meaning: 'How much your position moves with the underlying. Delta 0.5 = $50 move per $100 stock move.',
            },
            {
              greek: 'Gamma',
              meaning: 'How fast delta changes. High gamma = more risk but more flexibility.',
            },
            {
              greek: 'Theta',
              meaning: 'Time decay. How much you make (or lose) every day if nothing else changes.',
            },
            {
              greek: 'Vega',
              meaning: 'Volatility sensitivity. How much you make/lose if IV changes.',
            },
          ].map((item) => (
            <div
              key={item.greek}
              style={{
                background: 'var(--bg-1)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px' }}>
                {item.greek}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
                {item.meaning}
              </p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.7, marginTop: '24px' }}>
          TradVue calculates all four Greeks for your position. Trade with confidence, not guesses.
        </p>
      </section>

      <section
        style={{
          padding: 'clamp(60px, 8vw, 100px) 24px',
          background: 'var(--bg-1)',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: '2.2rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: '16px',
              color: 'var(--text-0)',
            }}
          >
            Stop Guessing. Start Understanding Your Options Trades
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-2)', marginBottom: '32px', lineHeight: 1.6 }}>
            TradVue gives you the math. Greeks, P&L, strategy performance. Trade smarter.
          </p>
          <Link
            href="/#signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '16px 40px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            Try Options Journaling
          </Link>
        </div>
      </section>

      <section style={{ padding: '60px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-1)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '24px', color: 'var(--text-0)' }}>
            You Might Also Like
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {[
              { href: '/journal', title: 'Start Journaling', desc: 'Open the trading journal app', emoji: '📓' },
              { href: '/tools', title: 'Options Calculator', desc: 'Calculate Greeks with Black-Scholes', emoji: '⚡' },
              { href: '/best-trading-journal', title: 'Best Trading Journal', desc: 'Why TradVue works for options traders', emoji: '🏆' },
              { href: '/trading-calculators', title: 'All Calculators', desc: '30+ free trading tools and calculators', emoji: '🔢' },
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', textDecoration: 'none', display: 'block' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{item.emoji}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.4 }}>{item.desc}</div>
              </Link>
            ))}
          </div>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-1)' }}>Related Guides</h3>
          <ul style={{ listStyle: 'none', display: 'grid', gap: '8px', margin: 0, padding: 0 }}>
            {[
              { href: '/best-trading-journal', text: 'Best Trading Journal for Day Traders 2026' },
              { href: '/trading-calculators', text: '30+ Free Trading Calculators — Position Size, Greeks' },
              { href: '/post-trade-ritual', text: 'Post-Trade Ritual — Build Your Daily Habit' },
              { href: '/futures-trading-journal', text: 'Futures Trading Journal — NQ, ES, CL' },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '14px' }}>
                  → {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer style={{ padding: '40px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-1)', textAlign: 'center', fontSize: '12px', color: 'var(--text-3)' }}>
        <p style={{ margin: '8px 0' }}>© 2026 TradVue. Not financial advice. Trading involves risk.</p>
        <p style={{ margin: '8px 0' }}>
          <Link href="/legal/disclaimer" style={{ color: 'var(--text-2)', textDecoration: 'none' }}>
            Disclaimer
          </Link>
          {' • '}
          <Link href="/legal/privacy" style={{ color: 'var(--text-2)', textDecoration: 'none' }}>
            Privacy
          </Link>
        </p>
      </footer>
    </div>
  )
}
