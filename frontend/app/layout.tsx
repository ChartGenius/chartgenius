import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChartGenius — Real-Time Market Intelligence',
  description: 'Live market data, news feed, economic calendar and market movers for active traders',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
