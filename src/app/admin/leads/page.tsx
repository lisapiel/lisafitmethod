"use client"

import { useEffect, useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import AdminHeader from "@/components/admin/AdminHeader"

export const dynamic = "force-dynamic"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cardBg = "#161616"

type Lead = { id: string; email: string; source: string; createdAt: string }

function formatDate(d: string) {
  if (!d) return "—"
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return "—"
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function sourceLabel(source: string) {
  const base: React.CSSProperties = {
    display: "inline-block",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: "0.5rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    padding: "2px 8px",
    border: "1px solid",
    whiteSpace: "nowrap",
    color: "#5b9a8b",
    borderColor: "#5b9a8b",
  }
  const label = source === "courses-page-teaser" ? "Courses Page" : "Free Guide"
  return <span style={base}>{label}</span>
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()
        if (!token) { setError("Not authenticated"); setLoading(false); return }

        const res = await fetch("/api/admin/leads", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) { setError("Failed to load leads"); setLoading(false); return }
        const data = await res.json() as { leads: Lead[] }
        setLeads(data.leads ?? [])
      } catch {
        setError("Something went wrong")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function deleteLead(id: string) {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) return
      await fetch("/api/admin/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      })
      setLeads((prev) => prev.filter((l) => l.id !== id))
    } catch {
      // non-fatal
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#111" }}>
      <AdminHeader />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 32px" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.4rem" }}>
          Free Guide Leads
        </h1>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginBottom: "2rem" }}>
          Emails captured via the free guide form. {!loading && `${leads.length} total.`}
        </p>

        {loading ? (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555" }}>Loading…</p>
        ) : error ? (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#cc6666" }}>{error}</p>
        ) : leads.length === 0 ? (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555" }}>No leads yet.</p>
        ) : (
          <div style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 110px 60px", gap: "1rem", padding: "0.6rem 1.5rem", borderBottom: `1px solid ${border}` }}>
              {["Email", "Source", "Date", ""].map((h) => (
                <span key={h} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555" }}>{h}</span>
              ))}
            </div>
            {leads.map((lead, i) => (
              <div
                key={lead.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.2fr 110px 60px",
                  gap: "1rem",
                  padding: "0.875rem 1.5rem",
                  borderBottom: i < leads.length - 1 ? `1px solid ${border}` : "none",
                  alignItems: "center",
                }}
              >
                <a
                  href={`mailto:${lead.email}`}
                  style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: gold, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                >
                  {lead.email}
                </a>
                <div>{sourceLabel(lead.source)}</div>
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", color: "#888" }}>
                  {formatDate(lead.createdAt)}
                </span>
                <button
                  onClick={() => deleteLead(lead.id)}
                  style={{ background: "none", border: `1px solid ${border}`, color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", letterSpacing: "0.1em", padding: "4px 10px", cursor: "pointer" }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
