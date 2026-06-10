import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { ADMIN_EMAIL, getCoachingClientRecord, updateCoachingClientRecord } from "@/lib/authTokens"

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
    return callerEmail === ADMIN_EMAIL
  } catch {
    return false
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ email: string }> }) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { email } = await params
  const client = await getCoachingClientRecord(decodeURIComponent(email))
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
