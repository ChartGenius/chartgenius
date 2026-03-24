import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import TickerBar from '../app/components/TickerBar'

describe('TickerBar loading and fallback states', () => {
  it('does not render fallback snapshot prices while live data is still loading', () => {
    render(
      <TickerBar
        tickerQuotes={{}}
        customSymbols={[]}
        isLoading
      />
    )

    expect(screen.getByText(/Connecting to live data/i)).toBeInTheDocument()
    expect(screen.queryByText(/market snapshot/i)).not.toBeInTheDocument()
    expect(screen.queryByText('S&P 500')).not.toBeInTheDocument()
  })

  it('shows a clearly labeled fallback snapshot after loading finishes with no quote data', () => {
    render(
      <TickerBar
        tickerQuotes={{}}
        customSymbols={[]}
        isLoading={false}
      />
    )

    expect(screen.getByText(/Live data temporarily unavailable/i)).toBeInTheDocument()
    expect(screen.getAllByText('S&P 500').length).toBeGreaterThan(0)
  })
})
