'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

// Lazy-load to keep initial bundle lean
const WelcomeModal = dynamic(() => import('./WelcomeModal'), { ssr: false })
const OnboardingChecklist = dynamic(() => import('./OnboardingChecklist'), { ssr: false })

/**
 * Renders all onboarding UI that lives outside the main page layout.
 * Only shows on the dashboard (/) — not on other pages.
 */
export default function OnboardingOverlay() {
  const pathname = usePathname()
  const isDashboard = pathname === '/'

  return (
    <>
      {isDashboard && <WelcomeModal />}
      {isDashboard && <OnboardingChecklist />}
    </>
  )
}
