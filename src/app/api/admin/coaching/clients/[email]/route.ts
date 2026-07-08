import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import {
  ADMIN_EMAIL,
  getCoachingClientRecord,
  updateCoachingClientRecord,
  listCoachingClientRecords,
  deleteCoachingClientCascade,
} from "@/lib/authTokens"

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
  const result = await deleteCoachingClientCascade(decoded)
  return NextResponse.json({ ok: true, deleted: result })
}
