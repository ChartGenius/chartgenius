'use client'

import { useEffect, useState } from 'react'
import { useOnboarding } from '../context/OnboardingContext'

export default function WelcomeModal() {
  const { showWelcome, markWelcomeSeen } = useOnboarding()
  const [visible, setVisible] = useState(false)

  // Slight delay so the app settles first
  useEffect(() => {
    if (showWelcome) {
      const t = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(t)
    }
  }, [showWelcome])

  if (!visible) return null

  const handleStart = () => {
    setVisible(false)
    markWelcomeSeen()
  }

  return (
    <>
      <div className="welcome-backdrop" onClick={handleStart} aria-hidden="true" />
      <div
        className="welcome-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-headline"
      >
        {/* Chart animation */}
        <div className="welcome-chart-icon" aria-hidden="true">
          <svg width="64" height="48" viewBox="0 0 64 48" fill="none">
            <polyline
              points="4,40 16,28 24,34 36,14 48,20 60,6"
              stroke="var(--green)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="welcome-chart-line"
            />
            {[4,16,24,36,48,60].map((x, i) => {
              const ys = [40,28,34,14,20,6]
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={ys[i]}
                  r="3"
                  fill="var(--green)"
                  className="welcome-chart-dot"
                  style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                />
              )
            })}
            {/* Trend arrow */}
            <path
              d="M56 4 L60 6 L58 10"
              stroke="var(--green)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 id="welcome-headline" className="welcome-headline">
          Track Any Stock in Seconds
        </h1>

        <p className="welcome-subheading">
          Get alerts. See trends. Trade smarter.
        </p>

        <button
          className="welcome-cta"
          onClick={handleStart}
          autoFocus
        >
          Let's Get Started →
        </button>

        <button
          className="welcome-skip"
          onClick={handleStart}
          aria-label="Skip onboarding"
        >
          Skip for now
        </button>
      </div>
    </>
  )
}
