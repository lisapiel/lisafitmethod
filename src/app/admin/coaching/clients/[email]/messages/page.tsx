"use client"

import { useState, useEffect, useRef, useCallback, use } from "react"
import { coachThreadId } from "@/lib/coachThreadKey"
import { fetchAuthSession } from "aws-amplify/auth"
import { attachmentKeys, SignedImage } from "@/components/coaching/NutritionComposer.client"

const gold = "var(--ca-accent-mark)"
const border = "var(--ca-line)"
const cream = "var(--ca-text)"
const muted = "var(--ca-muted)"
const ADMIN_EMAILS = new Set(["lisa.p.mcpherson@gmail.com", "contact@lisafitmethod.com"])

type NutritionKind = "nutrition-meal" | "nutrition-day" | "nutrition-question"
const NUTRITION_KIND_LABEL: Record<NutritionKind, string> = {
  "nutrition-meal": "Nutrition · Meal",
  "nutrition-day": "Nutrition · Day of eating",
  "nutrition-question": "Nutrition · Question",
}

type Message = {
  id: string
  fromEmail: string
  body: string
  sentAt: string
  readAt: string | null
  kind?: NutritionKind
  attachmentS3Keys?: string
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
  const threadId = coachThreadId(clientEmail)

  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState("")
  const [clientName, setClientName] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch(`/api/admin/coaching/messages/${encodeURIComponent(threadId)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setMessages(
        (data.messages ?? []).map((m: Record<string, unknown>) => ({
          id: m.id as string,
          fromEmail: m.fromEmail as string,
          body: m.body as string,
          sentAt: m.sentAt as string,
          readAt: (m.readAt as string | null) ?? null,
          kind: (m.kind as NutritionKind | undefined) ?? undefined,
          attachmentS3Keys: (m.attachmentS3Keys as string | undefined) ?? undefined,
        }))
      )
    } catch { /* handled by layout */ }
  }, [threadId])

  useEffect(() => {
    async function init() {
      try {
        const session = await fetchAuthSession()
        const accessToken = session.tokens?.accessToken?.toString() ?? ""
        setToken(accessToken)
        if (!accessToken) return

        // Fetch client name
        const clientsRes = await fetch("/api/admin/coaching/clients", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (clientsRes.ok) {
          const data = await clientsRes.json()
          const match = (data.clients ?? []).find(
            (c: { email: string; displayName: string }) => c.email.toLowerCase() === clientEmail.toLowerCase()
          )
          if (match) setClientName(match.displayName)
        }

        await loadMessages(accessToken)
      } catch { /* handled by layout */ }
      setLoading(false)
    }
    init()
  }, [clientEmail, loadMessages])

  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => loadMessages(token), 30_000)
    const onFocus = () => loadMessages(token)
    window.addEventListener("focus", onFocus)
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus) }
  }, [token, loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  async function send() {
    if (!input.trim() || !token) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/coaching/messages/${encodeURIComponent(threadId)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ body: input.trim(), toEmail: clientEmail }),
      })
      if (res.ok) {
        setInput("")
        await loadMessages(token)
      }
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
    <div style={{ minHeight: "min(70vh, 640px)", background: "var(--ca-surface)", color: cream, fontFamily: "var(--font-montserrat), sans-serif", display: "flex", flexDirection: "column" }}>
      {loading ? <Spinner /> : (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem clamp(12px, 3vw, 2rem) 1rem", minHeight: 0 }}>
            {messages.length === 0 ? (
              <div style={{ background: "var(--ca-raised)", border: `1px solid ${border}`, borderRadius: 8, padding: "3rem", textAlign: "center", marginTop: "1rem" }}>
                <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.2rem", color: muted }}>No messages yet in this thread</p>
              </div>
            ) : (
              <>
                {grouped.map((group) => (
                  <div key={group.date}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "1.5rem 0 1rem" }}>
                      <div style={{ flex: 1, height: 1, background: border }} />
                      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted, letterSpacing: "0.08em", flexShrink: 0 }}>{group.date}</span>
                      <div style={{ flex: 1, height: 1, background: border }} />
                    </div>
                    {group.messages.map((msg) => {
                      const isCoach = ADMIN_EMAILS.has(msg.fromEmail.toLowerCase())
                      const imageKeys = attachmentKeys(msg.attachmentS3Keys)
                      const kindLabel = msg.kind ? NUTRITION_KIND_LABEL[msg.kind] : null
                      return (
                        <div key={msg.id} style={{ display: "flex", justifyContent: isCoach ? "flex-end" : "flex-start", marginBottom: "0.75rem" }}>
                          {!isCoach && (
                            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--ca-line)", border: `1.5px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>
                              <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, color: muted }}>
                                {(clientName || clientEmail).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div style={{ maxWidth: "70%" }}>
                            <div style={{
                              background: isCoach ? gold : "var(--ca-line)",
                              color: isCoach ? "var(--ca-surface)" : cream,
                              borderRadius: isCoach ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                              padding: "0.6rem 0.9rem",
                              fontFamily: "var(--font-montserrat), sans-serif",
                              fontSize: "0.875rem",
                              lineHeight: 1.55,
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                            }}>
                              {kindLabel && (
                                <p style={{
                                  fontFamily: "var(--font-montserrat), sans-serif",
                                  fontSize: "0.75rem", fontWeight: 700,
                                  letterSpacing: "0.16em", textTransform: "uppercase",
                                  color: isCoach ? "var(--ca-accent-tint)" : gold,
                                  margin: "0 0 6px",
                                }}>
                                  {kindLabel}
                                </p>
                              )}
                              {imageKeys.length > 0 && (
                                <div style={{ display: "grid", gridTemplateColumns: imageKeys.length === 1 ? "1fr" : "repeat(auto-fit, minmax(140px, 1fr))", gap: 6, marginBottom: msg.body ? 8 : 0 }}>
                                  {imageKeys.map((k) => (
                                    <div key={k} style={{ borderRadius: 6, overflow: "hidden", background: "rgba(0,0,0,0.35)", aspectRatio: imageKeys.length === 1 ? "auto" : "4 / 3" }}>
                                      <SignedImage
                                        s3Key={k}
                                        style={{ width: "100%", height: "100%", display: "block", maxHeight: 360, objectFit: "cover" }}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}
                              {msg.body && <>{msg.body}</>}
                            </div>
                            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted, margin: "3px 4px 0", textAlign: isCoach ? "right" : "left" }}>
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
          <div style={{ background: "var(--ca-raised)", borderTop: `1px solid ${border}`, padding: "1rem 2rem", display: "flex", gap: 10, alignItems: "flex-end", flexShrink: 0 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${clientName || clientEmail}… (Enter to send)`}
              rows={1}
              style={{
                flex: 1, background: "var(--ca-surface)", border: `1px solid ${border}`, borderRadius: 6,
                padding: "0.65rem 0.875rem", fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.875rem", color: cream, resize: "none", outline: "none",
                lineHeight: 1.5, maxHeight: 120, overflowY: "auto",
              }}
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              style={{
                background: input.trim() ? gold : "var(--ca-line)", border: "none", borderRadius: 6,
                width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: input.trim() ? "pointer" : "not-allowed", flexShrink: 0, transition: "background 0.15s",
              }}
            >
              {sending ? (
                <div style={{ width: 14, height: 14, border: `2px solid var(--ca-muted)`, borderTop: `2px solid var(--ca-surface)`, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8l10-6-3 6 3 6-10-6Z" fill={input.trim() ? "var(--ca-surface)" : "var(--ca-muted)"} />
                </svg>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
