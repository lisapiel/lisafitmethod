"use client"
import { useEffect, useState } from "react"
import type { CustomerRow } from "@/app/api/admin/customers/route"

const gold = "#c9a96e"
const border = "#2a2a2a"

const PRODUCT_LABELS: Record<CustomerRow["product"], string> = {
  training: "Training Foundations",
  nutrition: "Nutrition Foundations",
  tracker: "Progress Tracker",
}

function formatDate(iso: string) {
  if (!iso) return "-"
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export function CustomersClient() {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<"all" | CustomerRow["product"]>("all")

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((data: { customers: CustomerRow[] }) => {
        setCustomers(data.customers ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [])

  const filtered = filter === "all" ? customers : customers.filter((c) => c.product === filter)

  const counts = {
    all: customers.length,
    training: customers.filter((c) => c.product === "training").length,
    nutrition: customers.filter((c) => c.product === "nutrition").length,
    tracker: customers.filter((c) => c.product === "tracker").length,
  }

  const uniqueEmails = new Set(customers.map((c) => c.email)).size

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.4rem" }}>
        Customers
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginBottom: "2rem" }}>
        {uniqueEmails} unique customer{uniqueEmails !== 1 ? "s" : ""} across all products.
      </p>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
        {(["training", "nutrition", "tracker"] as const).map((p) => (
          <div key={p} style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem" }}>
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "0.5rem" }}>
              {PRODUCT_LABELS[p]}
            </p>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 400, color: gold, margin: 0 }}>
              {counts[p]}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {(["all", "training", "nutrition", "tracker"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? gold : "none",
              border: `1px solid ${filter === f ? gold : border}`,
              color: filter === f ? "#0a0a0a" : "#888",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "0.4rem 1rem",
              cursor: "pointer",
            }}
          >
            {f === "all" ? `All (${counts.all})` : `${PRODUCT_LABELS[f]} (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#161616", border: `1px solid ${border}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 140px", gap: "1rem", padding: "0.75rem 1.5rem", borderBottom: `1px solid ${border}` }}>
          {["Email", "Product", "Granted"].map((h) => (
            <span key={h} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555" }}>{h}</span>
          ))}
        </div>

        {loading && (
          <p style={{ padding: "2rem 1.5rem", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: "#555" }}>Loading…</p>
        )}

        {!loading && error && (
          <p style={{ padding: "2rem 1.5rem", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: "#c97070" }}>Could not load customers. Please refresh.</p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p style={{ padding: "2rem 1.5rem", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: "#555" }}>No customers yet.</p>
        )}

        {filtered.map((c, i) => (
          <div
            key={`${c.email}-${c.product}`}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 220px 140px",
              gap: "1rem",
              padding: "0.9rem 1.5rem",
              borderBottom: i < filtered.length - 1 ? `1px solid ${border}` : "none",
              alignItems: "center",
            }}
          >
            <span style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#f0e6d3" }}>{c.email}</span>
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: gold }}>{PRODUCT_LABELS[c.product]}</span>
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888" }}>{formatDate(c.grantedAt)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
