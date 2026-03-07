import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { OnboardingProvider } from './context/OnboardingContext'
import OnboardingOverlay from './components/OnboardingOverlay'
import CookieConsent from './components/CookieConsent'

export const metadata: Metadata = {
  title: 'ChartGenius — Real-Time Market Intelligence',
  description: 'Live market data, news feed, economic calendar and market movers for active traders',
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="theme-dark">
      <body>
        {/* Google Analytics 4 — only load in production and when a GA ID is configured */}
        {GA_ID && process.env.NODE_ENV === 'production' && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true,
                  cookie_flags: 'SameSite=None;Secure'
                });
              `}
            </Script>
          </>
        )}

        <SettingsProvider>
          <AuthProvider>
            <OnboardingProvider>
              {children}
              <OnboardingOverlay />
              <CookieConsent />
            </OnboardingProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  )
}
