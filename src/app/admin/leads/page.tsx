"use client"

import { useEffect, useState } from "react"
import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/lib/amplifyConfig"
import AdminHeader from "@/components/admin/AdminHeader"

export const dynamic = "force-dynamic"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cardBg = "#161616"

type Lead = Schema["Lead"]["type"]
type Purchase = Schema["Purchase"]["type"]
type Contact = Schema["ContactSubmission"]["type"]

type SourceFilter = "All" | "Free Guide" | "Purchase" | "Contact Form" | "Coaching"

type Row =
  | { kind: "lead"; date: Date; data: Lead }
  | { kind: "purchase"; date: Date; data: Purchase }
  | { kind: "contact"; date: Date; data: Contact }

function sourceBadge(row: Row) {
  const styles: React.CSSProperties = {
    display: "inline-block",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: "0.5rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    padding: "2px 8px",
    border: "1px solid",
    whiteSpace: "nowrap",
  }
  if (row.kind === "lead") return <span style={{ ...styles, color: "#5b9a8b", borderColor: "#5b9a8b" }}>Free Guide</span>
  if (row.kind === "purchase") return <span style={{ ...styles, color: gold, borderColor: gold }}>Purchase</span>
  if (row.data.type === "coaching") return <span style={{ ...styles, color: "#9b8fc0", borderColor: "#9b8fc0" }}>Coaching</span>
  return <span style={{ ...styles, color: "#888", borderColor: "#444" }}>Contact Form</span>
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatAmount(cents: number | null | undefined) {
  if (!cents) return ""
  return `$${(cents / 100).toFixed(2)}`
}

function rowMatchesFilter(row: Row, filter: SourceFilter): boolean {
  if (filter === "All") return true
  if (filter === "Free Guide") return row.kind === "lead"
  if (filter === "Purchase") return row.kind === "purchase"
  if (filter === "Contact Form") return row.kind === "contact" && row.data.type !== "coaching"
  if (filter === "Coaching") return row.kind === "contact" && row.data.type === "coaching"
  return true
}

export default function AdminLeadsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<SourceFilter>("All")

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    Promise.all([
      (client.models.Lead?.list({ authMode: "userPool" }) ?? Promise.resolve({ data: [] })),
      (client.models.Purchase?.list({ authMode: "userPool" }) ?? Promise.resolve({ data: [] })),
      (client.models.ContactSubmission?.list({ authMode: "userPool" }) ?? Promise.resolve({ data: [] })),
    ]).then(([leads, purchases, contacts]) => {
      const all: Row[] = [
        ...leads.data.map((d): Row => ({ kind: "lead", date: new Date(d.createdAt ?? 0), data: d })),
        ...purchases.data.map((d): Row => ({ kind: "purchase", date: new Date(d.purchasedAt ?? d.createdAt ?? 0), data: d })),
        ...contacts.data.map((d): Row => ({ kind: "contact", date: new Date(d.createdAt ?? 0), data: d })),
      ]
      all.sort((a, b) => b.date.getTime() - a.date.getTime())
      setRows(all)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = rows.filter((r) => rowMatchesFilter(r, filter))

  const counts: Record<SourceFilter, number> = {
    All: rows.length,
    "Free Guide": rows.filter((r) => r.kind === "lead").length,
    Purchase: rows.filter((r) => r.kind === "purchase").length,
    "Contact Form": rows.filter((r) => r.kind === "contact" && r.data.type !== "coaching").length,
    Coaching: rows.filter((r) => r.kind === "contact" && r.data.type === "coaching").length,
  }

  const filters: SourceFilter[] = ["All", "Purchase", "Free Guide", "Contact Form", "Coaching"]

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <AdminHeader />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "3rem 2rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.4rem" }}>
          Leads & Contacts
        </h1>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginBottom: "2rem" }}>
          All contacts across every source — course purchases, contact forms, and free guide signups.
        </p>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? gold : cardBg,
                color: filter === f ? "#0a0a0a" : "#888",
                border: `1px solid ${filter === f ? gold : border}`,
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.6rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              {f} <span style={{ opacity: 0.7 }}>({counts[f]})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555" }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555" }}>No records yet.</p>
        ) : (
          <div style={{ background: cardBg, border: `1px solid ${border}` }}>
            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr 130px 110px 160px", gap: "1rem", padding: "0.6rem 1.5rem", borderBottom: `1px solid ${border}` }}>
              {["Name", "Email", "Source", "Date", "Details"].map((h) => (
                <span key={h} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555" }}>{h}</span>
              ))}
            </div>

            {filtered.map((row, i) => {
              const name = row.kind === "lead"
                ? "—"
                : row.kind === "purchase"
                ? row.data.name || "—"
                : row.data.name

              const email = row.data.email

              let details: React.ReactNode = null
              if (row.kind === "purchase") {
                const amount = formatAmount(row.data.amountPaidCents)
                const tracker = row.data.includesTracker ? " + Tracker" : ""
                const promo = row.data.promoCode ? ` · ${row.data.promoCode}` : ""
                details = (
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#aaa" }}>
                    {amount}{tracker}{promo}
                  </span>
                )
              } else if (row.kind === "contact") {
                const preview = row.data.message?.slice(0, 40)
                details = (
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", fontStyle: "italic" }}>
                    {preview}{(row.data.message?.length ?? 0) > 40 ? "…" : ""}
                  </span>
                )
              }

              return (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.4fr 130px 110px 160px",
                    gap: "1rem",
                    padding: "0.875rem 1.5rem",
                    borderBottom: i < filtered.length - 1 ? `1px solid ${border}` : "none",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#f0e6d3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {name}
                  </span>
                  <a
                    href={`mailto:${email}`}
                    style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: gold, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {email}
                  </a>
                  <div>{sourceBadge(row)}</div>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", color: "#888" }}>
                    {formatDate(row.date)}
                  </span>
                  <div style={{ overflow: "hidden" }}>{details}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
