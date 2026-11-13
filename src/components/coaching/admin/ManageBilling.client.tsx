"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import type { ManageView } from "@/lib/billing/actions"
import type { InvoiceSnapshot } from "@/lib/billing/snapshot"
import { CancellationDetails } from "./CancellationDetails.client"

const font = "var(--font-montserrat), sans-serif"
const border = "var(--ca-line)"
const gold = "var(--ca-accent-mark)"

const money = (c: number | null | undefined) => (c == null ? "—" : c % 100 === 0 ? `$${c / 100}` : `$${(c / 100).toFixed(2)}`)
const day = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—")

const KIND: Record<string, string> = {
  MAKE_COMPLIMENTARY: "Made complimentary",
  VOID_INVOICE: "Voided invoice",
  RECORD_PAID: "Recorded as paid",
  SET_COMPLIMENTARY_END: "Changed complimentary end date",
  END_COMPLIMENTARY: "Ended complimentary",
  CLIENT_CANCEL_COMPLIMENTARY: "Client cancelled (complimentary)",
  CANCEL_PAUSED_SUBSCRIPTION: "Cancelled paused subscription",
  CLIENT_CANCEL_PAID: "Client cancelled",
  CLIENT_KEEP_COACHING: "Client kept their coaching",
}
const STATUS_COLOR: Record<string, string> = { COMPLETED: "var(--ca-ok)", FAILED: "var(--ca-warn)", UNCERTAIN: "var(--ca-warn)", PENDING: "var(--ca-muted)", APPLIED: "var(--ca-muted)" }

async function token(): Promise<string> {
  const s = await fetchAuthSession()
  return s.tokens?.accessToken?.toString() ?? ""
}

type Result = { ok: boolean; message: string; blockers?: { message: string }[]; uncertain?: boolean }

const text = (size: string, color = "var(--ca-text)"): React.CSSProperties => ({ fontFamily: font, fontSize: size, color, margin: 0, lineHeight: 1.5 })
const labelStyle: React.CSSProperties = { fontFamily: font, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ca-muted)" }
const button = (primary: boolean, enabled = true): React.CSSProperties => ({
  background: primary && enabled ? "var(--ca-accent)" : "none",
  color: primary && enabled ? "var(--ca-on-accent)" : enabled ? gold : "var(--ca-muted)",
  border: primary && enabled ? "none" : `1px solid ${border}`,
  padding: "8px 14px", fontFamily: font, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
  cursor: enabled ? "pointer" : "not-allowed",
})

