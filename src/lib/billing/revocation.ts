import type { SubSnapshot } from "./snapshot"
import type { BillingMode } from "./rules"

// When Stripe says a coaching subscription has been deleted, does the access
// switch go off?
//
// Paid clients: yes, as before (unless the deleted subscription isn't the one
// on file, which is a stale event).
//
// Complimentary clients: their access comes from the complimentary grant, not
// from Stripe (see entitlement.ts). The switch only goes off when the client,
// or Lisa, asked for coaching to end and this deletion is that scheduled end,
// or when the grant has already ended. Any other deletion (a payment failure,
// a dispute, a manual delete in the Stripe dashboard, an unknown cause) keeps
// access and asks Lisa to look.
//
// Signals that someone is complimentary: the billing record, a Make
// Complimentary change still in progress, and two markers our own action puts
// on the Stripe subscription. The Stripe markers only ever protect access that
// already exists; they never grant it. The client record's `accessType` field
// is not a signal: it was never reliably written.

export type DeletionDecision =
  | { action: "revoke"; reason: "paid-subscription-ended" | "complimentary-cancellation-requested" | "complimentary-already-ended" }
  | { action: "keep"; reason: "stale-subscription" | "complimentary-unexpected-deletion"; alert: boolean; detail: string }

export type DeletionInput = {
  deleted: Pick<SubSnapshot, "id" | "pause" | "metadata" | "cancellationReason" | "cancelAtPeriodEnd" | "cancelAt">
  client: { stripeSubscriptionId?: string | null; cancellationScheduledAt?: string | null } | null
  billing: { mode: BillingMode; grantActive: boolean; pendingKind?: string | null; pendingStatus?: string | null } | null
}

export function complimentarySignals(input: DeletionInput): string[] {
  const s: string[] = []
  if (input.billing?.mode === "complimentary" && input.billing.grantActive) s.push("complimentary grant")
  if (input.billing?.pendingKind === "MAKE_COMPLIMENTARY" && input.billing.pendingStatus !== "FAILED") s.push("change in progress")
  if (input.deleted.pause?.behavior === "void" && !input.deleted.pause.resumesAt) s.push("Stripe collection paused")
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

  // A complimentary grant that has already ended (its end date passed, an
  // admin ended it, or the client's cancellation took effect) has nothing left
  // to protect, unless a new Make Complimentary is in progress.
  const endedGrant = input.billing?.mode === "complimentary" && !input.billing.grantActive
  const changeInProgress = input.billing?.pendingKind === "MAKE_COMPLIMENTARY" && input.billing.pendingStatus !== "FAILED"
  if (endedGrant && !changeInProgress) return { action: "revoke", reason: "complimentary-already-ended" }

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
    detail: `The Stripe subscription of a complimentary client (${signals.join(", ")}) was deleted ${why}. Their coaching access was kept. If coaching should end, end their complimentary coaching from their billing panel.`,
  }
}
