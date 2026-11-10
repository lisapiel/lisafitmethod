import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb"
import { canReserve, decideSettlement, shouldRelease, type CreditUsage, type DisputeState, type SettlementAction } from "./bundleCredit"

// Storage for bundle purchases and the coaching credit they carry.
//
// One item per buyer, `bundle_purchase_<email>`. Every change is a read
// followed by a write that only succeeds if nobody else wrote in between
// (`creditRev`), so two checkouts, a webhook and a refund can never both win.
// Nothing here creates a purchase record except a verified bundle payment.

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

export interface CreditDb {
  send(command: GetCommand | PutCommand): Promise<{ Item?: Record<string, unknown> }>
}

function makeDb(): CreditDb {
  return DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: process.env.COGNITO_REGION ?? "us-east-2",
      credentials: {
        accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
      },
    }),
  )
}

export interface StoredBundlePurchase {
  email: string
  purchasedAt: string
  paymentIntentId: string
  // Absent on records written before amounts were stored. Those are checked
  // against Stripe before any credit is offered.
  amountPaidCents: number | null
  currency: string | null
  refundedCents: number
  dispute: DisputeState
  usage: CreditUsage
  usedForSubscriptionId: string | null
  rev: number | null
}

const keyFor = (email: string) => `bundle_purchase_${email.trim().toLowerCase()}`
const choiceKeyFor = (applicationId: string) => `bundle_credit_choice_${applicationId}`

const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null)
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null)

// A record only counts as a purchase if it carries what a real bundle payment
// writes: a PaymentIntent id and a purchase time. The old "mark credit used"
// write created bare records for coaching clients who never bought the
// bundle, and those must not read as purchases.
export function parseBundlePurchase(item: Record<string, unknown> | undefined | null): StoredBundlePurchase | null {
  if (!item) return null
  const email = str(item.email)
  const purchasedAt = str(item.purchasedAt)
  const paymentIntentId = str(item.paymentIntentId)
  if (!email || !purchasedAt || !paymentIntentId) return null
  if (!paymentIntentId.startsWith("pi_")) return null
  if (!Number.isFinite(new Date(purchasedAt).getTime())) return null
  const dispute = item.disputeStatus === "lost" || item.disputeStatus === "open" ? item.disputeStatus : "none"
  return {
    email,
    purchasedAt,
    paymentIntentId,
    amountPaidCents: num(item.amountPaidCents),
    currency: str(item.currency),
    refundedCents: num(item.refundedCents) ?? 0,
    dispute,
    usage: {
      usedAt: str(item.bundleCreditUsedAt),
      usedForApplicationId: str(item.usedForApplicationId),
      usedForInvoiceId: str(item.usedForInvoiceId),
      usedAmountCents: num(item.usedAmountCents),
      reservedForApplicationId: str(item.reservedForApplicationId),
      reservedUntil: str(item.reservedUntil),
      reservedCouponId: str(item.reservedCouponId),
    },
    usedForSubscriptionId: str(item.usedForCoachingSubscriptionId),
    rev: num(item.creditRev),
  }
}

async function readItem(db: CreditDb, key: string): Promise<Record<string, unknown> | undefined> {
  const r = await db.send(new GetCommand({ TableName: TABLE, Key: { userId: key }, ConsistentRead: true }))
  return r.Item
}

export async function readBundlePurchase(email: string, db: CreditDb = makeDb()): Promise<StoredBundlePurchase | null> {
  return parseBundlePurchase(await readItem(db, keyFor(email)))
}

function isConditionFailure(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { name?: string }).name === "ConditionalCheckFailedException"
}

// Read, change, write back only if unchanged. `change` returns null to leave
// the item alone. Retries a few times when someone else wrote first.
async function mutate<T>(
  db: CreditDb,
  key: string,
  change: (item: Record<string, unknown> | undefined) => { next: Record<string, unknown>; result: T } | { next: null; result: T },
): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const item = await readItem(db, key)
    const { next, result } = change(item)
    if (!next) return result
    const rev = num(item?.creditRev)
    const condition = !item
      ? { ConditionExpression: "attribute_not_exists(userId)" }
      : rev === null
        ? { ConditionExpression: "attribute_exists(userId) AND attribute_not_exists(creditRev)" }
        : { ConditionExpression: "creditRev = :rev", ExpressionAttributeValues: { ":rev": rev } }
    try {
      await db.send(new PutCommand({
        TableName: TABLE,
        Item: { ...next, userId: key, creditRev: (rev ?? 0) + 1 },
        ...condition,
      }))
      return result
    } catch (err) {
      if (!isConditionFailure(err)) throw err
    }
  }
  throw new Error("Bundle credit record is busy, try again")
}

export interface BundlePaymentFacts {
  email: string
  paymentIntentId: string
  purchasedAt: string
  amountPaidCents: number
  currency: string
}

// Written by the bundle payment webhook only. A retry of the same payment
// fills in anything missing. A second purchase replaces the first only when
// the first was fully refunded and its credit never used.
export async function recordBundlePayment(facts: BundlePaymentFacts, db: CreditDb = makeDb()): Promise<"created" | "updated" | "kept"> {
  const email = facts.email.trim().toLowerCase()
  const fresh = {
    email,
    purchasedAt: facts.purchasedAt,
    paymentIntentId: facts.paymentIntentId,
    amountPaidCents: Math.round(facts.amountPaidCents),
    currency: facts.currency.toLowerCase(),
    refundedCents: 0,
  }
  return mutate(db, keyFor(email), (item) => {
    if (!item) return { next: fresh, result: "created" as const }
    const existing = parseBundlePurchase(item)
    if (!existing) return { next: fresh, result: "created" as const }
    if (existing.paymentIntentId === facts.paymentIntentId) {
      if (existing.amountPaidCents !== null && existing.currency) return { next: null, result: "kept" as const }
      return {
        next: { ...item, amountPaidCents: fresh.amountPaidCents, currency: fresh.currency },
        result: "updated" as const,
      }
    }
    const firstWasRefunded = existing.amountPaidCents !== null &&
      (existing.dispute === "lost" || existing.refundedCents >= existing.amountPaidCents)
    if (firstWasRefunded && !existing.usage.usedAt) return { next: fresh, result: "created" as const }
    return { next: null, result: "kept" as const }
  })
}

