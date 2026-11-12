import type { InvoiceSnapshot, SubSnapshot } from "./snapshot"
import type { ComplimentaryStatus } from "./entitlement"

// The billing rules, kept pure so every case can be read and tested.

export type BillingMode = "paid" | "complimentary"

export type CoachingSubs = {
  linkedId: string | null
  linked: SubSnapshot | null
  // Every coaching subscription found for the client that is still running.
  running: SubSnapshot[]
}

const RUNNING = new Set(["active", "trialing", "past_due", "unpaid", "incomplete", "paused"])
export const isRunning = (s: SubSnapshot) => RUNNING.has(s.status)

// Money Stripe may still try to collect on this subscription: open invoices
// (finalized, unpaid, retried by Stripe unless voided) and drafts that will be
// finalized and charged on their own.
export function outstandingInvoices(subId: string | null, invoices: InvoiceSnapshot[]): InvoiceSnapshot[] {
  if (!subId) return []
  return invoices.filter((i) => i.subscriptionId === subId && (i.status === "open" || i.status === "draft"))
}

export type Blocker = { code: string; message: string }

export type ComplimentaryPlan =
  | { kind: "blocked"; blockers: Blocker[]; warnings: string[]; outstanding: InvoiceSnapshot[] }
  // Nothing to change in Stripe: no running subscription, or it is already paused this way.
  | { kind: "record-only"; reason: "no-subscription" | "already-paused"; warnings: string[]; outstanding: InvoiceSnapshot[] }
  | { kind: "pause"; subscription: SubSnapshot; referencePriceCents: number | null; warnings: string[]; outstanding: InvoiceSnapshot[] }

// The paid commitment a client signed up to, as far as the client record says.
export type Commitment = { type: string | null; endDate: string | null }

export function commitmentNotice(c: Commitment | null | undefined, now: Date): string | null {
  if (!c?.endDate || c.type !== "THREE_MONTH_MINIMUM" || Date.parse(c.endDate) <= now.getTime()) return null
  return `This client is inside a 3-month commitment until ${c.endDate.slice(0, 10)}. Complimentary coaching isn't subject to it: no further payments are collected and no cancellation terms apply while they're complimentary. The original commitment stays on record and isn't changed in Stripe.`
}

// What "Make Complimentary" would do for this client right now. Anything
// unusual stops it with a reason rather than guessing.
export function planComplimentary(input: { mode: BillingMode; grantActive: boolean; subs: CoachingSubs; invoices: InvoiceSnapshot[]; commitment?: Commitment | null; now?: Date }): ComplimentaryPlan {
  const { subs } = input
  const blockers: Blocker[] = []
  const warnings: string[] = []

  // Already complimentary: nothing to do, unless Stripe has started collecting
  // again (out of sync), in which case pausing collection again is offered.
  const linkedNow = subs.linked
  const collecting = !!linkedNow && isRunning(linkedNow) && !linkedNow.pause
  if (input.grantActive && !collecting) {
    return { kind: "blocked", blockers: [{ code: "already", message: "This client is already complimentary." }], warnings, outstanding: [] }
  }
  const notice = commitmentNotice(input.commitment, input.now ?? new Date())
  if (notice) warnings.push(notice)

  const unlinkedRunning = subs.running.filter((s) => s.id !== subs.linkedId)
  if (unlinkedRunning.length > 0) {
    blockers.push({
      code: "unlinked-subscription",
      message: `Stripe has ${unlinkedRunning.length === 1 ? "a running coaching subscription" : `${unlinkedRunning.length} running coaching subscriptions`} for this client that ${unlinkedRunning.length === 1 ? "isn't" : "aren't"} linked here (${unlinkedRunning.map((s) => s.id).join(", ")}). Link or cancel ${unlinkedRunning.length === 1 ? "it" : "them"} first, or ${unlinkedRunning.length === 1 ? "it" : "they"} would keep charging.`,
    })
  }

  const sub = subs.linked
  if (subs.linkedId && !sub) {
    blockers.push({ code: "linked-missing", message: `The linked subscription ${subs.linkedId} couldn't be found in Stripe. Check the link before changing billing.` })
  }

  if (!sub || !isRunning(sub)) {
    if (blockers.length) return { kind: "blocked", blockers, warnings, outstanding: [] }
    return { kind: "record-only", reason: "no-subscription", warnings, outstanding: [] }
  }

  const outstanding = outstandingInvoices(sub.id, input.invoices)

  if (sub.pause?.behavior === "void" && !sub.pause.resumesAt) {
    if (blockers.length) return { kind: "blocked", blockers, warnings, outstanding }
    return { kind: "record-only", reason: "already-paused", warnings, outstanding }
  }
  if (sub.pause) {
    blockers.push({
      code: "other-pause",
      message: sub.pause.behavior === "void"
        ? `Collection is already paused until ${sub.pause.resumesAt?.slice(0, 10)}. Clear that pause in Stripe before making this permanent.`
        : `Collection is already paused in Stripe with "${sub.pause.behavior}", which still creates invoices. Clear it in Stripe first.`,
    })
  }
  if (sub.status !== "active" && sub.status !== "trialing" && sub.status !== "past_due") {
    blockers.push({ code: "status", message: `The subscription is "${sub.status.replace(/_/g, " ")}". Only an active, trialing or past-due subscription can be switched to complimentary.` })
  }
  if (sub.scheduleId) {
    blockers.push({ code: "schedule", message: `A Stripe subscription schedule (${sub.scheduleId}) controls this subscription and could undo the change. Release it in Stripe first.` })
  }
  if (sub.cancelAtPeriodEnd || sub.cancelAt) {
    blockers.push({
      code: "cancellation-scheduled",
      message: `A cancellation is scheduled for ${(sub.cancelAt ?? sub.currentPeriodEnd ?? "").slice(0, 10)}. Decide whether coaching is ending first: remove the cancellation, or let it end without changing billing.`,
    })
  }
  if (sub.collectionMethod === "send_invoice") {
    blockers.push({ code: "send-invoice", message: "This subscription is billed by emailed invoice, not automatic charge. Change it in Stripe directly." })
  }
  if (sub.itemCount !== 1) {
    blockers.push({ code: "items", message: `The subscription has ${sub.itemCount} price items; only single-price coaching subscriptions are supported.` })
  }
  const unusedCredit = sub.discounts.find((d) => d.isBundleCredit)
  if (unusedCredit) {
    blockers.push({
      code: "bundle-credit",
      message: "An unused course-to-coaching credit is still on this subscription. A voided invoice could use it up, so the credit would be lost. Leave billing as it is until the credit has been applied to a paid invoice.",
    })
  }

  if (outstanding.some((i) => i.paymentProcessing)) {
    warnings.push("A payment on an outstanding invoice is still processing. It may complete; it won't be voided or refunded by this change.")
  }
  if (outstanding.length > 0) {
    warnings.push(
      `${outstanding.length === 1 ? "1 invoice from before this change is" : `${outstanding.length} invoices from before this change are`} still outstanding. Pausing collection doesn't stop Stripe retrying ${outstanding.length === 1 ? "it" : "them"}. You can void ${outstanding.length === 1 ? "it" : "them"} separately.`,
    )
  }
  if (sub.status === "past_due") warnings.push("The subscription is past due because of an unpaid invoice.")

  if (blockers.length) return { kind: "blocked", blockers, warnings, outstanding }
  return { kind: "pause", subscription: sub, referencePriceCents: sub.unitAmountCents, warnings, outstanding }
}

