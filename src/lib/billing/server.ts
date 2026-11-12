import Stripe from "stripe"
import { NextResponse } from "next/server"
import { sharedDocClient } from "@/lib/dynamoClient"
import { getCoachingClientRecord } from "@/lib/authTokens"
import type { Deps, ActionResult } from "./actions"
import type { StripeLike } from "./stripeOps"

// Server-only wiring for billing management: the real table, Stripe and
// client records. Secrets stay on the server; the browser only calls our API.
export function billingDeps(): Deps {
  return {
    db: sharedDocClient(),
    stripe: new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { maxNetworkRetries: 1 }) as unknown as StripeLike,
    readClient: async (email) => {
      const c = await getCoachingClientRecord(email)
      if (!c) return null
      return {
        stripeSubscriptionId: c.stripeSubscriptionId ?? null,
        cancellationScheduledAt: c.cancellationScheduledAt ?? null,
        commitment: commitmentOf(c),
        commitmentNeedsConfirmation: c.commitmentNeedsConfirmation === true,
        approvedPriceInCents: c.approvedPriceInCents ?? null,
        cancellation: {
          requestedAt: c.cancellationRequestedAt ?? null,
          reason: c.cancellationReason ?? null,
          feedback: c.cancellationFeedback ?? null,
          alertedAt: c.cancellationAlertedAt ?? null,
          scheduledAt: c.cancellationScheduledAt ?? null,
          effectiveDate: c.cancellationEffectiveDate ?? null,
        },
      }
    },
  }
}

// The paid commitment from the client record: subscription start plus N
// calendar months, the same calculation the cancel and subscription routes use.
export function commitmentOf(c: { commitmentType?: string | null; subscriptionStartDate?: string | null; commitmentMonths?: number | null }): { type: string | null; endDate: string | null } | null {
  if (!c.commitmentType) return null
  if (!c.subscriptionStartDate || !c.commitmentMonths || c.commitmentMonths <= 0) return { type: c.commitmentType, endDate: null }
  const d = new Date(c.subscriptionStartDate)
  d.setMonth(d.getMonth() + c.commitmentMonths)
  return { type: c.commitmentType, endDate: d.toISOString() }
}

export function actionResponse(r: ActionResult): NextResponse {
  return r.ok ? NextResponse.json(r) : NextResponse.json(r, { status: r.status })
}

export const cleanEmail = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "")
