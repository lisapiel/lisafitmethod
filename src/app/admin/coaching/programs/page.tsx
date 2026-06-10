"use client"

import { useState, useEffect } from "react"
import { generateClient } from "aws-amplify/data"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

type Program = {
  id: string
  name: string
  clientEmail: string | null
  isTemplate: boolean | null
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED" | null
  notes: string | null
  createdAt: string
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#666",
  ACTIVE: "#5c9e6a",
  COMPLETED: "#c9a96e",
  ARCHIVED: "#444",
}

function Spinner() {
  return (
    <div style={{ width: 18, height: 18, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED">("ALL")

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    client.models.CoachingProgram.list({ authMode: "userPool" }).then(({ data }) => {
      setPrograms(data.map((p) => ({
        id: p.id,
        name: p.name,
        clientEmail: p.clientEmail ?? null,
        isTemplate: p.isTemplate ?? null,
        status: (p.status ?? "DRAFT") as Program["status"],
        notes: p.notes ?? null,
        createdAt: p.createdAt,
      })).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = filter === "ALL" ? programs : programs.filter((p) => p.status === filter)

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.25rem" }}>Programs</h1>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#888" }}>
            {loading ? "Loading…" : `${programs.length} total · ${programs.filter((p) => p.status === "ACTIVE").length} active`}
          </p>
        </div>
        <Link href="/admin/coaching/programs/new" style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "9px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>
          + New Program
        </Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem" }}>
        {(["ALL", "DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{ background: filter === s ? "#2a2a2a" : "none", border: `1px solid ${filter === s ? "#3a3a3a" : border}`, color: filter === s ? "#f0e6d3" : "#555", padding: "6px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
            {s === "ALL" ? `All (${programs.length})` : `${s} (${programs.filter((p) => p.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "3rem 0", color: "#555" }}>
          <Spinner />
          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem" }}>Loading programs…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#111", border: `1px solid ${border}`, padding: "3rem 2rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", color: "#444", marginBottom: 8 }}>{filter === "ALL" ? "No programs yet" : `No ${filter.toLowerCase()} programs`}</p>
          {filter === "ALL" && (
            <Link href="/admin/coaching/programs/new" style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "11px 24px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
              Create First Program →
            </Link>
          )}
        </div>
      ) : (
        <div>
          {filtered.map((p) => (
            <Link key={p.id} href={`/admin/coaching/programs/${p.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#111", border: `1px solid ${border}`, marginBottom: 6, textDecoration: "none" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "#f0e6d3", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {p.clientEmail ? (
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: gold }}>{p.clientEmail}</span>
                  ) : (
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#444" }}>Template</span>
                  )}
                  {p.notes && <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>{p.notes}</span>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", color: STATUS_COLORS[p.status ?? "DRAFT"] ?? "#666" }}>
                  {p.status ?? "DRAFT"}
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
