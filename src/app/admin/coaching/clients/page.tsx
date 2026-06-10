"use client"

import { useState, useEffect } from "react"
import { generateClient } from "aws-amplify/data"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

type Client = {
  id: string
  email: string
  displayName: string
  status: "ACTIVE" | "PAUSED" | "INACTIVE" | null
  goal: string | null
  startDate: string | null
  currentProgramId: string | null
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#5c9e6a",
  PAUSED: "#c9a96e",
  INACTIVE: "#444",
}

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

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "PAUSED" | "INACTIVE">("ACTIVE")
  const [query, setQuery] = useState("")

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    client.models.CoachingClient.list({ authMode: "userPool" }).then(({ data }) => {
      setClients(data.map((c) => ({
        id: c.id,
        email: c.email,
        displayName: c.displayName,
        status: (c.status ?? "ACTIVE") as Client["status"],
        goal: c.goal ?? null,
        startDate: c.startDate ?? null,
        currentProgramId: c.currentProgramId ?? null,
        createdAt: c.createdAt,
      })).sort((a, b) => a.displayName.localeCompare(b.displayName)))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = clients.filter((c) => {
    if (filter !== "ALL" && c.status !== filter) return false
    if (query && !c.displayName.toLowerCase().includes(query.toLowerCase()) && !c.email.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.25rem" }}>Clients</h1>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#888" }}>
            {loading ? "Loading…" : `${clients.filter((c) => c.status === "ACTIVE").length} active clients`}
          </p>
        </div>
        <Link href="/admin/coaching/clients/new" style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "9px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>
          + Add Client
        </Link>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Search name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: "1 1 200px", background: "#161616", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none" }}
        />
        {(["ACTIVE", "PAUSED", "INACTIVE", "ALL"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{ background: filter === s ? "#2a2a2a" : "none", border: `1px solid ${filter === s ? "#3a3a3a" : border}`, color: filter === s ? "#f0e6d3" : "#555", padding: "9px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "3rem 0", color: "#555" }}>
          <Spinner />
          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem" }}>Loading clients…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#111", border: `1px solid ${border}`, padding: "3rem 2rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", color: "#444", marginBottom: 8 }}>No clients yet</p>
          {clients.length === 0 && (
            <Link href="/admin/coaching/clients/new" style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "11px 24px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
              Add Your First Client →
            </Link>
          )}
        </div>
      ) : (
        <div>
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/admin/coaching/clients/${encodeURIComponent(c.email)}`}
              style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", background: "#111", border: `1px solid ${border}`, marginBottom: 6, textDecoration: "none" }}
            >
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a1a1a", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, color: gold }}>{initials(c.displayName)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "#f0e6d3", margin: "0 0 3px" }}>{c.displayName}</p>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#555" }}>{c.email}</span>
                  {c.goal && <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{c.goal}</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                {c.currentProgramId && (
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: gold, letterSpacing: "0.08em" }}>PROGRAM SET</span>
                )}
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", color: STATUS_COLORS[c.status ?? "ACTIVE"] ?? "#666" }}>
                  {c.status ?? "ACTIVE"}
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="#444" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
