import type { SubSnapshot } from "./snapshot"
import type { BillingMode } from "./rules"

// When Stripe says a coaching subscription has been deleted, does coaching
// access end?
//
// Paid clients: yes, as before (unless the deleted subscription isn't the one
// on file, which is a stale event).
//
// Complimentary clients: only when the client, or Lisa, asked for coaching to
// end and this deletion is that scheduled end. A deletion for any other reason
// (a payment failure, a dispute, a manual delete in the Stripe dashboard, an
// unknown cause) keeps their access and asks Lisa to look. Several independent
// signals mark someone complimentary, so a missing database write on our side
// can't make them look paid.

export type DeletionDecision =
  | { action: "revoke"; reason: "paid-subscription-ended" | "complimentary-cancellation-requested" }
  | { action: "keep"; reason: "stale-subscription" | "complimentary-unexpected-deletion"; alert: boolean; detail: string }

export type DeletionInput = {
  deleted: Pick<SubSnapshot, "id" | "pause" | "metadata" | "cancellationReason" | "cancelAtPeriodEnd" | "cancelAt">
  client: { stripeSubscriptionId?: string | null; cancellationScheduledAt?: string | null; accessType?: string | null } | null
  billing: { mode: BillingMode; pendingKind?: string | null; pendingStatus?: string | null } | null
}

export function complimentarySignals(input: DeletionInput): string[] {
  const s: string[] = []
  if (input.billing?.mode === "complimentary") s.push("billing record")
  if (input.billing?.pendingKind === "MAKE_COMPLIMENTARY" && input.billing.pendingStatus !== "FAILED") s.push("change in progress")
  if (input.client?.accessType === "complimentary") s.push("client record")
  if (input.deleted.pause?.behavior === "void") s.push("Stripe collection paused")
  if (input.deleted.metadata?.lfm_billing_mode === "complimentary") s.push("Stripe metadata")
  return s
}

export function decideOnSubscriptionDeleted(input: DeletionInput): DeletionDecision {
  const stored = input.client?.stripeSubscriptionId ?? null
  if (stored && stored !== input.deleted.id) {
    return {
      action: "keep",
      reason: "stale-subscription",
      alert: true,
      detail: `Subscription ${input.deleted.id} ended, but the client is linked to ${stored}. Access was left alone.`,
    }
  }

  const signals = complimentarySignals(input)
  if (signals.length === 0) return { action: "revoke", reason: "paid-subscription-ended" }

  const requested =
    !!input.client?.cancellationScheduledAt &&
    (input.deleted.cancelAtPeriodEnd || !!input.deleted.cancelAt) &&
    (input.deleted.cancellationReason === null || input.deleted.cancellationReason === "cancellation_requested")
  if (requested) return { action: "revoke", reason: "complimentary-cancellation-requested" }

  const why =
    input.deleted.cancellationReason === "payment_failed" ? "after failed payments"
    : input.deleted.cancellationReason === "payment_disputed" ? "after a payment dispute"
    : input.deleted.cancellationReason === "cancellation_requested" ? "by a cancellation nobody scheduled through Lisa Fit Method (for example in the Stripe dashboard)"
    : "for an unknown reason"
  return {
    action: "keep",
    reason: "complimentary-unexpected-deletion",
    alert: true,
    detail: `The Stripe subscription of a complimentary client (${signals.join(", ")}) was deleted ${why}. Their coaching access was kept. If coaching should end, revoke access from their profile.`,
  }
}
