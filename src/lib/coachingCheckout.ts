import Stripe from "stripe"
import { createHash } from "crypto"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb"
import {
  getCoachingApplication,
  getCoachingClientRecord,
  updateCoachingApplication,
  type CoachingApplication,
  type CommitmentType,
} from "@/lib/authTokens"
import { creditApplicationOf, reserveCreditForCheckout, type CheckoutCredit } from "@/lib/bundleCreditAssess"
import { readBundleCreditChoice, releaseBundleCredit } from "@/lib/bundleCreditStore"
import { releaseBundleCreditForSession } from "@/lib/bundleCreditWebhook"

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
    // The terms the session was built on, from its metadata. Null on
    // sessions made before terms were recorded.
    termsKey?: string | null
  } | null
  // The terms the application carries now. When given, an open session is
  // only reused if it was built on exactly these.
  termsKey?: string
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
    // Still open with enough life left, on the terms Lisa approved last: the
    // same session answers a second click on Process Payment instead of
    // opening a competing one. A session on older terms is replaced.
    const sameTerms = facts.termsKey === undefined || session.termsKey === facts.termsKey
    if (session.status === "open" && session.url && sameTerms && session.expiresAtMs - facts.now > REUSE_FLOOR_MS) {
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

// The terms a session is built on, as one string kept in its metadata. A
// session is only ever reused for the same price, commitment and bundle
// credit choice, so re-approving on new terms can't leave the old ones
// payable.
export function checkoutTermsKey(terms: {
  priceCents: number | null | undefined
  commitmentType: CommitmentType | null | undefined
  creditChoice: boolean | null
}): string {
  const choice = terms.creditChoice === null ? "default" : terms.creditChoice ? "on" : "off"
  return `v1|${terms.priceCents ?? "none"}|${terms.commitmentType ?? "none"}|credit-${choice}`
}

// The idempotency key has to change whenever the request does, or Stripe
// refuses the second, different request with the same key. It covers every
// parameter (the coupon included) and the session being replaced, so a
// genuine double submit still collapses into one session.
export function checkoutIdempotencyKey(applicationId: string, params: unknown, replacesSessionId: string | null): string {
  const digest = createHash("sha256").update(JSON.stringify({ params, replacesSessionId })).digest("hex").slice(0, 40)
  return `coaching-checkout-${applicationId}-${digest}`
}

// Stripe's own ceiling is 24 hours. Rounded down to ten minutes, so two
// requests a moment apart build identical parameters.
export function checkoutExpiresAt(nowMs: number): number {
  const bucket = Math.floor(nowMs / 600_000) * 600
  return bucket + 24 * 60 * 60
}

type SessionLike = { id: string; url: string | null; expires_at: number; status?: string | null; payment_status?: string | null }

export interface SessionStripe {
  checkout: {
    sessions: {
      create(params: Stripe.Checkout.SessionCreateParams, options: { idempotencyKey: string }): Promise<SessionLike>
      retrieve(id: string): Promise<SessionLike>
      expire(id: string): Promise<unknown>
    }
  }
}

export type RetireOutcome = "closed" | "paid" | "unknown"

// Closes a session that is being replaced. If Stripe won't expire it, it is
// read again: it may have just been paid, and then no second session may be
// made.
export async function retireCheckoutSession(stripe: SessionStripe, sessionId: string): Promise<RetireOutcome> {
  try {
    await stripe.checkout.sessions.expire(sessionId)
    return "closed"
  } catch { /* already closed, just paid, or Stripe is unavailable */ }
  const now = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null)
  if (!now) return "unknown"
  if (now.status === "complete" || now.payment_status === "paid") return "paid"
  if (now.status === "expired") return "closed"
  return "unknown"
}

export interface MintDeps {
  stripe: SessionStripe
  reserveCredit: () => Promise<CheckoutCredit | null>
  releaseCredit: (credit: CheckoutCredit) => Promise<unknown>
  // Gives back the hold the replaced session's coupon had, if it still has it.
  releaseReplacedCredit: () => Promise<unknown>
  now?: () => number
}

export type MintResult =
  | { kind: "awaiting-activation"; sessionId: string }
  | { kind: "created"; session: SessionLike; credit: CheckoutCredit | null }

