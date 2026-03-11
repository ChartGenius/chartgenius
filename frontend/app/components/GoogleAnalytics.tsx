'use client'

/**
 * GoogleAnalytics.tsx
 *
 * Loads GA4 only in production and only when the user has granted analytics
 * consent (localStorage key: cg_analytics_consent).
 *
 * Page-view events are fired on every client-side route change via
 * next/navigation's `usePathname`.
 *
 * Env var: NEXT_PUBLIC_GA_MEASUREMENT_ID (e.g. G-XXXXXXXXXX)
 */

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

const CONSENT_KEY = 'cg_analytics_consent'

function hasConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(CONSENT_KEY) === 'true'
  } catch {
    return false
  }
}

/** Send a page_view hit on SPA route changes */
function GoogleAnalyticsPageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!GA_ID || !hasConsent()) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    if (typeof w.gtag !== 'function') return
    w.gtag('config', GA_ID, {
      page_path: pathname,
    })
  }, [pathname])

  return null
}

export default function GoogleAnalytics() {
  // Only render in production and when a measurement ID is configured
  if (!GA_ID || process.env.NODE_ENV !== 'production') {
    return null
  }

  return (
    <>
      {/* Load the GA4 gtag.js library */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />

      {/* Initialize GA4 — respect consent before sending data */}
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          // Check consent before configuring GA4
          var hasConsent = false;
          try { hasConsent = localStorage.getItem('${CONSENT_KEY}') === 'true'; } catch(e) {}

          if (hasConsent) {
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          } else {
            // Set default consent state — wait for user to grant
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied'
            });
          }

          // Listen for consent changes from CookieConsent component
          window.addEventListener('storage', function(e) {
            if (e.key !== '${CONSENT_KEY}') return;
            if (e.newValue === 'true') {
              gtag('consent', 'update', { analytics_storage: 'granted' });
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure'
              });
            } else {
              gtag('consent', 'update', { analytics_storage: 'denied' });
            }
          });
        `}
      </Script>

      {/* SPA route change tracker */}
      <GoogleAnalyticsPageTracker />
    </>
  )
}
