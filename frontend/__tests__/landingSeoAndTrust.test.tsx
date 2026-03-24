import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import LandingPage from '../app/landing/page'

beforeAll(() => {
  class MockIntersectionObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver,
  })
})

describe('Landing page trust content', () => {
  it('does not publish fake aggregateRating structured data', () => {
    const { container } = render(<LandingPage />)
    const jsonLd = container.querySelector('script[type="application/ld+json"]')

    expect(jsonLd).toBeInTheDocument()
    expect(jsonLd?.innerHTML).not.toContain('aggregateRating')
    expect(jsonLd?.innerHTML).not.toContain('ratingValue')
    expect(jsonLd?.innerHTML).not.toContain('ratingCount')
  })

  it('replaces testimonial quotes with neutral product trust content', () => {
    render(<LandingPage />)

    expect(screen.queryByText(/Alex T\./i)).not.toBeInTheDocument()
    expect(screen.queryByText(/CryptoMayaR/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Built for real workflows/i)).toBeInTheDocument()
    expect(screen.getByText(/Privacy-first by design/i)).toBeInTheDocument()
  })

  it('gives returning users a clear sign-in path without hardcoded NEW badges', () => {
    render(<LandingPage />)

    const signInLinks = screen.getAllByRole('link', { name: /sign in/i })
    expect(signInLinks.length).toBeGreaterThan(0)
    signInLinks.forEach(link => expect(link).toHaveAttribute('href', '/?signup=true'))
    expect(screen.queryByText(/^NEW$/i)).not.toBeInTheDocument()
  })

  it('keeps landing free-tier bullets aligned with the actual free-account rules', () => {
    render(<LandingPage />)

    expect(screen.getByText(/3-week full-feature trial/i)).toBeInTheDocument()
    expect(screen.getByText(/Trading journal and portfolio with a 30-day rolling view after trial/i)).toBeInTheDocument()
    expect(screen.getByText(/Up to 3 price alerts/i)).toBeInTheDocument()
    expect(screen.queryByText(/15-min delay/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/up to 5 lists/i)).not.toBeInTheDocument()
  })

  it('positions TradVue as a broader trader workflow instead of only market intelligence', () => {
    render(<LandingPage />)

    expect(screen.getByRole('heading', { name: /The Trader Operating System Built for Review and Execution/i })).toBeInTheDocument()
    expect(screen.getByText(/Journal trades, track portfolio and prop firm rules, use built-in tools, keep your ritual tight, and use market intel when it matters/i)).toBeInTheDocument()
    expect(screen.queryByText(/Real-Time Market Intelligence\. React Faster\./i)).not.toBeInTheDocument()
  })

  it('only shows verified community links in the landing footer', () => {
    render(<LandingPage />)

    expect(screen.getByLabelText('X')).toHaveAttribute('href', 'https://x.com/tradvue')
    expect(screen.getByLabelText('Telegram')).toHaveAttribute('href', 'https://t.me/tradvue')
    expect(screen.getByLabelText('Discord')).toHaveAttribute('href', 'https://discord.gg/tradvue')
    expect(screen.queryByLabelText('GitHub')).not.toBeInTheDocument()
  })
})
