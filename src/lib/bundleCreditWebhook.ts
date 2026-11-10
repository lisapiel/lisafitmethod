import type { DisputeState } from "./bundleCredit"
import {
  markBundleCreditApplied, recordBundlePayment, recordBundleRefund, releaseBundleCredit, type CreditDb,
} from "./bundleCreditStore"
import { bundleCreditDiscountOnInvoice, couponIdsOfSession, subscriptionIdOfInvoice } from "./bundleCreditStripe"

// The webhook's side of the bundle credit, kept out of the route so the route
// only gains one call per event.

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v)
const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null)
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null)

export interface WebhookStripe {
  invoices: { retrieve(id: string, params?: { expand?: string[] }): Promise<unknown> }
  paymentIntents: { retrieve(id: string): Promise<unknown> }
  coupons: { retrieve(id: string): Promise<unknown> }
}

// payment_intent.succeeded for product "bundle".
export async function recordBundlePaymentFromIntent(intent: unknown, db?: CreditDb): Promise<void> {
  if (!isObj(intent) || !isObj(intent.metadata) || intent.metadata.product !== "bundle") return
  const email = str(intent.metadata.customerEmail)
  const id = str(intent.id)
  const amount = num(intent.amount_received)
  const currency = str(intent.currency)
  const created = num(intent.created)
  if (!email || !id || amount === null || !currency) return
  await recordBundlePayment({
    email,
    paymentIntentId: id,
    purchasedAt: new Date((created ?? Date.now() / 1000) * 1000).toISOString(),
    amountPaidCents: amount,
    currency,
  }, db)
}

// charge.refunded and dispute events. Only acts on bundle payments, and only
// on the record that payment created.
export async function syncBundleCreditFromCharge(
  stripe: WebhookStripe,
  charge: unknown,
  change: { dispute?: DisputeState | "closed" },
  db?: CreditDb,
): Promise<void> {
  if (!isObj(charge)) return
  const intentId = str(charge.payment_intent) ?? (isObj(charge.payment_intent) ? str(charge.payment_intent.id) : null)
  if (!intentId) return
  const intent = await stripe.paymentIntents.retrieve(intentId)
  if (!isObj(intent) || !isObj(intent.metadata) || intent.metadata.product !== "bundle") return
  const email = str(intent.metadata.customerEmail)
  if (!email) return
  // A refund or dispute can arrive before the purchase was recorded (the
  // payment webhook is late, or its write failed). The PaymentIntent just
  // read from Stripe is the verified payment, so the record is written from
  // it first and the refund or dispute is never dropped. An existing record
  // is left as it is.
  if (intent.status === "succeeded") await recordBundlePaymentFromIntent(intent, db)
  await recordBundleRefund({
    email,
    paymentIntentId: intentId,
    refundedCents: num(charge.amount_refunded) ?? undefined,
    dispute: change.dispute,
  }, db)
}

export type SettleOutcome =
  | { outcome: "none" }
  | { outcome: "marked" | "already-marked" | "no-record"; email: string; amountCents: number }
  | { outcome: "conflict"; email: string; amountCents: number; usedForInvoiceId: string | null }

// invoice.paid. If the invoice carried a bundle-credit coupon that actually
// took money off, the credit is now used, tied to this invoice.
export async function settleBundleCreditFromInvoice(stripe: WebhookStripe, invoiceId: string, db?: CreditDb): Promise<SettleOutcome> {
  const invoice = await stripe.invoices.retrieve(invoiceId, { expand: ["discounts", "discounts.source.coupon"] })
  if (!isObj(invoice) || invoice.status !== "paid") return { outcome: "none" }
  const credit = bundleCreditDiscountOnInvoice(invoice)
  if (!credit || credit.amountCents <= 0) return { outcome: "none" }
  const result = await markBundleCreditApplied({
    email: credit.email,
    applicationId: credit.applicationId,
    invoiceId,
    subscriptionId: subscriptionIdOfInvoice(invoice) ?? "",
    amountCents: credit.amountCents,
    at: new Date().toISOString(),
  }, db)
  if (result.action === "mark") return { outcome: "marked", email: credit.email, amountCents: credit.amountCents }
  if (result.action === "conflict") return { outcome: "conflict", email: credit.email, amountCents: credit.amountCents, usedForInvoiceId: result.usedForInvoiceId }
  if (result.action === "already-marked") return { outcome: "already-marked", email: credit.email, amountCents: credit.amountCents }
  if (result.action === "no-record") return { outcome: "no-record", email: credit.email, amountCents: credit.amountCents }
  return { outcome: "none" }
}

// checkout.session.expired. Gives the held credit back if this session's
// coupon is still the one holding it.
export async function releaseBundleCreditForSession(stripe: WebhookStripe, session: unknown, db?: CreditDb): Promise<boolean> {
  for (const couponId of couponIdsOfSession(session)) {
    const coupon = await stripe.coupons.retrieve(couponId).catch(() => null)
    if (!isObj(coupon) || !isObj(coupon.metadata) || coupon.metadata.bundleCredit !== "true") continue
    const email = str(coupon.metadata.bundleCreditEmail)
    const applicationId = str(coupon.metadata.applicationId)
    if (!email || !applicationId) continue
    return releaseBundleCredit({ email, applicationId, couponId }, db)
  }
  return false
}