// Which invoice the admin may void, and why not otherwise.
export function voidCheck(invoice: InvoiceSnapshot | null, linkedSubId: string | null): { ok: true } | { ok: false; message: string } {
  if (!invoice) return { ok: false, message: "That invoice wasn't found for this client." }
  if (!linkedSubId || invoice.subscriptionId !== linkedSubId) return { ok: false, message: "Only invoices of the linked coaching subscription can be voided here." }
  if (invoice.status === "paid") return { ok: false, message: "This invoice is paid. Voiding never refunds money; use a refund in Stripe if that is what you mean." }
  if (invoice.status === "void") return { ok: false, message: "This invoice is already void." }
  if (invoice.status !== "open") return { ok: false, message: `Only open invoices can be voided (this one is "${invoice.status}").` }
  if (invoice.amountPaidCents > 0) return { ok: false, message: "Part of this invoice has been paid, so voiding it here could misstate what was paid. Handle it in Stripe." }
  if (invoice.paymentProcessing) return { ok: false, message: "A payment on this invoice is still processing. Wait for it to finish." }
  return { ok: true }
}

// ── What is actually being collected, for display ─────────────────────────

export type CollectionView = {
  // What the badge says.
  state:
    | "complimentary"
    | "complimentary-ended"
    | "paid"
    | "no-subscription"
    | "cancelling"
    | "past-due"
    | "trialing"
    | "ended"
    | "out-of-sync-paused"
    | "out-of-sync-collecting"
    | "paused-other"
  label: string
  // What is actually collected each month, if known; 0 for complimentary.
  collectedPerMonthCents: number | null
  // The price on the Stripe subscription, kept for reference when nothing is collected.
  referencePriceCents: number | null
  nextCollection: { date: string | null; amountCents: number | null; note: string | null } | null
  warning: string | null
}

const money = (c: number) => (c % 100 === 0 ? `$${c / 100}` : `$${(c / 100).toFixed(2)}`)

