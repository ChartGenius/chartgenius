'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useOnboarding } from '../context/OnboardingContext'

interface Props {
  id: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  children: ReactNode
  delayMs?: number
}

/**
 * Wraps a UI element and shows a one-time tooltip for new users.
 * Uses CSS-only tooltip rendering (no external library).
 * Hides after 4 seconds or when user clicks "Got it".
 */
export default function OnboardingTooltip({
  id,
  content,
  position = 'bottom',
  children,
  delayMs = 2000,
}: Props) {
  const { shouldShowTooltips, hasSeenTooltip, markTooltipSeen } = useOnboarding()
  const [visible, setVisible] = useState(false)

  const shouldShow = shouldShowTooltips && !hasSeenTooltip(id)

  useEffect(() => {
    if (!shouldShow) return

    // Delay before showing (let UI settle, avoid jarring pop-in)
    const showTimer = setTimeout(() => setVisible(true), delayMs)
    return () => clearTimeout(showTimer)
  }, [shouldShow, delayMs])

  // Auto-hide after 5 seconds
  useEffect(() => {
    if (!visible) return
    const hideTimer = setTimeout(() => dismiss(), 5000)
    return () => clearTimeout(hideTimer)
  }, [visible])

  const dismiss = () => {
    setVisible(false)
    markTooltipSeen(id)
  }

  if (!shouldShow) return <>{children}</>

  return (
    <span className={`ob-tooltip-wrap ob-tooltip-wrap-${position}`}>
      {children}
      {visible && (
        <span
          className={`ob-tooltip ob-tooltip-${position}`}
          role="tooltip"
          id={`tooltip-${id}`}
        >
          <span className="ob-tooltip-arrow" aria-hidden="true" />
          <span className="ob-tooltip-content">{content}</span>
          <button
            className="ob-tooltip-dismiss"
            onClick={e => { e.stopPropagation(); dismiss() }}
            aria-label="Dismiss tip"
          >
            Got it
          </button>
        </span>
      )}
    </span>
  )
}
