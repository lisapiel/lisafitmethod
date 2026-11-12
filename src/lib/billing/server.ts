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
      const r = c as { stripeSubscriptionId?: string; accessType?: string; cancellationScheduledAt?: string }
      return { stripeSubscriptionId: r.stripeSubscriptionId ?? null, accessType: r.accessType ?? null, cancellationScheduledAt: r.cancellationScheduledAt ?? null }
    },
  }
}

export function actionResponse(r: ActionResult): NextResponse {
  return r.ok ? NextResponse.json(r) : NextResponse.json(r, { status: r.status })
}

export const cleanEmail = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "")
