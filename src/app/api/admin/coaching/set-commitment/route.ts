import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import {
  isAdminEmail,
  getCoachingClientRecord,
  updateCoachingClientRecord,
  type CommitmentType,
} from "@/lib/authTokens"

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
    return callerEmail != null && isAdminEmail(callerEmail)
  } catch {
    return false
  }
}

// POST /api/admin/coaching/set-commitment
// Allows the admin to confirm/set commitment terms for a legacy coaching client
// who was created before the explicit commitmentType field existed.
// Also used to correct an admin data-entry error on a new client BEFORE they
// have signed a Stripe cancellation request (i.e., before any substantive
// commitment logic has acted on the stored value).
export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as {
    email?: string
    commitmentType?: CommitmentType
    approvedPriceInCents?: number
    subscriptionStartDate?: string
  }

  const email = body.email?.trim().toLowerCase() ?? ""
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 })

  const commitmentType = body.commitmentType
  if (!commitmentType || !["THREE_MONTH_MINIMUM", "MONTH_TO_MONTH"].includes(commitmentType)) {
    return NextResponse.json({ error: "commitmentType must be THREE_MONTH_MINIMUM or MONTH_TO_MONTH" }, { status: 400 })
  }

  const client = await getCoachingClientRecord(email)
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const updates: Parameters<typeof updateCoachingClientRecord>[1] = {
    commitmentType,
    commitmentMonths: commitmentType === "THREE_MONTH_MINIMUM" ? 3 : 0,
    commitmentNeedsConfirmation: false,
  }

  if (body.approvedPriceInCents) {
    updates.approvedPriceInCents = body.approvedPriceInCents
  }

  if (body.subscriptionStartDate) {
    updates.subscriptionStartDate = body.subscriptionStartDate
  }

  await updateCoachingClientRecord(email, updates)

  return NextResponse.json({ ok: true })
}
