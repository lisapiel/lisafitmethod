import Stripe from "stripe"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import {
  getCoachingApplication,
  getCoachingClientRecord,
  getBundleCredit,
  updateCoachingApplication,
  type CoachingApplication,
} from "@/lib/authTokens"

function makeStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
}

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

function makeDb() {
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

// Only one request at a time may mint a session for an application.
//
// Reusing an open session makes repeated clicks safe, but two requests landing
// in the same instant both find nothing to reuse and both create one. Two open
// sessions mean two ways to pay, and a customer who returns to an old tab
// could complete both. The winner of this claim mints; everyone else waits and
// picks up what the winner wrote.
const MINT_LOCK_MS = 30_000

async function claimMintLock(applicationId: string): Promise<boolean> {
  const now = Date.now()
  try {
    await makeDb().send(new UpdateCommand({
      TableName: TABLE,
      Key: { userId: `coaching_app_${applicationId}` },
      UpdateExpression: "SET checkoutLockUntil = :until",
      ConditionExpression: "attribute_not_exists(checkoutLockUntil) OR checkoutLockUntil < :now",
      ExpressionAttributeValues: { ":until": now + MINT_LOCK_MS, ":now": now },
    }))
    return true
  } catch {
    return false
  }
}

async function releaseMintLock(applicationId: string): Promise<void> {
  await makeDb().send(new UpdateCommand({
    TableName: TABLE,
    Key: { userId: `coaching_app_${applicationId}` },
    UpdateExpression: "SET checkoutLockUntil = :zero",
    ExpressionAttributeValues: { ":zero": 0 },
  })).catch(() => { /* the lock expires on its own */ })
}

// A Checkout Session is a receipt-in-waiting, not an invitation.
//
// The approval step used to mint one and freeze its URL onto the application,
// and the acceptance page replayed that URL forever. Stripe expires a session
// after 24 hours, so every applicant who did not pay the same day was sent to
// a dead page that reads "You're all done here" — which also looks, to the
// person reading it, as though they had already paid.
//
// The invitation now lives on the application record, which does not expire,
// and the session is minted at the moment someone actually intends to pay.
export type CheckoutDecision =
  | { kind: "already-active"; subscriptionId?: string }
  | { kind: "awaiting-activation"; sessionId: string }
  | { kind: "checkout"; url: string; sessionId: string; reused: boolean }

const REUSE_FLOOR_MS = 2 * 60 * 1000

// Everything the decision depends on, gathered once so the rule itself can be
// read — and tested — without Stripe or the database in the way.
export type CheckoutFacts = {
  applicationStatus: CoachingApplication["status"]
  clientStatus?: string | null
  clientSubscriptionId?: string | null
  applicationSubscriptionId?: string | null
  liveSubscriptionId: string | null
  existingSession: {
    status: string | null
    paymentStatus: string | null
    url: string | null
    expiresAtMs: number
  } | null
  now: number
}

export type CheckoutAction =
  | { action: "already-active"; subscriptionId?: string }
  | { action: "awaiting-activation" }
  | { action: "reuse"; url: string }
  | { action: "create" }

// The order matters. Anything that means "they are already paying, or have
// just paid" has to win over minting a new session, because the cost of
// getting that wrong is charging someone twice.
export function decideCheckout(facts: CheckoutFacts): CheckoutAction {
  if (facts.clientStatus === "ACTIVE") {
    return { action: "already-active", subscriptionId: facts.clientSubscriptionId ?? undefined }
  }
  if (facts.applicationStatus === "PAID") {
    return { action: "already-active", subscriptionId: facts.applicationSubscriptionId ?? undefined }
  }
  if (facts.liveSubscriptionId) {
    return { action: "already-active", subscriptionId: facts.liveSubscriptionId }
  }

  const session = facts.existingSession
  if (session) {
    // Paid, but our records have not caught up yet — the webhook is still in
    // flight. Sending them back to Stripe here is the double charge.
    if (session.status === "complete" || session.paymentStatus === "paid") {
      return { action: "awaiting-activation" }
    }
    // Still open with enough life left: the same session answers a second
    // click on Process Payment instead of opening a competing one.
    if (session.status === "open" && session.url && session.expiresAtMs - facts.now > REUSE_FLOOR_MS) {
      return { action: "reuse", url: session.url }
    }
  }

  return { action: "create" }
}

// Every address this person is known by, so a subscription bought under the
// original applicant address is still found after the application has been
// linked to their main account.
function candidateEmails(application: CoachingApplication, ownerEmail: string): string[] {
  const all = [ownerEmail, application.ownerEmail, application.email]
    .filter((e): e is string => Boolean(e))
    .map((e) => e.toLowerCase())
  return Array.from(new Set(all))
}

// Is this person already paying us? Asked of Stripe directly rather than of
// our own records, because our records are what a missed webhook leaves stale.
export async function findLiveCoachingSubscription(
  stripe: Stripe,
  emails: string[],
): Promise<string | null> {
  for (const email of emails) {
    const customers = await stripe.customers.list({ email, limit: 20 })
    for (const customer of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 50 })
      const live = subs.data.find(
        (s) =>
          (s.status === "active" || s.status === "trialing" || s.status === "past_due") &&
          s.metadata?.product === "coaching",
      )
      if (live) return live.id
    }
  }
  return null
}

