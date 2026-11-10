import type { BundlePaymentCheck, DisputeState } from "./bundleCredit"
import type { StoredBundlePurchase } from "./bundleCreditStore"

// Read-only Stripe lookups for the bundle credit. The client is passed in so
// tests can stub it, and the interface only names reads (retrieve and list),
// so nothing written here can charge, refund or change anyone.

type Page = Promise<{ data: unknown[] }>

export const STRIPE_UNREACHABLE = "Stripe couldn't be reached"
export const STRIPE_PAYMENT_NOT_FOUND = "Stripe couldn't find a matching bundle payment"

export interface StripeReader {
  paymentIntents: { retrieve(id: string, params?: { expand?: string[] }): Promise<unknown> }
  disputes: { list(params: { payment_intent: string; limit?: number }): Page }
  customers: { list(params: { email: string; limit?: number }): Page }
  subscriptions: { list(params: { customer: string; status?: "all"; limit?: number }): Page }
  invoices: { list(params: { subscription: string; limit?: number; expand?: string[] }): Page }
}

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v)
const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null)
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null)
const idOf = (v: unknown): string | null => str(v) ?? (isObj(v) ? str(v.id) : null)
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

// A definite answer from Stripe (no such payment, or a request it will never
// accept) can't be fixed by trying again, so it means "couldn't verify", not
// "Stripe is down". Only network trouble, Stripe's own errors, rate limits and
// key problems count as unreachable.
export function isDefiniteStripeRefusal(err: unknown): boolean {
  if (!isObj(err)) return false
  if (err.code === "resource_missing") return true
  const status = num(err.statusCode)
  if (status === null || status < 400 || status >= 500) return false
  return status !== 401 && status !== 403 && status !== 408 && status !== 409 && status !== 429
}

const OPEN_DISPUTE = new Set(["needs_response", "under_review", "warning_needs_response", "warning_under_review"])

export function disputeStateOf(disputes: unknown[]): DisputeState {
  let state: DisputeState = "none"
  for (const d of disputes) {
    const status = isObj(d) ? str(d.status) : null
    if (status === "lost") return "lost"
    if (status && OPEN_DISPUTE.has(status)) state = "open"
  }
  return state
}

// Turns a retrieved PaymentIntent (with latest_charge expanded) into the
// verified facts, or says why it can't be trusted.
export function bundlePaymentFromIntent(intent: unknown, expectedEmail: string, disputes: unknown[]): BundlePaymentCheck {
  if (!isObj(intent)) return { state: "unverified", purchasedAt: null, paymentIntentId: null, reason: "Stripe returned no payment" }
  const id = str(intent.id)
  const created = num(intent.created)
  const purchasedAt = created !== null ? new Date(created * 1000).toISOString() : null
  const fail = (reason: string): BundlePaymentCheck => ({ state: "unverified", purchasedAt, paymentIntentId: id, reason })
  if (!id || purchasedAt === null) return fail("The payment is missing its id or date")
  if (intent.status !== "succeeded") return fail("The payment did not succeed")
  const metadata = isObj(intent.metadata) ? intent.metadata : {}
  if (metadata.product !== "bundle") return fail("The payment isn't a Complete Foundations Bundle purchase")
  const buyer = str(metadata.customerEmail)?.toLowerCase() ?? null
  if (buyer && buyer !== expectedEmail.toLowerCase()) return fail("The payment belongs to a different email")
  const received = num(intent.amount_received)
  const currency = str(intent.currency)
  if (received === null || !currency) return fail("The payment amount is missing")
  const charge = intent.latest_charge
  if (!isObj(charge)) return fail("The charge details couldn't be read")
  const refunded = num(charge.amount_refunded) ?? 0
  const dispute = charge.disputed === true ? disputeStateOf(disputes) : "none"
  return {
    state: "verified",
    payment: { paymentIntentId: id, purchasedAt, amountPaidCents: received, refundedCents: refunded, currency, dispute },
  }
}

// Records written since amounts were stored are trusted as written: they came
// from verified webhook events and refunds keep them current. Older records
// are checked against Stripe; with no Stripe client, or on any error, the
// answer is "couldn't verify", never a guess.
export async function verifyBundlePayment(record: StoredBundlePurchase | null, stripe: StripeReader | null): Promise<BundlePaymentCheck> {
  if (!record) return { state: "none" }
  if (record.amountPaidCents !== null && record.currency) {
    return {
      state: "verified",
      payment: {
        paymentIntentId: record.paymentIntentId,
        purchasedAt: record.purchasedAt,
        amountPaidCents: record.amountPaidCents,
        refundedCents: record.refundedCents,
        currency: record.currency,
        dispute: record.dispute,
      },
    }
  }
  const unverified = (reason: string): BundlePaymentCheck =>
    ({ state: "unverified", purchasedAt: record.purchasedAt, paymentIntentId: record.paymentIntentId, reason })
  if (!stripe) return unverified("This older purchase needs checking with Stripe")
  try {
    const intent = await stripe.paymentIntents.retrieve(record.paymentIntentId, { expand: ["latest_charge"] })
    const charge = isObj(intent) ? intent.latest_charge : null
    const disputes = isObj(charge) && charge.disputed === true
      ? (await stripe.disputes.list({ payment_intent: record.paymentIntentId, limit: 10 })).data
      : []
    const check = bundlePaymentFromIntent(intent, record.email, disputes)
    // The record's own purchase time is what the window has always used.
    return check.state === "verified" ? { state: "verified", payment: { ...check.payment, purchasedAt: record.purchasedAt } } : check
  } catch (err) {
    return unverified(isDefiniteStripeRefusal(err) ? STRIPE_PAYMENT_NOT_FOUND : STRIPE_UNREACHABLE)
  }
}

