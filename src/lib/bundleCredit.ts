import type { CommitmentType } from "./authTokens"
import { COACHING_3MONTH_CENTS, COACHING_MTM_CENTS } from "./pricing"

// The Complete Foundations Bundle coaching credit, as one set of rules.
//
// The application form, the approval screen, the payment summary, checkout
// and the webhook all call into this file, so they cannot disagree about who
// is owed what. Nothing here touches Stripe or the database.

export const BUNDLE_CREDIT_LEGACY_WINDOW_DAYS = 90
export const BUNDLE_CREDIT_WINDOW_DAYS = 30

// The moment the updated Terms of Use (30-day application window) take
// effect. Lisa sets this to the date she publishes those Terms. Until then it
// sits far in the future, so every purchase keeps the 90-day window it was
// sold with and nobody loses eligibility early. Purchases made before this
// instant keep 90 days for good; purchases on or after it get 30.
export const BUNDLE_CREDIT_30_DAY_CUTOVER = "2099-01-01T05:00:00.000Z"

// Calendar days are counted in Lisa's time zone, so "within 30 days" means
// the 30th day after purchase is still in, whatever the clock says.
export const BUNDLE_CREDIT_TIME_ZONE = "America/New_York"

// A held credit outlives the 24-hour Stripe Checkout Session it was reserved
// for by an hour, then lapses on its own if no webhook ever releases it.
export const BUNDLE_CREDIT_RESERVATION_MS = 25 * 60 * 60 * 1000

export const STANDARD_COACHING_PRICE_CENTS: Record<CommitmentType, number> = {
  THREE_MONTH_MINIMUM: COACHING_3MONTH_CENTS,
  MONTH_TO_MONTH: COACHING_MTM_CENTS,
}

export type DisputeState = "none" | "open" | "lost"

export interface VerifiedBundlePayment {
  paymentIntentId: string
  purchasedAt: string
  amountPaidCents: number
  refundedCents: number
  currency: string
  dispute: DisputeState
}

export type BundlePaymentCheck =
  | { state: "none" }
  | { state: "unverified"; purchasedAt: string | null; paymentIntentId: string | null; reason: string }
  | { state: "verified"; payment: VerifiedBundlePayment }

export interface CreditUsage {
  usedAt: string | null
  usedForApplicationId: string | null
  usedForInvoiceId: string | null
  usedAmountCents: number | null
  reservedForApplicationId: string | null
  reservedUntil: string | null
  reservedCouponId: string | null
}

export const NO_USAGE: CreditUsage = {
  usedAt: null,
  usedForApplicationId: null,
  usedForInvoiceId: null,
  usedAmountCents: null,
  reservedForApplicationId: null,
  reservedUntil: null,
  reservedCouponId: null,
}

export type CreditBlock =
  | "no-purchase"
  | "unverified"
  | "currency"
  | "refunded"
  | "disputed"
  | "window"
  | "used"
  | "reserved-elsewhere"
  | "month-to-month"
  | "billing-change"
  | "returning-client"
  | "history-unverified"

export const CREDIT_BLOCK_TEXT: Record<CreditBlock, string> = {
  "no-purchase": "No Complete Foundations Bundle purchase on file.",
  unverified: "Couldn't verify the bundle payment with Stripe.",
  currency: "The bundle was paid in a currency other than USD.",
  refunded: "The bundle was fully refunded, so there's nothing to credit.",
  disputed: "The bundle payment has an open dispute.",
  window: "The application came in after the application window closed.",
  used: "The bundle credit has already been used.",
  "reserved-elsewhere": "The credit is held for another open checkout.",
  "month-to-month": "Month-to-month coaching isn't eligible.",
  "billing-change": "This is a billing change for an existing client, not a first coaching payment.",
  "returning-client": "This client has paid for coaching before. The credit only applies to a first coaching payment.",
  "history-unverified": "Couldn't verify this client's previous coaching payments.",
}

export function bundleNetPaidCents(payment: Pick<VerifiedBundlePayment, "amountPaidCents" | "refundedCents" | "dispute">): number {
  if (payment.dispute === "lost") return 0
  const paid = Math.max(0, Math.round(payment.amountPaidCents))
  const refunded = Math.max(0, Math.round(payment.refundedCents))
  return Math.max(0, paid - refunded)
}