export function collectionView(input: {
  mode: BillingMode
  sub: SubSnapshot | null
  // Stripe's own preview of the next invoice, when one was fetched.
  preview: { amountDueCents: number; date: string | null } | null
  comp?: ComplimentaryStatus
}): CollectionView {
  const { sub, mode } = input
  const reference = sub?.unitAmountCents ?? null
  const paused = sub?.pause?.behavior === "void" && !sub.pause.resumesAt
  const running = !!sub && isRunning(sub)

  if (mode === "complimentary" && input.comp?.state === "ended") {
    const why = input.comp.why === "client-cancelled" ? "after the client cancelled" : input.comp.why === "ended-by-admin" ? "by an admin" : "on its end date"
    return {
      state: "complimentary-ended",
      label: `Complimentary ended ${input.comp.endedAt.slice(0, 10)} · no coaching access`,
      collectedPerMonthCents: running && sub && !sub.pause ? reference : 0,
      referencePriceCents: reference,
      nextCollection: null,
      warning: running && sub && !sub.pause
        ? "Complimentary coaching has ended, but Stripe is collecting again. Check the subscription in Stripe."
        : `Complimentary coaching ended ${why}. Paid billing was not resumed and nothing is charged.${running ? " The Stripe subscription is still there, paused; cancel it in Stripe if coaching is over, or use Resume Paid Coaching when that's available." : ""}`,
    }
  }

  if (mode === "complimentary") {
    if (running && sub && !sub.pause) {
      return {
        state: "out-of-sync-collecting",
        label: "Complimentary here, but Stripe is collecting",
        collectedPerMonthCents: input.preview?.amountDueCents ?? reference,
        referencePriceCents: reference,
        nextCollection: { date: input.preview?.date ?? sub.currentPeriodEnd, amountCents: input.preview?.amountDueCents ?? null, note: null },
        warning: "This client is marked complimentary, but Stripe is still set to charge them. Pause collection again, or record them as paid.",
      }
    }
    const grantEnd = input.comp?.state === "active" ? input.comp.endsAt : null
    const stripeEnd = sub && running && (sub.cancelAtPeriodEnd || sub.cancelAt) ? (sub.cancelAt ?? sub.currentPeriodEnd) : null
    const endsAt = [grantEnd, stripeEnd].filter((d): d is string => !!d).sort()[0] ?? null
    return {
      state: "complimentary",
      label: `Complimentary · $0 collected/month · ${endsAt ? `until ${endsAt.slice(0, 10)}` : "no end date"}`,
      collectedPerMonthCents: 0,
      referencePriceCents: reference,
      nextCollection: null,
      warning: sub?.pause && !paused ? `Collection is paused in Stripe with "${sub.pause.behavior}"${sub.pause.resumesAt ? ` and resumes ${sub.pause.resumesAt.slice(0, 10)}` : ""}.` : null,
    }
  }

  if (!sub) {
    return { state: "no-subscription", label: "No Stripe subscription", collectedPerMonthCents: null, referencePriceCents: null, nextCollection: null, warning: null }
  }
  if (!running) {
    return { state: "ended", label: `Subscription ${sub.status.replace(/_/g, " ")}`, collectedPerMonthCents: 0, referencePriceCents: reference, nextCollection: null, warning: null }
  }
  if (paused) {
    return {
      state: "out-of-sync-paused",
      label: "Stripe collection paused",
      collectedPerMonthCents: 0,
      referencePriceCents: reference,
      nextCollection: null,
      warning: "Stripe isn't collecting payments for this subscription, but it isn't recorded as complimentary here. Record it as complimentary, or resume paid coaching.",
    }
  }
  if (sub.pause) {
    return {
      state: "paused-other",
      label: `Collection paused (${sub.pause.behavior.replace(/_/g, " ")})`,
      collectedPerMonthCents: 0,
      referencePriceCents: reference,
      nextCollection: sub.pause.resumesAt ? { date: sub.pause.resumesAt, amountCents: null, note: "Collection resumes on this date." } : null,
      warning: null,
    }
  }

  const amount = input.preview?.amountDueCents ?? null
  const next = { date: input.preview?.date ?? sub.currentPeriodEnd, amountCents: amount, note: null as string | null }
  if (amount != null && reference != null && amount !== reference * sub.quantity) {
    next.note = amount < reference * sub.quantity ? "Lower than the price because of a discount or account credit." : "Higher than the price because of extra charges on the next invoice."
  }
  if (sub.cancelAtPeriodEnd || sub.cancelAt) {
    return {
      state: "cancelling",
      label: `Ends ${(sub.cancelAt ?? sub.currentPeriodEnd ?? "").slice(0, 10)}`,
      collectedPerMonthCents: reference,
      referencePriceCents: reference,
      nextCollection: null,
      warning: null,
    }
  }
  if (sub.status === "past_due") {
    return { state: "past-due", label: "Past due", collectedPerMonthCents: reference, referencePriceCents: reference, nextCollection: next, warning: "The latest invoice hasn't been paid." }
  }
  if (sub.status === "trialing") {
    return { state: "trialing", label: `${reference != null ? money(reference) : "?"}/month from ${(sub.currentPeriodEnd ?? "").slice(0, 10)}`, collectedPerMonthCents: reference, referencePriceCents: reference, nextCollection: next, warning: null }
  }
  return {
    state: "paid",
    label: `Paid · ${reference != null ? money(reference) : "?"}/month`,
    collectedPerMonthCents: reference,
    referencePriceCents: reference,
    nextCollection: next,
    warning: null,
  }
}
