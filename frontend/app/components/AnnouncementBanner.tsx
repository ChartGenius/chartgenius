'use client'

import { useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://tradvue-api.onrender.com'

interface Announcement {
  id: string
  message: string
  type: 'info' | 'warning' | 'success'
  expires_at: string | null
  created_at: string
}

const COLORS = {
  info:    { bg: 'rgba(74,158,255,0.12)', border: 'rgba(74,158,255,0.35)', text: '#4a9eff', icon: 'ℹ' },
  warning: { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', text: '#f97316', icon: '⚠' },
  success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', text: '#22c55e', icon: '✓' },
}

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/announcements`)
      .then(r => r.json())
      .then(({ announcement: a }) => {
        if (!a) return
        // Check if already dismissed
        try {
          const dismissed = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]')
          if (dismissed.includes(a.id)) return
        } catch {}
        setAnnouncement(a)
      })
      .catch(() => {})
  }, [])

  const dismiss = () => {
    if (!announcement) return
    try {
      const existing = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]')
      existing.push(announcement.id)
      localStorage.setItem('dismissed_announcements', JSON.stringify(existing.slice(-20)))
    } catch {}
    setDismissed(true)
  }

  if (!announcement || dismissed) return null

  const c = COLORS[announcement.type] || COLORS.info

  return (
    <div style={{
      background: c.bg,
      borderBottom: `1px solid ${c.border}`,
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      position: 'relative',
      zIndex: 100,
      fontSize: 14,
      color: c.text,
    }}>
      <span style={{ fontWeight: 600 }}>{c.icon}</span>
      <span style={{ color: 'var(--text-0)', flex: 1, textAlign: 'center' }}>{announcement.message}</span>
      <button
        onClick={dismiss}
        aria-label="Dismiss announcement"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-2)', padding: '2px 6px', borderRadius: 4, fontSize: 16,
          lineHeight: 1, flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
