"use client"

import { useEffect, useState, useCallback } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import AdminHeader from "@/components/admin/AdminHeader"

export const dynamic = "force-dynamic"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cardBg = "#161616"

type Product = "training" | "nutrition" | "tracker"

interface MergedRow {
  email: string
  name?: string
  products: Product[]
  hasCognitoAccount: boolean
  leadSource: string | null
  leadId: string | null
  createdAt: string
}

type FilterTab = "all" | "purchasers" | "accounts" | "leads"

function formatDate(d: string) {
  if (!d) return "-"
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return "-"
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function ProductBadge({ product }: { product: Product }) {
  const colors: Record<Product, { color: string; label: string }> = {
    training: { color: gold, label: "Training" },
    nutrition: { color: "#7eb89a", label: "Nutrition" },
    tracker: { color: "#8888cc", label: "Tracker" },
  }
  const { color, label } = colors[product]
  return (
    <span style={{
      display: "inline-block",
      fontFamily: "var(--font-montserrat), sans-serif",
      fontSize: "0.48rem",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      padding: "2px 7px",
      border: `1px solid ${color}`,
      color,
      marginRight: 4,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  )
}

function SourceBadge({ source }: { source: string | null }) {
  if (!source) return null
  const label = source === "courses-page-teaser" ? "Courses Page" : "Free Guide"
  return (
    <span style={{
      display: "inline-block",
      fontFamily: "var(--font-montserrat), sans-serif",
      fontSize: "0.48rem",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      padding: "2px 7px",
      border: "1px solid #5b9a8b",
      color: "#5b9a8b",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  )
}

function AccountBadge() {
  return (
    <span style={{
      display: "inline-block",
      fontFamily: "var(--font-montserrat), sans-serif",
      fontSize: "0.48rem",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      padding: "2px 7px",
      border: "1px solid #b89458",
      color: "#b89458",
      whiteSpace: "nowrap",
    }}>
      Account
    </span>
  )
}

export default function AdminLeadsPage() {
  const [rows, setRows] = useState<MergedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<FilterTab>("all")
  const [granting, setGranting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) { setError("Not authenticated"); setLoading(false); return }

      const headers = { Authorization: `Bearer ${token}` }

      const [customersRes, leadsRes, usersRes] = await Promise.allSettled([
        fetch("/api/admin/customers"),
        fetch("/api/admin/leads", { headers }),
        fetch("/api/admin/users", { headers }),
      ])

      const map = new Map<string, MergedRow>()

      if (customersRes.status === "fulfilled" && customersRes.value.ok) {
        const data = await customersRes.value.json() as { customers: { email: string; product: Product; grantedAt: string }[] }
        for (const c of data.customers ?? []) {
          const key = c.email.toLowerCase()
          const existing = map.get(key)
          if (existing) {
            if (!existing.products.includes(c.product)) existing.products.push(c.product)
          } else {
            map.set(key, { email: c.email, products: [c.product], hasCognitoAccount: true, leadSource: null, leadId: null, createdAt: c.grantedAt })
          }
        }
      }

      if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        const data = await usersRes.value.json() as { users: { email: string; createdAt: string; status: string }[] }
        for (const u of data.users ?? []) {
          const key = u.email.toLowerCase()
          const existing = map.get(key)
          if (existing) {
            existing.hasCognitoAccount = true
            if (!existing.createdAt) existing.createdAt = u.createdAt
          } else {
            map.set(key, { email: u.email, products: [], hasCognitoAccount: true, leadSource: null, leadId: null, createdAt: u.createdAt })
          }
        }
      }

      if (leadsRes.status === "fulfilled" && leadsRes.value.ok) {
        const data = await leadsRes.value.json() as { leads: { id: string; email: string; name?: string; source: string; createdAt: string }[] }
        for (const l of data.leads ?? []) {
          const key = l.email.toLowerCase()
          const existing = map.get(key)
          if (existing) {
            if (!existing.leadSource) {
              existing.leadSource = l.source
              existing.leadId = l.id
              if (l.name) existing.name = l.name
            }
          } else {
            map.set(key, { email: l.email, name: l.name, products: [], hasCognitoAccount: false, leadSource: l.source, leadId: l.id, createdAt: l.createdAt })
          }
        }
      }

      const sorted = [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      setRows(sorted)
    } catch {
      setError("Something went wrong loading data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function deleteLead(id: string, email: string) {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) return
      await fetch("/api/admin/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id }),
      })
      setRows((prev) => prev.map((r) =>
        r.email.toLowerCase() === email.toLowerCase()
          ? { ...r, leadSource: null, leadId: null }
          : r
      ).filter((r) => r.products.length > 0 || r.hasCognitoAccount || r.leadSource !== null))
    } catch {
      // non-fatal
    }
  }

  async function grantAccess(email: string, product: Product) {
    const key = `${email}:${product}`
    setGranting(key)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) return
      const res = await fetch("/api/admin/grant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email, product }),
      })
      if (res.ok) {
        setRows((prev) => prev.map((r) =>
          r.email.toLowerCase() === email.toLowerCase()
            ? { ...r, products: r.products.includes(product) ? r.products : [...r.products, product] }
            : r
        ))
      }
    } finally {
      setGranting(null)
    }
  }

  const filtered = rows.filter((r) => {
    if (filter === "purchasers") return r.products.length > 0
    if (filter === "accounts") return r.hasCognitoAccount && r.products.length === 0
    if (filter === "leads") return !r.hasCognitoAccount && r.products.length === 0 && !!r.leadSource
    return true
  })

  const counts = {
    all: rows.length,
    purchasers: rows.filter((r) => r.products.length > 0).length,
    accounts: rows.filter((r) => r.hasCognitoAccount && r.products.length === 0).length,
    leads: rows.filter((r) => !r.hasCognitoAccount && r.products.length === 0 && !!r.leadSource).length,
  }

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: `All (${counts.all})` },
    { id: "purchasers", label: `Purchasers (${counts.purchasers})` },
    { id: "accounts", label: `Accounts (${counts.accounts})` },
    { id: "leads", label: `Leads (${counts.leads})` },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "#111" }}>
      <AdminHeader />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 32px" }}>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.4rem" }}>
          People
        </h1>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "#888", marginBottom: "2rem" }}>
          Purchasers, accounts, and leads in one place. Use +Training to restore access for anyone who paid.
        </p>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                background: filter === tab.id ? gold : "transparent",
                color: filter === tab.id ? "#0a0a0a" : "#888",
                border: `1px solid ${filter === tab.id ? gold : border}`,
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.55rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "6px 14px",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555" }}>Loading…</p>
        ) : error ? (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#cc6666" }}>{error}</p>
        ) : filtered.length === 0 ? (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555" }}>No records.</p>
        ) : (
          <div style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.6fr 1fr 110px 140px", gap: "1rem", padding: "0.6rem 1.5rem", borderBottom: `1px solid ${border}` }}>
              {["Email", "Access", "Lead Source", "Date", ""].map((h) => (
                <span key={h} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#555" }}>{h}</span>
              ))}
            </div>

            {filtered.map((row, i) => (
              <div
                key={row.email}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1.6fr 1fr 110px 140px",
                  gap: "1rem",
                  padding: "0.875rem 1.5rem",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${border}` : "none",
                  alignItems: "center",
                }}
              >
                <div style={{ overflow: "hidden" }}>
                  {row.name && (
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "#f0e6d3", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {row.name}
                    </p>
                  )}
                  <a
                    href={`mailto:${row.email}`}
                    style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", color: gold, textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}
                  >
                    {row.email}
                  </a>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
                  {row.products.map((p) => <ProductBadge key={p} product={p} />)}
                  {row.products.length === 0 && row.hasCognitoAccount && <AccountBadge />}
                  {row.products.length === 0 && !row.hasCognitoAccount && (
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.48rem", color: "#555", letterSpacing: "0.1em" }}>
                      -
                    </span>
                  )}
                </div>

                <div>
                  {row.leadSource ? <SourceBadge source={row.leadSource} /> : (
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.48rem", color: "#444" }}>-</span>
                  )}
                </div>

                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", color: "#888" }}>
                  {formatDate(row.createdAt)}
                </span>

                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {!row.products.includes("training") && (
                    <button
                      onClick={() => grantAccess(row.email, "training")}
                      disabled={granting === `${row.email}:training`}
                      style={{
                        background: "none",
                        border: "1px solid #555",
                        color: "#888",
                        fontFamily: "var(--font-montserrat), sans-serif",
                        fontSize: "0.45rem",
                        letterSpacing: "0.08em",
                        padding: "3px 7px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        opacity: granting === `${row.email}:training` ? 0.5 : 1,
                      }}
                      title={`Grant training access to ${row.email}`}
                    >
                      {granting === `${row.email}:training` ? "…" : "+Training"}
                    </button>
                  )}
                  {row.leadId && (
                    <button
                      onClick={() => deleteLead(row.leadId!, row.email)}
                      style={{
                        background: "none",
                        border: `1px solid ${border}`,
                        color: "#555",
                        fontFamily: "var(--font-montserrat), sans-serif",
                        fontSize: "0.45rem",
                        letterSpacing: "0.08em",
                        padding: "3px 7px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Del
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
