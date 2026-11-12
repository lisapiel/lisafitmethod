import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { runClientCancellation } from "@/lib/billing/clientCancelFlow"

export const dynamic = "force-dynamic"

async function getCallerEmail(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const cognito = new CognitoIdentityProviderClient({
      region: process.env.COGNITO_REGION ?? "us-east-2",
      credentials: { accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "" },
    })
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    return result.UserAttributes?.find((a) => a.Name === "email")?.Value ?? null
  } catch {
    return null
  }
}

// POST /api/coaching/cancel
// A client cancels their own coaching online, with no conversation required.
// Also "Check again" for a request still being confirmed. See billing/clientCancelFlow.ts.
export async function POST(req: NextRequest) {
  const email = await getCallerEmail(req)
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = (await req.json().catch(() => ({}))) as { reason?: string; feedback?: string; timeZone?: string }
  const r = await runClientCancellation(email, { ...body, requestedBy: "client" })
  return NextResponse.json(r.body, { status: r.status })
}
