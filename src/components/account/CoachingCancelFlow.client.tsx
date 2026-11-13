"use client"
import { useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"

const gold = "#c9a96e"
const border = "#2a2a2a"
const coral = "#d97460"
const font = "var(--font-montserrat), sans-serif"

export type PlannedPayment = { date: string; amountCents: number | null }

export const CANCEL_REASONS = [
  "Too expensive right now",
  "Not enough time",
  "Not seeing the results I expected",
  "Taking a break",
  "Personal circumstances",
  "Other",
] as const

export type CancelOutcome =
  | { kind: "scheduled"; endsAt: string; remainingPayments: PlannedPayment[] }
  | { kind: "pending"; requestedAt: string | null }
  | { kind: "kept" }

type Props = {
  complimentary: boolean
  // The current state of any cancellation.
  status: "none" | "pending" | "scheduled"
  requestedAt: string | null
  // What cancelling now would mean, if it can be established. Null: the
  // request is still accepted and stays pending until the date is confirmed.
  endsAt: string | null
  commitmentEndsAt: string | null
  remainingPayments: PlannedPayment[]
  onChange: (o: CancelOutcome) => void
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export function formatMoney(cents: number): string {
  const dollars = cents / 100
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

export function paymentList(payments: PlannedPayment[]): string {
  const items = payments.map((p) => `${p.amountCents != null ? formatMoney(p.amountCents) : "the amount on your invoice"} on ${formatDate(p.date)}`)
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

async function authHeaders(): Promise<Record<string, string>> {
  const session = await fetchAuthSession()
  return { Authorization: `Bearer ${session.tokens?.accessToken?.toString() ?? ""}`, "Content-Type": "application/json" }
}

const text = { fontSize: "0.75rem", color: "#888", lineHeight: 1.7, margin: 0 } as const
const outline = (color: string, disabled = false) => ({ background: "transparent", border: `1px solid ${color}`, color, padding: "10px 18px", fontFamily: font, fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 })

// The client's way to end their coaching. Personal, but never in the way:
// "Continue with cancellation" is shown alongside every other option, reasons
// are optional, and nothing needs a reply from Lisa.
export function CoachingCancelFlow(p: Props) {
  const [step, setStep] = useState<"idle" | "choose" | "talk" | "talk-sent" | "cancel">("idle")
  const [reason, setReason] = useState("")
  const [feedback, setFeedback] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function cancel() {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch("/api/coaching/cancel", {
        method: "POST",
        headers: await authHeaders(),
        // The time zone lets the confirmation email name the same end date this page shows.
        body: JSON.stringify({ reason: reason || undefined, feedback: feedback || undefined, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; pending?: boolean; requestedAt?: string; effectiveDate?: string; remainingPayments?: PlannedPayment[] }
      if (res.ok && data.ok && data.effectiveDate) {
        p.onChange({ kind: "scheduled", endsAt: data.effectiveDate, remainingPayments: data.remainingPayments ?? [] })
        setStep("idle")
      } else if (data.pending) {
        p.onChange({ kind: "pending", requestedAt: data.requestedAt ?? null })
        setStep("idle")
      } else {
        setErr(data.error ?? "Something went wrong. Please try again, or email contact@lisafitmethod.com.")
      }
    } catch {
      setErr("Something went wrong. Please try again, or email contact@lisafitmethod.com.")
    }
    setBusy(false)
  }

  async function sendMessage() {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch("/api/coaching/talk-first", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ message }) })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) setStep("talk-sent")
      else setErr(data.error ?? "Your message didn't send. Please try again, or email contact@lisafitmethod.com.")
    } catch {
      setErr("Your message didn't send. Please try again, or email contact@lisafitmethod.com.")
    }
    setBusy(false)
  }

  async function keep() {
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch("/api/coaching/reactivate", { method: "POST", headers: await authHeaders(), body: "{}" })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) p.onChange({ kind: "kept" })
      else setErr(data.error ?? "Something went wrong. Please email contact@lisafitmethod.com.")
    } catch {
      setErr("Something went wrong. Please try again.")
    }
    setBusy(false)
  }

  const errorLine = err && <p role="alert" style={{ ...text, fontSize: "0.72rem", color: "#ff9080" }}>{err}</p>
  const section = { borderTop: `1px solid ${border}`, paddingTop: 16, marginTop: 4, display: "grid", gap: 12 } as const

  if (p.status === "pending") {
    return (
      <div style={section}>
        <p style={text}>
          Your cancellation request was received{p.requestedAt ? ` on ${formatDate(p.requestedAt)}` : ""}. I&apos;m confirming your end date, and you&apos;ll get an email as soon as it&apos;s confirmed. Your coaching continues in the meantime.
        </p>
        {errorLine}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={cancel} disabled={busy} style={outline(gold, busy)}>{busy ? "Checking…" : "Check again"}</button>
          {!p.complimentary && <button type="button" onClick={keep} disabled={busy} style={outline("#888", busy)}>Keep my coaching</button>}
        </div>
      </div>
    )
  }

  if (p.status === "scheduled") {
    return (
      <div style={section}>
        {p.remainingPayments.length > 0 && (
          <p style={text}>Committed payments still to come: {paymentList(p.remainingPayments)}. Nothing is charged after that.</p>
        )}
        {p.complimentary ? (
          <p style={text}>Your coaching is scheduled to end. If you&apos;d like to keep going, message me and we&apos;ll sort it out.</p>
        ) : (
          <>
            <p style={text}>Your coaching is scheduled to end. If you&apos;d like to continue, you can remove the cancellation at any time before your access ends.</p>
            {errorLine}
            <button type="button" onClick={keep} disabled={busy} style={{ justifySelf: "start", background: gold, border: "none", color: "#0a0a0a", padding: "10px 20px", fontFamily: font, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1 }}>
              {busy ? "Updating…" : "Keep my coaching →"}
            </button>
          </>
        )}
      </div>
    )
  }

  if (step === "idle") {
    return (
      <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16, marginTop: 4 }}>
        <button type="button" onClick={() => setStep("choose")} style={{ background: "transparent", border: "none", color: "#888", fontSize: "0.7rem", cursor: "pointer", padding: 0, textDecoration: "underline", fontFamily: font }}>
          Manage or cancel coaching →
        </button>
      </div>
    )
  }

  const continueButton = (
    <button type="button" onClick={() => setStep("cancel")} style={outline(coral)}>Continue with cancellation</button>
  )

  if (step === "choose") {
    return (
      <div style={section}>
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.35rem", color: "#f0e6d3", margin: 0, lineHeight: 1.3 }}>Thinking about ending your coaching?</p>
        <p style={text}>
          I&apos;m sorry to see you go! If something isn&apos;t working for you, whether it&apos;s the price, your schedule, your program or anything else, I&apos;d love to see if we can find a solution that works better for you.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setStep("talk")} style={outline(gold)}>Talk to Lisa first</button>
          {continueButton}
        </div>
        <button type="button" onClick={() => setStep("idle")} style={{ justifySelf: "start", background: "transparent", border: "none", color: "#666", fontSize: "0.68rem", cursor: "pointer", padding: 0, fontFamily: font }}>
          Never mind, go back
        </button>
      </div>
    )
  }

  if (step === "talk" || step === "talk-sent") {
    return (
      <div style={section}>
        {step === "talk" ? (
          <>
            <label htmlFor="talk-first-message" style={{ ...text, color: "#aaa", fontWeight: 600 }}>Tell me what&apos;s going on</label>
            <p style={text}>Your message comes straight to me, and I&apos;ll get back to you within 48 hours. Nothing about your coaching changes.</p>
            <textarea
              id="talk-first-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="For example: the price is hard right now, or my schedule has changed."
              style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#ccc", padding: 10, fontFamily: font, fontSize: "0.75rem", resize: "vertical", boxSizing: "border-box" }}
            />
            {errorLine}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={sendMessage} disabled={busy || !message.trim()} style={outline(gold, busy || !message.trim())}>{busy ? "Sending…" : "Send to Lisa"}</button>
              {continueButton}
            </div>
          </>
        ) : (
          <>
            <p style={{ ...text, color: "#ccc" }}>Thanks, your message is with me. I&apos;ll get back to you within 48 hours.</p>
            <p style={text}>Your coaching hasn&apos;t changed. If you&apos;d still like to cancel, you can do that now or any time.</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{continueButton}</div>
          </>
        )}
      </div>
    )
  }

  // step === "cancel"
  return (
    <div style={section}>
      <p style={{ ...text, color: "#ccc", fontWeight: 600 }}>Cancel coaching</p>
      {p.endsAt ? (
        p.complimentary ? (
          <p style={text}>Your coaching continues through {formatDate(p.endsAt)} and then ends. Nothing is charged.</p>
        ) : p.remainingPayments.length > 0 ? (
          <p style={text}>
            You started with a 3-month minimum{p.commitmentEndsAt ? `, which ends ${formatDate(p.commitmentEndsAt)}` : ""}. {p.remainingPayments.length === 1 ? "Your last committed payment" : "Your remaining committed payments"}: {paymentList(p.remainingPayments)}. Your coaching continues through {formatDate(p.endsAt)}, and then it ends. Nothing is charged after that.
          </p>
        ) : (
          <p style={text}>Your coaching continues through {formatDate(p.endsAt)}, and then it ends. That time is already paid for, and nothing more will be charged.</p>
        )
      ) : (
        <p style={text}>
          I can&apos;t show your exact end date right now. You can still cancel: your request is recorded straight away, and you&apos;ll get an email with your end date as soon as it&apos;s confirmed. Your coaching continues in the meantime.
        </p>
      )}

      <fieldset style={{ border: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
        <legend style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#666", marginBottom: 8, padding: 0 }}>Mind sharing why? (optional)</legend>
        {CANCEL_REASONS.map((r) => (
          <label key={r} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input type="radio" name="cancel-reason" value={r} checked={reason === r} onChange={(e) => setReason(e.target.value)} style={{ accentColor: gold }} />
            <span style={{ fontSize: "0.75rem", color: "#888" }}>{r}</span>
          </label>
        ))}
      </fieldset>
      <label htmlFor="cancel-feedback" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Anything else you&apos;d like me to know? (optional)</label>
      <textarea
        id="cancel-feedback"
        placeholder="Anything else you'd like me to know? (optional)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={3}
        maxLength={2000}
        style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#ccc", padding: 10, fontFamily: font, fontSize: "0.72rem", resize: "vertical", boxSizing: "border-box" }}
      />
      {errorLine}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={cancel} disabled={busy} style={outline(coral, busy)}>{busy ? "Cancelling…" : "Confirm cancellation"}</button>
        <button type="button" onClick={() => { setStep("idle"); setReason(""); setFeedback("") }} style={outline("#888")}>Keep my coaching</button>
      </div>
    </div>
  )
}