// Refunds only ever grow, so the larger figure wins and a replayed or
// out-of-order event cannot shrink it. Never creates a record.
export async function recordBundleRefund(
  input: { email: string; paymentIntentId: string; refundedCents?: number; dispute?: DisputeState | "closed" },
  db: CreditDb = makeDb(),
): Promise<boolean> {
  return mutate(db, keyFor(input.email), (item) => {
    const existing = parseBundlePurchase(item)
    if (!item || !existing || existing.paymentIntentId !== input.paymentIntentId) return { next: null, result: false }
    const next: Record<string, unknown> = { ...item }
    if (typeof input.refundedCents === "number") next.refundedCents = Math.max(existing.refundedCents, Math.round(input.refundedCents))
    if (input.dispute === "lost") next.disputeStatus = "lost"
    else if (input.dispute === "open" && existing.dispute !== "lost") next.disputeStatus = "open"
    else if (input.dispute === "closed" && existing.dispute === "open") delete next.disputeStatus
    return { next, result: true }
  })
}

// Holds the credit for one application while its checkout is open. Fails if
// it is used, or held by another application whose hold hasn't lapsed.
export async function reserveBundleCredit(
  input: { email: string; applicationId: string; until: string; now: string },
  db: CreditDb = makeDb(),
): Promise<boolean> {
  return mutate(db, keyFor(input.email), (item) => {
    const existing = parseBundlePurchase(item)
    if (!item || !existing) return { next: null, result: false }
    if (!canReserve(existing.usage, input.applicationId, input.now)) return { next: null, result: false }
    const next: Record<string, unknown> = { ...item, reservedForApplicationId: input.applicationId, reservedUntil: input.until }
    delete next.reservedCouponId
    return { next, result: true }
  })
}

export async function attachReservedCoupon(
  input: { email: string; applicationId: string; couponId: string },
  db: CreditDb = makeDb(),
): Promise<boolean> {
  return mutate(db, keyFor(input.email), (item) => {
    const existing = parseBundlePurchase(item)
    if (!item || !existing || existing.usage.usedAt) return { next: null, result: false }
    if (existing.usage.reservedForApplicationId !== input.applicationId) return { next: null, result: false }
    return { next: { ...item, reservedCouponId: input.couponId }, result: true }
  })
}

export async function releaseBundleCredit(
  input: { email: string; applicationId: string; couponId: string | null },
  db: CreditDb = makeDb(),
): Promise<boolean> {
  return mutate(db, keyFor(input.email), (item) => {
    const existing = parseBundlePurchase(item)
    if (!item || !existing || !shouldRelease(existing.usage, input.applicationId, input.couponId)) return { next: null, result: false }
    const next: Record<string, unknown> = { ...item }
    delete next.reservedForApplicationId
    delete next.reservedUntil
    delete next.reservedCouponId
    return { next, result: true }
  })
}

// Called from a paid invoice that carried the bundle coupon. This is the only
// place the credit becomes used, and only once.
export async function markBundleCreditApplied(
  input: { email: string; applicationId: string; invoiceId: string; subscriptionId: string; amountCents: number; at: string },
  db: CreditDb = makeDb(),
): Promise<SettlementAction | { action: "no-record" }> {
  return mutate<SettlementAction | { action: "no-record" }>(db, keyFor(input.email), (item) => {
    const existing = parseBundlePurchase(item)
    if (!item || !existing) return { next: null, result: { action: "no-record" as const } }
    const decision = decideSettlement(existing.usage, input.invoiceId, input.amountCents)
    if (decision.action !== "mark") return { next: null, result: decision }
    const next: Record<string, unknown> = {
      ...item,
      bundleCreditUsedAt: input.at,
      usedForApplicationId: input.applicationId,
      usedForInvoiceId: input.invoiceId,
      usedForCoachingSubscriptionId: input.subscriptionId,
      usedAmountCents: Math.round(input.amountCents),
    }
    delete next.reservedForApplicationId
    delete next.reservedUntil
    delete next.reservedCouponId
    return { next, result: decision }
  })
}

// Lisa's tick-box on the approval screen, kept beside the application rather
// than on it.
export interface BundleCreditChoice {
  apply: boolean
  priceCents: number
  decidedAt: string
  decidedBy: string
}

export async function saveBundleCreditChoice(applicationId: string, choice: BundleCreditChoice, db: CreditDb = makeDb()): Promise<void> {
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: { userId: choiceKeyFor(applicationId), applicationId, ...choice },
  }))
}

// The choice only holds for the price it was made at. If the price changes
// afterwards, the default for the new price applies until Lisa chooses again.
export async function readBundleCreditChoice(applicationId: string, priceCents: number | null, db: CreditDb = makeDb()): Promise<boolean | null> {
  const r = await db.send(new GetCommand({ TableName: TABLE, Key: { userId: choiceKeyFor(applicationId) } }))
  const item = r.Item
  if (!item || typeof item.apply !== "boolean") return null
  if (priceCents !== null && item.priceCents !== priceCents) return null
  return item.apply
}
