"use client"

import { useEffect, useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import type { CommitmentType } from "@/lib/authTokens"
import { CREDIT_BLOCK_TEXT, formatCents, planBundleCredit, reservationIsLive } from "@/lib/bundleCredit"
import type { PaymentSummary as Summary } from "@/lib/paymentSummary"

const text = "var(--ca-text, #f0e6d3)"
const muted = "var(--ca-muted, #888)"
const line = "var(--ca-line, #2a2a2a)"
const accent = "var(--ca-accent-mark, #c9a96e)"
const ok = "var(--ca-ok, #5c9e6a)"
const warn = "var(--ca-warn, #d97460)"
const sans = "var(--font-montserrat), sans-serif"

const COMMITMENT_LABEL: Record<CommitmentType, string> = {
  THREE_MONTH_MINIMUM: "3-month",
  MONTH_TO_MONTH: "month-to-month",
}

function day(iso: string | null | undefined): string {
  if (!iso) return "unknown date"
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function calendarDay(ymd: string): string {
  return day(`${ymd}T12:00:00Z`)
}

function when(iso: string | null): string {
  if (!iso) return "unknown time"
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

function Row({ label, value, strong, color }: { label: string; value: string; strong?: boolean; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
      <span style={{ fontFamily: sans, fontSize: "0.66rem", color: muted }}>{label}</span>
      <span style={{ fontFamily: sans, fontSize: strong ? "0.85rem" : "0.72rem", fontWeight: strong ? 700 : 500, color: color ?? text, textAlign: "right" }}>{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: `1px solid ${line}`, paddingTop: 10, display: "grid", gap: 5 }}>
      <p style={{ fontFamily: sans, fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: accent, margin: 0 }}>{title}</p>
      {children}
    </div>
  )
}

function Note({ children, color }: { children: React.ReactNode; color?: string }) {
  return <p style={{ fontFamily: sans, fontSize: "0.68rem", color: color ?? muted, margin: 0, lineHeight: 1.55 }}>{children}</p>
}

// Read-only summary of what this person has paid and what the first coaching
// month will cost. With onApplyChoice it also shows Lisa's bundle-credit
// tick-box for the approval screen. Nothing here charges or sends anything.
export function PaymentSummaryPanel({ email, applicationId, commitment, priceCents, applyChoice, onApplyChoice, sendLabel }: {
  email: string
  applicationId?: string | null
  commitment?: CommitmentType | null
  priceCents?: number | null
  applyChoice?: boolean | null
  onApplyChoice?: (apply: boolean) => void
  sendLabel?: string
}) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setSummary(null)
    setError(null)
    ;(async () => {
      try {
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString() ?? ""
        const params = new URLSearchParams({ email })
        if (applicationId) params.set("applicationId", applicationId)
        const res = await fetch(`/api/admin/coaching/payment-summary?${params}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
        const data = await res.json() as { summary?: Summary; error?: string }
        if (cancelled) return
        if (!res.ok || !data.summary) setError(data.error ?? "Couldn't load the payment summary.")
        else setSummary(data.summary)
      } catch {
        if (!cancelled) setError("Couldn't load the payment summary.")
      }
    })()
    return () => { cancelled = true }
  }, [email, applicationId])

  const effectiveCommitment = commitment !== undefined && commitment !== null ? commitment : summary?.current.commitmentType ?? null
  const effectivePrice = priceCents !== undefined && priceCents !== null ? priceCents : summary?.current.priceCents ?? null
  const plan = summary
    ? planBundleCredit({
        ...summary.facts,
        now: new Date().toISOString(),
        commitmentType: effectiveCommitment,
        priceCents: effectivePrice,
        applyChoice: applyChoice !== undefined ? applyChoice : summary.storedChoice,
      })
    : null

  if (error) return <Note color={warn}>{error} Nothing has been charged or sent.</Note>
  if (!summary || !plan) return <Note>Checking Stripe…</Note>

  const p = summary.purchase
  const usage = summary.usage
  const live = reservationIsLive(usage, new Date().toISOString())
  const showChoice = !!onApplyChoice && plan.eligible && effectiveCommitment === "THREE_MONTH_MINIMUM" && effectivePrice !== null && plan.eligibleCreditCents > 0

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <Section title="Bundle purchase">
        {!p ? (
          <Note>No Complete Foundations Bundle purchase on file.</Note>
        ) : !p.verified ? (
          <>
            <Row label="Bought" value={day(p.purchasedAt)} />
            <Note color={warn}>Couldn&apos;t verify: {p.unverifiedReason ?? "unknown reason"}. No credit is applied automatically.</Note>
          </>
        ) : (
          <>
            <Row label="Bought" value={day(p.purchasedAt)} />
            <Row label="Paid" value={formatCents(p.paidCents ?? 0)} />
            <Row label="Refunded" value={formatCents(p.refundedCents ?? 0)} />
            <Row label="Kept (net)" value={formatCents(p.netCents ?? 0)} strong />
            {p.dispute === "lost" && <Note color={warn}>The payment was disputed and the dispute was lost.</Note>}
            {p.dispute === "open" && <Note color={warn}>The payment has an open dispute.</Note>}
          </>
        )}
      </Section>

      {p && (
        <Section title="Bundle credit">
          {usage.usedAt ? (
            <Note>Already used on {day(usage.usedAt)}: {formatCents(usage.usedAmountCents ?? 0)} off invoice {usage.usedForInvoiceId ?? "(unknown)"}.</Note>
          ) : live ? (
            <Note>
              {usage.reservedForApplicationId === summary.facts.applicationId
                ? `Held for this application's open checkout until ${when(usage.reservedUntil)}. Not used yet.`
                : `Held for another application's open checkout until ${when(usage.reservedUntil)}. Not used yet.`}
            </Note>
          ) : null}
          {plan.eligible ? (
            <>
              <Row label="Eligible credit" value={formatCents(plan.eligibleCreditCents)} strong color={ok} />
              {plan.applyBy && (
                <Note>Application sent {day(summary.facts.applicationDate)}, inside the {plan.windowDays}-day window (it closes {calendarDay(plan.applyBy)}).</Note>
              )}
            </>
          ) : (
            <>
              <Row label="Eligible credit" value="None" />
              {plan.blocks.map((b) => <Note key={b}>{CREDIT_BLOCK_TEXT[b]}</Note>)}
            </>
          )}
        </Section>
      )}

      <Section title="Previous coaching payments">
        {!summary.coachingPayments.verified ? (
          <Note color={warn}>Couldn&apos;t verify: {summary.coachingPayments.reason ?? "unknown reason"}.</Note>
        ) : summary.coachingPayments.invoices.length === 0 ? (
          <Note>No coaching invoices in Stripe.</Note>
        ) : (
          summary.coachingPayments.invoices.slice(0, 6).map((inv) => (
            <Row
              key={inv.id}
              label={`${day(inv.created)} · ${inv.status}`}
              value={`paid ${formatCents(inv.amountPaidCents)}${inv.discountCents > 0 ? ` · ${formatCents(inv.discountCents)} off` : ""}`}
            />
          ))
        )}
      </Section>

      <Section title="First month">
        {effectiveCommitment && (
          <Row label={`Standard price (${COMMITMENT_LABEL[effectiveCommitment]})`} value={`${formatCents(summary.standardPrices[effectiveCommitment])}/month`} />
        )}
        <Row
          label={plan.isCustomPrice ? "Your price (custom)" : "Your price"}
          value={effectivePrice !== null ? `${formatCents(effectivePrice)}/month` : "Not set"}
        />
        {showChoice && (
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer", margin: "4px 0" }}>
            <input type="checkbox" checked={plan.apply} onChange={(e) => onApplyChoice?.(e.target.checked)} style={{ marginTop: 2 }} />
            <span style={{ fontFamily: sans, fontSize: "0.72rem", color: text, lineHeight: 1.5 }}>
              Apply bundle credit of {formatCents(Math.min(plan.eligibleCreditCents, effectivePrice ?? 0))} to the first month
              {plan.isCustomPrice && <span style={{ display: "block", color: muted, fontSize: "0.64rem" }}>Off by default because your price is custom.</span>}
              {plan.eligibleCreditCents > (effectivePrice ?? 0) && <span style={{ display: "block", color: muted, fontSize: "0.64rem" }}>Capped at the first month&apos;s price. The client paid {formatCents(plan.eligibleCreditCents)} for the bundle.</span>}
            </span>
          </label>
        )}
        {effectivePrice !== null && (
          <>
            <Note color={text}>
              {plan.apply ? "Your price, then the bundle credit comes off month one." : "Your price is what the client pays for month one."}
            </Note>
            <Row label="Credit applied" value={plan.appliedCents > 0 ? formatCents(plan.appliedCents) : "None"} />
            <Row label="First month to collect" value={formatCents(plan.firstMonthCents ?? effectivePrice)} strong color={accent} />
            {plan.laterMonthlyCents !== null && plan.laterMonthlyCents !== plan.firstMonthCents && (
              <Row label="Then each month" value={`${formatCents(plan.laterMonthlyCents)}/month`} />
            )}
          </>
        )}
      </Section>

      {sendLabel && <Note>Nothing is charged or sent until you click {sendLabel}.</Note>}
    </div>
  )
}
