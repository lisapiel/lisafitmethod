import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import Stripe from "stripe"
import { isAdminEmail, getCoachingClientRecord, updateCoachingClientRecord } from "@/lib/authTokens"
import { adminMfaOk } from "@/lib/adminMfa"

export const dynamic = "force-dynamic"

function makeCognito() {
  return new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  })
}

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return false
  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    const callerEmail = result.UserAttributes?.find((a) => a.Name === "email")?.Value
    return callerEmail != null && isAdminEmail(callerEmail) && adminMfaOk(result)
  } catch {
    return false
  }
}

// POST /api/admin/coaching/billing/link-subscription
//
// Finds the active coaching subscription in Stripe for a given email and stores
// its ID on the client record. This is a pure linking operation — it does NOT:
// - Create a Cognito account
// - Send welcome or password-setup emails
// - Grant or modify coaching access records
// - Change the client's status
// - Update application records
//
// If the client already has stripeSubscriptionId set, this will overwrite it.
// The endpoint returns the found subscription ID and amount for confirmation display.
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as { email?: string }
  const email = body.email?.trim().toLowerCase() ?? ""
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  const client = await getCoachingClientRecord(email).catch(() => null)
  if (!client) return NextResponse.json({ error: "Client record not found. Create the client first." }, { status: 404 })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")

  // Search all Stripe customers matching this email, paginating through subscriptions
  const customers = await stripe.customers.list({ email, limit: 10 }).catch(() => ({ data: [] }))
  if (customers.data.length === 0) {
    return NextResponse.json({
      error: `No Stripe customer found for ${email}. Check the email matches the Stripe customer exactly.`,
    }, { status: 404 })
  }

  let foundSub: Stripe.Subscription | null = null
  let foundCustomerId = ""
  for (const customer of customers.data) {
    const subs = await stripe.subscriptions.list({ customer: customer.id, status: "active", limit: 10 })
    const coaching = subs.data.find((s) => s.metadata?.product === "coaching")
    if (coaching) {
      foundSub = coaching
      foundCustomerId = customer.id
      break
    }
  }

  if (!foundSub) {
    return NextResponse.json({
      error: `No active coaching subscription found in Stripe for ${email}. Only active subscriptions can be linked.`,
    }, { status: 404 })
  }

  // Store only the subscription ID — no other side effects
  await updateCoachingClientRecord(email, { stripeSubscriptionId: foundSub.id })

  const item = foundSub.items.data[0]
  return NextResponse.json({
    ok: true,
    subscriptionId: foundSub.id,
    stripeCustomerId: foundCustomerId,
    unitAmountCents: item?.price?.unit_amount ?? 0,
    interval: item?.price?.recurring?.interval ?? "month",
    message: `Linked subscription ${foundSub.id} to client record. No emails sent, no access changed.`,
  })
}