// Replaces any open session, holds the credit, and creates the new session.
// Whatever fails after the hold is taken gives the hold back (only if it is
// still this checkout's), so a failed checkout never costs the credit.
export async function mintCheckoutSession(
  deps: MintDeps,
  input: {
    applicationId: string
    replaces: { id: string; open: boolean } | null
    termsKey: string
    buildParams: (bundleCouponId: string | null, expiresAt: number) => Stripe.Checkout.SessionCreateParams
  },
): Promise<MintResult> {
  if (input.replaces?.open) {
    const outcome = await retireCheckoutSession(deps.stripe, input.replaces.id)
    if (outcome === "paid") return { kind: "awaiting-activation", sessionId: input.replaces.id }
    if (outcome === "unknown") {
      throw new Error("I couldn't close your earlier checkout just now. Nothing was charged. Please try again in a minute.")
    }
    await deps.releaseReplacedCredit().catch((err) =>
      console.error("bundle credit release for replaced session failed:", err),
    )
  }

  const credit = await deps.reserveCredit()
  try {
    const params = input.buildParams(credit?.couponId ?? null, checkoutExpiresAt((deps.now ?? Date.now)()))
    const session = await deps.stripe.checkout.sessions.create(params, {
      idempotencyKey: checkoutIdempotencyKey(input.applicationId, params, input.replaces?.id ?? null),
    })
    if (!session.url) throw new Error("Stripe returned a session without a URL")
    return { kind: "created", session, credit }
  } catch (err) {
    if (credit) {
      await deps.releaseCredit(credit).catch((e) => console.error("bundle credit release after failed checkout failed:", e))
    }
    throw err
  }
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

  const priceInCents = application.approvedPriceInCents
  const commitmentType = application.approvedCommitmentType
  const creditChoice = await readBundleCreditChoice(application.id, priceInCents ?? null).catch(() => null)
  const termsKey = checkoutTermsKey({ priceCents: priceInCents, commitmentType, creditChoice })

  // Gather the facts, then apply the rule. Stripe is asked directly rather
  // than trusting our own records, because a stale record is exactly what a
  // missed webhook leaves behind.
  const client = await getCoachingClientRecord(ownerEmail).catch(() => null)
  const liveSubscriptionId =
    client?.status === "ACTIVE" || application.status === "PAID"
      ? null
      : await findLiveCoachingSubscription(stripe, emails).catch(() => null)

  let existingSession: CheckoutFacts["existingSession"] = null
  let replacedSession: Stripe.Checkout.Session | null = null
  if (application.stripeCheckoutSessionId) {
    try {
      const retrieved = await stripe.checkout.sessions.retrieve(application.stripeCheckoutSessionId)
      replacedSession = retrieved
      existingSession = {
        status: retrieved.status ?? null,
        paymentStatus: retrieved.payment_status ?? null,
        url: retrieved.url ?? null,
        expiresAtMs: (retrieved.expires_at ?? 0) * 1000,
        termsKey: retrieved.metadata?.checkoutTerms ?? null,
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
    termsKey,
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
  const claimed = await claimMintLock(application.id)
  if (!claimed) {
    // Someone else is minting right now. Wait for them rather than opening a
    // competing session, then read back what they produced.
    for (let attempt = 0; attempt < 8; attempt++) {
      await new Promise((r) => setTimeout(r, 400))
      const fresh = await getCoachingApplication(application.id).catch(() => null)
      const sid = fresh?.stripeCheckoutSessionId
      if (sid && sid !== application.stripeCheckoutSessionId) {
        try {
          const made = await stripe.checkout.sessions.retrieve(sid)
          if (made.status === "open" && made.url && made.metadata?.checkoutTerms === termsKey) {
            return { kind: "checkout", url: made.url, sessionId: made.id, reused: true }
          }
        } catch { /* fall through and mint our own */ }
      }
    }
  }

  try {
    if (!priceInCents || !commitmentType) {
      throw new Error("Application is missing its approved price or commitment terms")
    }

    // The bundle credit is held for this one application before any coupon
    // exists, so a retry, a second tab or a second application cannot carry
    // another. Billing-change applications for existing clients never get it.
    const minted = await mintCheckoutSession({
      stripe,
      reserveCredit: () => commitmentType === "THREE_MONTH_MINIMUM"
        ? reserveCreditForCheckout(
          { stripe, readClient: getCoachingClientRecord },
          { application: creditApplicationOf(application), commitmentType, priceCents: priceInCents },
        )
        : Promise.resolve(null),
      releaseCredit: (credit) => releaseBundleCredit({ email: credit.email, applicationId: application.id, couponId: credit.couponId }),
      releaseReplacedCredit: async () => {
        if (replacedSession) await releaseBundleCreditForSession(stripe, replacedSession)
      },
    }, {
      applicationId: application.id,
      // Close the session being replaced, so an application never has two
      // open ways to pay sitting in two different browser tabs.
      replaces: application.stripeCheckoutSessionId
        ? { id: application.stripeCheckoutSessionId, open: existingSession?.status === "open" }
        : null,
      termsKey,
      buildParams: (bundleCouponId, expiresAt) => {
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
          checkoutTerms: termsKey,
          ...(bundleCouponId ? { bundleCouponId } : {}),
        }
        return {
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
          // The link that survives is the invitation, not this.
          expires_at: expiresAt,
        }
      },
    })

    if (minted.kind === "awaiting-activation") {
      return { kind: "awaiting-activation", sessionId: minted.sessionId }
    }
    const { session, credit } = minted
    const url = session.url ?? ""

    await updateCoachingApplication(application.id, {
      stripeCheckoutUrl: url,
      stripeCheckoutSessionId: session.id,
      stripeCheckoutExpiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
      ...(credit ? { bundleCouponId: credit.couponId } : {}),
    }).catch((err) => console.error("updateCoachingApplication (checkout session) failed:", err))

    return { kind: "checkout", url, sessionId: session.id, reused: false }
  } finally {
    if (claimed) await releaseMintLock(application.id)
  }
}

// Called when Lisa approves (or re-approves) an application. An open session
// built on different terms is closed straight away, so an old Stripe tab
// can't be paid at the old price or with a credit she has since turned off.
// A session that turns out to be paid is left alone.
export async function retireCheckoutIfTermsChanged(application: CoachingApplication, termsKey: string): Promise<RetireOutcome | "kept" | "none"> {
  const sessionId = application.stripeCheckoutSessionId
  if (!sessionId) return "none"
  const stripe = makeStripe()
  const session = await stripe.checkout.sessions.retrieve(sessionId).catch(() => null)
  if (!session || session.status !== "open") return "none"
  if (session.metadata?.checkoutTerms === termsKey) return "kept"
  const outcome = await retireCheckoutSession(stripe, sessionId)
  if (outcome === "closed") {
    await releaseBundleCreditForSession(stripe, session).catch((err) =>
      console.error("bundle credit release for replaced session failed:", err),
    )
  }
  return outcome
}
