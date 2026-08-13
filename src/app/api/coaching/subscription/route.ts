import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import Stripe from "stripe"
import { getCoachingClientRecord } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

function makeStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
}

function makeCognito() {
  return new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  })
}

async function getCallerEmail(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    return result.UserAttributes?.find((a) => a.Name === "email")?.Value ?? null
  } catch {
    return null
  }
}

// Compute the commitment end date: subscription start + N months (actual calendar months,
// not approximated as days). This matches Stripe's own monthly billing cycle boundaries.
function computeCommitmentEndDate(subscriptionStartDate: string, commitmentMonths: number): string {
  const d = new Date(subscriptionStartDate)
  d.setMonth(d.getMonth() + commitmentMonths)
  return d.toISOString()
}

export async function GET(req: NextRequest) {
  const email = await getCallerEmail(req)
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const client = await getCoachingClientRecord(email)
  if (!client) return NextResponse.json({ subscription: null })

  // Only return data for active coaching clients
  if (client.status !== "ACTIVE" && client.status !== "PAUSED") {
    return NextResponse.json({ subscription: null })
  }

  const result: {
    approvedPriceInCents: number | null
    commitmentType: string | null
    commitmentMonths: number | null
    subscriptionStartDate: string | null
    commitmentEndDate: string | null
    commitmentNeedsConfirmation: boolean
    commitmentFulfilled: boolean
    stripeSubscriptionId: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    cancelAt: string | null
    cancellationScheduledAt: string | null
    cancellationEffectiveDate: string | null
    status: string
  } = {
    approvedPriceInCents: client.approvedPriceInCents ?? null,
    commitmentType: client.commitmentType ?? null,
    commitmentMonths: client.commitmentMonths ?? null,
    subscriptionStartDate: client.subscriptionStartDate ?? null,
    commitmentEndDate: null,
    commitmentNeedsConfirmation: client.commitmentNeedsConfirmation === true,
    commitmentFulfilled: false,
    stripeSubscriptionId: client.stripeSubscriptionId ?? null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    cancelAt: null,
    cancellationScheduledAt: client.cancellationScheduledAt ?? null,
    cancellationEffectiveDate: client.cancellationEffectiveDate ?? null,
    status: client.status ?? "ACTIVE",
  }

  // Compute commitment end date
  if (client.subscriptionStartDate && client.commitmentMonths && client.commitmentMonths > 0) {
    result.commitmentEndDate = computeCommitmentEndDate(client.subscriptionStartDate, client.commitmentMonths)
    result.commitmentFulfilled = new Date() >= new Date(result.commitmentEndDate)
  } else if (client.commitmentType === "MONTH_TO_MONTH") {
    result.commitmentFulfilled = true
  }

  // Fetch live billing data from Stripe if we have a subscription ID
  if (client.stripeSubscriptionId) {
    try {
      const stripe = makeStripe()
      const sub = await stripe.subscriptions.retrieve(client.stripeSubscriptionId)
      const rawPeriodEnd = sub.items?.data?.[0]?.current_period_end ?? 0
      result.currentPeriodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000).toISOString() : null
      result.cancelAtPeriodEnd = sub.cancel_at_period_end
      result.cancelAt = sub.cancel_at ? new Date(sub.cancel_at * 1000).toISOString() : null
    } catch (err) {
      console.error("GET /api/coaching/subscription: Stripe retrieve failed", err)
    }
  }

  return NextResponse.json({ subscription: result })
}
