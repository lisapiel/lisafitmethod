import { toInvoiceSnapshot, toSubSnapshot, type InvoiceSnapshot, type StripeInvoiceLike, type StripeSubscriptionLike, type SubSnapshot } from "./snapshot"
import { isRunning, type CoachingSubs } from "./rules"

// The few Stripe calls billing management makes, behind a narrow interface
// so tests can stand in for Stripe. Reads expand discounts so credits and
// coupons are visible; writes always carry an idempotency key.

type List<T> = { data: T[]; has_more?: boolean }
type Opts = { idempotencyKey?: string }

export type StripeLike = {
  customers: { list(p: { email: string; limit: number }): Promise<List<{ id: string }>> }
  subscriptions: {
    list(p: Record<string, unknown>): Promise<List<StripeSubscriptionLike>>
    retrieve(id: string, p?: Record<string, unknown>): Promise<StripeSubscriptionLike>
    update(id: string, p: Record<string, unknown>, o?: Opts): Promise<StripeSubscriptionLike>
    cancel(id: string, p?: Record<string, unknown>, o?: Opts): Promise<StripeSubscriptionLike>
  }
  invoices: {
    list(p: Record<string, unknown>): Promise<List<StripeInvoiceLike>>
    retrieve(id: string, p?: Record<string, unknown>): Promise<StripeInvoiceLike>
    voidInvoice(id: string, p?: Record<string, unknown>, o?: Opts): Promise<StripeInvoiceLike>
    createPreview(p: Record<string, unknown>): Promise<{ amount_due?: number | null; next_payment_attempt?: number | null; period_end?: number | null }>
  }
}

// "definitive": Stripe answered and refused, so nothing changed and trying
// again is safe. "uncertain": no reliable answer (network, timeout, Stripe
// server error), so the change may or may not have happened.
export function classifyStripeError(e: unknown): { kind: "definitive" | "uncertain"; message: string } {
  const err = e as { type?: string; statusCode?: number; message?: string; raw?: { message?: string } }
  const message = err?.raw?.message ?? err?.message ?? "Stripe request failed"
  if (err?.type === "StripeConnectionError" || err?.type === "StripeAPIError") return { kind: "uncertain", message }
  if (typeof err?.statusCode === "number") return { kind: err.statusCode >= 500 ? "uncertain" : "definitive", message }
  if (err?.type && String(err.type).startsWith("Stripe")) return { kind: "definitive", message }
  return { kind: "uncertain", message }
}

const SUB_EXPAND = ["discounts.source.coupon"]

export type LoadedBilling = {
  customers: string[]
  subs: CoachingSubs
  // Every coaching subscription found, running or not, for display.
  all: SubSnapshot[]
  invoices: InvoiceSnapshot[]
  linkedCustomerOutsideEmail: string | null
}

