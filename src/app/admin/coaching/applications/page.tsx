"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import Link from "next/link"
import type { CoachingApplication, CommitmentType } from "@/lib/authTokens"

// Standard monthly prices in whole dollars per commitment. Auto-fills the
// price input when the coach picks a commitment. The coach can still type
// a custom value — auto-fill only replaces the price when it's empty or
// still matches the OTHER commitment's default (i.e., the coach hasn't
// intentionally overridden anything).
const STANDARD_PRICE_DOLLARS: Record<CommitmentType, number> = {
  THREE_MONTH_MINIMUM: 397,
  MONTH_TO_MONTH:      497,
}
const STANDARD_PRICE_STRINGS = new Set(
  Object.values(STANDARD_PRICE_DOLLARS).map(String)
)
function nextPriceForCommitmentChange(currentPriceStr: string, newCommitment: CommitmentType): string {
  const trimmed = currentPriceStr.trim()
  // Empty OR still matches one of the standard defaults → safe to
  // replace with the new commitment's standard. Anything else is a
  // real coach override, leave it alone.
  if (trimmed === "" || STANDARD_PRICE_STRINGS.has(trimmed)) {
    return String(STANDARD_PRICE_DOLLARS[newCommitment])
  }
  return currentPriceStr
}

type CustomerHistoryPayload = {
  training:    { purchased: boolean; grantedAt: string | null }
  nutrition:   { purchased: boolean; grantedAt: string | null }
  tracker:     { purchased: boolean; grantedAt: string | null }
  masterclass: { purchased: boolean; grantedAt: string | null }
  coaching:    { hasEverEnrolled: boolean; status: string | null; approvedPriceInCents: number | null; commitmentType: string | null; subscriptionStartDate: string | null; cancellationDate: string | null }
  bundle:      { purchased: boolean; purchasedAt: string | null; expiresAt: string | null; usedAt: string | null; usedForSubscriptionId: string | null; amountCents: number; available: boolean }
}
type EnrichedApplication = CoachingApplication & {
  bundleCredit?: { available: boolean; amountCents: number; expiresAt: string | null; purchasedAt: string | null } | null
  history?: CustomerHistoryPayload | null
}

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"

