import type { BillingState } from "./store"

// Complimentary coaching is one explicit grant, written only by an admin
// action (Make Complimentary) and kept on the client's billing record with
// who granted it, when, why, and until when. Nothing else makes someone
// complimentary: not a $0 or $1 price, not a paused Stripe subscription, not
// the old client-record `accessType` field.
//
// While the grant is in place it, and only it, decides coaching access. Stripe
// can delete or fail the paused subscription without ending it. When the grant
// ends (its end date passes, Lisa ends it, or a client's cancellation takes
// effect) access ends, and paid billing is never resumed on its own.

export type GrantFields = Pick<
  BillingState,
  "mode" | "modeSince" | "modeBy" | "compReason" | "compEndsAt" | "compEndReason" | "compEndedAt" | "compEndedBy" | "compEndNote" | "compCommitment"
>

export type ComplimentaryStatus =
  | { state: "none" }
  | {
      state: "active"
      since: string | null
      by: string | null
      reason: string | null
      // null: complimentary until Lisa changes or ends it.
      endsAt: string | null
      endsBecause: "end-date" | "client-cancelled" | null
    }
  | {
      state: "ended"
      endedAt: string
      why: "end-date-reached" | "client-cancelled" | "ended-by-admin"
      by: string | null
      note: string | null
    }

export function complimentaryStatus(state: GrantFields | null | undefined, now: Date): ComplimentaryStatus {
  if (!state || state.mode !== "complimentary") return { state: "none" }
  if (state.compEndedAt) {
    return { state: "ended", endedAt: state.compEndedAt, why: "ended-by-admin", by: state.compEndedBy ?? null, note: state.compEndNote ?? null }
  }
  if (state.compEndsAt && Date.parse(state.compEndsAt) <= now.getTime()) {
    return {
      state: "ended",
      endedAt: state.compEndsAt,
      why: state.compEndReason === "client-cancelled" ? "client-cancelled" : "end-date-reached",
      by: null,
      note: null,
    }
  }
  return {
    state: "active",
    since: state.modeSince ?? null,
    by: state.modeBy ?? null,
    reason: state.compReason ?? null,
    endsAt: state.compEndsAt ?? null,
    endsBecause: state.compEndsAt ? state.compEndReason ?? "end-date" : null,
  }
}

export const isComplimentaryActive = (state: GrantFields | null | undefined, now: Date) => complimentaryStatus(state, now).state === "active"

export type AccessInputs = {
  switchActive: boolean
  // When the access switch was last turned on (coaching_access.grantedAt).
  switchGrantedAt?: string | null
  billing: GrantFields | null
  now: Date
}

// Coaching access for one person.
//   - Active complimentary grant: the grant decides, whatever the access
//     switch says. An unexpected Stripe deletion can switch access off; the
//     grant keeps it.
//   - Ended complimentary grant: no access, unless another entitlement was
//     granted independently after it ended (the access switch turned on again
//     after the end, for example by a new paid sign-up). The switch staying on
//     from before, because the paused subscription still exists, doesn't count.
//   - Everyone else (paid, or no billing record): the access switch, as before.
export function coachingAccessDecision(input: AccessInputs): { access: boolean; basis: "paid" | "complimentary" | "none" } {
  if (input.billing?.mode === "complimentary") {
    const s = complimentaryStatus(input.billing, input.now)
    if (s.state === "active") return { access: true, basis: "complimentary" }
    if (s.state === "ended" && input.switchActive && input.switchGrantedAt && Date.parse(input.switchGrantedAt) > Date.parse(s.endedAt)) {
      return { access: true, basis: "paid" }
    }
    return { access: false, basis: "none" }
  }
  return input.switchActive ? { access: true, basis: "paid" } : { access: false, basis: "none" }
}

// "Is this person paying for coaching?" Paid-client benefits (the coaching
// client prices) depend on this. Complimentary coaching never qualifies.
export function paysForCoaching(input: AccessInputs): boolean {
  return coachingAccessDecision(input).basis === "paid"
}

// The next monthly anniversary of `start` that falls after `now`, keeping the
// day of the month (clamped to the month's last day).
export function nextMonthlyAnniversary(start: string, now: Date): string {
  const s = new Date(start)
  for (let i = 1; i < 1200; i++) {
    const d = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + i, 1, s.getUTCHours(), s.getUTCMinutes(), s.getUTCSeconds()))
    const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
    d.setUTCDate(Math.min(s.getUTCDate(), lastDay))
    if (d.getTime() > now.getTime()) return d.toISOString()
  }
  return now.toISOString()
}

// When a complimentary client cancels, coaching continues to the end of the
// current monthly period, never past an end date Lisa already set, and no
// paid commitment applies. The period is Stripe's when there's a running
// subscription; otherwise it's the complimentary arrangement's own monthly
// cycle, counted from the day it was granted.
//
// Returns null when the date can't be established (a running subscription
// whose current period can't be read, or no subscription and no grant date).
// Callers must then refuse the cancellation rather than guess a date.
export function complimentaryCancellationDate(input: {
  hasRunningSubscription: boolean
  periodEnd: string | null
  currentEndsAt: string | null
  grantStart: string | null
  now: Date
}): string | null {
  const future = (d: string | null | undefined): d is string => !!d && Number.isFinite(Date.parse(d)) && Date.parse(d) > input.now.getTime()
  const period = input.hasRunningSubscription
    ? (future(input.periodEnd) ? input.periodEnd : null)
    : (input.grantStart && Number.isFinite(Date.parse(input.grantStart)) ? nextMonthlyAnniversary(input.grantStart, input.now) : null)
  if (!period) return null
  return future(input.currentEndsAt) && Date.parse(input.currentEndsAt) < Date.parse(period) ? input.currentEndsAt : period
}

// Validates an admin-chosen end date: absent (indefinite) or a real date in the future.
export function parseEndDate(value: unknown, now: Date): { ok: true; endsAt: string | null } | { ok: false; message: string } {
  if (value === null || value === undefined || value === "") return { ok: true, endsAt: null }
  if (typeof value !== "string") return { ok: false, message: "The end date isn't a valid date." }
  // A plain date (from the admin date picker) runs to the end of that day, UTC.
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T23:59:59.000Z` : value
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return { ok: false, message: "The end date isn't a valid date." }
  if (t <= now.getTime()) return { ok: false, message: "The end date must be in the future." }
  return { ok: true, endsAt: new Date(t).toISOString() }
}
