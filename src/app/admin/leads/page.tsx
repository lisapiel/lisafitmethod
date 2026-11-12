"use client"

import { useEffect, useState, useCallback } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { mergePeopleData } from "./people-merge"
import type { MergedRow, Product, ProductAccess, CoachingClientRecord } from "./people-merge"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cardBg = "#161616"

type FilterTab = "all" | "purchasers" | "accounts" | "leads" | "access" | "coaching"

function formatDate(d: string) {
  if (!d) return "-"
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return "-"
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function ProductBadge({ access }: { access: ProductAccess }) {
  const colors: Record<Product, { color: string; label: string }> = {
    training: { color: gold, label: "Training" },
    nutrition: { color: "#7eb89a", label: "Nutrition" },
    tracker: { color: "#8888cc", label: "Tracker" },
  }
  const { color, label } = colors[access.product]
  const suffix = access.grantType === "purchase" ? "" : ` (${access.grantType})`
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
      {label}{suffix}
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

function CoachingBadge() {
  return (
    <span style={{
      display: "inline-block",
      fontFamily: "var(--font-montserrat), sans-serif",
      fontSize: "0.48rem",
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      padding: "2px 7px",
      border: "1px solid #9a7eb8",
      color: "#9a7eb8",
      whiteSpace: "nowrap",
    }}>
      Coaching
    </span>
  )
}

function escapeCsvField(v: string): string {
  const s = String(v)
  const safe = /^[=+\-@|]/.test(s) ? `'${s}` : s
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`
  }
  return safe
}

function exportCsv(rows: MergedRow[], tab: FilterTab) {
  const toCategories = (r: MergedRow) => {
    const cats: string[] = []
    if (r.products.some((p) => p.grantType === "purchase")) cats.push("Purchaser")
    if (r.hasCognitoAccount) cats.push("Account")
    if (r.leadSource) cats.push("Lead")
    if (r.products.length > 0) cats.push("Access")
    if (r.isCoachingClient) cats.push("Coaching")
    return cats.join("; ")
  }

  const headers = ["Name", "Email", "Categories", "Lead Source", "Products", "Grant Types", "Signup Date", "Has Account"]
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.name ?? "",
        r.email,
        toCategories(r),
        r.leadSource ?? "",
        r.products.map((p) => p.product).join("; "),
        [...new Set(r.products.map((p) => p.grantType))].join("; "),
        r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US") : "",
        r.hasCognitoAccount ? "Yes" : "No",
      ]
        .map(escapeCsvField)
        .join(",")
    ),
  ]

  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `lfm-people-${tab}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminLeadsPage() {
  const [rows, setRows] = useState<MergedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [apiErrors, setApiErrors] = useState<string[]>([])
  const [filter, setFilter] = useState<FilterTab>("all")
  const [granting, setGranting] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setApiErrors([])
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) {
        setApiErrors(["auth"])
        setLoading(false)
        return
      }

      const authHeader = { Authorization: `Bearer ${token}` }

      const [customersRes, leadsRes, usersRes, coachingRes] = await Promise.allSettled([
        fetch("/api/admin/customers"),
        fetch("/api/admin/leads", { headers: authHeader }),
        fetch("/api/admin/users", { headers: authHeader }),
        fetch("/api/admin/coaching/clients", { headers: authHeader }),
      ])

      const errors: string[] = []

      let customers: { email: string; product: Product; grantedAt: string; grantType: string }[] = []
      if (customersRes.status === "fulfilled" && customersRes.value.ok) {
        const data = await customersRes.value.json() as { customers: { email: string; product: Product; grantedAt: string; grantType: string }[] }
        customers = data.customers ?? []
      } else {
        errors.push("customers")
      }

      let users: { email: string; createdAt: string; status: string }[] = []
      if (usersRes.status === "fulfilled" && usersRes.value.ok) {
        const data = await usersRes.value.json() as { users: { email: string; createdAt: string; status: string }[] }
        users = data.users ?? []
      } else {
        errors.push("users")
      }

      let leads: { id: string; email: string; name?: string; source: string; createdAt: string }[] = []
      if (leadsRes.status === "fulfilled" && leadsRes.value.ok) {
        const data = await leadsRes.value.json() as { leads: { id: string; email: string; name?: string; source: string; createdAt: string }[] }
        leads = data.leads ?? []
      } else {
        errors.push("leads")
      }

      let coachingClients: CoachingClientRecord[] = []
      if (coachingRes.status === "fulfilled" && coachingRes.value.ok) {
        const data = await coachingRes.value.json() as { clients: { email: string; name: string | null; startedAt: string | null }[] }
        coachingClients = (data.clients ?? []).map((c) => ({
          email: c.email,
          name: c.name ?? undefined,
          startedAt: c.startedAt ?? undefined,
        }))
      } else {
        errors.push("coaching")
      }

      setApiErrors(errors)
      setRows(mergePeopleData(customers, users, leads, coachingClients))
    } catch {
      setApiErrors(["unknown"])
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
      setRows((prev) =>
        prev
          .map((r) =>
            r.email.toLowerCase() === email.toLowerCase()
              ? { ...r, leadSource: null, leadId: null }
              : r
          )
          .filter((r) => r.products.length > 0 || r.hasCognitoAccount || r.leadSource !== null)
      )
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
        setRows((prev) =>
          prev.map((r) =>
            r.email.toLowerCase() === email.toLowerCase()
              ? {
                  ...r,
                  products: r.products.some((p) => p.product === product)
                    ? r.products
                    : [...r.products, { product, grantType: "admin" }],
                }
              : r
          )
        )
      }
    } finally {
      setGranting(null)
    }
  }

  const filtered = rows.filter((r) => {
    if (filter === "purchasers") return r.products.some((p) => p.grantType === "purchase")
    if (filter === "accounts") return r.hasCognitoAccount
    if (filter === "leads") return !!r.leadSource
    if (filter === "access") return r.products.length > 0
    if (filter === "coaching") return r.isCoachingClient
    return true
  })

  const counts = {
    all: rows.length,
    purchasers: rows.filter((r) => r.products.some((p) => p.grantType === "purchase")).length,
    accounts: rows.filter((r) => r.hasCognitoAccount).length,
    leads: rows.filter((r) => !!r.leadSource).length,
    access: rows.filter((r) => r.products.length > 0).length,
    coaching: rows.filter((r) => r.isCoachingClient).length,
  }

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: `All (${counts.all})` },
    { id: "purchasers", label: `Purchasers (${counts.purchasers})` },
    { id: "accounts", label: `Accounts (${counts.accounts})` },
    { id: "leads", label: `Leads (${counts.leads})` },
    { id: "access", label: `Access (${counts.access})` },
    { id: "coaching", label: `Coaching (${counts.coaching})` },
  ]

  const hasErrors = apiErrors.length > 0

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.4rem" }}>
        People
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "#888", marginBottom: "1.5rem" }}>
        Purchasers, accounts, and leads in one place. Use +Training to restore access for anyone who paid.
      </p>

      {hasErrors && (
        <div style={{ background: "#1a0f0f", border: "1px solid #663333", padding: "10px 16px", marginBottom: "1.5rem", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#cc6666", lineHeight: 1.6 }}>
          Warning: data from {apiErrors.join(", ")} failed to load. Some records may be missing. Export disabled.
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
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

        <button
          onClick={() => { if (!hasErrors && !loading) exportCsv(filtered, filter) }}
          disabled={hasErrors || loading}
          style={{
            background: "transparent",
            color: hasErrors || loading ? "#444" : "#888",
            border: `1px solid ${hasErrors || loading ? "#333" : border}`,
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.55rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "6px 14px",
            cursor: hasErrors || loading ? "not-allowed" : "pointer",
          }}
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555" }}>Loading…</p>
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
                {row.products.map((pa) => <ProductBadge key={pa.product} access={pa} />)}
                {row.isCoachingClient && <CoachingBadge />}
                {row.products.length === 0 && !row.isCoachingClient && row.hasCognitoAccount && <AccountBadge />}
                {row.products.length === 0 && !row.isCoachingClient && !row.hasCognitoAccount && (
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.48rem", color: "#555", letterSpacing: "0.1em" }}>-</span>
                )}
              </div>

              <div>
                {row.leadSource ? (
                  <SourceBadge source={row.leadSource} />
                ) : (
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.48rem", color: "#444" }}>-</span>
                )}
              </div>

              <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", color: "#888" }}>
                {formatDate(row.createdAt)}
              </span>

              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {!row.products.some((p) => p.product === "training") && (
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
  )
}
