// Plain, testable views of the Stripe objects billing decisions depend on.
// Stripe responses are transport only: everything the rules read comes
// through these adapters, so the rules never touch a Stripe type directly.

export type PauseBehavior = "void" | "keep_as_draft" | "mark_uncollectible"

export type SubSnapshot = {
  id: string
  status: string
  customerId: string
  itemId: string | null
  productId: string | null
  unitAmountCents: number | null
  currency: string
  interval: string | null
  quantity: number
  itemCount: number
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  cancelAt: string | null
  pause: { behavior: PauseBehavior; resumesAt: string | null } | null
  scheduleId: string | null
  collectionMethod: string | null
  hasDefaultPaymentMethod: boolean
  discounts: DiscountSnapshot[]
  metadata: Record<string, string>
  cancellationReason: string | null
  endedAt: string | null
}

export type DiscountSnapshot = {
  couponId: string | null
  percentOff: number | null
  amountOffCents: number | null
  duration: string | null
  isBundleCredit: boolean
}

export type InvoiceSnapshot = {
  id: string
  number: string | null
  status: string
  subscriptionId: string | null
  amountDueCents: number
  amountPaidCents: number
  amountRemainingCents: number
  attemptCount: number
  nextPaymentAttempt: string | null
  createdAt: string | null
  paidAt: string | null
  hostedInvoiceUrl: string | null
  paymentProcessing: boolean
}

type Ref = string | { id?: string | null } | null | undefined
const refId = (r: Ref): string | null => (typeof r === "string" ? r : r?.id ?? null)
const iso = (seconds: number | null | undefined): string | null =>
  typeof seconds === "number" && seconds > 0 ? new Date(seconds * 1000).toISOString() : null

type StripeCouponLike = { id?: string; percent_off?: number | null; amount_off?: number | null; duration?: string | null; metadata?: Record<string, string> | null }
type StripeDiscountLike = string | { coupon?: StripeCouponLike | null; source?: { coupon?: StripeCouponLike | string | null } | null }

function toDiscount(d: StripeDiscountLike): DiscountSnapshot {
  if (typeof d === "string") return { couponId: null, percentOff: null, amountOffCents: null, duration: null, isBundleCredit: false }
  const raw = d.coupon ?? (typeof d.source?.coupon === "object" ? d.source.coupon : null)
  return {
    couponId: raw?.id ?? (typeof d.source?.coupon === "string" ? d.source.coupon : null),
    percentOff: raw?.percent_off ?? null,
    amountOffCents: raw?.amount_off ?? null,
    duration: raw?.duration ?? null,
    isBundleCredit: raw?.metadata?.bundleCredit === "true",
  }
}

export type StripeSubscriptionLike = {
  id: string
  status: string
  customer: Ref
  cancel_at_period_end?: boolean | null
  cancel_at?: number | null
  ended_at?: number | null
  pause_collection?: { behavior?: string | null; resumes_at?: number | null } | null
  schedule?: Ref
  collection_method?: string | null
  default_payment_method?: Ref
  metadata?: Record<string, string> | null
  discounts?: StripeDiscountLike[] | null
  cancellation_details?: { reason?: string | null } | null
  currency?: string | null
  items?: {
    data?: Array<{
      id?: string
      quantity?: number | null
      current_period_end?: number | null
      price?: { unit_amount?: number | null; product?: Ref; currency?: string | null; recurring?: { interval?: string | null } | null } | null
    }>
  } | null
}

export function toSubSnapshot(sub: StripeSubscriptionLike): SubSnapshot {
  const items = sub.items?.data ?? []
  const item = items[0]
  const behavior = sub.pause_collection?.behavior
  return {
    id: sub.id,
    status: sub.status,
    customerId: refId(sub.customer) ?? "",
    itemId: item?.id ?? null,
    productId: refId(item?.price?.product) ?? null,
    unitAmountCents: item?.price?.unit_amount ?? null,
    currency: item?.price?.currency ?? sub.currency ?? "usd",
    interval: item?.price?.recurring?.interval ?? null,
    quantity: item?.quantity ?? 1,
    itemCount: items.length,
    currentPeriodEnd: iso(item?.current_period_end),
    cancelAtPeriodEnd: sub.cancel_at_period_end === true,
    cancelAt: iso(sub.cancel_at),
    pause:
      behavior === "void" || behavior === "keep_as_draft" || behavior === "mark_uncollectible"
        ? { behavior, resumesAt: iso(sub.pause_collection?.resumes_at) }
        : null,
    scheduleId: refId(sub.schedule),
    collectionMethod: sub.collection_method ?? null,
    hasDefaultPaymentMethod: !!refId(sub.default_payment_method),
    discounts: (sub.discounts ?? []).map(toDiscount),
    metadata: { ...(sub.metadata ?? {}) },
    cancellationReason: sub.cancellation_details?.reason ?? null,
    endedAt: iso(sub.ended_at),
  }
}

export type StripeInvoiceLike = {
  id: string
  number?: string | null
  status?: string | null
  amount_due?: number | null
  amount_paid?: number | null
  amount_remaining?: number | null
  attempt_count?: number | null
  next_payment_attempt?: number | null
  created?: number | null
  hosted_invoice_url?: string | null
  status_transitions?: { paid_at?: number | null } | null
  subscription?: Ref
  parent?: { subscription_details?: { subscription?: Ref } | null } | null
  lines?: { data?: Array<{ subscription?: Ref }> } | null
  payments?: { data?: Array<{ payment?: { payment_intent?: { status?: string | null } | string | null } | null; status?: string | null }> } | null
}

export function invoiceSubscriptionRef(inv: StripeInvoiceLike): string | null {
  return (
    refId(inv.subscription) ??
    refId(inv.parent?.subscription_details?.subscription) ??
    (inv.lines?.data ?? []).map((l) => refId(l.subscription)).find(Boolean) ??
    null
  )
}

export function toInvoiceSnapshot(inv: StripeInvoiceLike): InvoiceSnapshot {
  const payments = inv.payments?.data ?? []
  const processing = payments.some((p) => {
    const pi = p.payment?.payment_intent
    return (typeof pi === "object" && pi?.status === "processing") || p.status === "processing"
  })
  return {
    id: inv.id,
    number: inv.number ?? null,
    status: inv.status ?? "unknown",
    subscriptionId: invoiceSubscriptionRef(inv),
    amountDueCents: inv.amount_due ?? 0,
    amountPaidCents: inv.amount_paid ?? 0,
    amountRemainingCents: inv.amount_remaining ?? 0,
    attemptCount: inv.attempt_count ?? 0,
    nextPaymentAttempt: iso(inv.next_payment_attempt),
    createdAt: iso(inv.created),
    paidAt: iso(inv.status_transitions?.paid_at),
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    paymentProcessing: processing,
  }
}
