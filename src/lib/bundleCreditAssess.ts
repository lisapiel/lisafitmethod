import type { CoachingApplication, CommitmentType } from "./authTokens"
import {
  BUNDLE_CREDIT_RESERVATION_MS, NO_USAGE, planBundleCredit,
  type BundlePaymentCheck, type CreditFacts, type CreditPlan,
} from "./bundleCredit"
import {
  PENDING_COUPON, attachReservedCoupon, readBundleCreditChoice, readBundlePurchase, releaseBundleCredit, reserveBundleCredit,
  type CreditDb, type StoredBundlePurchase,
} from "./bundleCreditStore"
import { STRIPE_UNREACHABLE, readCoachingHistory, verifyBundlePayment, type CoachingHistory, type StripeReader } from "./bundleCreditStripe"

// Gathers the facts for one application and runs the credit rules on them.
// The form, the admin screens and checkout all come through here.

export interface CreditApplication {
  id: string | null
  email: string
  ownerEmail?: string
  applicationDate: string
  // Set on applications the billing-change cron creates for existing clients.
  billingChangeId?: string
}

export interface AssessDeps {
  // Null for a quick read from our own records only. Older purchases then
  // show as needing a check, and no credit is ever applied from that.
  stripe: StripeReader | null
  db?: CreditDb
  readClient: (email: string) => Promise<{ stripeSubscriptionId?: string } | null>
}

export interface AssessInput {
  application: CreditApplication
  commitmentType: CommitmentType | null
  priceCents: number | null
  // A live tick-box value from the approval screen. Undefined reads the
  // choice saved at approval.
  applyChoice?: boolean | null
  now?: string
}

export interface CreditAssessment {
  purchaseEmail: string | null
  record: StoredBundlePurchase | null
  payment: BundlePaymentCheck
  history: CoachingHistory | null
  storedChoice: boolean | null
  // Everything the rules need except Lisa's price, commitment and tick-box,
  // so a screen can re-run planBundleCredit as she edits them.
  facts: CreditFacts
  plan: CreditPlan
}

// billingChangeId is written by the billing-change cron for existing clients
// moving rate. Read loosely so this works whether or not the application type
// declares it yet.
export function creditApplicationOf(app: CoachingApplication): CreditApplication & { id: string } {
  const billingChangeId = (app as CoachingApplication & { billingChangeId?: unknown }).billingChangeId
  return {
    id: app.id,
    email: app.email,
    ownerEmail: app.ownerEmail,
    applicationDate: app.applicationDate,
    billingChangeId: typeof billingChangeId === "string" && billingChangeId ? billingChangeId : undefined,
  }
}

export function candidateEmails(application: Pick<CreditApplication, "email" | "ownerEmail">): string[] {
  const all = [application.email, application.ownerEmail]
    .filter((e): e is string => !!e)
    .map((e) => e.trim().toLowerCase())
  return Array.from(new Set(all))
}

export async function assessBundleCredit(deps: AssessDeps, input: AssessInput): Promise<CreditAssessment> {
  const now = input.now ?? new Date().toISOString()
  const emails = candidateEmails(input.application)

  let record: StoredBundlePurchase | null = null
  for (const email of emails) {
    record = await readBundlePurchase(email, deps.db)
    if (record) break
  }
  const payment = await verifyBundlePayment(record, deps.stripe)

  let hasPriorCoachingPayment: boolean | null = false
  for (const email of emails) {
    const client = await deps.readClient(email).catch(() => null)
    if (client?.stripeSubscriptionId) hasPriorCoachingPayment = true
  }
  let history: CoachingHistory | null = null
  if (deps.stripe) {
    history = await readCoachingHistory(deps.stripe, emails)
    if (!history.verified) hasPriorCoachingPayment = hasPriorCoachingPayment === true ? true : null
    else if (history.hasPriorPayment) hasPriorCoachingPayment = true
  }

  const storedChoice = input.application.id
    ? await readBundleCreditChoice(input.application.id, input.priceCents, deps.db).catch(() => null)
    : null
  const applyChoice = input.applyChoice !== undefined ? input.applyChoice : storedChoice

  const facts: CreditFacts = {
    payment,
    usage: record?.usage ?? NO_USAGE,
    applicationId: input.application.id,
    applicationDate: input.application.applicationDate,
    isBillingChange: !!input.application.billingChangeId,
    hasPriorCoachingPayment,
    now,
  }
  const plan = planBundleCredit({ ...facts, commitmentType: input.commitmentType, priceCents: input.priceCents, applyChoice })
  return { purchaseEmail: record?.email ?? null, record, payment, history, storedChoice, facts, plan }
}

