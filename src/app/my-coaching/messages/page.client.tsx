"use client"

import { useState, useEffect, useRef, useCallback } from "react"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"

type Message = {
  id: string
  fromEmail: string
  toEmail: string
  body: string
  sentAt: string
  readAt: string | null
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 24 * 60 * 60 * 1000) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return d.toLocaleDateString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function MessagesClient() {
  const [loading, setLoading] = useState(true)
  const [myEmail, setMyEmail] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/coaching/messages")
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages ?? [])
    } catch { /* network error */ }
  }, [])

  useEffect(() => {
    async function init() {
      // Get email from member access endpoint
      try {
        const res = await fetch("/api/member/access")
        const data = await res.json()
        if (data.email) setMyEmail(data.email)
      } catch { /* ignore */ }
      await loadMessages()
      setLoading(false)
    }
    init()
  }, [loadMessages])

  // Poll every 30s + on focus
  useEffect(() => {
    if (!myEmail) return
    const interval = setInterval(loadMessages, 30_000)
    const onFocus = () => loadMessages()
    window.addEventListener("focus", onFocus)
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus) }
  }, [myEmail, loadMessages])

  // Scroll to bottom when messages load/arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  async function send() {
    if (!input.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/coaching/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: input.trim() }),
      })
      if (res.ok) {
        setInput("")
        await loadMessages()
      }
    } catch { /* network error */ }
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  if (loading) return <Spinner />

  // Group messages by date
  const grouped: { date: string; messages: Message[] }[] = []
  for (const msg of messages) {
    const dateLabel = new Date(msg.sentAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    const last = grouped[grouped.length - 1]
    if (last && last.date === dateLabel) {
      last.messages.push(msg)
    } else {
      grouped.push({ date: dateLabel, messages: [msg] })
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 58px - 4rem)" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.25rem", flexShrink: 0 }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, margin: "0 0 4px" }}>Coaching</p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: black, margin: 0 }}>Messages with Lisa</h1>
      </div>

      {/* Thread */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        background: white,
        border: `1px solid ${border}`,
        borderRadius: "8px 8px 0 0",
        padding: "1.5rem 1.25rem",
        minHeight: 0,
      }}>
        {messages.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: "2rem" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${accent}18`, border: `1.5px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 4h16v11H13l-4 3.5V15H3V4Z" stroke={accent} strokeWidth="1.4" strokeLinejoin="round" /></svg>
            </div>
            <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.2rem", color: black, margin: "0 0 8px" }}>Start the conversation</p>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: 0, maxWidth: 280, lineHeight: 1.5 }}>
              Ask a question, share a win, or flag something. Lisa responds within 24–48 hours.
            </p>
          </div>
        ) : (
          <>
            {grouped.map((group) => (
              <div key={group.date}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "1.5rem 0 1rem" }}>
                  <div style={{ flex: 1, height: 1, background: border }} />
                  <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", color: muted, letterSpacing: "0.08em", flexShrink: 0 }}>{group.date}</span>
                  <div style={{ flex: 1, height: 1, background: border }} />
                </div>
                {group.messages.map((msg) => {
                  const isMe = myEmail ? msg.fromEmail.toLowerCase() === myEmail.toLowerCase() : false
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "0.75rem" }}>
                      {!isMe && (
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${accent}18`, border: `1.5px solid ${accent}`, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>
                          <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, color: accent }}>L</span>
                        </div>
                      )}
                      <div style={{ maxWidth: "72%" }}>
                        <div style={{
                          background: isMe ? black : "#f5f2ee",
                          color: isMe ? white : black,
                          borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                          padding: "0.6rem 0.9rem",
                          fontFamily: "var(--font-dm-sans), sans-serif",
                          fontSize: "0.875rem",
                          lineHeight: 1.55,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}>
                          {msg.body}
                        </div>
                        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", color: muted, margin: "3px 4px 0", textAlign: isMe ? "right" : "left" }}>
                          {formatTime(msg.sentAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Composer */}
      <div style={{
        background: white,
        border: `1px solid ${border}`,
        borderTop: "none",
        borderRadius: "0 0 8px 8px",
        padding: "0.75rem 1rem",
        display: "flex",
        gap: 10,
        alignItems: "flex-end",
        flexShrink: 0,
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Lisa… (Enter to send, Shift+Enter for new line)"
          rows={1}
          style={{
            flex: 1,
            background: "#faf8f5",
            border: `1px solid ${border}`,
            borderRadius: 6,
            padding: "0.6rem 0.75rem",
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: "0.875rem",
            color: black,
            resize: "none",
            outline: "none",
            lineHeight: 1.5,
            maxHeight: 120,
            overflowY: "auto",
          }}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          style={{
            background: input.trim() ? black : "#f0ece8",
            border: "none",
            borderRadius: 6,
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: input.trim() ? "pointer" : "not-allowed",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          {sending ? (
            <div style={{ width: 14, height: 14, border: `2px solid #888`, borderTop: `2px solid ${white}`, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8l10-6-3 6 3 6-10-6Z" fill={input.trim() ? white : "#aaa"} />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
