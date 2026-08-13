"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { fetchAuthSession } from "aws-amplify/auth"
import AccountDropdown from "@/components/AccountDropdown.client"
import {
  COURSE_PRICE_DISPLAY, COURSE_REGULAR_PRICE_DISPLAY,
  NUTRITION_COURSE_PRICE_DISPLAY, NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
  BUNDLE_PRICE_DISPLAY, BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
  TRACKER_PRICE_DISPLAY,
} from "@/lib/pricing"

const gold = "#c9a96e"
const border = "#2a2a2a"

interface CoachingClientData {
  status?: string | null
  approvedPriceInCents?: number | null
  commitmentType?: string | null
  commitmentMonths?: number | null
  subscriptionStartDate?: string | null
  commitmentNeedsConfirmation?: boolean | null
  stripeSubscriptionId?: string | null
  cancellationScheduledAt?: string | null
  cancellationEffectiveDate?: string | null
  cancellationReason?: string | null
  displayName?: string | null
}

interface Props {
  email: string
  training: boolean
  nutrition: boolean
  tracker: boolean
  masterclass: boolean
  coaching: boolean
  isAdmin: boolean
  coachingClient?: CoachingClientData | null
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function formatPrice(cents: number) {
  const dollars = cents / 100
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

function computeCommitmentEndDate(startIso: string, months: number): string {
  const d = new Date(startIso)
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}

interface LiveSubData {
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  cancelAt: string | null
}

function CoachingBillingSection({ client }: { client: CoachingClientData }) {
  const [liveSub, setLiveSub] = useState<LiveSubData | null>(null)
  const [loadingLive, setLoadingLive] = useState(true)
  const [cancelStep, setCancelStep] = useState<"idle" | "confirm">("idle")
  const [cancelReason, setCancelReason] = useState("")
  const [cancelFeedback, setCancelFeedback] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<"cancelled" | "reactivated" | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString() ?? ""
        const res = await fetch("/api/coaching/subscription", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("fetch failed")
        const data = await res.json() as { subscription?: { currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; cancelAt: string | null } | null }
        if (!cancelled && data.subscription) {
          setLiveSub({
            currentPeriodEnd: data.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: data.subscription.cancelAtPeriodEnd,
            cancelAt: data.subscription.cancelAt,
          })
        }
      } catch { /* live data optional */ }
      if (!cancelled) setLoadingLive(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const commitmentEndDate =
    client.subscriptionStartDate && client.commitmentMonths && client.commitmentMonths > 0
      ? computeCommitmentEndDate(client.subscriptionStartDate, client.commitmentMonths)
      : null

  const commitmentFulfilled = commitmentEndDate ? new Date() >= new Date(commitmentEndDate) : client.commitmentType === "MONTH_TO_MONTH"

  const isCancellationDone = done === "cancelled"
  const isReactivationDone = done === "reactivated"

  const isScheduledToCancel =
    isCancellationDone ||
    (!isReactivationDone && !isCancellationDone && Boolean(client.cancellationScheduledAt || liveSub?.cancelAtPeriodEnd || liveSub?.cancelAt))

  const effectiveDate = client.cancellationEffectiveDate ?? liveSub?.cancelAt ?? liveSub?.cancelAtPeriodEnd ? (client.cancellationEffectiveDate ?? liveSub?.cancelAt ?? liveSub?.currentPeriodEnd) : null
  const nextBilling = liveSub?.currentPeriodEnd

  async function handleCancel() {
    setSubmitting(true)
    setErr(null)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const res = await fetch("/api/coaching/cancel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || undefined, feedback: cancelFeedback || undefined }),
      })
      const data = await res.json() as { ok?: boolean; error?: string; effectiveDate?: string }
      if (!res.ok || !data.ok) {
        setErr(data.error ?? "Something went wrong. Please contact contact@lisafitmethod.com.")
      } else {
        setDone("cancelled")
        setCancelStep("idle")
      }
    } catch {
      setErr("Something went wrong. Please try again.")
    }
    setSubmitting(false)
  }

  async function handleReactivate() {
    setSubmitting(true)
    setErr(null)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const res = await fetch("/api/coaching/reactivate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setErr(data.error ?? "Something went wrong. Please contact contact@lisafitmethod.com.")
      } else {
        setDone("reactivated")
      }
    } catch {
      setErr("Something went wrong. Please try again.")
    }
    setSubmitting(false)
  }

  const priceDisplay = client.approvedPriceInCents ? formatPrice(client.approvedPriceInCents) + "/month" : null