// Everything billing decisions need for one client.
export async function loadBilling(stripe: StripeLike, email: string, linkedId: string | null): Promise<LoadedBilling> {
  const customers = (await stripe.customers.list({ email, limit: 10 })).data.map((c) => c.id)
  const all: SubSnapshot[] = []
  for (const customer of customers) {
    let startingAfter: string | undefined
    do {
      const page = await stripe.subscriptions.list({ customer, status: "all", limit: 100, expand: SUB_EXPAND.map((e) => `data.${e}`), ...(startingAfter ? { starting_after: startingAfter } : {}) })
      for (const s of page.data) if (s.metadata?.product === "coaching" || s.id === linkedId) all.push(toSubSnapshot(s))
      startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : undefined
    } while (startingAfter)
  }

  let linked = linkedId ? all.find((s) => s.id === linkedId) ?? null : null
  let linkedCustomerOutsideEmail: string | null = null
  if (linkedId && !linked) {
    try {
      linked = toSubSnapshot(await stripe.subscriptions.retrieve(linkedId, { expand: SUB_EXPAND }))
      all.push(linked)
      if (!customers.includes(linked.customerId)) linkedCustomerOutsideEmail = linked.customerId
    } catch (e) {
      if (classifyStripeError(e).kind === "uncertain") throw e
      linked = null
    }
  }

  const invoiceCustomers = new Set(customers)
  if (linkedCustomerOutsideEmail) invoiceCustomers.add(linkedCustomerOutsideEmail)
  const coachingIds = new Set(all.map((s) => s.id))
  const invoices: InvoiceSnapshot[] = []
  for (const customer of invoiceCustomers) {
    const page = await stripe.invoices.list({ customer, limit: 24 })
    for (const inv of page.data) {
      const snap = toInvoiceSnapshot(inv)
      if (snap.subscriptionId && coachingIds.has(snap.subscriptionId)) invoices.push(snap)
    }
  }

  // Whether a payment is mid-flight decides if an invoice may be voided, so
  // check it on the few invoices that are still open.
  for (let i = 0; i < invoices.length; i++) {
    if (invoices[i].status !== "open") continue
    const full = await stripe.invoices.retrieve(invoices[i].id, { expand: ["payments.data.payment.payment_intent"] })
    invoices[i] = toInvoiceSnapshot(full)
  }

  invoices.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
  return { customers, subs: { linkedId, linked, running: all.filter(isRunning) }, all, invoices, linkedCustomerOutsideEmail }
}

// Stripe's own figure for the next invoice, including discounts and credit.
export async function previewNext(stripe: StripeLike, sub: SubSnapshot): Promise<{ amountDueCents: number; date: string | null } | null> {
  try {
    const p = await stripe.invoices.createPreview({ subscription: sub.id })
    const at = p.next_payment_attempt ?? p.period_end ?? null
    return { amountDueCents: p.amount_due ?? 0, date: at ? new Date(at * 1000).toISOString() : sub.currentPeriodEnd }
  } catch {
    return null
  }
}

// Pause collection indefinitely: invoices keep being created and are voided
// at once, the subscription stays active. Nothing else on the subscription is
// sent, so no other setting can change along with it.
export async function pauseForComplimentary(stripe: StripeLike, subId: string, opId: string, referencePriceCents: number | null, idempotencyKey: string): Promise<SubSnapshot> {
  const updated = await stripe.subscriptions.update(
    subId,
    {
      pause_collection: { behavior: "void" },
      metadata: { lfm_billing_mode: "complimentary", lfm_billing_op: opId, lfm_reference_price_cents: referencePriceCents == null ? "" : String(referencePriceCents) },
    },
    { idempotencyKey },
  )
  return toSubSnapshot(updated)
}

// A complimentary client's own cancellation: the paused subscription ends at
// the end of its current period. Nothing else on it changes.
export async function scheduleEndAtPeriodEnd(stripe: StripeLike, subId: string, idempotencyKey: string): Promise<SubSnapshot> {
  return toSubSnapshot(await stripe.subscriptions.update(subId, { cancel_at_period_end: true }, { idempotencyKey }))
}

// After complimentary has ended, and only when an admin confirms: end the
// paused subscription now. No final invoice, no proration, nothing refunded.
export async function cancelNow(stripe: StripeLike, subId: string, idempotencyKey: string): Promise<SubSnapshot> {
  return toSubSnapshot(await stripe.subscriptions.cancel(subId, { invoice_now: false, prorate: false }, { idempotencyKey }))
}

export async function voidInvoice(stripe: StripeLike, invoiceId: string, idempotencyKey: string): Promise<InvoiceSnapshot> {
  return toInvoiceSnapshot(await stripe.invoices.voidInvoice(invoiceId, {}, { idempotencyKey }))
}

export async function readSubscription(stripe: StripeLike, id: string): Promise<SubSnapshot> {
  return toSubSnapshot(await stripe.subscriptions.retrieve(id, { expand: SUB_EXPAND }))
}

export async function readInvoice(stripe: StripeLike, id: string): Promise<InvoiceSnapshot> {
  return toInvoiceSnapshot(await stripe.invoices.retrieve(id))
}
