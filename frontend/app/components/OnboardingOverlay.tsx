'use client'

import dynamic from 'next/dynamic'

// Lazy-load to keep initial bundle lean
const WelcomeModal = dynamic(() => import('./WelcomeModal'), { ssr: false })
const OnboardingChecklist = dynamic(() => import('./OnboardingChecklist'), { ssr: false })

/**
 * Renders all onboarding UI that lives outside the main page layout.
 * Dropped directly into the root layout.
 */
export default function OnboardingOverlay() {
  return (
    <>
      <WelcomeModal />
      <OnboardingChecklist />
    </>
  )
}
