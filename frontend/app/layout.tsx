import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { OnboardingProvider } from './context/OnboardingContext'
import OnboardingOverlay from './components/OnboardingOverlay'

export const metadata: Metadata = {
  title: 'ChartGenius — Real-Time Market Intelligence',
  description: 'Live market data, news feed, economic calendar and market movers for active traders',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="theme-dark">
      <body>
        <SettingsProvider>
          <AuthProvider>
            <OnboardingProvider>
              {children}
              <OnboardingOverlay />
            </OnboardingProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
