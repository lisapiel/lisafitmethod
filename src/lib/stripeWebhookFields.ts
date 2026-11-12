type SubRef = string | { id?: string } | null | undefined

export type InvoiceLike = {
  subscription?: SubRef
  parent?: { subscription_details?: { subscription?: SubRef } | null } | null
  lines?: { data?: Array<{ subscription?: SubRef }> }
}

function refId(ref: SubRef): string {
  if (typeof ref === "string") return ref
  return ref?.id ?? ""
}

// Stripe moved the subscription reference between API versions; an invoice may
// carry it in any of these places.
export function invoiceSubscriptionId(invoice: InvoiceLike): string {
  return (
    refId(invoice.subscription) ||
    refId(invoice.parent?.subscription_details?.subscription) ||
    (invoice.lines?.data?.map((l) => refId(l.subscription)).find(Boolean) ?? "")
  )
}

export type EndedSubscriptionLike = { ended_at?: number | null; canceled_at?: number | null }

// A delivery can arrive hours after the cancellation, so the delivery time is
// not the effective date.
export function subscriptionEndedAt(subscription: EndedSubscriptionLike, eventCreated: number): string {
  const seconds = subscription.ended_at ?? subscription.canceled_at ?? eventCreated
  return new Date(seconds * 1000).toISOString()
}

// A cancellation for an older subscription must not end access that a newer
// subscription now provides.
export function isStaleCancellation(storedSubscriptionId: string | undefined, deletedSubscriptionId: string): boolean {
  return !!storedSubscriptionId && storedSubscriptionId !== deletedSubscriptionId
}