  return (
    <div style={{ marginBottom: 40 }}>
      <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 16 }}>
        Coaching &amp; Billing
      </p>
      <div style={{ background: "#111", border: `1px solid ${border}`, borderLeft: `3px solid ${gold}`, padding: "20px 24px" }}>
        <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: 8 }}>
          1:1 Coaching
          {isScheduledToCancel && !isReactivationDone && (
            <span style={{ marginLeft: 10, color: "#d97460", letterSpacing: "0.1em" }}>· Cancellation scheduled</span>
          )}
          {isReactivationDone && (
            <span style={{ marginLeft: 10, color: "#5c9e6a", letterSpacing: "0.1em" }}>· Active</span>
          )}
        </p>

        {/* Price + commitment summary */}
        <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
          {priceDisplay && (
            <p style={{ fontSize: "0.8rem", color: "#f0e6d3", margin: 0 }}>{priceDisplay}</p>
          )}
          {client.commitmentType === "THREE_MONTH_MINIMUM" && (
            <p style={{ fontSize: "0.75rem", color: "#888", margin: 0 }}>
              {commitmentFulfilled
                ? "Initial 3-month commitment completed — now month-to-month"
                : "3-month minimum commitment"}
            </p>
          )}
          {client.commitmentType === "MONTH_TO_MONTH" && (
            <p style={{ fontSize: "0.75rem", color: "#888", margin: 0 }}>Month-to-month · Cancel anytime before your next billing date</p>
          )}
          {!client.commitmentType && (
            <p style={{ fontSize: "0.75rem", color: "#888", margin: 0 }}>1:1 Coaching</p>
          )}
          {commitmentEndDate && !commitmentFulfilled && (
            <p style={{ fontSize: "0.75rem", color: "#888", margin: 0 }}>
              Commitment ends: {formatDate(commitmentEndDate)}
            </p>
          )}
          {!loadingLive && nextBilling && !isScheduledToCancel && (
            <p style={{ fontSize: "0.75rem", color: "#888", margin: 0 }}>
              Next billing date: {formatDate(nextBilling)}
            </p>
          )}
          {!loadingLive && isScheduledToCancel && !isReactivationDone && effectiveDate && (
            <p style={{ fontSize: "0.75rem", color: "#888", margin: 0 }}>
              Access active through: {formatDate(effectiveDate)}
            </p>
          )}
        </div>

        {err && (
          <p style={{ fontSize: "0.72rem", color: "#ff9080", marginBottom: 12 }}>{err}</p>
        )}

        {/* Manage / cancel section */}
        {!client.commitmentNeedsConfirmation && (
          <>
            {/* Already scheduled — offer reactivation */}
            {isScheduledToCancel && !isReactivationDone && (
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16, marginTop: 4 }}>
                <p style={{ fontSize: "0.72rem", color: "#888", lineHeight: 1.7, marginBottom: 12 }}>
                  Your coaching is scheduled to end. If you&apos;d like to continue, you can remove the cancellation at any time before your access expires.
                </p>
                <button
                  onClick={handleReactivate}
                  disabled={submitting}
                  style={{ background: gold, border: "none", color: "#0a0a0a", padding: "10px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}
                >
                  {submitting ? "Updating…" : "Keep my coaching →"}
                </button>
              </div>
            )}

            {/* Reactivation confirmed */}
            {isReactivationDone && (
              <p style={{ fontSize: "0.75rem", color: "#5c9e6a", marginTop: 8 }}>
                You&apos;re staying. Subscription continues unchanged.
              </p>
            )}

            {/* Cancellation confirmed */}
            {isCancellationDone && (
              <p style={{ fontSize: "0.75rem", color: "#888", marginTop: 8 }}>
                Cancellation scheduled. You&apos;ll receive a confirmation email.
              </p>
            )}

            {/* Not yet scheduled — show manage link */}
            {!isScheduledToCancel && !isCancellationDone && cancelStep === "idle" && (
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16, marginTop: 4 }}>
                <button
                  onClick={() => setCancelStep("confirm")}
                  style={{ background: "transparent", border: "none", color: "#666", fontSize: "0.7rem", cursor: "pointer", padding: 0, textDecoration: "underline", fontFamily: "var(--font-montserrat), sans-serif" }}
                >
                  Manage or cancel coaching →
                </button>
              </div>
            )}

            {/* Cancel confirmation step */}
            {cancelStep === "confirm" && !isScheduledToCancel && (
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16, marginTop: 4 }}>
                {/* Retention copy */}
                <div style={{ background: "#0d0d0d", border: `1px solid ${border}`, padding: "14px 16px", marginBottom: 16 }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 600, color: gold, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>Talk to Lisa about options</p>
                  <p style={{ fontSize: "0.75rem", color: "#888", lineHeight: 1.7, margin: "0 0 8px" }}>
                    If cost, schedule, an injury, your program, or something else is making coaching difficult right now, reach out. I may be able to help.
                  </p>
                  <a href="mailto:contact@lisafitmethod.com" style={{ fontSize: "0.75rem", color: gold, textDecoration: "none" }}>contact@lisafitmethod.com</a>
                </div>

                {/* In-commitment message */}
                {client.commitmentType === "THREE_MONTH_MINIMUM" && !commitmentFulfilled && commitmentEndDate && (
                  <div style={{ background: "#130d00", border: `1px solid #4a3820`, padding: "12px 16px", marginBottom: 16, borderRadius: 2 }}>
                    <p style={{ fontSize: "0.72rem", color: "#c8a97e", lineHeight: 1.7, margin: 0 }}>
                      <strong>Your initial 3-month commitment ends on {formatDate(commitmentEndDate)}.</strong>
                      {" "}You committed to three monthly payments when you enrolled. Any remaining payments in your 3-month commitment will still be processed as scheduled.
                      You will continue receiving coaching and retain access through {formatDate(commitmentEndDate)}.
                    </p>
                  </div>
                )}

                {/* Schedule cancellation heading + effective date */}
                {client.commitmentType === "THREE_MONTH_MINIMUM" && !commitmentFulfilled && commitmentEndDate ? (
                  <p style={{ fontSize: "0.72rem", color: "#888", lineHeight: 1.7, marginBottom: 12 }}>
                    <strong style={{ color: "#aaa" }}>Schedule cancellation</strong><br />
                    Your coaching will remain active through {formatDate(commitmentEndDate)} and will not renew after your initial commitment.
                  </p>
                ) : (
                  <p style={{ fontSize: "0.72rem", color: "#888", lineHeight: 1.7, marginBottom: 12 }}>
                    <strong style={{ color: "#aaa" }}>Cancel coaching</strong><br />
                    Your access remains through {nextBilling ? formatDate(nextBilling) : "your current billing period"} — no further renewals after that.
                  </p>
                )}

                {/* Optional reason */}
                <p style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>Why are you leaving? (optional)</p>
                <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
                  {["Cost", "Schedule / not enough time", "Program isn't the right fit", "Not seeing the results I expected", "Injury or health reason", "Personal circumstances", "Other"].map((reason) => (
                    <label key={reason} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="cancel-reason"
                        value={reason}
                        checked={cancelReason === reason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        style={{ accentColor: gold }}
                      />
                      <span style={{ fontSize: "0.75rem", color: "#888" }}>{reason}</span>
                    </label>
                  ))}
                </div>
                <textarea
                  placeholder="Anything else you'd like me to know? (optional)"
                  value={cancelFeedback}
                  onChange={(e) => setCancelFeedback(e.target.value)}
                  rows={3}
                  style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#888", padding: "10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 14 }}
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    onClick={() => { setCancelStep("idle"); setCancelReason(""); setCancelFeedback("") }}
                    style={{ flex: "0 0 auto", background: "transparent", border: `1px solid ${border}`, color: "#888", padding: "10px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}
                  >
                    Keep my coaching
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={submitting}
                    style={{ flex: "0 0 auto", background: "transparent", border: `1px solid #d97460`, color: "#d97460", padding: "10px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}
                  >
                    {submitting ? "Scheduling…" : "Confirm scheduled cancellation"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Legacy: commitment not yet confirmed by admin */}
        {client.commitmentNeedsConfirmation && (
          <div style={{ borderTop: `1px solid ${border}`, paddingTop: 14, marginTop: 4 }}>
            <p style={{ fontSize: "0.7rem", color: "#666", lineHeight: 1.7, margin: 0 }}>
              To manage or cancel your coaching subscription, please contact{" "}
              <a href="mailto:contact@lisafitmethod.com" style={{ color: gold, textDecoration: "none" }}>
                contact@lisafitmethod.com
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function InactiveCoachingSection({ client, email }: { client: CoachingClientData; email: string }) {
  const [step, setStep] = useState<"idle" | "form" | "submitted">("idle")
  const [helpWith, setHelpWith] = useState("")
  const [changedSince, setChangedSince] = useState("")
  const [timeline, setTimeline] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submitRequest() {
    setSubmitting(true)
    setErr(null)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString() ?? ""
      const res = await fetch("/api/coaching/restart-request", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ helpWith, changedSince: changedSince || undefined, timeline }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setErr(data.error ?? "Something went wrong. Please email contact@lisafitmethod.com.")
      } else {
        setStep("submitted")
      }
    } catch {
      setErr("Something went wrong. Please try again.")
    }
    setSubmitting(false)
  }

  return (
    <div style={{ marginBottom: 40 }}>
      <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 16 }}>
        1:1 Coaching
      </p>
      <div style={{ background: "#111", border: `1px solid ${border}`, borderLeft: `3px solid ${border}`, padding: "20px 24px" }}>

        {step === "submitted" ? (
          <div>
            <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5c9e6a", marginBottom: 10 }}>
              Request sent
            </p>
            <p style={{ fontSize: "0.8rem", color: "#f0e6d3", margin: "0 0 8px" }}>
              {client.displayName?.split(" ")[0] ?? "Thanks"}, I&apos;ll be in touch.
            </p>
            <p style={{ fontSize: "0.75rem", color: "#888", lineHeight: 1.7, margin: 0 }}>
              Your request has been sent. I&apos;ll review it and follow up at {email}.
            </p>
          </div>
        ) : step === "form" ? (
          <div>
            <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: 12 }}>
              Restart coaching
            </p>

            {/* Q1 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#aaa", marginBottom: 8, lineHeight: 1.5 }}>
                What would you like help with this time?
              </label>
              <textarea
                value={helpWith}
                onChange={(e) => setHelpWith(e.target.value)}
                placeholder="Goals, focus areas, what you're working towards…"
                rows={3}
                style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", padding: "10px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>

            {/* Q2 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#aaa", marginBottom: 4, lineHeight: 1.5 }}>
                Has anything changed since your last coaching period? <span style={{ color: "#555", fontWeight: 400 }}>(optional)</span>
              </label>
              <p style={{ fontSize: "0.65rem", color: "#555", margin: "0 0 8px", lineHeight: 1.6 }}>
                Goals, schedule, equipment, injuries or limitations, anything else relevant.
              </p>
              <textarea
                value={changedSince}
                onChange={(e) => setChangedSince(e.target.value)}
                placeholder="Anything you'd like me to know…"
                rows={2}
                style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", padding: "10px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>

            {/* Q3 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#aaa", marginBottom: 8 }}>
                When would you like to restart?
              </label>
              <div style={{ display: "grid", gap: 6 }}>
                {[
                  { value: "asap", label: "As soon as possible" },
                  { value: "few-weeks", label: "Within the next few weeks" },
                  { value: "exploring", label: "Just exploring for now" },
                ].map((opt) => (
                  <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="restart-timeline"
                      value={opt.value}
                      checked={timeline === opt.value}
                      onChange={(e) => setTimeline(e.target.value)}
                      style={{ accentColor: gold }}
                    />
                    <span style={{ fontSize: "0.75rem", color: "#888" }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {err && <p style={{ fontSize: "0.72rem", color: "#ff9080", marginBottom: 10 }}>{err}</p>}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => { setStep("idle"); setErr(null) }}
                style={{ background: "transparent", border: `1px solid ${border}`, color: "#888", padding: "10px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={submitRequest}
                disabled={!helpWith.trim() || !timeline || submitting}
                style={{ background: helpWith.trim() && timeline ? gold : "#333", color: "#0a0a0a", border: "none", padding: "10px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: helpWith.trim() && timeline && !submitting ? "pointer" : "not-allowed", opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? "Sending…" : "Request to restart coaching →"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>
              Coaching inactive
            </p>
            <p style={{ fontSize: "0.78rem", color: "#f0e6d3", margin: "0 0 8px" }}>
              Your Lisa Fit Method account and any products you&apos;ve purchased remain available.
            </p>
            <p style={{ fontSize: "0.72rem", color: "#888", lineHeight: 1.7, margin: "0 0 20px" }}>
              If you&apos;d like to work together again, click below and I&apos;ll follow up with availability and details. No payment yet — I&apos;ll confirm everything before we start.
            </p>
            <button
              onClick={() => setStep("form")}
              style={{ background: gold, border: "none", color: "#0a0a0a", padding: "10px 22px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
            >
              Restart coaching →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface OwnedProduct {
  id: string
  label: string
  desc: string
  href: string
  icon: string
}

interface UpsellProduct {
  id: string
  label: string
  desc: string
  price: string
  regularPrice: string
  href: string
  featured?: boolean
}

export function AccountClient({ email, training, nutrition, tracker, masterclass, coaching, isAdmin, coachingClient }: Props) {

  const owned: OwnedProduct[] = []
  if (coaching) {
    owned.push({
      id: "coaching",
      label: "1:1 Coaching",
      desc: "Your personalised coaching portal — workouts, progress tracking, weekly check-ins, and direct messaging with Lisa.",
      href: "/my-coaching",
      icon: "CO",
    })
  }
  if (masterclass && isAdmin) {
    owned.push({
      id: "masterclass",
      label: "Masterclass",
      desc: "Monthly programming, 361 exercise videos, Q&A with Lisa. New block every month.",
      href: "/masterclass",
      icon: "MC",
    })
  }
  if (training) {
    owned.push({
      id: "training",
      label: "Training Foundations",
      desc: "4-week beginner strength program. 5 movements, progressive overload, workout tracking.",
      href: "/training-foundations",
      icon: "TF",
    })
  }
  if (nutrition) {
    owned.push({
      id: "nutrition",
      label: "Nutrition Foundations",
      desc: "4-week nutrition course with TDEE calculator, meal plan, and real verified recipes.",
      href: "/nutrition-foundations",
      icon: "NF",
    })
  }
  if (tracker) {
    owned.push({
      id: "tracker",
      label: "Progress Tracker",
      desc: "Workout tracker. Build custom days, log every lift, track progress over time.",
      href: "/my-tracker",
      icon: "PT",
    })
  }

  const upsells: UpsellProduct[] = []
  if (!training && !nutrition) {
    upsells.push({
      id: "bundle",
      label: "Foundations Bundle",
      desc: "Training + Nutrition together. The complete system.",
      price: BUNDLE_PRICE_DISPLAY,
      regularPrice: BUNDLE_INDIVIDUAL_TOTAL_DISPLAY,
      href: "/checkout?product=bundle",
      featured: true,
    })
    upsells.push({
      id: "training",
      label: "Training Foundations",
      desc: "4-week beginner strength program.",
      price: COURSE_PRICE_DISPLAY,
      regularPrice: COURSE_REGULAR_PRICE_DISPLAY,
      href: "/checkout",
    })
    upsells.push({
      id: "nutrition",
      label: "Nutrition Foundations",
      desc: "4-week nutrition course.",
      price: NUTRITION_COURSE_PRICE_DISPLAY,
      regularPrice: NUTRITION_COURSE_REGULAR_PRICE_DISPLAY,
      href: "/checkout?product=nutrition",
    })
  } else if (training && !nutrition) {
    upsells.push({
      id: "nutrition",
      label: "Nutrition Foundations",
      desc: "Pair training with the right nutrition. 4-week course, personalized TDEE calculator.",
      price: "$69",
      regularPrice: NUTRITION_COURSE_PRICE_DISPLAY,
      href: "/checkout?product=nutrition&member=1",
      featured: true,
    })
  } else if (nutrition && !training) {
    upsells.push({
      id: "training",
      label: "Training Foundations",
      desc: "Put the nutrition to work. 4-week beginner strength program.",
      price: "$87",
      regularPrice: COURSE_PRICE_DISPLAY,
      href: "/checkout?member=1",
      featured: true,
    })
  }
  if (isAdmin && training && !masterclass) {
    upsells.push({
      id: "masterclass",
      label: "Masterclass",
      desc: "New 3-day block every month. 361 exercise videos. Monthly Q&A. From $16.42/mo on annual.",
      price: "From $197/yr",
      regularPrice: "",
      href: "/masterclass-info",
      featured: true,
    })
  }
  if (training && !tracker) {
    upsells.push({
      id: "tracker",
      label: "Progress Tracker",
      desc: "Build any workout, log every lift, beat last week's numbers. Installs like an app on your home screen. Buy once. No subscription, ever.",
      price: TRACKER_PRICE_DISPLAY,
      regularPrice: TRACKER_PRICE_DISPLAY,
      href: "/tracker-checkout",
    })
  }

  return (
    <main style={{
      background: "#0a0a0a",
      minHeight: "100vh",
      fontFamily: "var(--font-montserrat), sans-serif",
      color: "#f0e6d3",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${border}`,
        padding: "0 40px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/account" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 20, fontWeight: 600, color: "#f0e6d3" }}>
            Lisa <span style={{ color: gold }}>Fit Method</span>
          </span>
        </Link>
        <AccountDropdown />
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Account label */}
        <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "#555", marginBottom: 8 }}>My Account</p>
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 300, color: "#f0e6d3", marginBottom: 4 }}>
          Welcome back.
        </p>
        <p style={{ fontSize: "0.75rem", color: "#555", marginBottom: 40 }}>{email}</p>

        {/* Owned courses */}
        {owned.length > 0 ? (
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 16 }}>
              Your Courses
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {owned.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: "#111",
                    border: `1px solid ${border}`,
                    borderLeft: `3px solid ${gold}`,
                    padding: "20px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: 6 }}>
                      {p.label}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#888", lineHeight: 1.6 }}>{p.desc}</p>
                  </div>
                  <Link
                    href={p.href}
                    style={{
                      display: "inline-block",
                      background: gold,
                      color: "#0a0a0a",
                      fontFamily: "var(--font-montserrat), sans-serif",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      textDecoration: "none",
                      padding: "0.65rem 1.25rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Continue →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 48, background: "#111", border: `1px solid ${border}`, padding: "28px 24px" }}>
            <p style={{ fontSize: "0.75rem", color: "#555", lineHeight: 1.7 }}>
              You don&apos;t have any courses yet. Browse below to get started.
            </p>
          </div>
        )}

        {/* Former client: inactive coaching — show restart flow */}
        {!coaching && coachingClient?.status === "INACTIVE" && (
          <InactiveCoachingSection client={coachingClient} email={email} />
        )}

        {/* Active coaching — billing section with cancel/reactivate controls */}
        {coaching && coachingClient && coachingClient.status !== "INACTIVE" && (
          <CoachingBillingSection client={coachingClient} />
        )}

        {/* No coaching history — show apply CTA */}
        {!coaching && !coachingClient && (
          <div style={{ marginBottom: 40 }}>
            <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 16 }}>
              1:1 Coaching
            </p>
            <div style={{
              background: "#111",
              border: `1px solid ${border}`,
              borderLeft: `3px solid ${gold}`,
              padding: "20px 24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: 6 }}>
                  Personalised Coaching
                </p>
                <p style={{ fontSize: "0.75rem", color: "#888", lineHeight: 1.6 }}>
                  Custom programming, weekly check-ins, and direct access to Lisa. Spaces are limited — apply to be considered.
                </p>
              </div>
              <Link
                href="/coaching"
                style={{
                  display: "inline-block",
                  background: "transparent",
                  color: gold,
                  border: `1px solid rgba(201,169,110,0.5)`,
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  padding: "0.65rem 1.25rem",
                  whiteSpace: "nowrap",
                }}
              >
                Apply →
              </Link>
            </div>
          </div>
        )}

        {/* Upsell shelf */}
        {upsells.length > 0 && (
          <div>
            <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>
              {owned.length > 0 ? "Add to Your Account" : "Get Started"}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#555", marginBottom: 16 }}>
              {owned.length > 0 ? "10% member discount applied automatically." : "Limited time pricing."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: owned.length > 0 ? 0 : 16 }}>
              {upsells.map((u) => (
                <div
                  key={u.id}
                  style={{
                    background: u.featured ? "#1a1208" : "#111",
                    border: u.featured ? `1px solid rgba(201,169,110,0.3)` : `1px solid ${border}`,
                    borderLeft: `3px solid ${gold}`,
                    padding: "20px 24px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    {u.featured && (
                      <span style={{ display: "inline-block", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#0a0a0a", background: gold, padding: "2px 8px", marginBottom: 8 }}>
                        Best Value
                      </span>
                    )}
                    <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, marginBottom: 4 }}>
                      {u.label}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#888", lineHeight: 1.6 }}>{u.desc}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      {u.regularPrice !== u.price && (
                        <span style={{ display: "block", fontSize: "0.7rem", color: "#444", textDecoration: "line-through" }}>{u.regularPrice}</span>
                      )}
                      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "1.3rem", fontWeight: 700, color: gold }}>{u.price}</span>
                    </div>
                    <Link
                      href={u.href}
                      style={{
                        display: "inline-block",
                        background: u.featured ? gold : "transparent",
                        color: u.featured ? "#0a0a0a" : gold,
                        border: u.featured ? "none" : `1px solid rgba(201,169,110,0.5)`,
                        fontFamily: "var(--font-montserrat), sans-serif",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        padding: "0.65rem 1.25rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Get Access
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