function validTime(iso: string | null | undefined): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : null
}

export function applicationWindowDays(purchasedAt: string, cutover: string = BUNDLE_CREDIT_30_DAY_CUTOVER): number {
  const bought = validTime(purchasedAt)
  const cut = validTime(cutover)
  if (bought === null || cut === null) return BUNDLE_CREDIT_LEGACY_WINDOW_DAYS
  return bought < cut ? BUNDLE_CREDIT_LEGACY_WINDOW_DAYS : BUNDLE_CREDIT_WINDOW_DAYS
}

// YYYY-MM-DD of an instant in Lisa's time zone.
export function businessDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUNDLE_CREDIT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date(iso))
}

function dayNumber(day: string): number {
  const [y, m, d] = day.split("-").map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000)
}

function addDays(day: string, days: number): string {
  const n = dayNumber(day) + days
  return new Date(n * 86_400_000).toISOString().slice(0, 10)
}

// The last calendar day an application can be submitted on.
export function applyByDay(purchasedAt: string, cutover: string = BUNDLE_CREDIT_30_DAY_CUTOVER): string {
  return addDays(businessDay(purchasedAt), applicationWindowDays(purchasedAt, cutover))
}

export function appliedWithinWindow(purchasedAt: string, applicationDate: string, cutover: string = BUNDLE_CREDIT_30_DAY_CUTOVER): boolean {
  if (validTime(purchasedAt) === null || validTime(applicationDate) === null) return false
  const elapsed = dayNumber(businessDay(applicationDate)) - dayNumber(businessDay(purchasedAt))
  return elapsed >= 0 && elapsed <= applicationWindowDays(purchasedAt, cutover)
}

export function reservationIsLive(usage: CreditUsage, now: string): boolean {
  const until = validTime(usage.reservedUntil)
  const at = validTime(now)
  return !!usage.reservedForApplicationId && until !== null && at !== null && until > at
}

export function canReserve(usage: CreditUsage, applicationId: string, now: string): boolean {
  if (usage.usedAt) return false
  if (!reservationIsLive(usage, now)) return true
  return usage.reservedForApplicationId === applicationId
}

// The facts about one person and one application, gathered on the server.
export interface CreditFacts {
  payment: BundlePaymentCheck
  usage: CreditUsage
  applicationId: string | null
  // When the application was submitted. The window is about the application,
  // not about when coaching starts.
  applicationDate: string
  isBillingChange: boolean
  // Null when it could not be checked. That blocks an automatic credit.
  hasPriorCoachingPayment: boolean | null
  now: string
}

export interface CreditPlanInput {
  payment: BundlePaymentCheck
  usage: CreditUsage
  applicationId: string | null
  // When the application was submitted. The window is about the application,
  // not about when coaching starts.
  applicationDate: string
  // Null while the applicant hasn't been given terms yet (the apply form).
  commitmentType: CommitmentType | null
  isBillingChange: boolean
  // Null when it could not be checked. That blocks an automatic credit.
  hasPriorCoachingPayment: boolean | null
  // Lisa's monthly price for this client. Null before she has set one.
  priceCents: number | null
  // Lisa's explicit choice on the approval screen. Null means she hasn't
  // made one, and the default for the price applies.
  applyChoice: boolean | null
  now: string
  cutover?: string
}

export interface CreditPlan {
  purchasedAt: string | null
  netPaidCents: number | null
  windowDays: number | null
  applyBy: string | null
  // Every rule that stops the credit. Empty means the credit can be applied.
  blocks: CreditBlock[]
  eligible: boolean
  eligibleCreditCents: number
  standardPriceCents: number | null
  isCustomPrice: boolean
  defaultApply: boolean
  apply: boolean
  appliedCents: number
  firstMonthCents: number | null
  laterMonthlyCents: number | null
}

