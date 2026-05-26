import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, AdminSetUserPasswordCommand } from "@aws-sdk/client-cognito-identity-provider"
import { getAuthToken, markAuthTokenUsed } from "@/lib/authTokens"

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

export async function POST(request: NextRequest) {
  let token: string, password: string
  try {
    const body = await request.json() as { token?: string; password?: string }
    token = body.token ?? ""
    password = body.password ?? ""
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  if (!token || !password) {
    return NextResponse.json({ error: "Missing token or password" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
  }

  const data = await getAuthToken(token)
  if (!data) return NextResponse.json({ error: "Link not found. Please request a new one." }, { status: 400 })
  if (data.used) return NextResponse.json({ error: "This link has already been used. Please log in or request a new link." }, { status: 400 })
  if (new Date(data.expiresAt) < new Date()) return NextResponse.json({ error: "This link has expired. Please request a new one." }, { status: 400 })

  try {
    const cognito = makeCognito()
    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID ?? "",
        Username: data.email,
        Password: password,
        Permanent: true,
      })
    )
    await markAuthTokenUsed(token)
    return NextResponse.json({ email: data.email })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("Password did not conform")) {
      return NextResponse.json({ error: "Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol." }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to set password. Please try again." }, { status: 500 })
  }
}
