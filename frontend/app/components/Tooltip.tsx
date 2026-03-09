'use client'

import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  text: string
  /** 'top' | 'bottom' | 'left' | 'right' — default 'top' */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Override the trigger element (default: ℹ️ circle) */
  children?: React.ReactNode
}

/**
 * Reusable Tooltip component — shows a popover on hover.
 * Usage:  <Tooltip text="Explanation here" />
 */
export default function Tooltip({ text, position = 'top', children }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  // Close on click-outside (for mobile)
  useEffect(() => {
    if (!visible) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setVisible(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [visible])

  const popoverStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 9999,
    background: '#1e2030',
    border: '1px solid rgba(99,102,241,0.4)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    color: 'var(--text-1, #e2e8f0)',
    lineHeight: 1.5,
    width: 240,
    maxWidth: '80vw',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    pointerEvents: 'none',
    whiteSpace: 'normal',
    ...(position === 'top'    ? { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' } : {}),
    ...(position === 'bottom' ? { top:    'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' } : {}),
    ...(position === 'left'   ? { right:  'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' } : {}),
    ...(position === 'right'  ? { left:   'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' } : {}),
  }

  return (
    <span
      ref={ref}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible(v => !v)}
    >
      {children ?? (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 15,
          height: 15,
          borderRadius: '50%',
          background: 'rgba(99,102,241,0.2)',
          border: '1px solid rgba(99,102,241,0.4)',
          color: '#818cf8',
          fontSize: 9,
          fontWeight: 700,
          cursor: 'help',
          flexShrink: 0,
          marginLeft: 4,
          lineHeight: 1,
          userSelect: 'none',
        }}>?</span>
      )}
      {visible && (
        <span style={popoverStyle}>
          {text}
        </span>
      )}
    </span>
  )
}
