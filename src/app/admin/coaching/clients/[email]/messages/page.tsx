"use client"

import { useState, useEffect, useRef, useCallback, use } from "react"
import { fetchUserAttributes } from "aws-amplify/auth"
import { generateClient } from "aws-amplify/data"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"
const COACH_EMAIL = "lisa.p.mcpherson@gmail.com"

type Message = {
  id: string
  fromEmail: string
  body: string
  sentAt: string
  readAt: string | null
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
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
      <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function AdminClientMessagesPage({ params }: { params: Promise<{ email: string }> }) {
  const { email: encodedEmail } = use(params)
  const clientEmail = decodeURIComponent(encodedEmail)
  const threadId = [clientEmail, COACH_EMAIL].sort().join("_")

  const [loading, setLoading] = useState(true)
  const [clientName, setClientName] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async () => {
    try {
      const db = generateClient<Schema>({ authMode: "userPool" })
      const { data } = await db.models.CoachingMessage.list({ authMode: "userPool" })
      const thread = data
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => a.sentAt.localeCompare(b.sentAt))
        .map((m) => ({ id: m.id, fromEmail: m.fromEmail, body: m.body, sentAt: m.sentAt, readAt: m.readAt ?? null }))
      setMessages(thread)

      // Mark client's messages as read
      const unread = data.filter((m) => m.threadId === threadId && m.toEmail === COACH_EMAIL && !m.readAt)
      if (unread.length > 0) {
        const now = new Date().toISOString()
        await Promise.all(unread.map((m) => db.models.CoachingMessage.update({ id: m.id, readAt: now })))
      }
    } catch { /* handled by layout */ }
  }, [threadId])

  useEffect(() => {
    async function init() {
      try {
        const db = generateClient<Schema>({ authMode: "userPool" })
        const { data: clients } = await db.models.CoachingClient.list({ authMode: "userPool" })
        const match = clients.find((c) => c.email.toLowerCase() === clientEmail.toLowerCase())
        if (match) setClientName(match.displayName)
      } catch { /* handled by layout */ }
      await loadMessages()
      setLoading(false)
    }
    init()
  }, [clientEmail, loadMessages])

  useEffect(() => {
    const interval = setInterval(loadMessages, 30_000)
    const onFocus = () => loadMessages()
    window.addEventListener("focus", onFocus)
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus) }
  }, [loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  async function send() {
    if (!input.trim()) return
    setSending(true)
    try {
      const coachEmail = (await fetchUserAttributes()).email ?? COACH_EMAIL
      const db = generateClient<Schema>({ authMode: "userPool" })
      await db.models.CoachingMessage.create({
        threadId,
        fromEmail: coachEmail,
        toEmail: clientEmail,
        body: input.trim(),
        sentAt: new Date().toISOString(),
      })
      setInput("")
      await loadMessages()
    } catch (err) {
      console.error(err)
    }
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  }

  // Group by date
  const grouped: { date: string; messages: Message[] }[] = []
  for (const msg of messages) {
    const dateLabel = new Date(msg.sentAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    const last = grouped[grouped.length - 1]
    if (last && last.date === dateLabel) last.messages.push(msg)
    else grouped.push({ date: dateLabel, messages: [msg] })
  }

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, fontFamily: "var(--font-montserrat), sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "2rem 2rem 1rem", flexShrink: 0 }}>
        <Link href="/admin/coaching/messages" style={{ color: muted, fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1.25rem" }}>
          ← Messages
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, margin: "0 0 4px" }}>Thread</p>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 700, color: cream, margin: 0 }}>
              {clientName || clientEmail}
            </h1>
          </div>
          <Link
            href={`/admin/coaching/clients/${encodedEmail}`}
            style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: muted, textDecoration: "none", border: `1px solid ${border}`, padding: "6px 14px", borderRadius: 4 }}
          >
            View Profile →
          </Link>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 2rem 1rem", minHeight: 0 }}>
            {messages.length === 0 ? (
              <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "3rem", textAlign: "center", marginTop: "1rem" }}>
                <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.2rem", color: muted }}>No messages yet in this thread</p>
              </div>
            ) : (
              <>
                {grouped.map((group) => (
                  <div key={group.date}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "1.5rem 0 1rem" }}>
                      <div style={{ flex: 1, height: 1, background: border }} />
                      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: muted, letterSpacing: "0.08em", flexShrink: 0 }}>{group.date}</span>
                      <div style={{ flex: 1, height: 1, background: border }} />
                    </div>
                    {group.messages.map((msg) => {
                      const isCoach = msg.fromEmail === COACH_EMAIL
                      return (
                        <div key={msg.id} style={{ display: "flex", justifyContent: isCoach ? "flex-end" : "flex-start", marginBottom: "0.75rem" }}>
                          {!isCoach && (
                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#2a2a2a", border: `1.5px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>
                              <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, color: muted }}>
                                {(clientName || clientEmail).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div style={{ maxWidth: "70%" }}>
                            <div style={{
                              background: isCoach ? gold : "#222",
                              color: isCoach ? "#111" : cream,
                              borderRadius: isCoach ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                              padding: "0.6rem 0.9rem",
                              fontFamily: "var(--font-montserrat), sans-serif",
                              fontSize: "0.875rem",
                              lineHeight: 1.55,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}>
                              {msg.body}
                            </div>
                            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: muted, margin: "3px 4px 0", textAlign: isCoach ? "right" : "left" }}>
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
          <div style={{ background: "#161616", borderTop: `1px solid ${border}`, padding: "1rem 2rem", display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${clientName || clientEmail}… (Enter to send)`}
              rows={1}
              style={{
                flex: 1,
                background: "#111",
                border: `1px solid ${border}`,
                borderRadius: 6,
                padding: "0.65rem 0.875rem",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.875rem",
                color: cream,
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
                background: input.trim() ? gold : "#2a2a2a",
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
                <div style={{ width: 14, height: 14, border: `2px solid #888`, borderTop: `2px solid #111`, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8l10-6-3 6 3 6-10-6Z" fill={input.trim() ? "#111" : "#444"} />
                </svg>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