// Admin → client → Manage billing. Every figure comes from Stripe on load; a
// change is reported as done only when the server says Stripe confirmed it.
export function ManageBilling({ email, onChanged }: { email: string; onChanged?: () => void }) {
  const [view, setView] = useState<ManageView | null>(null)
  const [loadError, setLoadError] = useState("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [confirming, setConfirming] = useState<null | "complimentary" | "record-paid" | "edit-end" | "end-now" | "cancel-sub" | { invoice: InvoiceSnapshot }>(null)
  // Make Complimentary inputs: a reason is required; the end date is optional.
  const [reason, setReason] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [newEnd, setNewEnd] = useState("")
  const [endNote, setEndNote] = useState("")
  const [understood, setUnderstood] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const load = useCallback(async () => {
    setLoadError("")
    try {
      const res = await fetch(`/api/admin/coaching/billing/manage?email=${encodeURIComponent(email)}`, { headers: { Authorization: `Bearer ${await token()}` } })
      const data = (await res.json()) as { ok?: boolean; view?: ManageView; error?: string }
      if (!res.ok || !data.view) setLoadError(data.error ?? "Billing couldn't be loaded.")
      else setView(data.view)
    } catch {
      setLoadError("Billing couldn't be loaded. Check your connection and try again.")
    }
  }, [email])

  useEffect(() => { load() }, [load])

  async function post(path: string, body: Record<string, unknown>) {
    setBusy(true)
    setResult(null)
    try {
      const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` }, body: JSON.stringify({ email, ...body }) })
      const data = (await res.json().catch(() => ({ ok: false, message: "The server's answer couldn't be read. Reload billing to see what happened." }))) as Result
      setResult(data)
    } catch {
      setResult({ ok: false, message: "The request didn't get an answer. Reload billing to see whether anything changed." })
    }
    setBusy(false)
    setConfirming(null)
    setUnderstood(false)
    setReason("")
    setEndsAt("")
    setNewEnd("")
    setEndNote("")
    await load()
    onChanged?.()
  }

  if (loadError) {
    return (
      <div style={{ padding: "12px 0", display: "grid", gap: 8 }}>
        <p role="alert" style={text("0.75rem", "var(--ca-warn)")}>{loadError}</p>
        <button type="button" onClick={load} style={{ ...button(false), justifySelf: "start" }}>Retry</button>
      </div>
    )
  }
  if (!view) return <p style={{ ...text("0.72rem", "var(--ca-muted)"), padding: "12px 0" }}>Loading billing from Stripe…</p>

  const c = view.collection
  const plan = view.complimentary
  const grant = view.comp.state === "active" ? view.comp : null
  const today = new Date().toISOString().slice(0, 10)
  const canComplimentary = plan.kind === "pause" || plan.kind === "record-only"
  const compLabel = c.state === "out-of-sync-paused" ? "Record as complimentary" : c.state === "out-of-sync-collecting" ? "Pause collection again" : "Make complimentary"
  const outstanding = view.outstanding.filter((i) => i.status === "open" || i.status === "draft")

  return (
    <section aria-label="Manage billing" style={{ border: `1px solid ${border}`, background: "var(--ca-surface)", padding: "16px 18px", marginBottom: 20, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <span style={labelStyle}>Manage billing</span>
        <button type="button" onClick={load} disabled={busy} style={{ ...button(false, !busy), padding: "4px 10px" }}>Refresh</button>
      </div>

      <div style={{ display: "grid", gap: 4 }}>
        <p style={{ ...text("0.95rem"), fontWeight: 700, color: grant ? gold : c.warning ? "var(--ca-warn)" : "var(--ca-text)" }}>{c.label}</p>
        {c.collectedPerMonthCents != null && (
          <p style={text("0.75rem", "var(--ca-muted)")}>
            Collected each month: <strong style={{ color: "var(--ca-text)" }}>{money(c.collectedPerMonthCents)}</strong>
            {c.referencePriceCents != null && c.collectedPerMonthCents !== c.referencePriceCents && <> · subscription price kept for reference: {money(c.referencePriceCents)}/month</>}
          </p>
        )}
        {c.nextCollection && (
          <p style={text("0.75rem", "var(--ca-muted)")}>
            Next payment: <strong style={{ color: "var(--ca-text)" }}>{day(c.nextCollection.date)}</strong>
            {c.nextCollection.amountCents != null && <> · <strong style={{ color: "var(--ca-text)" }}>{money(c.nextCollection.amountCents)}</strong> (Stripe&apos;s preview)</>}
            {c.nextCollection.note && <> · {c.nextCollection.note}</>}
          </p>
        )}
        {grant && (
          <div style={{ display: "grid", gap: 2 }}>
            <p style={text("0.72rem", "var(--ca-muted)")}>Complimentary since {day(grant.since)}{grant.by ? ` · by ${grant.by}` : ""}</p>
            {grant.reason && <p style={text("0.72rem", "var(--ca-muted)")}>Reason: {grant.reason}</p>}
            <p style={text("0.72rem", "var(--ca-muted)")}>
              {grant.endsAt
                ? grant.endsBecause === "client-cancelled" ? `Client cancelled · coaching ends ${day(grant.endsAt)}` : `Ends ${day(grant.endsAt)}`
                : "No end date · complimentary until you change it"}
            </p>
            {view.waivedCommitment?.endDate && <p style={text("0.72rem", "var(--ca-muted)")}>Paid commitment (until {day(view.waivedCommitment.endDate)}) doesn&apos;t apply while complimentary.</p>}
          </div>
        )}
        {c.warning && <p role="alert" style={text("0.75rem", "var(--ca-warn)")}>⚠ {c.warning}</p>}
        {view.notice && <p style={text("0.75rem", "var(--ca-muted)")}>ℹ {view.notice}</p>}
        {view.pending && <p style={text("0.75rem", "var(--ca-warn)")}>A change ({KIND[view.pending.kind] ?? view.pending.kind}) started {day(view.pending.since)} is still being confirmed with Stripe. New changes wait until it settles.</p>}
      </div>

      <CancellationDetails c={view.cancellation} busy={busy || !!view.pending} onFinish={() => post("/api/admin/coaching/billing/finish-cancel", {})} />

      {result && (
        <div role="status" style={{ borderLeft: `3px solid ${result.ok ? "var(--ca-ok)" : "var(--ca-warn)"}`, padding: "8px 12px", background: "var(--ca-bg)" }}>
          <p style={text("0.78rem", result.ok ? "var(--ca-text)" : "var(--ca-warn)")}>{result.message}</p>
          {result.blockers?.map((b, i) => <p key={i} style={text("0.75rem", "var(--ca-warn)")}>• {b.message}</p>)}
        </div>
      )}

      {/* Make complimentary */}
      {plan.kind === "blocked" && plan.blockers[0]?.code !== "already" && (
        <div style={{ display: "grid", gap: 4 }}>
          <p style={text("0.75rem", "var(--ca-muted)")}>Make complimentary isn&apos;t available yet:</p>
          {plan.blockers.map((b) => <p key={b.code} style={text("0.75rem", "var(--ca-warn)")}>• {b.message}</p>)}
        </div>
      )}
      {canComplimentary && confirming !== "complimentary" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" disabled={busy || !!view.pending} onClick={() => { setConfirming("complimentary"); setUnderstood(false); setResult(null) }} style={button(false, !busy && !view.pending)}>{compLabel}</button>
          {c.state === "out-of-sync-collecting" && (
            <button type="button" disabled={busy || !!view.pending} onClick={() => setConfirming("record-paid")} style={button(false, !busy && !view.pending)}>Record as paid</button>
          )}
        </div>
      )}
      {confirming === "complimentary" && canComplimentary && (
        <div style={{ border: `1px solid ${border}`, padding: 14, display: "grid", gap: 8, background: "var(--ca-bg)" }}>
          <p style={{ ...text("0.85rem"), fontWeight: 700 }}>{compLabel}?</p>
          {plan.kind === "pause" ? (
            <>
              <p style={text("0.78rem")}>Stripe will stop collecting payments for subscription {plan.subscription.id}. It stays active, and every invoice it creates is voided straight away, so nothing is charged.</p>
              <p style={text("0.78rem")}>Their coaching, program, nutrition, check-ins, messages and history are unchanged.</p>
              <p style={text("0.78rem")}>The subscription price ({money(plan.referencePriceCents)}/month) is kept for reference. Payments only start again if you resume paid coaching.</p>
              {plan.subscription.currentPeriodEnd && <p style={text("0.78rem")}>The payment due {day(plan.subscription.currentPeriodEnd)} won&apos;t be collected.</p>}
            </>
          ) : (
            <p style={text("0.78rem")}>{plan.reason === "already-paused" ? "Stripe is already not collecting. This records them as complimentary here; nothing is sent to Stripe." : "There's no running Stripe subscription. This records them as complimentary; nothing is sent to Stripe."}</p>
          )}
          {plan.warnings.map((w, i) => <p key={i} style={text("0.75rem", "var(--ca-warn)")}>⚠ {w}</p>)}
          <label htmlFor="comp-reason" style={text("0.75rem")}>Reason (for the record)</label>
          <input id="comp-reason" type="text" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} placeholder="For example: family member, staff, goodwill" style={{ ...text("0.8rem"), padding: "6px 8px", border: `1px solid ${border}`, background: "var(--ca-surface)" }} />
          <label htmlFor="comp-end" style={text("0.75rem")}>End date (optional)</label>
          <input id="comp-end" type="date" value={endsAt} min={today} onChange={(e) => setEndsAt(e.target.value)} style={{ ...text("0.8rem"), padding: "6px 8px", border: `1px solid ${border}`, background: "var(--ca-surface)", justifySelf: "start" }} />
          <p style={text("0.72rem", "var(--ca-muted)")}>{endsAt ? `Coaching access ends after ${day(`${endsAt}T12:00:00Z`)}. Paid billing won't restart on its own.` : "Leave empty to keep them complimentary until you change it."}</p>
          <label style={{ ...text("0.75rem"), display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} style={{ marginTop: 3 }} />
            I understand Stripe will stop collecting from this client, and payments only restart if I set up paid coaching again.
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" disabled={!understood || !reason.trim() || busy} onClick={() => post("/api/admin/coaching/billing/complimentary", { reason, endsAt, confirm: { subscriptionId: plan.kind === "pause" ? plan.subscription.id : null } })} style={button(true, understood && !!reason.trim() && !busy)}>
              {busy ? "Confirming with Stripe…" : compLabel}
            </button>
            <button type="button" disabled={busy} onClick={() => setConfirming(null)} style={button(false, !busy)}>Cancel</button>
          </div>
        </div>
      )}
      {confirming === "record-paid" && (
        <div style={{ border: `1px solid ${border}`, padding: 14, display: "grid", gap: 8, background: "var(--ca-bg)" }}>
          <p style={text("0.78rem")}>Stripe is collecting from this client, but they&apos;re marked complimentary here. Record them as paid to match Stripe? Nothing is sent to Stripe.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" disabled={busy} onClick={() => post("/api/admin/coaching/billing/record-paid", {})} style={button(true, !busy)}>Record as paid</button>
            <button type="button" disabled={busy} onClick={() => setConfirming(null)} style={button(false, !busy)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Change or end an active complimentary grant (no Stripe change, never resumes billing) */}
      {grant && confirming !== "edit-end" && confirming !== "end-now" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" disabled={busy || !!view.pending} onClick={() => { setConfirming("edit-end"); setNewEnd(grant.endsAt ? grant.endsAt.slice(0, 10) : ""); setResult(null) }} style={button(false, !busy && !view.pending)}>Change end date</button>
          <button type="button" disabled={busy || !!view.pending} onClick={() => { setConfirming("end-now"); setEndNote(""); setResult(null) }} style={button(false, !busy && !view.pending)}>End complimentary now…</button>
        </div>
      )}
      {grant && confirming === "edit-end" && (
        <div style={{ border: `1px solid ${border}`, padding: 14, display: "grid", gap: 8, background: "var(--ca-bg)" }}>
          <label htmlFor="comp-new-end" style={text("0.78rem")}>New end date</label>
          <input id="comp-new-end" type="date" value={newEnd} min={today} onChange={(e) => setNewEnd(e.target.value)} style={{ ...text("0.8rem"), padding: "6px 8px", border: `1px solid ${border}`, background: "var(--ca-surface)", justifySelf: "start" }} />
          <p style={text("0.72rem", "var(--ca-muted)")}>{grant.endsBecause === "client-cancelled" ? "The client cancelled; the end date can be brought forward, not extended." : "Leave empty for no end date. Nothing changes in Stripe."}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" disabled={busy} onClick={() => post("/api/admin/coaching/billing/complimentary-end", { action: "set-end-date", endsAt: newEnd })} style={button(true, !busy)}>{newEnd ? "Save end date" : "Remove end date"}</button>
            <button type="button" disabled={busy} onClick={() => setConfirming(null)} style={button(false, !busy)}>Cancel</button>
          </div>
        </div>
      )}
      {grant && confirming === "end-now" && (
        <div style={{ border: `1px solid ${border}`, padding: 14, display: "grid", gap: 8, background: "var(--ca-bg)" }}>
          <p style={{ ...text("0.85rem"), fontWeight: 700 }}>End complimentary coaching now?</p>
          <p style={text("0.78rem")}>Their coaching access ends now. Their data stays. Stripe stays paused and nothing is charged; paid billing is not resumed.</p>
          <label htmlFor="comp-end-note" style={text("0.75rem")}>Note (for the record)</label>
          <input id="comp-end-note" type="text" value={endNote} maxLength={500} onChange={(e) => setEndNote(e.target.value)} style={{ ...text("0.8rem"), padding: "6px 8px", border: `1px solid ${border}`, background: "var(--ca-surface)" }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" disabled={busy || !endNote.trim()} onClick={() => post("/api/admin/coaching/billing/complimentary-end", { action: "end-now", note: endNote })} style={button(true, !busy && !!endNote.trim())}>End complimentary</button>
            <button type="button" disabled={busy} onClick={() => setConfirming(null)} style={button(false, !busy)}>Keep it</button>
          </div>
        </div>
      )}

      {/* After complimentary has ended: optionally cancel the paused Stripe subscription */}
      {view.cancelPausedSubscription && confirming !== "cancel-sub" && (
        <button type="button" disabled={busy || !!view.pending} onClick={() => { setConfirming("cancel-sub"); setResult(null) }} style={{ ...button(false, !busy && !view.pending), justifySelf: "start" }}>Cancel paused Stripe subscription…</button>
      )}
      {view.cancelPausedSubscription && confirming === "cancel-sub" && (
        <div style={{ border: `1px solid ${border}`, padding: 14, display: "grid", gap: 8, background: "var(--ca-bg)" }}>
          <p style={{ ...text("0.85rem"), fontWeight: 700 }}>Cancel the paused subscription?</p>
          <p style={text("0.78rem")}>Stripe subscription {view.cancelPausedSubscription.subscriptionId} ends now. Nothing is charged or refunded. Outstanding invoices, if any, stay as they are and are handled separately.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" disabled={busy} onClick={() => post("/api/admin/coaching/billing/complimentary-end", { action: "cancel-paused-subscription", confirm: { subscriptionId: view.cancelPausedSubscription!.subscriptionId } })} style={button(true, !busy)}>{busy ? "Confirming with Stripe…" : "Cancel subscription"}</button>
            <button type="button" disabled={busy} onClick={() => setConfirming(null)} style={button(false, !busy)}>Keep it</button>
          </div>
        </div>
      )}

      {/* Outstanding invoices */}
      {outstanding.length > 0 && (
        <div style={{ display: "grid", gap: 6 }}>
          <span style={labelStyle}>Outstanding invoices ({outstanding.length})</span>
          <p style={text("0.72rem", "var(--ca-muted)")}>Stripe keeps trying to collect these until they&apos;re paid or voided. Making someone complimentary doesn&apos;t change them.</p>
          {outstanding.map((inv) => {
            const isConfirming = typeof confirming === "object" && confirming?.invoice.id === inv.id
            return (
              <div key={inv.id} style={{ borderTop: `1px solid ${border}`, paddingTop: 8, display: "grid", gap: 6 }}>
                <p style={text("0.75rem")}>
                  {inv.number ?? inv.id} · <strong>{money(inv.amountRemainingCents || inv.amountDueCents)}</strong> · {inv.status} · created {day(inv.createdAt)}
                  {inv.attemptCount > 0 && <> · {inv.attemptCount} attempt{inv.attemptCount === 1 ? "" : "s"}</>}
                  {inv.nextPaymentAttempt && <> · next try {day(inv.nextPaymentAttempt)}</>}
                  {inv.paymentProcessing && <> · payment processing</>}
                </p>
                {inv.status === "open" && !isConfirming && (
                  <button type="button" disabled={busy || !!view.pending || inv.paymentProcessing} onClick={() => setConfirming({ invoice: inv })} style={{ ...button(false, !busy && !view.pending && !inv.paymentProcessing), justifySelf: "start" }}>Void this invoice…</button>
                )}
                {inv.status === "draft" && <p style={text("0.72rem", "var(--ca-muted)")}>Draft invoices can&apos;t be voided here; Stripe finalizes them first.</p>}
                {isConfirming && (
                  <div style={{ border: `1px solid ${border}`, padding: 12, display: "grid", gap: 8, background: "var(--ca-bg)" }}>
                    <p style={text("0.78rem")}>Void invoice {inv.number ?? inv.id} for {money(inv.amountRemainingCents)}? Stripe stops trying to collect it. Nothing is refunded, and paid invoices are never touched.</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" disabled={busy} onClick={() => post("/api/admin/coaching/billing/void-invoice", { invoiceId: inv.id, amountRemainingCents: inv.amountRemainingCents })} style={button(true, !busy)}>{busy ? "Confirming with Stripe…" : "Void invoice"}</button>
                      <button type="button" disabled={busy} onClick={() => setConfirming(null)} style={button(false, !busy)}>Keep it</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* History */}
      {view.history.length > 0 && (
        <div style={{ display: "grid", gap: 6 }}>
          <button type="button" onClick={() => setShowHistory((v) => !v)} style={{ background: "none", border: "none", padding: 0, color: gold, fontFamily: font, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", justifySelf: "start" }}>
            {showHistory ? "Hide" : "Show"} billing changes ({view.history.length})
          </button>
          {showHistory && view.history.map((h) => (
            <div key={h.id} style={{ borderTop: `1px solid ${border}`, paddingTop: 6 }}>
              <p style={text("0.75rem")}>
                <strong>{KIND[h.kind] ?? h.kind}</strong> · {day(h.requestedAt)} · {h.requestedBy} · <span style={{ color: STATUS_COLOR[h.status] ?? "var(--ca-muted)" }}>{h.status.toLowerCase()}</span>
              </p>
              <p style={text("0.72rem", "var(--ca-muted)")}>
                {Object.entries(h.before).map(([k, v]) => `${k}: ${v ?? "—"}`).join(", ")} → {Object.entries(h.target).map(([k, v]) => `${k}: ${v ?? "—"}`).join(", ")}
              </p>
              {h.stripeResult && <p style={text("0.72rem", "var(--ca-muted)")}>Stripe: {h.stripeResult}</p>}
              {h.error && <p style={text("0.72rem", "var(--ca-warn)")}>{h.error}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
