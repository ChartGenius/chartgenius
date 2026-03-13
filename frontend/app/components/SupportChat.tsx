'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── Bot Avatar SVG ───────────────────────────────────────────────────────────

function BotAvatar({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #4a9eff 0%, #3b82f6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </div>
  )
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '4px 0' }}>
      <BotAvatar size={26} />
      <div
        style={{
          background: 'var(--bg-2, #1a1a24)',
          border: '1px solid var(--border, rgba(255,255,255,0.08))',
          borderRadius: '12px 12px 12px 3px',
          padding: '10px 14px',
          display: 'flex',
          gap: 5,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--text-3, rgba(255,255,255,0.3))',
              display: 'block',
              animation: 'supportChatTyping 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Chat Message Bubble ──────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8,
        flexDirection: isUser ? 'row-reverse' : 'row',
        padding: '2px 0',
      }}
    >
      {!isUser && <BotAvatar size={26} />}
      <div
        style={{
          maxWidth: '78%',
          padding: '10px 14px',
          borderRadius: isUser ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
          background: isUser
            ? '#4a9eff'
            : 'var(--bg-2, #1a1a24)',
          border: isUser
            ? 'none'
            : '1px solid var(--border, rgba(255,255,255,0.08))',
          color: isUser ? '#fff' : 'var(--text-0, #e0e0e8)',
          fontSize: 13.5,
          lineHeight: 1.6,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {msg.content}
      </div>
    </div>
  )
}

// ─── Main SupportChat Component ───────────────────────────────────────────────

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, isOpen])

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Show unread dot when closed and gets a message
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'assistant') setHasUnread(true)
    }
  }, [messages, isOpen])

  const handleOpen = () => {
    setIsOpen(true)
    setHasUnread(false)
  }

  const handleClose = () => setIsOpen(false)

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://tradvue-api.onrender.com'
      const res = await fetch(`${apiBase}/api/support/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-10),
        }),
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      const botMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply || "I'm having trouble connecting. Please email support@tradvue.com",
      }
      setMessages(prev => [...prev, botMsg])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please email support@tradvue.com and we'll get back to you within 24 hours.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, messages, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* ── Animation keyframes ── */}
      <style>{`
        @keyframes supportChatTyping {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes supportChatSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes supportChatPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.05); }
        }
      `}</style>

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div
          ref={chatRef}
          role="dialog"
          aria-label="TradVue Support Chat"
          style={{
            position: 'fixed',
            bottom: 88,
            right: 20,
            width: 'min(380px, calc(100vw - 24px))',
            height: 500,
            background: 'var(--bg-0, #0f0f12)',
            border: '1px solid var(--border, rgba(255,255,255,0.1))',
            borderRadius: 16,
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(74,158,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9000,
            animation: 'supportChatSlideUp 0.2s ease-out',
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #1a2744 0%, #0f1a33 100%)',
              borderBottom: '1px solid rgba(74,158,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexShrink: 0,
            }}
          >
            <BotAvatar size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e0e0e8', lineHeight: 1.2 }}>
                TradVue Support
              </div>
              <div style={{ fontSize: 11, color: '#4a9eff', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#22c55e',
                    display: 'inline-block',
                  }}
                />
                Online · Powered by AI
              </div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close chat"
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a0a0b0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ── Messages Area ── */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.1) transparent',
            }}
          >
            {/* Welcome message */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <BotAvatar size={26} />
              <div
                style={{
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: '12px 12px 12px 3px',
                  background: 'var(--bg-2, #1a1a24)',
                  border: '1px solid var(--border, rgba(255,255,255,0.08))',
                  color: 'var(--text-0, #e0e0e8)',
                  fontSize: 13.5,
                  lineHeight: 1.6,
                }}
              >
                👋 Hi! I'm TradVue Support. How can I help you today?
              </div>
            </div>

            {/* Chat history */}
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}

            {/* Typing indicator */}
            {isLoading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input Area ── */}
          <div
            style={{
              padding: '10px 12px',
              borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
              background: 'var(--bg-1, #13131a)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-end',
                background: 'var(--bg-2, #1a1a24)',
                border: '1px solid var(--border, rgba(255,255,255,0.1))',
                borderRadius: 10,
                padding: '6px 6px 6px 12px',
                transition: 'border-color 0.15s',
              }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = 'rgba(74,158,255,0.4)')}
              onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border, rgba(255,255,255,0.1))')}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question…"
                rows={1}
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-0, #e0e0e8)',
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                  resize: 'none',
                  maxHeight: 90,
                  overflowY: 'auto',
                  padding: '3px 0',
                  opacity: isLoading ? 0.5 : 1,
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: input.trim() && !isLoading ? '#4a9eff' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: input.trim() && !isLoading ? '#fff' : 'rgba(255,255,255,0.3)',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <p style={{ fontSize: 10.5, color: 'var(--text-3, rgba(255,255,255,0.3))', textAlign: 'center', marginTop: 6 }}>
              AI support · Complex issues? Email{' '}
              <a href="mailto:support@tradvue.com" style={{ color: '#4a9eff', textDecoration: 'none' }}>
                support@tradvue.com
              </a>
            </p>
          </div>
        </div>
      )}

      {/* ── Floating Chat Bubble ── */}
      <button
        onClick={isOpen ? handleClose : handleOpen}
        aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: isOpen
            ? 'rgba(74,158,255,0.9)'
            : '#4a9eff',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 24px rgba(74,158,255,0.4), 0 2px 8px rgba(0,0,0,0.4)',
          zIndex: 9001,
          transition: 'background 0.2s, transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.06)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(74,158,255,0.5), 0 2px 8px rgba(0,0,0,0.4)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(74,158,255,0.4), 0 2px 8px rgba(0,0,0,0.4)'
        }}
      >
        {/* Unread dot */}
        {hasUnread && !isOpen && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: '#ef4444',
              border: '2px solid #0f0f12',
              animation: 'supportChatPulse 2s ease-in-out infinite',
            }}
          />
        )}

        {/* Icon toggles between chat and X */}
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </>
  )
}
