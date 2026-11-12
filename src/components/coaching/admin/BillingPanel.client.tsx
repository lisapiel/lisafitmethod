"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import type { BillingOverview, BillingSubscription, BillingInvoice } from "@/app/api/admin/coaching/billing/route"
import { ManageBilling } from "./ManageBilling.client"

const gold = "var(--ca-accent-mark)"
const border = "var(--ca-line)"

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function fmtMoney(cents: number): string {
  const dollars = cents / 100
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "var(--ca-ok)",
    trialing: gold,
    past_due: "var(--ca-warn)",
    unpaid: "var(--ca-warn)",
    paused: "var(--ca-muted)",
    canceled: "var(--ca-muted)",
  }
  const color = colors[status] ?? "var(--ca-muted)"
  return (
    <span style={{
      fontFamily: "var(--font-montserrat), sans-serif",
      fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em",
      textTransform: "uppercase", color,
    }}>
      {status.replace(/_/g, " ")}
    </span>
  )
}

function SubscriptionRow({ sub }: { sub: BillingSubscription }) {
  const isActive = sub.status === "active" || sub.status === "trialing"
  const paused = sub.pauseBehavior != null
  const willRenew = isActive && !sub.cancelAtPeriodEnd && !sub.cancelAt && !paused
  const hasDiscount = sub.discountPercent != null && sub.discountPercent > 0

  return (
    <div style={{
      padding: "12px 0",
      borderBottom: `1px solid ${border}`,
      display: "grid",
      gridTemplateColumns: "1fr auto",
      gap: "8px 16px",
      alignItems: "start",
    }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
          <StatusPill status={sub.status} />
          {sub.isPrimary && (
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em", color: gold, textTransform: "uppercase" }}>
              linked
            </span>
          )}
          {paused && (
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em", color: gold, textTransform: "uppercase" }}>
              collection paused
            </span>
          )}
          {sub.cancelAtPeriodEnd && (
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em", color: "var(--ca-warn)", textTransform: "uppercase" }}>
              cancels {fmt(sub.currentPeriodEnd)}
            </span>
          )}
          {sub.cancelAt && !sub.cancelAtPeriodEnd && (
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em", color: "var(--ca-warn)", textTransform: "uppercase" }}>
              cancels {fmt(sub.cancelAt)}
            </span>
          )}
        </div>
        <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-muted)" }}>
          {hasDiscount ? (
            <>
              <span style={{ textDecoration: "line-through", opacity: 0.5 }}>{fmtMoney(sub.unitAmountCents)}</span>
              {" "}
              <span style={{ color: "var(--ca-ok)" }}>{fmtMoney(sub.effectiveAmountCents ?? 0)}/{sub.interval}</span>
              <span style={{ marginLeft: 6, fontSize: "0.65rem" }}>({sub.discountPercent}% off)</span>
            </>
          ) : (
            <>{fmtMoney(sub.unitAmountCents)}/{sub.interval}{paused && " price · not collected"}</>
          )}
          {sub.trialEnd && <> · trial ends {fmt(sub.trialEnd)}</>}
          {willRenew && <> · renews {fmt(sub.currentPeriodEnd)}</>}
        </div>
        {sub.warning && (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", color: "var(--ca-warn)", margin: "4px 0 0" }}>
            ⚠ {sub.warning}
          </p>
        )}
      </div>
      <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", color: "var(--ca-muted)", textAlign: "right", whiteSpace: "nowrap" }}>
        {sub.source !== "unknown" ? sub.source : ""}
      </div>
    </div>
  )
}

function InvoiceRow({ inv }: { inv: BillingInvoice }) {
  return (
    <div style={{
      padding: "9px 0",
      borderBottom: `1px solid ${border}`,
      display: "grid",
      gridTemplateColumns: "1fr auto auto",
      gap: "0 12px",
      alignItems: "center",
    }}>
      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-muted)" }}>
        {fmt(inv.paidAt ?? undefined)}
        {inv.number && <span style={{ color: "var(--ca-muted)", marginLeft: 6, fontSize: "0.65rem" }}>{inv.number}</span>}
      </span>
      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-text)", fontVariantNumeric: "tabular-nums" }}>
        {fmtMoney(inv.amountPaidCents)}
      </span>
      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", color: inv.status === "paid" ? "var(--ca-ok)" : "var(--ca-warn)" }}>
        {inv.status}
      </span>
    </div>
  )
}

interface BillingPanelProps {
  email: string
  onLinkSubscription?: () => void
}