export async function prepareCoachingCheckout(input: {
  application: CoachingApplication
  ownerEmail: string
  ownerName: string
  baseUrl: string
}): Promise<CheckoutDecision> {
  const { application, ownerEmail, ownerName, baseUrl } = input
  const stripe = makeStripe()
  const emails = candidateEmails(application, ownerEmail)

  // Gather the facts, then apply the rule. Stripe is asked directly rather
  // than trusting our own records, because a stale record is exactly what a
  // missed webhook leaves behind.
  const client = await getCoachingClientRecord(ownerEmail).catch(() => null)
  const liveSubscriptionId =
    client?.status === "ACTIVE" || application.status === "PAID"
      ? null
      : await findLiveCoachingSubscription(stripe, emails).catch(() => null)

  let existingSession: CheckoutFacts["existingSession"] = null
  if (application.stripeCheckoutSessionId) {
    try {
      const retrieved = await stripe.checkout.sessions.retrieve(application.stripeCheckoutSessionId)
      existingSession = {
        status: retrieved.status ?? null,
        paymentStatus: retrieved.payment_status ?? null,
        url: retrieved.url ?? null,
        expiresAtMs: (retrieved.expires_at ?? 0) * 1000,
      }
    } catch {
      // Unknown or unreadable session — treated as absent, so a fresh one is minted.
    }
  }

  const decision = decideCheckout({
    applicationStatus: application.status,
    clientStatus: client?.status ?? null,
    clientSubscriptionId: client?.stripeSubscriptionId ?? null,
    applicationSubscriptionId: application.stripeSubscriptionId ?? null,
    liveSubscriptionId,
    existingSession,
    now: Date.now(),
  })

  if (decision.action === "already-active") {
    return { kind: "already-active", subscriptionId: decision.subscriptionId }
  }
  if (decision.action === "awaiting-activation") {
    return { kind: "awaiting-activation", sessionId: application.stripeCheckoutSessionId ?? "" }
  }
  if (decision.action === "reuse") {
    return { kind: "checkout", url: decision.url, sessionId: application.stripeCheckoutSessionId ?? "", reused: true }
  }

  // Nothing live, nothing paid: mint a new session on the approved terms —
  // but only one request gets to do it.
  if (!(await claimMintLock(application.id))) {
    // Someone else is minting right now. Wait for them rather than opening a
    // competing session, then read back what they produced.
    for (let attempt = 0; attempt < 8; attempt++) {
      await new Promise((r) => setTimeout(r, 400))
      const fresh = await getCoachingApplication(application.id).catch(() => null)
      const sid = fresh?.stripeCheckoutSessionId
      if (sid && sid !== application.stripeCheckoutSessionId) {
        try {
          const made = await stripe.checkout.sessions.retrieve(sid)
          if (made.status === "open" && made.url) {
            return { kind: "checkout", url: made.url, sessionId: made.id, reused: true }
          }
        } catch { /* fall through and mint our own */ }
      }
    }
  }


  const priceInCents = application.approvedPriceInCents
  const commitmentType = application.approvedCommitmentType
  if (!priceInCents || !commitmentType) {
    throw new Error("Application is missing its approved price or commitment terms")
  }

  // The bundle coupon is created once and then carried on the application, so
  // retrying checkout cannot mint a second one-time discount.
  let bundleCouponId: string | null = application.bundleCouponId ?? null
  if (!bundleCouponId && commitmentType === "THREE_MONTH_MINIMUM") {
    const credit = await getBundleCredit(application.email).catch(() => null)
    if (credit?.available && credit.amountCents > 0) {
      try {
        const coupon = await stripe.coupons.create({
          amount_off: Math.min(credit.amountCents, priceInCents),
          currency: "usd",
          duration: "once",
          max_redemptions: 1,
          name: "Bundle credit",
          metadata: {
            applicantEmail: application.email,
            applicationId: application.id,
            coachingCommitmentType: commitmentType,
          },
        })
        bundleCouponId = coupon.id
      } catch (err) {
        console.error("Stripe coupon create failed:", err)
      }
    }
  }

  const metadata = {
    product: "coaching",
    // The address that will be provisioned. The webhook reads this, so a
    // linked application activates the account the person actually uses.
    customerEmail: ownerEmail,
    customerName: ownerName,
    applicationId: application.id,
    applicantEmail: application.email,
    coachingCommitmentType: commitmentType,
    coachingCommitmentMonths: commitmentType === "THREE_MONTH_MINIMUM" ? "3" : "0",
    ...(bundleCouponId ? { bundleCouponId } : {}),
  }

  // Close the session being replaced, so an application never has two open
  // ways to pay sitting in two different browser tabs.
  if (application.stripeCheckoutSessionId && existingSession?.status === "open") {
    await stripe.checkout.sessions.expire(application.stripeCheckoutSessionId).catch(() => {})
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: ownerEmail,
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "1:1 Coaching — Lisa Fit Method" },
        unit_amount: priceInCents,
        recurring: { interval: "month" },
      },
      quantity: 1,
    }],
    ...(bundleCouponId ? { discounts: [{ coupon: bundleCouponId }] } : {}),
    metadata,
    subscription_data: { metadata },
    // Back to their own dashboard, which shows enrolment finishing and then
    // opens the coaching portal once Stripe confirms.
    success_url: `${baseUrl}/account?enrolled=1`,
    cancel_url: `${baseUrl}/coaching/accept/${application.id}`,
    // Stripe's own ceiling is 24 hours. The link that survives is the
    // invitation, not this.
    expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  }, {
    // Second net under the lock: if two creates do get through, Stripe itself
    // returns one session rather than two.
    idempotencyKey: `coaching-checkout-${application.id}-${Math.floor(Date.now() / 600_000)}`,
  })

  if (!session.url) throw new Error("Stripe returned a session without a URL")

  await updateCoachingApplication(application.id, {
    stripeCheckoutUrl: session.url,
    stripeCheckoutSessionId: session.id,
    stripeCheckoutExpiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
    ...(bundleCouponId ? { bundleCouponId } : {}),
  }).catch((err) => console.error("updateCoachingApplication (checkout session) failed:", err))

  await releaseMintLock(application.id)
  return { kind: "checkout", url: session.url, sessionId: session.id, reused: false }
}