export function planBundleCredit(input: CreditPlanInput): CreditPlan {
  const cutover = input.cutover ?? BUNDLE_CREDIT_30_DAY_CUTOVER
  const blocks: CreditBlock[] = []
  let purchasedAt: string | null = null
  let netPaidCents: number | null = null
  let windowDays: number | null = null
  let applyBy: string | null = null

  if (input.payment.state === "none") {
    blocks.push("no-purchase")
  } else if (input.payment.state === "unverified") {
    purchasedAt = input.payment.purchasedAt
    blocks.push("unverified")
  } else {
    const p = input.payment.payment
    purchasedAt = p.purchasedAt
    netPaidCents = bundleNetPaidCents(p)
    if (p.currency.toLowerCase() !== "usd") blocks.push("currency")
    if (netPaidCents <= 0) blocks.push("refunded")
    if (p.dispute === "open") blocks.push("disputed")
  }

  if (purchasedAt && validTime(purchasedAt) !== null) {
    windowDays = applicationWindowDays(purchasedAt, cutover)
    applyBy = applyByDay(purchasedAt, cutover)
    if (!appliedWithinWindow(purchasedAt, input.applicationDate, cutover)) blocks.push("window")
  }

  if (input.usage.usedAt) blocks.push("used")
  else if (reservationIsLive(input.usage, input.now) && input.usage.reservedForApplicationId !== input.applicationId) {
    blocks.push("reserved-elsewhere")
  }

  if (input.isBillingChange) blocks.push("billing-change")
  if (input.hasPriorCoachingPayment === true) blocks.push("returning-client")
  if (input.hasPriorCoachingPayment === null) blocks.push("history-unverified")
  if (input.commitmentType === "MONTH_TO_MONTH") blocks.push("month-to-month")

  const eligible = blocks.length === 0
  const eligibleCreditCents = eligible ? netPaidCents ?? 0 : 0

  const standardPriceCents = input.commitmentType ? STANDARD_COACHING_PRICE_CENTS[input.commitmentType] : null
  const price = input.priceCents !== null && input.priceCents > 0 ? Math.round(input.priceCents) : null
  const isCustomPrice = price !== null && standardPriceCents !== null && price !== standardPriceCents
  const canApply = eligible && input.commitmentType === "THREE_MONTH_MINIMUM" && price !== null && eligibleCreditCents > 0
  const defaultApply = canApply && !isCustomPrice
  const apply = canApply && (input.applyChoice ?? defaultApply)
  const appliedCents = apply && price !== null ? Math.min(eligibleCreditCents, price) : 0

  return {
    purchasedAt,
    netPaidCents,
    windowDays,
    applyBy,
    blocks,
    eligible,
    eligibleCreditCents,
    standardPriceCents,
    isCustomPrice,
    defaultApply,
    apply,
    appliedCents,
    firstMonthCents: price !== null ? price - appliedCents : null,
    laterMonthlyCents: price,
  }
}

// What the apply form may tell the applicant. "check" means a purchase is on
// file but couldn't be confirmed automatically, so Lisa confirms it by hand.
export type CreditFormStatus = "available" | "check" | "none"

export function creditFormStatus(plan: CreditPlan): CreditFormStatus {
  if (plan.eligible && plan.eligibleCreditCents > 0) return "available"
  const onlyUnchecked = plan.blocks.length > 0 && plan.blocks.every((b) => b === "unverified" || b === "history-unverified")
  return onlyUnchecked ? "check" : "none"
}

// What a paid invoice carrying a bundle-credit coupon should do to the record.
export type SettlementAction =
  | { action: "mark" }
  | { action: "already-marked" }
  | { action: "conflict"; usedForInvoiceId: string | null }
  | { action: "skip"; reason: "no-discount" }

export function decideSettlement(usage: CreditUsage, invoiceId: string, discountCents: number): SettlementAction {
  if (!(discountCents > 0)) return { action: "skip", reason: "no-discount" }
  if (usage.usedAt) {
    return usage.usedForInvoiceId === invoiceId
      ? { action: "already-marked" }
      : { action: "conflict", usedForInvoiceId: usage.usedForInvoiceId }
  }
  return { action: "mark" }
}

// An expired or abandoned checkout gives the credit back, but only if the
// hold is still the one that checkout made. A newer checkout for the same
// application carries a different coupon and keeps its hold.
export function shouldRelease(usage: CreditUsage, applicationId: string, couponId: string | null): boolean {
  if (usage.usedAt) return false
  if (usage.reservedForApplicationId !== applicationId) return false
  if (usage.reservedCouponId && couponId && usage.reservedCouponId !== couponId) return false
  return true
}

export function formatCents(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`
}
