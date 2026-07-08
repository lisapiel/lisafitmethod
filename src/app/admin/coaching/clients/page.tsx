"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import Link from "next/link"
import type { CoachingClientRecord } from "@/lib/authTokens"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"
const red = "#c14646"
const amber = "#d4a04a"

type Client = CoachingClientRecord
type Activity = { email: string; lastWorkoutAt: string | null; workoutsThisWeek: number; pendingCheckIns: number; unreadMessageCount: number }

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "#d97460",
  ACTIVE: "#5c9e6a",
  PAUSED: "#c9a96e",
  INACTIVE: "#444",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "AWAITING PAYMENT",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  INACTIVE: "INACTIVE",
}

type Filter = "NEEDS_ATTENTION" | "ACTIVE" | "PENDING_PAYMENT" | "PAUSED" | "INACTIVE" | "ALL"

function Spinner() {
  return (
    <div style={{ width: 18, height: 18, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function lastWorkoutLabel(iso: string | null): { text: string; color: string } {
  if (!iso) return { text: "no logs", color: red }
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return { text: "today", color: muted }
  if (days === 1) return { text: "1d ago", color: muted }
  if (days < 7) return { text: `${days}d ago`, color: muted }
  if (days < 14) return { text: `${days}d ago`, color: amber }
  return { text: `${days}d ago`, color: red }
}

function needsAttention(c: Client, a: Activity | undefined): boolean {
  if (!a) return false
  if (a.pendingCheckIns > 0) return true
  if (a.unreadMessageCount > 0) return true
  if ((c.status ?? "ACTIVE") === "ACTIVE") {
    if (!a.lastWorkoutAt) return true
    const days = Math.floor((Date.now() - new Date(a.lastWorkoutAt).getTime()) / 86_400_000)
    if (days > 10) return true
  }
  return false
}

function DeleteModal({ client, onClose, onDeleted }: { client: Client; onClose: () => void; onDeleted: (email: string) => void }) {
  const [confirmText, setConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  async function handleDelete() {
    if (confirmText !== "DELETE") return
    setDeleting(true)
    setError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      const res = await fetch(`/api/admin/coaching/clients/${encodeURIComponent(client.email)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      })
      if (res.ok) {
        onDeleted(client.email)
        onClose()
      } else {
        setError("Delete failed. Try again.")
      }
    } catch {
      setError("Delete failed. Try again.")
    }
    setDeleting(false)
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#111", border: `1px solid ${border}`, borderLeft: `4px solid ${red}`, padding: "1.5rem", maxWidth: 460, width: "100%" }}
      >
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: red, margin: "0 0 6px" }}>
          Danger zone
        </p>
        <h3 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.35rem", color: cream, margin: "0 0 10px", fontWeight: 500 }}>
          Delete {client.displayName}?
        </h3>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: muted, margin: "0 0 12px", lineHeight: 1.5 }}>
          This permanently removes their coaching data — client record, workouts, check-ins, progress snapshots, goals, and message thread. Their Cognito login account will stay. This cannot be undone.
        </p>
        <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, color: muted, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
          Type DELETE to confirm
        </label>
        <input
          type="text"
          autoFocus
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="DELETE"
          style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: cream, padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", marginBottom: 12 }}
        />
        {error && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: red, margin: "0 0 10px" }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${border}`, color: muted, padding: "9px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={confirmText !== "DELETE" || deleting}
            style={{
              background: confirmText === "DELETE" && !deleting ? red : "#333",
              color: "#fff", border: "none", padding: "9px 20px",
              fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
              cursor: confirmText === "DELETE" && !deleting ? "pointer" : "not-allowed",
            }}
          >
            {deleting ? "Deleting…" : "Delete forever"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [activity, setActivity] = useState<Map<string, Activity>>(new Map())
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("NEEDS_ATTENTION")
  const [query, setQuery] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  const load = useCallback(async () => {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const [clientsRes, activityRes] = await Promise.all([
        fetch("/api/admin/coaching/clients", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/coaching/clients-activity", { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const cData = await clientsRes.json() as { clients: Client[] }
      setClients(cData.clients ?? [])
      if (activityRes.ok) {
        const aData = await activityRes.json() as { activity: Activity[] }
        const map = new Map<string, Activity>()
        for (const a of aData.activity) map.set(a.email.toLowerCase(), a)
        setActivity(map)
      }
    } catch { /* handled */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function handleDeleted(email: string) {
    setClients((cs) => cs.filter((c) => c.email.toLowerCase() !== email.toLowerCase()))
  }

  const filtered = clients.filter((c) => {
    if (query) {
      const q = query.toLowerCase()
      if (!c.displayName.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false
    }
    if (filter === "ALL") return true
    if (filter === "NEEDS_ATTENTION") return needsAttention(c, activity.get(c.email.toLowerCase()))
    return (c.status ?? "ACTIVE") === filter
  })

  const attentionCount = clients.filter((c) => needsAttention(c, activity.get(c.email.toLowerCase()))).length
  const activeCount = clients.filter((c) => (c.status ?? "ACTIVE") === "ACTIVE").length

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: cream, marginBottom: "0.25rem" }}>Clients</h1>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: muted }}>
            {loading ? "Loading…" : `${activeCount} active`}{attentionCount > 0 && !loading ? ` · ${attentionCount} need attention` : ""}
          </p>
        </div>
        <Link href="/admin/coaching/clients/new" style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "9px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>
          + Add Client
        </Link>
      </div>

      <input
        type="search"
        placeholder="Search name or email…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: "100%", background: "#161616", border: `1px solid ${border}`, color: cream, padding: "9px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", outline: "none", marginBottom: 12, boxSizing: "border-box" }}
      />

      <div className="h-scroll" style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
        {([
          { key: "NEEDS_ATTENTION" as const, label: attentionCount > 0 ? `● Needs attention (${attentionCount})` : "Needs attention" },
          { key: "ACTIVE" as const, label: "Active" },
          { key: "PENDING_PAYMENT" as const, label: "Pending" },
          { key: "PAUSED" as const, label: "Paused" },
          { key: "INACTIVE" as const, label: "Inactive" },
          { key: "ALL" as const, label: "All" },
        ]).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              background: filter === f.key ? gold : "transparent",
              border: `1px solid ${filter === f.key ? gold : border}`,
              color: filter === f.key ? "#0a0a0a" : muted,
              padding: "8px 14px",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.62rem",
              fontWeight: filter === f.key ? 700 : 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "3rem 0", color: "#555" }}>
          <Spinner />
          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem" }}>Loading clients…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#111", border: `1px solid ${border}`, padding: "3rem 1.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.2rem", color: "#444", marginBottom: 8 }}>
            {filter === "NEEDS_ATTENTION" ? "All caught up! 🎉" : "No clients yet"}
          </p>
          {clients.length === 0 && (
            <Link href="/admin/coaching/clients/new" style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "11px 24px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
              Add Your First Client →
            </Link>
          )}
        </div>
      ) : (
        <div>
          {filtered.map((c) => {
            const a = activity.get(c.email.toLowerCase())
            const last = lastWorkoutLabel(a?.lastWorkoutAt ?? null)
            return (
              <div
                key={c.email}
                style={{ position: "relative", background: "#111", border: `1px solid ${border}`, marginBottom: 6 }}
              >
                <Link
                  href={`/admin/coaching/clients/${encodeURIComponent(c.email)}`}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", textDecoration: "none" }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a1a1a", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, color: gold }}>{initials(c.displayName)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: cream, margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.displayName}
                    </p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: last.color }}>
                        {last.text}
                      </span>
                      {a && a.pendingCheckIns > 0 && (
                        <span style={{ background: gold, color: "#0a0a0a", fontSize: "0.55rem", fontWeight: 700, padding: "2px 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          Check-in
                        </span>
                      )}
                      {a && a.unreadMessageCount > 0 && (
                        <span style={{ background: red, color: "#fff", fontSize: "0.55rem", fontWeight: 700, padding: "2px 6px", borderRadius: 8, minWidth: 16, textAlign: "center" }}>
                          {a.unreadMessageCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", letterSpacing: "0.1em", color: STATUS_COLORS[c.status ?? "ACTIVE"] ?? "#666" }}>
                      {STATUS_LABELS[c.status ?? "ACTIVE"] ?? c.status ?? "ACTIVE"}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 3l3 3-3 3" stroke="#444" strokeWidth="1.4" strokeLinecap="round" /></svg>
                  </div>
                </Link>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(c) }}
                  aria-label={`Delete ${c.displayName}`}
                  style={{
                    position: "absolute", right: 6, top: 6,
                    background: "none", border: "none", color: "#333",
                    fontSize: "0.85rem", padding: "4px 8px", cursor: "pointer",
                  }}
                >
                  ⋯
                </button>
              </div>
            )
          })}
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          client={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}
