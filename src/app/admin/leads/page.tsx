"use client"

import { useEffect, useState } from "react"
import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/lib/amplifyConfig"
import AdminHeader from "@/components/admin/AdminHeader"

const gold = "#c9a96e"
const border = "#2a2a2a"

type Lead = Schema["Lead"]["type"]

export const dynamic = "force-dynamic"

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    const promise = client.models.Lead?.list({ authMode: "userPool" }) ?? Promise.resolve({ data: [] })
    promise.then(({ data }) => {
      const sorted = [...data].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      setLeads(sorted)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    if (!confirm("Delete this lead?")) return
    const client = generateClient<Schema>({ authMode: "userPool" })
    await client.models.Lead?.delete({ id })
    setLeads((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <AdminHeader />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 2rem" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.4rem" }}>
          Leads
        </h1>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginBottom: "2.5rem" }}>
          Email addresses captured from the free guide page. {leads.length > 0 && `${leads.length} total.`}
        </p>

        {loading ? (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555" }}>Loading...</p>
        ) : leads.length === 0 ? (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555" }}>No leads yet.</p>
        ) : (
          <div style={{ background: "#161616", border: `1px solid ${border}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 120px 80px", gap: "1rem", padding: "0.6rem 1.5rem", borderBottom: `1px solid ${border}` }}>
              {["Email", "Captured", "Source", ""].map((h) => (
                <span key={h} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555" }}>{h}</span>
              ))}
            </div>
            {leads.map((lead) => {
              const date = lead.createdAt
                ? new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : ""
              return (
                <div
                  key={lead.id}
                  style={{ display: "grid", gridTemplateColumns: "1fr 180px 120px 80px", gap: "1rem", padding: "0.875rem 1.5rem", borderBottom: `1px solid ${border}`, alignItems: "center" }}
                >
                  <a
                    href={`mailto:${lead.email}`}
                    style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: gold, textDecoration: "none" }}
                  >
                    {lead.email}
                  </a>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#888" }}>{date}</span>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#555", letterSpacing: "0.05em" }}>{lead.source ?? "free-guide"}</span>
                  <button
                    onClick={() => handleDelete(lead.id)}
                    style={{ background: "none", border: "1px solid #3a2a2a", color: "#884444", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.58rem", letterSpacing: "0.1em", padding: "4px 10px", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
