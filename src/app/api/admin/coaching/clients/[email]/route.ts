import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import Stripe from "stripe"
import {
  isAdminEmail,
  getCoachingClientRecord,
  updateCoachingClientRecord,
  listCoachingClientRecords,
  deleteCoachingClientCascade,
} from "@/lib/authTokens"
import { adminMfaOk } from "@/lib/adminMfa"

export const dynamic = "force-dynamic"

async function verifyAdmin(req: NextRequest): Promise<boolean> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return false
  try {
    const cognito = new CognitoIdentityProviderClient({
      region: process.env.COGNITO_REGION ?? "us-east-2",
      credentials: {
        accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
      },
    })
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    const callerEmail = result.UserAttributes?.find((a) => a.Name === "email")?.Value
    return callerEmail != null && isAdminEmail(callerEmail) && adminMfaOk(result)
  } catch {
    return false
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { email } = await params
  const decoded = decodeURIComponent(email)

  let client = await getCoachingClientRecord(decoded)

  // Fallback: scan all records and match by email field (handles userId/case drift)
  if (!client) {
    const all = await listCoachingClientRecords()
    const match = all.find((c) => c.email?.toLowerCase() === decoded.toLowerCase())
    if (match) client = match
  }

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ client })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { email } = await params
  const updates = await req.json()
  await updateCoachingClientRecord(decodeURIComponent(email), updates)
  return NextResponse.json({ ok: true })
}

// Statuses that indicate a live billing obligation that must be resolved before deletion.
const BLOCKING_STRIPE_STATUSES = ["active", "trialing", "past_due", "unpaid", "paused"]

async function findBlockingStripeSubscriptions(email: string, linkedSubId: string | undefined): Promise<string[]> {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "")
  const blocking: string[] = []

  // 1. Check the stored stripeSubscriptionId directly — catches manually linked subs.
  //    We do NOT filter by metadata.product here: we stored this ID ourselves, so we trust
  //    it is this client's subscription regardless of whether metadata was set at creation time.
  //    Only swallow "resource_missing" (sub deleted from Stripe); re-throw network/auth errors
  //    so the outer catch can return 503 and block deletion conservatively.
  if (linkedSubId) {
    const sub = await stripe.subscriptions.retrieve(linkedSubId).catch((err: { code?: string }) => {
      if (err?.code === "resource_missing") return null
      throw err
    })
    if (sub && BLOCKING_STRIPE_STATUSES.includes(sub.status)) {
      blocking.push(sub.id)
    }
  }

  // 2. Search all customers for this email, paginating through their subscriptions.
  //    Let network errors propagate so the outer catch can block deletion conservatively.
  const customers = await stripe.customers.list({ email, limit: 10 })
  for (const customer of customers.data) {
    let startingAfter: string | undefined
    do {
      const page = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })
      for (const sub of page.data) {
        if (sub.metadata?.product === "coaching" && BLOCKING_STRIPE_STATUSES.includes(sub.status)) {
          if (!blocking.includes(sub.id)) blocking.push(sub.id)
        }
      }
      startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : undefined
    } while (startingAfter)
  }

  return blocking
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { email } = await params
  const body = await req.json().catch(() => ({})) as { confirm?: string }
  if (body.confirm !== "DELETE") {
    return NextResponse.json({ error: "confirm must equal 'DELETE'" }, { status: 400 })
  }
  const decoded = decodeURIComponent(email)

  // Load the client record to get their linked subscription ID
  const client = await getCoachingClientRecord(decoded).catch(() => null)

  // Check Stripe for any live billing obligations before allowing deletion.
  // This includes manually created subscriptions and any subscription found via email search.
  // If Stripe cannot be checked reliably, block deletion with an actionable error.
  let blockingSubscriptions: string[] = []
  try {
    blockingSubscriptions = await findBlockingStripeSubscriptions(decoded, client?.stripeSubscriptionId)
  } catch (err) {
    console.error("Stripe check failed during client deletion attempt:", err)
    return NextResponse.json({
      error: "Cannot verify Stripe billing status. Deletion blocked to prevent orphaned subscriptions. Please check Stripe manually before retrying.",
      code: "stripe_check_failed",
    }, { status: 503 })
  }

  if (blockingSubscriptions.length > 0) {
    return NextResponse.json({
      error: `This client has ${blockingSubscriptions.length} active Stripe subscription${blockingSubscriptions.length > 1 ? "s" : ""} (${blockingSubscriptions.join(", ")}). Cancel or allow it to expire before deleting the client record.`,
      code: "active_stripe_subscription",
      subscriptionIds: blockingSubscriptions,
    }, { status: 409 })
  }

  const result = await deleteCoachingClientCascade(decoded)
  return NextResponse.json({ ok: true, deleted: result })
}
