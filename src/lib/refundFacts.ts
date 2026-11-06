import Stripe from "stripe"
import { PRODUCT_GRANTS, type CourseEntitlement, type RefundFacts, type EntitlementFacts } from "@/lib/refundPolicy"
import { readAccessRecord } from "@/lib/entitlementAudit"

// Pulls together everything the refund rules need.
//
// Stripe is the authority on what someone has paid for, not our own records —
// our records are what a missed webhook or a migration leaves stale. The
// question "do they still own this?" is therefore asked of their payment
// history, and only the access record's provenance is read locally.

function productOf(obj: { metadata?: Stripe.Metadata | null }): string | null {
  const p = obj.metadata?.product
  return p && p.length > 0 ? p : null
}

function emailOf(intent: Stripe.PaymentIntent, charge: Stripe.Charge): string {
  return (
    intent.metadata?.customerEmail ??
    charge.billing_details?.email ??
    charge.receipt_email ??
    ""
  ).trim().toLowerCase()
}

// A charge with no product metadata predates the metadata itself. Everything
// sold before that point was Training Foundations, which is also what the
// provisioning fallback granted at the time.
function grantsFor(product: string | null): CourseEntitlement[] {
  if (!product) return PRODUCT_GRANTS.training
  return PRODUCT_GRANTS[product] ?? []
}

export async function gatherRefundFacts(
  stripe: Stripe,
  charge: Stripe.Charge,
  amountRefundedOverride?: number,
): Promise<RefundFacts> {
  const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id
  const intent = intentId ? await stripe.paymentIntents.retrieve(intentId) : ({} as Stripe.PaymentIntent)
  const email = emailOf(intent, charge)
  const product = productOf(intent) ?? productOf(charge)
  const wanted = grantsFor(product)

  // Any other charge of theirs, still paid and not refunded, that grants the
  // same thing. This is the safeguard against stripping access from someone
  // who bought the course twice, or bought it inside a bundle as well.
  const covered = new Set<CourseEntitlement>()
  if (email && wanted.length > 0) {
    const others: Stripe.Charge[] = []
    let startingAfter: string | undefined
    for (let page = 0; page < 5; page++) {
      const batch = await stripe.charges.list({ limit: 100, ...(startingAfter ? { starting_after: startingAfter } : {}) })
      others.push(...batch.data)
      if (!batch.has_more) break
      startingAfter = batch.data[batch.data.length - 1]?.id
    }
    for (const other of others) {
      if (other.id === charge.id) continue
      if (other.status !== "succeeded" || other.refunded) continue
      const otherIntentId = typeof other.payment_intent === "string" ? other.payment_intent : other.payment_intent?.id
      if (!otherIntentId) continue
      const otherIntent = await stripe.paymentIntents.retrieve(otherIntentId).catch(() => null)
      if (!otherIntent) continue
      if (emailOf(otherIntent, other) !== email) continue
      for (const g of grantsFor(productOf(otherIntent) ?? productOf(other))) covered.add(g)
    }
  }

  const entitlements: EntitlementFacts[] = []
  for (const e of wanted) {
    const record = email ? await readAccessRecord(email, e) : null
    entitlements.push({
      entitlement: e,
      coveredByOtherPurchase: covered.has(e),
      grantType: record?.grantType ?? null,
      grantedAt: record?.grantedAt ?? null,
      present: !!record,
    })
  }

  return {
    product,
    email,
    amount: charge.amount,
    amountRefunded: amountRefundedOverride ?? charge.amount_refunded,
    // A charge always carries `created`, but this decides whether access is
    // taken away, so it does not assume so. An unreadable timestamp becomes
    // empty, and the rule that depends on it then declines to act.
    chargeCreatedAt: Number.isFinite(charge.created)
      ? new Date(charge.created * 1000).toISOString()
      : "",
    entitlements,
  }
}