type RestartRequest = {
  id: string
  email: string
  displayName: string
  submittedAt: string
  helpWith: string
  changedSince: string | null
  timeline: string
  previousPriceInCents: number | null
  previousCommitmentType: string | null
  previousSubscriptionStartDate: string | null
  previousCancellationDate: string | null
  previousCancellationReason: string | null
}

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
  const [applications, setApplications] = useState<EnrichedApplication[]>([])
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "DECLINED" | "PAID">("PENDING")
  const [acting, setActing] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [commitments, setCommitments] = useState<Record<string, CommitmentType | "">>({})
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [restartRequests, setRestartRequests] = useState<RestartRequest[]>([])
  const [restartPrices, setRestartPrices] = useState<Record<string, string>>({})
  const [restartCommitments, setRestartCommitments] = useState<Record<string, CommitmentType | "">>({})
  const [approvingRestart, setApprovingRestart] = useState<string | null>(null)
  const [restartConfirmingId, setRestartConfirmingId] = useState<string | null>(null)
  const [restartApprovedUrls, setRestartApprovedUrls] = useState<Record<string, string>>({})
  const [copiedRestartId, setCopiedRestartId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const [appsRes, restartRes] = await Promise.all([
        fetch("/api/admin/coaching/applications", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/admin/coaching/restart-requests", { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const appsData = await appsRes.json() as { applications: EnrichedApplication[] }
      setApplications(appsData.applications ?? [])
      const restartData = await restartRes.json() as { requests: RestartRequest[] }
      setRestartRequests(restartData.requests ?? [])
    } catch { /* handled by layout */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Pre-fill commitment selector from applicant's self-reported coachingOption,
  // and also seed the price input with the standard for that commitment so
  // the coach doesn't have to type it every time. Coach can still override.
  useEffect(() => {
    const seededPrices: Record<string, string> = {}
    setCommitments((prev) => {
      const next = { ...prev }
      for (const app of applications) {
        if (app.status !== "PENDING" || next[app.id] !== undefined) continue
        const opt = (app.coachingOption ?? "").toLowerCase()
        let seeded: CommitmentType | "" = ""
        if (opt.includes("3-month") || opt.includes("3 month") || opt.includes("three")) {
          seeded = "THREE_MONTH_MINIMUM"
        } else if (opt.includes("month-to-month") || opt.includes("month to month") || opt.includes("flexible") || opt.includes("cancel")) {
          seeded = "MONTH_TO_MONTH"
        }
        next[app.id] = seeded
        if (seeded) seededPrices[app.id] = String(STANDARD_PRICE_DOLLARS[seeded])
      }
      return next
    })
    if (Object.keys(seededPrices).length > 0) {
      setPrices((prev) => {
        const next = { ...prev }
        for (const [id, val] of Object.entries(seededPrices)) {
          // Never overwrite an already-typed price.
          if (next[id] === undefined || next[id] === "") next[id] = val
        }
        return next
      })
    }
  }, [applications])

  async function act(id: string, action: "approve" | "decline") {
    if (action === "approve") {
      const priceStr = prices[id] ?? ""
      const priceInCents = priceStr ? Math.round(parseFloat(priceStr) * 100) : 0
      if (!priceInCents || priceInCents < 100) {
        alert("Please enter a monthly price (minimum $1.00) before approving.")
        return
      }
      if (!commitments[id]) {
        alert("Please select a commitment type (3-month minimum or Month-to-month) before approving.")
        return
      }
      // Show confirmation step instead of sending immediately
      setConfirmingId(id)
      return
    }
    setActing(id)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const res = await fetch(`/api/admin/coaching/applications/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json() as { ok: boolean; error?: string }
      if (!data.ok) alert(data.error ?? "Something went wrong")
      else await load()
    } catch { /* handled */ }
    setActing(null)
  }

  async function confirmApprove(id: string) {
    setConfirmingId(null)
    setActing(id)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const priceStr = prices[id] ?? ""
      const priceInCents = Math.round(parseFloat(priceStr) * 100)
      const commitmentType = commitments[id] || undefined
      const res = await fetch(`/api/admin/coaching/applications/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", priceInCents, commitmentType }),
      })
      const data = await res.json() as { ok: boolean; error?: string }
      if (!data.ok) alert(data.error ?? "Something went wrong")
      else await load()
    } catch { /* handled */ }
    setActing(null)
  }

  function copyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  async function confirmApproveRestart(requestId: string) {
    setRestartConfirmingId(null)
    setApprovingRestart(requestId)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const priceStr = restartPrices[requestId] ?? ""
      const priceInCents = Math.round(parseFloat(priceStr) * 100)
      const commitmentType = restartCommitments[requestId] || undefined
      const res = await fetch("/api/admin/coaching/restart-requests/approve", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, priceInCents, commitmentType }),
      })
      const data = await res.json() as { ok: boolean; acceptUrl?: string; error?: string }
      if (!data.ok) {
        alert(data.error ?? "Something went wrong")
      } else {
        setRestartApprovedUrls((prev) => ({ ...prev, [requestId]: data.acceptUrl ?? "" }))
        await load()
      }
    } catch { /* handled */ }
    setApprovingRestart(null)
  }

  function copyRestartUrl(url: string, id: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedRestartId(id)
      setTimeout(() => setCopiedRestartId(null), 2000)
    })
  }

  const filtered = filter === "ALL" ? applications : applications.filter((a) => a.status === filter)
  const pendingCount = applications.filter((a) => a.status === "PENDING").length
  const totalActionable = pendingCount + restartRequests.length

  function formatPrice(cents: number) {
    const dollars = cents / 100
    return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }

  const timelineLabels: Record<string, string> = {
    asap: "As soon as possible",
    "few-weeks": "Within the next few weeks",
    exploring: "Just exploring for now",
  }

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
              {totalActionable > 0 && (
                <span style={{ marginLeft: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: gold, color: "#111", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", fontWeight: 700, verticalAlign: "middle" }}>
                  {totalActionable}
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
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.9rem", fontWeight: 600, color: cream }}>{app.name}</span>
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, color: s.color, border: `1px solid ${s.color}44`, padding: "2px 8px", borderRadius: 3 }}>{s.label}</span>
                        {app.bundleCredit?.available && (
                          <span style={{ background: gold, color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", padding: "3px 8px", borderRadius: 3, textTransform: "uppercase" }}>
                            Bundle credit ${(app.bundleCredit.amountCents / 100).toFixed(0)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: muted }}>{app.email}</span>
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: muted }}>{timeAgo(app.applicationDate)}</span>
                      </div>
                    </div>
                    {app.status === "PENDING" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, alignItems: "flex-end", minWidth: 210 }}>
                        {/* Monthly price */}
                        <div style={{ display: "flex", alignItems: "center", gap: 0, width: "100%" }}>
                          <span style={{ background: "#0a0a0a", border: `1px solid ${border}`, borderRight: "none", padding: "7px 10px", fontSize: "0.75rem", color: "#555" }}>$</span>
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={prices[app.id] ?? ""}
                            onChange={(e) => setPrices((p) => ({ ...p, [app.id]: e.target.value }))}
                            placeholder="Monthly price"
                            style={{ flex: 1, background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "7px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", outline: "none" }}
                          />
                        </div>
                        {app.bundleCredit?.available && prices[app.id] && parseFloat(prices[app.id]) > 0 && (
                          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: gold, letterSpacing: "0.06em", alignSelf: "flex-start" }}>
                            First month: ${Math.max(0, parseFloat(prices[app.id]) - app.bundleCredit.amountCents / 100).toFixed(2)}
                          </span>
                        )}
                        {/* Commitment selector */}
                        <select
                          value={commitments[app.id] ?? ""}
                          onChange={(e) => {
                            const nextCommitment = e.target.value as CommitmentType | ""
                            setCommitments((c) => ({ ...c, [app.id]: nextCommitment }))
                            if (nextCommitment === "THREE_MONTH_MINIMUM" || nextCommitment === "MONTH_TO_MONTH") {
                              setPrices((p) => ({ ...p, [app.id]: nextPriceForCommitmentChange(p[app.id] ?? "", nextCommitment) }))
                            }
                          }}
                          style={{ width: "100%", background: "#111", border: `1px solid ${!commitments[app.id] ? "#6b4a20" : border}`, color: commitments[app.id] ? "#f0e6d3" : "#888", padding: "7px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", outline: "none", cursor: "pointer" }}
                        >
                          <option value="">— Select commitment —</option>
                          <option value="THREE_MONTH_MINIMUM">3-month minimum</option>
                          <option value="MONTH_TO_MONTH">Month-to-month</option>
                        </select>
                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: 8, width: "100%" }}>
                          <button
                            onClick={() => act(app.id, "decline")}
                            disabled={acting === app.id}
                            style={{ flex: "0 0 auto", background: "transparent", border: `1px solid ${border}`, color: "#d97460", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", cursor: "pointer", borderRadius: 4 }}
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => act(app.id, "approve")}
                            disabled={acting === app.id}
                            style={{ flex: 1, background: gold, border: "none", color: "#111", padding: "7px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", borderRadius: 4 }}
                          >
                            {acting === app.id ? "Sending…" : "Approve →"}
                          </button>
                        </div>
                      </div>
                    )}
                    {(app.status === "APPROVED") && app.stripeCheckoutUrl && (
                      <button
                        onClick={() => {
                          // Copy the interstitial URL (which requires the two acknowledgements)
                          // instead of the raw Stripe URL, so DM'd links can't bypass acceptance.
                          const acceptUrl = `${typeof window !== "undefined" ? window.location.origin : "https://lisafitmethod.com"}/coaching/accept/${app.id}`
                          copyUrl(acceptUrl, app.id)
                        }}
                        style={{ background: "transparent", border: `1px solid ${gold}44`, color: gold, padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", cursor: "pointer", borderRadius: 4 }}
                      >
                        {copiedId === app.id ? "Copied ✓" : "Copy Payment Link"}
                      </button>
                    )}
                  </div>

                  {/* Bundle-credit status callout — shown for every pending
                      application so the coach immediately knows whether a
                      credit will apply to the commitment they're about to
                      approve. Only 3-month commitments consume the credit
                      server-side; the callout wording reflects the currently-
                      selected commitment. */}
                  {app.status === "PENDING" && (() => {
                    const b = app.history?.bundle
                    const selected = commitments[app.id]
                    if (!b || !b.purchased) {
                      return (
                        <div style={{ background: "#111", border: `1px solid ${border}`, padding: "10px 14px", marginBottom: 10, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: muted, letterSpacing: "0.04em" }}>
                          No active bundle coaching credit
                        </div>
                      )
                    }
                    const usedText = b.usedAt
                      ? "Bundle coaching credit already used"
                      : (b.available ? null : "Bundle purchased previously — 90-day coaching credit expired")
                    if (usedText) {
                      return (
                        <div style={{ background: "#1a1512", border: `1px solid ${border}`, padding: "10px 14px", marginBottom: 10, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: muted, letterSpacing: "0.04em" }}>
                          {usedText}
                          {b.purchasedAt && <span style={{ color: "#555" }}> · Purchased {formatDate(b.purchasedAt)}</span>}
                        </div>
                      )
                    }
                    // Available: fmt for 3-month vs m2m distinctly
                    const willApply = selected === "THREE_MONTH_MINIMUM"
                    return (
                      <div style={{
                        background: willApply ? "rgba(92,158,106,0.10)" : "rgba(201,169,110,0.10)",
                        border: `1px solid ${willApply ? "#5c9e6a" : gold}`,
                        borderLeft: `4px solid ${willApply ? "#5c9e6a" : gold}`,
                        padding: "10px 14px", marginBottom: 10,
                        fontFamily: "var(--font-montserrat), sans-serif",
                      }}>
                        <p style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: willApply ? "#7bc48c" : gold, margin: "0 0 4px" }}>
                          🟢 ${(b.amountCents / 100).toFixed(0)} Bundle Credit Available
                        </p>
                        <p style={{ fontSize: "0.68rem", color: cream, margin: "0 0 2px", lineHeight: 1.55 }}>
                          Purchased {b.purchasedAt ? formatDate(b.purchasedAt) : "—"} · Eligible through {b.expiresAt ? formatDate(b.expiresAt) : "—"} · Applies to 3-month coaching only
                        </p>
                        <p style={{ fontSize: "0.65rem", color: willApply ? "#7bc48c" : "#c78e5a", margin: 0, fontWeight: 600, letterSpacing: "0.04em" }}>
                          {selected === "THREE_MONTH_MINIMUM"
                            ? "Will apply on approval → first invoice reduced by $" + (b.amountCents / 100).toFixed(0)
                            : selected === "MONTH_TO_MONTH"
                              ? "Not applied — month-to-month coaching isn't eligible"
                              : "Select 3-month commitment to apply this credit"}
                        </p>
                      </div>
                    )
                  })()}

                  {/* Customer history — everything this email has ever bought.
                      Resolved from the same DDB access records that gate
                      access; nothing is denormalized. */}
                  {app.history && (() => {
                    const h = app.history
                    const rows: Array<{ label: string; detail: string }> = []
                    if (h.bundle.purchased) rows.push({ label: "Complete Foundations Bundle", detail: `${h.bundle.purchasedAt ? `Purchased ${formatDate(h.bundle.purchasedAt)}` : "Purchased"}${h.bundle.usedAt ? " · credit used" : ""}` })
                    if (h.training.purchased)  rows.push({ label: "Training Foundations",  detail: h.training.grantedAt  ? `Access granted ${formatDate(h.training.grantedAt)}`  : "Access granted" })
                    if (h.nutrition.purchased) rows.push({ label: "Nutrition Foundations", detail: h.nutrition.grantedAt ? `Access granted ${formatDate(h.nutrition.grantedAt)}` : "Access granted" })
                    if (h.tracker.purchased)   rows.push({ label: "Progress Tracker",       detail: h.tracker.grantedAt   ? `Access granted ${formatDate(h.tracker.grantedAt)}`   : "Access granted" })
                    if (h.coaching.hasEverEnrolled) {
                      const bits = [h.coaching.status ?? "coaching"]
                      if (h.coaching.approvedPriceInCents != null) bits.push(`${formatPrice(h.coaching.approvedPriceInCents)}/mo`)
                      if (h.coaching.commitmentType) bits.push(h.coaching.commitmentType === "THREE_MONTH_MINIMUM" ? "3-month" : "month-to-month")
                      if (h.coaching.subscriptionStartDate) bits.push(`start ${formatDate(h.coaching.subscriptionStartDate)}`)
                      if (h.coaching.cancellationDate) bits.push(`cancelled ${formatDate(h.coaching.cancellationDate)}`)
                      rows.push({ label: "Previous / current 1:1 Coaching", detail: bits.join(" · ") })
                    }
                    if (rows.length === 0) return null
                    return (
                      <div style={{ background: "#0e0e0e", border: `1px solid ${border}`, padding: "10px 14px", marginBottom: 10 }}>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: gold, margin: "0 0 6px" }}>
                          Customer History
                        </p>
                        {rows.map((r, i) => (
                          <p key={i} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: cream, margin: "2px 0", lineHeight: 1.5 }}>
                            <span style={{ color: "#bbb" }}>{r.label}</span>
                            <span style={{ color: "#666" }}> — {r.detail}</span>
                          </p>
                        ))}
                      </div>
                    )
                  })()}

                  {/* Application details */}
                  <div style={{ display: "grid", gap: 10 }}>
                    {/* Primary goal — includes free-text if applicant selected "Other" */}
                    {app.primaryGoal && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: gold, margin: "0 0 3px" }}>Primary Goal</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.82rem", color: cream, margin: 0, lineHeight: 1.5 }}>
                          {app.primaryGoal}
                          {app.primaryGoalOther && <span style={{ color: "#bbb" }}> — {app.primaryGoalOther}</span>}
                        </p>
                      </div>
                    )}
                    {/* Legacy goals field */}
                    {!app.primaryGoal && app.goals && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: gold, margin: "0 0 3px" }}>Goals</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.82rem", color: cream, margin: 0, lineHeight: 1.5 }}>{app.goals}</p>
                      </div>
                    )}
                    {app.specificOutcome && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: gold, margin: "0 0 3px" }}>Specific Outcome</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.82rem", color: cream, margin: 0, lineHeight: 1.5 }}>{app.specificOutcome}</p>
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                      {app.trainingExperience && (
                        <div>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Experience</p>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0 }}>{app.trainingExperience}</p>
                        </div>
                      )}
                      {app.daysPerWeek && (
                        <div>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Days/Week</p>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0 }}>{app.daysPerWeek}</p>
                        </div>
                      )}
                      {app.sessionDuration && (
                        <div>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Session</p>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0 }}>{app.sessionDuration}</p>
                        </div>
                      )}
                      {app.equipment && (
                        <div>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Equipment</p>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0 }}>{app.equipment}</p>
                        </div>
                      )}
                      {app.coachingOption && (
                        <div>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Option</p>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0 }}>{app.coachingOption}</p>
                        </div>
                      )}
                      {app.startTiming && (
                        <div>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Start Timing</p>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0 }}>{app.startTiming}</p>
                        </div>
                      )}
                      {/* Legacy grid fields */}
                      {app.investmentReadiness && (
                        <div>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Investment (legacy)</p>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0 }}>{app.investmentReadiness}</p>
                        </div>
                      )}
                      {app.coursesCompleted && (
                        <div>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Courses (legacy)</p>
                          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0 }}>{app.coursesCompleted}</p>
                        </div>
                      )}
                    </div>
                    {app.equipmentDetails && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Equipment Notes</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0, lineHeight: 1.5 }}>{app.equipmentDetails}</p>
                      </div>
                    )}
                    {app.currentTraining && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Current Training</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0, lineHeight: 1.5 }}>{app.currentTraining}</p>
                      </div>
                    )}
                    {app.injuries && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Injuries / Limitations</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0, lineHeight: 1.5 }}>{app.injuries}</p>
                      </div>
                    )}
                    {app.exercisePreferences && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Exercise Preferences</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0, lineHeight: 1.5 }}>{app.exercisePreferences}</p>
                      </div>
                    )}
                    {app.scheduleConstraints && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Schedule</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0, lineHeight: 1.5 }}>{app.scheduleConstraints}</p>
                      </div>
                    )}
                    {app.whyCoachingNow && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Why Coaching Now</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0, lineHeight: 1.5 }}>{app.whyCoachingNow}</p>
                      </div>
                    )}
                    {/* Legacy free-text fields (older applications only) */}
                    {app.whatHaveYouTried && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>What they&apos;ve tried (legacy)</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0, lineHeight: 1.5 }}>{app.whatHaveYouTried}</p>
                      </div>
                    )}
                    {app.whyNow && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Why Now (legacy)</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0, lineHeight: 1.5 }}>{app.whyNow}</p>
                      </div>
                    )}
                    {!app.whyCoachingNow && !app.whyNow && !app.whatHaveYouTried && app.whyCoaching && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Why Coaching (legacy)</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0, lineHeight: 1.5 }}>{app.whyCoaching}</p>
                      </div>
                    )}
                    {app.whyLisa && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Why Lisa (legacy)</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0, lineHeight: 1.5 }}>{app.whyLisa}</p>
                      </div>
                    )}
                    {app.currentFitnessLevel && !app.trainingExperience && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Current Level (legacy)</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0 }}>{app.currentFitnessLevel}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Restart requests section */}
      {restartRequests.length > 0 && (
        <div style={{ marginTop: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
            <h2 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.6rem", fontWeight: 700, color: cream, margin: 0 }}>Restart Requests</h2>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: "50%", background: "#d97460", color: "#fff", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", fontWeight: 700 }}>
              {restartRequests.length}
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: muted, marginBottom: "1rem" }}>
            Former clients who want to re-enroll. Go to their client profile to set a new price + commitment and approve.
          </p>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {restartRequests.map((req) => (
              <div key={req.id} style={{ background: "#161616", border: `1px solid #4a2a1a`, borderRadius: 8, padding: "1.25rem 1.5rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.9rem", fontWeight: 600, color: cream }}>{req.displayName}</span>
                      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, color: "#d97460", border: `1px solid #d9746044`, padding: "2px 8px", borderRadius: 3 }}>Restart Request</span>
                    </div>
                    <div style={{ display: "flex", gap: 12 }}>
                      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: muted }}>{req.email}</span>
                      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: muted }}>{timeAgo(req.submittedAt)}</span>
                    </div>
                  </div>
                  {restartApprovedUrls[req.id] ? (
                    <button
                      onClick={() => copyRestartUrl(restartApprovedUrls[req.id], req.id)}
                      style={{ background: "#5c9e6a", border: "none", color: "#fff", padding: "8px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", borderRadius: 4, flexShrink: 0 }}
                    >
                      {copiedRestartId === req.id ? "Copied ✓" : "Copy Accept Link"}
                    </button>
                  ) : (
                    <Link
                      href={`/admin/coaching/clients/${encodeURIComponent(req.email)}`}
                      style={{ color: muted, fontSize: "0.72rem", textDecoration: "none", flexShrink: 0 }}
                    >
                      View history →
                    </Link>
                  )}
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: gold, margin: "0 0 3px" }}>What they want help with</p>
                    <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.82rem", color: cream, margin: 0, lineHeight: 1.5 }}>{req.helpWith}</p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                    <div>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Timeline</p>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0 }}>{timelineLabels[req.timeline] ?? req.timeline}</p>
                    </div>
                    {req.previousPriceInCents != null && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Previous price</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0 }}>{formatPrice(req.previousPriceInCents)}/mo</p>
                      </div>
                    )}
                    {req.previousCommitmentType && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Previous commitment</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0 }}>
                          {req.previousCommitmentType === "THREE_MONTH_MINIMUM" ? "3-month minimum" : "Month-to-month"}
                        </p>
                      </div>
                    )}
                    {req.previousCancellationDate && (
                      <div>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Last active through</p>
                        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0 }}>{formatDate(req.previousCancellationDate)}</p>
                      </div>
                    )}
                  </div>
                  {req.changedSince && (
                    <div>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>What&apos;s changed since last time</p>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#bbb", margin: 0, lineHeight: 1.5 }}>{req.changedSince}</p>
                    </div>
                  )}
                  {req.previousCancellationReason && (
                    <div>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Previous cancellation reason</p>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#888", margin: 0, lineHeight: 1.5 }}>{req.previousCancellationReason}</p>
                    </div>
                  )}

                  {/* Approval form — shown unless already approved this session */}
                  {!restartApprovedUrls[req.id] && (
                    <div style={{ borderTop: `1px solid ${border}`, marginTop: 8, paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: gold, margin: 0 }}>Approve with new terms</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                          <span style={{ background: "#0a0a0a", border: `1px solid ${border}`, borderRight: "none", padding: "7px 10px", fontSize: "0.75rem", color: "#555" }}>$</span>
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            value={restartPrices[req.id] ?? ""}
                            onChange={(e) => setRestartPrices((p) => ({ ...p, [req.id]: e.target.value }))}
                            placeholder="New monthly price"
                            style={{ background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "7px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", outline: "none", width: 140 }}
                          />
                        </div>
                        <select
                          value={restartCommitments[req.id] ?? ""}
                          onChange={(e) => {
                            const nextCommitment = e.target.value as CommitmentType | ""
                            setRestartCommitments((c) => ({ ...c, [req.id]: nextCommitment }))
                            if (nextCommitment === "THREE_MONTH_MINIMUM" || nextCommitment === "MONTH_TO_MONTH") {
                              setRestartPrices((p) => ({ ...p, [req.id]: nextPriceForCommitmentChange(p[req.id] ?? "", nextCommitment) }))
                            }
                          }}
                          style={{ background: "#111", border: `1px solid ${!restartCommitments[req.id] ? "#6b4a20" : border}`, color: restartCommitments[req.id] ? "#f0e6d3" : "#888", padding: "7px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", outline: "none", cursor: "pointer" }}
                        >
                          <option value="">— Commitment —</option>
                          <option value="THREE_MONTH_MINIMUM">3-month minimum</option>
                          <option value="MONTH_TO_MONTH">Month-to-month</option>
                        </select>
                        <button
                          onClick={() => {
                            const priceStr = restartPrices[req.id] ?? ""
                            const price = parseFloat(priceStr)
                            if (!price || price < 1) { alert("Enter a monthly price before approving."); return }
                            if (!restartCommitments[req.id]) { alert("Select a commitment type before approving."); return }
                            setRestartConfirmingId(req.id)
                          }}
                          disabled={approvingRestart === req.id}
                          style={{ background: gold, border: "none", color: "#111", padding: "7px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", borderRadius: 4 }}
                        >
                          {approvingRestart === req.id ? "Sending…" : "Approve →"}
                        </button>
                      </div>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem", color: muted, margin: 0, lineHeight: 1.5 }}>
                        Old deal is context only — set new price + commitment above. Client receives accept link; you copy it to send.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restart approval confirmation modal */}
      {restartConfirmingId && (() => {
        const req = restartRequests.find((r) => r.id === restartConfirmingId)
        if (!req) return null
        const priceStr = restartPrices[restartConfirmingId] ?? ""
        const price = parseFloat(priceStr) || 0
        const commitment = restartCommitments[restartConfirmingId]
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 24 }}>
            <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "2rem", maxWidth: 440, width: "100%" }}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, margin: "0 0 12px" }}>Confirm Restart Approval</p>
              <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", color: "#f0e6d3", margin: "0 0 6px" }}>{req.displayName}</p>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: muted, margin: "0 0 20px" }}>Former client — existing account will be reactivated, no duplicate account created.</p>
              <div style={{ background: "#0a0a0a", border: `1px solid #2a2a2a`, borderLeft: `3px solid ${gold}`, padding: "14px 16px", marginBottom: 20, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem", color: "#888" }}>New monthly price</span>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.9rem", fontWeight: 700, color: "#f0e6d3" }}>${price.toFixed(2)}/mo</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem", color: "#888" }}>New commitment</span>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.9rem", fontWeight: 700, color: "#f0e6d3" }}>
                    {commitment === "THREE_MONTH_MINIMUM" ? "3-month minimum" : "Month-to-month"}
                  </span>
                </div>
                {req.previousPriceInCents != null && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem", color: "#555" }}>Previous price (reference only)</span>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: "#555" }}>${(req.previousPriceInCents / 100).toFixed(0)}/mo</span>
                  </div>
                )}
              </div>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "#666", lineHeight: 1.6, margin: "0 0 20px" }}>
                Client will receive a &ldquo;Welcome back&rdquo; email with the accept link. The old coaching price and commitment are history only — these new terms take effect.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setRestartConfirmingId(null)} style={{ flex: 1, background: "transparent", border: `1px solid ${border}`, color: "#888", padding: "10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", cursor: "pointer", borderRadius: 4 }}>
                  Go back
                </button>
                <button onClick={() => confirmApproveRestart(restartConfirmingId)} style={{ flex: 1, background: gold, border: "none", color: "#111", padding: "10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>
                  Confirm &amp; Send Accept Link
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Approval confirmation modal */}
      {confirmingId && (() => {
        const app = applications.find((a) => a.id === confirmingId)
        if (!app) return null
        const priceStr = prices[confirmingId] ?? ""
        const price = parseFloat(priceStr) || 0
        const commitment = commitments[confirmingId]
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 24 }}>
            <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "2rem", maxWidth: 440, width: "100%" }}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, margin: "0 0 12px" }}>Confirm Approval</p>
              <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", color: "#f0e6d3", margin: "0 0 20px" }}>{app.name}</p>
              <div style={{ background: "#0a0a0a", border: `1px solid #2a2a2a`, borderLeft: `3px solid ${gold}`, padding: "14px 16px", marginBottom: 20, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem", color: "#888" }}>Monthly price</span>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.9rem", fontWeight: 700, color: "#f0e6d3" }}>${price.toFixed(2)}/mo</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem", color: "#888" }}>Commitment</span>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.9rem", fontWeight: 700, color: "#f0e6d3" }}>
                    {commitment === "THREE_MONTH_MINIMUM" ? "3-month minimum" : "Month-to-month"}
                  </span>
                </div>
                {app.bundleCredit?.available && price > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.62rem", color: "#888" }}>First month (after credit)</span>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.9rem", fontWeight: 700, color: gold }}>${Math.max(0, price - app.bundleCredit.amountCents / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "#666", lineHeight: 1.6, margin: "0 0 20px" }}>
                These terms will be shown on the client&apos;s acceptance screen and stored as their contractual agreement. Double-check before confirming.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setConfirmingId(null)} style={{ flex: 1, background: "transparent", border: `1px solid ${border}`, color: "#888", padding: "10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", cursor: "pointer", borderRadius: 4 }}>
                  Go back
                </button>
                <button onClick={() => confirmApprove(confirmingId)} style={{ flex: 1, background: gold, border: "none", color: "#111", padding: "10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>
                  Confirm &amp; Send Payment Link
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
