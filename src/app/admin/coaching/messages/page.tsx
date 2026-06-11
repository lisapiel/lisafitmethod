"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import Link from "next/link"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"

type ThreadSummary = {
  threadId: string
  clientEmail: string
  clientName: string
  lastMessage: string
  lastAt: string
  unreadCount: number
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
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

export default function AdminMessagesPage() {
  const [loading, setLoading] = useState(true)
  const [threads, setThreads] = useState<ThreadSummary[]>([])

  const loadThreads = useCallback(async () => {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) return
      const res = await fetch("/api/admin/coaching/messages", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      setThreads(data.threads ?? [])
    } catch { /* handled by layout */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadThreads()
    const interval = setInterval(loadThreads, 30_000)
    const onFocus = () => loadThreads()
    window.addEventListener("focus", onFocus)
    return () => { clearInterval(interval); window.removeEventListener("focus", onFocus) }
  }, [loadThreads])

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0)

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, padding: "2.5rem 2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/admin/coaching" style={{ color: muted, fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1rem" }}>
            ← Coaching
          </Link>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2.2rem", fontWeight: 700, color: cream, margin: 0 }}>
            Messages
            {totalUnread > 0 && (
              <span style={{ marginLeft: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: gold, color: "#111", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", fontWeight: 700, verticalAlign: "middle" }}>
                {totalUnread}
              </span>
            )}
          </h1>
        </div>

        {loading ? <Spinner /> : threads.length === 0 ? (
          <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "3rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", color: muted }}>No messages yet</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {threads.map((t) => (
              <Link
                key={t.clientEmail}
                href={`/admin/coaching/clients/${encodeURIComponent(t.clientEmail)}/messages`}
                style={{
                  background: "#161616",
                  border: `1px solid ${t.unreadCount > 0 ? "#4a3820" : border}`,
                  borderRadius: 8,
                  padding: "1rem 1.25rem",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                  background: t.unreadCount > 0 ? `${gold}20` : "#2a2a2a",
                  border: `1.5px solid ${t.unreadCount > 0 ? gold : border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 700, color: t.unreadCount > 0 ? gold : muted }}>
                    {t.clientName.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.875rem", fontWeight: t.unreadCount > 0 ? 700 : 500, color: t.unreadCount > 0 ? cream : "#ccc" }}>
                      {t.clientName}
                    </span>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: muted, flexShrink: 0 }}>
                      {timeAgo(t.lastAt)}
                    </span>
                  </div>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: t.unreadCount > 0 ? "#ccc" : muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.lastMessage}
                  </p>
                </div>

                {t.unreadCount > 0 && (
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: gold, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, color: "#111" }}>{t.unreadCount}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
