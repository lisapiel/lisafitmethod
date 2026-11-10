import type { CoachingApplication, CommitmentType } from "./authTokens"
import { STANDARD_COACHING_PRICE_CENTS, bundleNetPaidCents, type CreditFacts, type CreditUsage, type DisputeState } from "./bundleCredit"
import { assessBundleCredit, creditApplicationOf, type AssessDeps, type CreditApplication } from "./bundleCreditAssess"
import type { CoachingInvoice } from "./bundleCreditStripe"

// The read-only payment summary Lisa sees before sending a payment link and
// on a client's page. Every figure comes from a verified record or Stripe;
// anything that can't be checked says so instead of guessing.

export interface PaymentSummary {
  email: string
  application: { id: string; applicationDate: string; status: string; isBillingChange: boolean } | null
  purchase: null | {
    purchaseEmail: string
    purchasedAt: string | null
    paymentIntentId: string | null
    verified: boolean
    unverifiedReason: string | null
    paidCents: number | null
    refundedCents: number | null
    netCents: number | null
    currency: string | null
    dispute: DisputeState | null
  }
  usage: CreditUsage
  coachingPayments: { verified: boolean; reason: string | null; invoices: CoachingInvoice[] }
  standardPrices: Record<CommitmentType, number>
  current: { commitmentType: CommitmentType | null; priceCents: number | null }
  facts: CreditFacts
  storedChoice: boolean | null
}

export interface SummaryDeps extends AssessDeps {
  readApplication: (id: string) => Promise<CoachingApplication | null>
  latestApplicationFor: (email: string) => Promise<CoachingApplication | null>
  readClient: (email: string) => Promise<{ stripeSubscriptionId?: string; approvedPriceInCents?: number; commitmentType?: CommitmentType } | null>
}

export async function buildPaymentSummary(
  deps: SummaryDeps,
  input: { email: string; applicationId: string | null; commitmentType: CommitmentType | null; priceCents: number | null; now?: string },
): Promise<PaymentSummary | null> {
  const email = input.email.trim().toLowerCase()
  const app = input.applicationId
    ? await deps.readApplication(input.applicationId)
    : await deps.latestApplicationFor(email)
  if (input.applicationId && !app) return null
  const client = await deps.readClient(email).catch(() => null)

  const commitmentType = input.commitmentType ?? app?.approvedCommitmentType ?? client?.commitmentType ?? null
  const priceCents = input.priceCents ?? app?.approvedPriceInCents ?? client?.approvedPriceInCents ?? null
  const creditApp: CreditApplication = app ? creditApplicationOf(app) : { id: null, email, applicationDate: input.now ?? new Date().toISOString() }

  const a = await assessBundleCredit(deps, { application: creditApp, commitmentType, priceCents, now: input.now })

  let purchase: PaymentSummary["purchase"] = null
  if (a.record) {
    const verified = a.payment.state === "verified" ? a.payment.payment : null
    purchase = {
      purchaseEmail: a.record.email,
      purchasedAt: a.record.purchasedAt,
      paymentIntentId: a.record.paymentIntentId,
      verified: !!verified,
      unverifiedReason: a.payment.state === "unverified" ? a.payment.reason : null,
      paidCents: verified?.amountPaidCents ?? null,
      refundedCents: verified ? (verified.dispute === "lost" ? verified.amountPaidCents : verified.refundedCents) : null,
      netCents: verified ? bundleNetPaidCents(verified) : null,
      currency: verified?.currency ?? null,
      dispute: verified?.dispute ?? null,
    }
  }

  const history = a.history
  return {
    email,
    application: app ? { id: app.id, applicationDate: app.applicationDate, status: app.status, isBillingChange: !!creditApp.billingChangeId } : null,
    purchase,
    usage: a.facts.usage,
    coachingPayments: history
      ? { verified: history.verified, reason: history.verified ? null : history.reason, invoices: history.invoices }
      : { verified: false, reason: "Stripe wasn't checked", invoices: [] },
    standardPrices: STANDARD_COACHING_PRICE_CENTS,
    current: { commitmentType, priceCents },
    facts: a.facts,
    storedChoice: a.storedChoice,
  }
}