export interface CoachingInvoice {
  id: string
  subscriptionId: string
  status: string
  created: string
  billingReason: string | null
  amountPaidCents: number
  subtotalCents: number
  discountCents: number
}

export function parseInvoice(invoice: unknown, subscriptionId: string): CoachingInvoice | null {
  if (!isObj(invoice)) return null
  const id = str(invoice.id)
  const created = num(invoice.created)
  if (!id || created === null) return null
  const discountCents = arr(invoice.total_discount_amounts)
    .map((d) => (isObj(d) ? num(d.amount) ?? 0 : 0))
    .reduce((a, b) => a + b, 0)
  return {
    id,
    subscriptionId,
    status: str(invoice.status) ?? "unknown",
    created: new Date(created * 1000).toISOString(),
    billingReason: str(invoice.billing_reason),
    amountPaidCents: num(invoice.amount_paid) ?? 0,
    subtotalCents: num(invoice.subtotal) ?? 0,
    discountCents,
  }
}

// A paid invoice that moved money, or was covered by a discount, is a real
// coaching payment. A $0 trial invoice is not.
export function isRealCoachingPayment(inv: CoachingInvoice): boolean {
  return inv.status === "paid" && (inv.amountPaidCents > 0 || inv.discountCents > 0)
}

export type CoachingHistory =
  | { verified: true; invoices: CoachingInvoice[]; hasPriorPayment: boolean }
  | { verified: false; invoices: CoachingInvoice[]; reason: string }

export async function readCoachingHistory(stripe: StripeReader, emails: string[]): Promise<CoachingHistory> {
  const invoices: CoachingInvoice[] = []
  try {
    for (const email of emails) {
      const customers = await stripe.customers.list({ email, limit: 20 })
      for (const customer of customers.data) {
        const customerId = idOf(customer)
        if (!customerId) continue
        const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 50 })
        for (const sub of subs.data) {
          if (!isObj(sub) || !isObj(sub.metadata) || sub.metadata.product !== "coaching") continue
          const subId = idOf(sub)
          if (!subId) continue
          const list = await stripe.invoices.list({ subscription: subId, limit: 24 })
          for (const raw of list.data) {
            const inv = parseInvoice(raw, subId)
            if (inv && !invoices.some((i) => i.id === inv.id)) invoices.push(inv)
          }
        }
      }
    }
  } catch {
    return { verified: false, invoices, reason: STRIPE_UNREACHABLE }
  }
  invoices.sort((a, b) => b.created.localeCompare(a.created))
  return { verified: true, invoices, hasPriorPayment: invoices.some(isRealCoachingPayment) }
}

// Finds the bundle-credit discount on an invoice retrieved with
// `discounts.source.coupon` expanded. The coupon's own metadata says whose
// credit it is, so nothing else needs looking up.
export interface InvoiceCreditDiscount {
  couponId: string
  email: string
  applicationId: string
  amountCents: number
}

export function bundleCreditDiscountOnInvoice(invoice: unknown): InvoiceCreditDiscount | null {
  if (!isObj(invoice)) return null
  for (const d of arr(invoice.discounts)) {
    if (!isObj(d)) continue
    const discountId = str(d.id)
    const source = isObj(d.source) ? d.source : null
    const coupon = (source && isObj(source.coupon) ? source.coupon : null) ?? (isObj(d.coupon) ? d.coupon : null)
    if (!discountId || !coupon) continue
    const meta = isObj(coupon.metadata) ? coupon.metadata : {}
    if (meta.bundleCredit !== "true") continue
    const email = str(meta.bundleCreditEmail)
    const applicationId = str(meta.applicationId)
    const couponId = str(coupon.id)
    if (!email || !applicationId || !couponId) continue
    const amountCents = arr(invoice.total_discount_amounts)
      .filter((t) => isObj(t) && idOf(t.discount) === discountId)
      .map((t) => (isObj(t) ? num(t.amount) ?? 0 : 0))
      .reduce((a, b) => a + b, 0)
    return { couponId, email: email.toLowerCase(), applicationId, amountCents }
  }
  return null
}

export function subscriptionIdOfInvoice(invoice: unknown): string | null {
  if (!isObj(invoice)) return null
  const direct = idOf(invoice.subscription)
  if (direct) return direct
  const parent = isObj(invoice.parent) ? invoice.parent : null
  const details = parent && isObj(parent.subscription_details) ? parent.subscription_details : null
  return details ? idOf(details.subscription) : null
}

export function couponIdsOfSession(session: unknown): string[] {
  if (!isObj(session)) return []
  return arr(session.discounts).map((d) => (isObj(d) ? idOf(d.coupon) : null)).filter((v): v is string => !!v)
}
