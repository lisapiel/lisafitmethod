import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb"
import { getCoachingClientRecord } from "@/lib/authTokens"
import { notifyAdmin } from "@/lib/notifyAdmin"

export const dynamic = "force-dynamic"

const TABLE = process.env.DYNAMODB_TABLE ?? "lfm-user-progress"

function makeDb() {
  return DynamoDBDocumentClient.from(new DynamoDBClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  }))
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

function formatPrice(cents: number) {
  const dollars = cents / 100
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

// POST /api/coaching/restart-request
// Submitted by a former coaching client who wants to re-enroll.
// Stores the request and notifies admin. Does NOT create a subscription or charge anything.
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let callerEmail: string | null = null
  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    callerEmail = result.UserAttributes?.find((a) => a.Name === "email")?.Value?.toLowerCase() ?? null
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!callerEmail) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    helpWith?: string
    changedSince?: string
    timeline?: string
  }

  const helpWith = body.helpWith?.trim() ?? ""
  const timeline = body.timeline?.trim() ?? ""
  if (!helpWith) return NextResponse.json({ error: "helpWith is required" }, { status: 400 })
  if (!timeline) return NextResponse.json({ error: "timeline is required" }, { status: 400 })

  // Get their previous coaching record for context
  const previousRecord = await getCoachingClientRecord(callerEmail).catch(() => null)

  const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()

  const item = {
    userId: `coaching_restart_${requestId}`,
    email: callerEmail,
    displayName: previousRecord?.displayName ?? callerEmail,
    submittedAt: now,
    helpWith,
    changedSince: body.changedSince?.trim() || null,
    timeline,
    previousPriceInCents: previousRecord?.approvedPriceInCents ?? null,
    previousCommitmentType: previousRecord?.commitmentType ?? null,
    previousSubscriptionStartDate: previousRecord?.subscriptionStartDate ?? null,
    previousCancellationDate: previousRecord?.cancellationEffectiveDate ?? null,
    previousCancellationReason: previousRecord?.cancellationReason ?? null,
  }

  await makeDb().send(new PutCommand({ TableName: TABLE, Item: item }))

  const timelineLabels: Record<string, string> = {
    asap: "As soon as possible",
    "few-weeks": "Within the next few weeks",
    exploring: "Just exploring for now",
  }

  // Admin notification with full context
  notifyAdmin({
    kind: "application-received",
    subject: `Coaching restart request — ${item.displayName}`,
    headline: `${item.displayName} wants to restart coaching`,
    body: [
      `Email: ${callerEmail}`,
      `Timeline: ${timelineLabels[timeline] ?? timeline}`,
      `What they want help with: ${helpWith}`,
      body.changedSince?.trim() ? `Changes since last period: ${body.changedSince.trim()}` : "",
      "─── Previous coaching history ───",
      previousRecord?.approvedPriceInCents ? `Previous price: ${formatPrice(previousRecord.approvedPriceInCents)}/month` : "",
      previousRecord?.commitmentType ? `Previous commitment: ${previousRecord.commitmentType === "THREE_MONTH_MINIMUM" ? "3-month minimum" : "Month-to-month"}` : "",
      previousRecord?.subscriptionStartDate ? `Previous start date: ${formatDate(previousRecord.subscriptionStartDate)}` : "",
      previousRecord?.cancellationEffectiveDate ? `Last active through: ${formatDate(previousRecord.cancellationEffectiveDate)}` : "",
      previousRecord?.cancellationReason ? `Previous cancellation reason: ${previousRecord.cancellationReason}` : "",
    ].filter(Boolean).join("\n"),
    ctaLabel: "View client profile",
    ctaHref: `https://lisafitmethod.com/admin/coaching/clients/${encodeURIComponent(callerEmail)}`,
    meta: { email: callerEmail, requestId },
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