export interface CouponCreator {
  coupons: {
    create(params: {
      amount_off: number
      currency: string
      duration: "once"
      max_redemptions: number
      redeem_by: number
      name: string
      metadata: Record<string, string>
    }): Promise<{ id: string }>
  }
}

export interface CheckoutCredit {
  couponId: string
  email: string
  amountCents: number
}

// Called while minting a coaching Checkout Session. Holds the credit for this
// application first, so a second application or a second tab cannot also get
// a coupon, and only then creates the one-time coupon. A coupon that can't be
// created gives the hold back and stops checkout rather than quietly charging
// full price. The credit is not marked used here; the paid invoice does that.
export async function reserveCreditForCheckout(
  deps: AssessDeps & { stripe: StripeReader & CouponCreator },
  input: { application: CreditApplication & { id: string }; commitmentType: CommitmentType; priceCents: number; now?: string },
): Promise<CheckoutCredit | null> {
  const now = input.now ?? new Date().toISOString()
  const { plan, purchaseEmail, payment, history } = await assessBundleCredit(deps, {
    application: input.application,
    commitmentType: input.commitmentType,
    priceCents: input.priceCents,
    now,
  })
  // A bundle buyer must not be charged full price because Stripe had a bad
  // moment. Checkout stops and can be retried instead.
  const stripeDown = (payment.state === "unverified" && payment.reason === STRIPE_UNREACHABLE) || (history !== null && !history.verified)
  if (purchaseEmail && stripeDown && !input.application.billingChangeId) {
    throw new Error("I couldn't check your bundle credit just now. Nothing was charged. Please try again in a minute.")
  }
  if (!purchaseEmail || !plan.apply || plan.appliedCents <= 0) return null

  const until = new Date(new Date(now).getTime() + BUNDLE_CREDIT_RESERVATION_MS).toISOString()
  const held = await reserveBundleCredit({ email: purchaseEmail, applicationId: input.application.id, until, now }, deps.db)
  if (!held) return null

  let couponId: string
  try {
    const coupon = await deps.stripe.coupons.create({
      amount_off: plan.appliedCents,
      currency: "usd",
      duration: "once",
      max_redemptions: 1,
      redeem_by: Math.floor(new Date(until).getTime() / 1000),
      name: "Bundle credit",
      metadata: {
        bundleCredit: "true",
        bundleCreditEmail: purchaseEmail,
        applicationId: input.application.id,
        applicantEmail: input.application.email,
        coachingCommitmentType: input.commitmentType,
      },
    })
    couponId = coupon.id
  } catch (err) {
    await releaseBundleCredit({ email: purchaseEmail, applicationId: input.application.id, couponId: PENDING_COUPON }, deps.db).catch(() => {})
    console.error("Stripe coupon create failed:", err)
    throw new Error("I couldn't add your bundle credit to checkout just now. Nothing was charged. Please try again in a minute.")
  }
  // The hold can be lost between taking it and here (it lapsed, or the
  // checkout it replaced was released late). The coupon is then left unused.
  const attached = await attachReservedCoupon({ email: purchaseEmail, applicationId: input.application.id, couponId }, deps.db)
    .catch(async (err) => {
      console.error("attachReservedCoupon failed:", err)
      await releaseBundleCredit({ email: purchaseEmail, applicationId: input.application.id, couponId: PENDING_COUPON }, deps.db).catch(() => {})
      return false
    })
  if (!attached) {
    throw new Error("I couldn't add your bundle credit to checkout just now. Nothing was charged. Please try again in a minute.")
  }
  return { couponId, email: purchaseEmail, amountCents: plan.appliedCents }
}