export function BillingPanel({ email, onLinkSubscription }: BillingPanelProps) {
  const [billing, setBilling] = useState<BillingOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showInvoices, setShowInvoices] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const res = await fetch(`/api/admin/coaching/billing?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json() as { ok?: boolean; billing?: BillingOverview; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not load billing data")
      } else {
        setBilling(data.billing ?? null)
      }
    } catch {
      setError("Request failed")
    }
    setLoading(false)
  }, [email])

  useEffect(() => { load() }, [load])

  const label = (text: string) => (
    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ca-muted)" }}>
      {text}
    </span>
  )

  const row = (l: string, v: React.ReactNode) => (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, padding: "6px 0", borderBottom: `1px solid ${border}` }}>
      {label(l)}
      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "var(--ca-text)" }}>{v}</span>
    </div>
  )

  if (loading) {
    return (
      <div style={{ padding: "16px 0", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-muted)" }}>
        Loading billing…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: "12px 0" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-warn)", margin: "0 0 8px" }}>{error}</p>
        <button onClick={load} style={{ background: "none", border: `1px solid ${border}`, color: gold, padding: "6px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
          Retry
        </button>
      </div>
    )
  }

  if (!billing) return null

  const hasNoSubscriptions = billing.subscriptions.length === 0
  const isComplimentary = billing.accessType === "complimentary"

  return (
    <div>
      <ManageBilling email={email} onChanged={load} />

      {/* Access type */}
      <div style={{ marginBottom: 16 }}>
        {isComplimentary ? (
          <div style={{ background: "var(--ca-accent-tint)", border: `1px solid ${border}`, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold }}>
              Complimentary access
            </span>
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-muted)" }}>
              No active Stripe subscription required
            </span>
          </div>
        ) : null}

        {billing.multipleActiveWarning && (
          <div style={{ background: "var(--ca-warn-tint, rgba(201,122,62,0.1))", border: `1px solid var(--ca-warn)`, borderLeft: "3px solid var(--ca-warn)", padding: "10px 14px", marginTop: isComplimentary ? 8 : 0 }}>
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-warn)", margin: 0 }}>
              Multiple active subscriptions detected. Review which should remain active.
            </p>
          </div>
        )}
      </div>

      {/* Linked subscription details */}
      {billing.approvedPriceInCents != null && row(
        "Agreed price",
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtMoney(billing.approvedPriceInCents)}/mo</span>
      )}
      {billing.commitmentType && row(
        "Commitment",
        billing.commitmentType === "THREE_MONTH_MINIMUM"
          ? `3-month minimum${billing.subscriptionStartDate ? ` · started ${fmt(billing.subscriptionStartDate)}` : ""}`
          : "Month to month"
      )}
      {billing.cancellationScheduledAt && row(
        "Cancellation",
        <span style={{ color: "var(--ca-warn)" }}>
          Scheduled — access through {fmt(billing.cancellationEffectiveDate)}
        </span>
      )}

      {/* Subscriptions */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          {label(`Stripe subscriptions (${billing.subscriptions.length})`)}
          {hasNoSubscriptions && !isComplimentary && onLinkSubscription && (
            <button
              onClick={onLinkSubscription}
              style={{ background: "none", border: `1px solid ${border}`, color: gold, padding: "5px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Link Stripe Subscription
            </button>
          )}
        </div>

        {hasNoSubscriptions ? (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: "var(--ca-muted)", padding: "10px 0" }}>
            {isComplimentary ? "No Stripe subscription — access is complimentary." : "No Stripe subscription found."}
          </p>
        ) : (
          <div>
            {billing.subscriptions.map((sub) => (
              <SubscriptionRow key={sub.id} sub={sub} />
            ))}
          </div>
        )}
      </div>

      {/* Invoice history */}
      {billing.invoices.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setShowInvoices((v) => !v)}
            style={{ background: "none", border: "none", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", padding: 0 }}
          >
            {showInvoices ? "Hide" : "Show"} payment history ({billing.invoices.length})
          </button>

          {showInvoices && (
            <div style={{ marginTop: 10 }}>
              {billing.invoices.map((inv) => (
                <InvoiceRow key={inv.id} inv={inv} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invoice coverage note — shown when linked sub is under a different customer */}
      {billing.invoiceCoverageNote && (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "var(--ca-muted)", marginTop: 14, marginBottom: 0 }}>
          ℹ {billing.invoiceCoverageNote}
        </p>
      )}

      {/* Stripe customer ID (for reference) */}
      {billing.stripeCustomerId && (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "var(--ca-muted)", marginTop: 8, marginBottom: 0 }}>
          Stripe customer: {billing.stripeCustomerId}
        </p>
      )}
    </div>
  )
}
