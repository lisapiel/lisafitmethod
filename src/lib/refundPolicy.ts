// What a refund or a lost dispute should do to someone's access.
//
// Kept as a plain function over plain facts so the rules can be read and
// tested without Stripe or the database in the way. Gathering the facts is
// the webhook's job; deciding is this.

export type CourseEntitlement = "training" | "nutrition" | "tracker"

// What each purchasable product grants. A bundle is the one that grants more
// than it is named after, which is also why a bundle refund has to be checked
// against every course it covered.
export const PRODUCT_GRANTS: Record<string, CourseEntitlement[]> = {
  training: ["training"],
  nutrition: ["nutrition"],
  tracker: ["tracker"],
  bundle: ["training", "nutrition"],
}

// Products billed as a subscription. Their access follows the subscription
// lifecycle, not individual charges, so a refunded month must not strip the
// portal from someone whose subscription is still running.
export const SUBSCRIPTION_PRODUCTS = new Set(["coaching", "masterclass"])

export type EntitlementFacts = {
  entitlement: CourseEntitlement
  // Another purchase, still unrefunded, that grants the same thing.
  coveredByOtherPurchase: boolean
  // "complimentary" and "admin" were never paid for, so a refund has no claim
  // on them.
  grantType?: string | null
  // When the access record was written. Access granted well after the charge
  // being refunded came from something else.
  grantedAt?: string | null
  present: boolean
}

export type RefundFacts = {
  product: string | null
  email: string
  amount: number
  amountRefunded: number
  chargeCreatedAt: string
  entitlements: EntitlementFacts[]
}

export type RefundDecision = {
  revoke: CourseEntitlement[]
  keep: { entitlement: CourseEntitlement; because: string }[]
  notifyOnly: boolean
  summary: string
}

// Access granted more than this after the refunded charge is treated as
// having come from somewhere else — a later purchase, or a manual grant.
const LATER_GRANT_TOLERANCE_MS = 60 * 60 * 1000

export function decideRefund(facts: RefundFacts): RefundDecision {
  const keep: RefundDecision["keep"] = []

  if (!facts.email) {
    return { revoke: [], keep, notifyOnly: true, summary: "No customer email on the charge — nothing matched, nothing revoked." }
  }
  if (facts.product && SUBSCRIPTION_PRODUCTS.has(facts.product)) {
    return {
      revoke: [], keep, notifyOnly: true,
      summary: `Refund on a ${facts.product} subscription. Subscription access follows cancellation, not individual charges — nothing revoked.`,
    }
  }
  if (facts.amountRefunded < facts.amount) {
    return {
      revoke: [], keep, notifyOnly: true,
      summary: `Partial refund (${(facts.amountRefunded / 100).toFixed(2)} of ${(facts.amount / 100).toFixed(2)}). Access preserved.`,
    }
  }
  if (facts.entitlements.length === 0) {
    return {
      revoke: [], keep, notifyOnly: true,
      summary: `Could not map this charge to a known product${facts.product ? ` ("${facts.product}")` : ""} — nothing revoked.`,
    }
  }

  const revoke: CourseEntitlement[] = []
  const chargeAt = Date.parse(facts.chargeCreatedAt)

  for (const e of facts.entitlements) {
    if (!e.present) {
      keep.push({ entitlement: e.entitlement, because: "no access record to remove" })
      continue
    }
    if (e.grantType === "complimentary" || e.grantType === "admin") {
      keep.push({ entitlement: e.entitlement, because: `granted as ${e.grantType}, not by this payment` })
      continue
    }
    if (e.coveredByOtherPurchase) {
      keep.push({ entitlement: e.entitlement, because: "still covered by another purchase" })
      continue
    }
    const grantedAt = e.grantedAt ? Date.parse(e.grantedAt) : NaN
    if (Number.isNaN(chargeAt)) {
      keep.push({ entitlement: e.entitlement, because: "charge date unreadable, so this access cannot be tied to it" })
      continue
    }
    if (!Number.isNaN(grantedAt) && grantedAt > chargeAt + LATER_GRANT_TOLERANCE_MS) {
      keep.push({ entitlement: e.entitlement, because: "access granted after this charge, so it came from elsewhere" })
      continue
    }
    revoke.push(e.entitlement)
  }

  const summary = revoke.length > 0
    ? `Full refund. Revoking: ${revoke.join(", ")}.${keep.length ? ` Keeping: ${keep.map((k) => `${k.entitlement} (${k.because})`).join("; ")}.` : ""}`
    : `Full refund, but nothing to revoke. ${keep.map((k) => `${k.entitlement}: ${k.because}`).join("; ")}.`

  return { revoke, keep, notifyOnly: revoke.length === 0, summary }
}
