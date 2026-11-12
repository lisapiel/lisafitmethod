"use client"

import type { CancellationView } from "@/lib/billing/actions"

const font = "var(--font-montserrat), sans-serif"
const money = (c: number) => (c % 100 === 0 ? `$${c / 100}` : `$${(c / 100).toFixed(2)}`)
const day = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—")
const text = (color = "var(--ca-muted)"): React.CSSProperties => ({ fontFamily: font, fontSize: "0.75rem", color, margin: 0, lineHeight: 1.5 })

// The client's own cancellation, inside Manage billing: when they asked, why
// (if they said), when coaching ends and what is still to be charged.
export function CancellationDetails({ c, busy, onFinish }: { c: CancellationView; busy: boolean; onFinish: () => void }) {
  if (c.status === "none") return null
  const commitment = c.commitment?.type === "THREE_MONTH_MINIMUM" ? `3-month minimum${c.commitment.endDate ? ` until ${day(c.commitment.endDate)}` : " (dates missing)"}` : c.commitment?.type === "MONTH_TO_MONTH" ? "Month-to-month" : "Not recorded"
  return (
    <div role="group" aria-label="Client cancellation" style={{ borderLeft: `3px solid ${c.status === "scheduled" ? "var(--ca-warn)" : "var(--ca-accent-mark)"}`, padding: "8px 12px", background: "var(--ca-bg)", display: "grid", gap: 4 }}>
      <p style={{ ...text("var(--ca-text)"), fontWeight: 700 }}>
        {c.status === "scheduled" ? `Cancellation scheduled · coaching ends ${day(c.endsAt)}` : "Cancellation requested · end date not confirmed yet"}
      </p>
      <p style={text()}>Requested {day(c.requestedAt)}{c.approvedPriceCents != null ? ` · rate ${money(c.approvedPriceCents)}/month` : ""} · {commitment}</p>
      {c.status === "scheduled" && (
        <p style={text()}>
          Still to be charged: {c.remainingPayments.length ? c.remainingPayments.map((p) => `${p.amountCents != null ? money(p.amountCents) : "invoice amount"} on ${day(p.date)}`).join(", ") : "nothing"}
        </p>
      )}
      <p style={text()}>Reason: {c.reason ?? "not given"}</p>
      {c.feedback && <p style={text()}>Comments: “{c.feedback}”</p>}
      {c.status === "requested" && (
        <>
          <p style={text()}>
            The client has been told their request is recorded and being confirmed. Their coaching continues and nothing has changed in Stripe.
            {c.alertedAt ? ` You were alerted ${day(c.alertedAt)}.` : ""} If their commitment wasn&apos;t confirmed, confirm it first, then finish the request here.
          </p>
          {c.canFinish && (
            <button type="button" onClick={onFinish} disabled={busy} style={{ justifySelf: "start", background: "none", border: "1px solid var(--ca-line)", color: busy ? "var(--ca-muted)" : "var(--ca-accent-mark)", padding: "8px 14px", fontFamily: font, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: busy ? "not-allowed" : "pointer" }}>
              Finish cancellation request
            </button>
          )}
        </>
      )}
    </div>
  )
}
