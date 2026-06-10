"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import Link from "next/link"
import type { CoachingApplication } from "@/lib/authTokens"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  PENDING: { color: gold, label: "Pending" },
  APPROVED: { color: "#5c9e6a", label: "Approved" },
  DECLINED: { color: "#d97460", label: "Declined" },
  PAID: { color: "#5c9e6a", label: "Paying ✓" },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  return `${days}d ago`
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <div style={{ width: 20, height: 20, border: `2px solid ${border}`, borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function AdminApplicationsPage() {
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<CoachingApplication[]>([])
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "DECLINED" | "PAID">("PENDING")
  const [acting, setActing] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const res = await fetch("/api/admin/coaching/applications", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json() as { applications: CoachingApplication[] }
      setApplications(data.applications ?? [])
    } catch { /* handled by layout */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function act(id: string, action: "approve" | "decline") {
    setActing(id)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const res = await fetch(`/api/admin/coaching/applications/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json() as { ok: boolean; error?: string; checkoutUrl?: string }
      if (!data.ok) {
        alert(data.error ?? "Something went wrong")
      } else {
        await load()
      }
    } catch { /* handled */ }
    setActing(null)
  }

  function copyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const filtered = filter === "ALL" ? applications : applications.filter((a) => a.status === filter)
  const pendingCount = applications.filter((a) => a.status === "PENDING").length

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, padding: "2.5rem 2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <div style={{ maxWidth: 840, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <Link href="/admin/coaching" style={{ color: muted, fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1rem" }}>
            ← Coaching
          </Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2.2rem", fontWeight: 700, color: cream, margin: 0 }}>
              Applications
              {pendingCount > 0 && (
                <span style={{ marginLeft: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: gold, color: "#111", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", fontWeight: 700, verticalAlign: "middle" }}>
                  {pendingCount}
                </span>
              )}
            </h1>
            <Link href="/admin/coaching/settings" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: muted, textDecoration: "none", border: `1px solid ${border}`, padding: "7px 14px", borderRadius: 4 }}>
              ⚙ Settings
            </Link>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {(["PENDING", "APPROVED", "PAID", "DECLINED", "ALL"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? gold : "transparent", border: `1px solid ${filter === f ? gold : border}`, color: filter === f ? "#111" : muted, padding: "6px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", fontWeight: filter === f ? 700 : 400, cursor: "pointer", borderRadius: 4 }}>
              {f === "PENDING" && pendingCount > 0 ? `Pending (${pendingCount})` : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "3rem", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.2rem", color: muted }}>
              {filter === "PENDING" ? "No pending applications" : "No applications"}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {filtered.map((app) => {
              const s = STATUS_STYLE[app.status] ?? { color: muted, label: app.status }
              return (
                <div key={app.id} style={{ background: "#161616", border: `1px solid ${app.status === "PENDING" ? "#4a3820" : border}`, borderRadius: 8, padding: "1.25rem 1.5rem" }}>
                  {/* Header row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.9rem", fontWeight: 600, color: cream }}>{app.name}</span>
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, color: s.color, border: `1px solid ${s.color}44`, padding: "2px 8px", borderRadius: 3 }}>{s.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: muted }}>{app.email}</span>
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: muted }}>{timeAgo(app.applicationDate)}</span>
                      </div>
                    </div>
                    {app.status === "PENDING" && (
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={() => act(app.id, "decline")}
                          disabled={acting === app.id}
                          style={{ background: "transparent", border: `1px solid ${border}`, color: "#d97460", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", cursor: "pointer", borderRadius: 4 }}
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => act(app.id, "approve")}
                          disabled={acting === app.id}
                          style={{ background: gold, border: "none", color: "#111", padding: "7px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", borderRadius: 4 }}
                        >
                          {acting === app.id ? "Sending…" : "Approve + Send Payment Link"}
                        </button>
                      </div>
                    )}
                    {(app.status === "APPROVED") && app.stripeCheckoutUrl && (
                      <button
                        onClick={() => copyUrl(app.stripeCheckoutUrl!, app.id)}
                        style={{ background: "transparent", border: `1px solid ${gold}44`, color: gold, padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", cursor: "pointer", borderRadius: 4 }}
                      >
                        {copiedId === app.id ? "Copied ✓" : "Copy Payment Link"}
                      </button>
                    )}
                  </div>

                  {/* Application details */}
                  <div style={{ display: "grid", gap: 8 }}>
                    {app.goals && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: gold, margin: "0 0 3px" }}>Goals</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: cream, margin: 0, lineHeight: 1.5 }}>{app.goals}</p>
                      </div>
                    )}
                    {app.currentFitnessLevel && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, margin: "0 0 3px" }}>Current Level</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: "#bbb", margin: 0 }}>{app.currentFitnessLevel}</p>
                      </div>
                    )}
                    {app.whyCoaching && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, margin: "0 0 3px" }}>Why Coaching</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: "#bbb", margin: 0, lineHeight: 1.5 }}>{app.whyCoaching}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
