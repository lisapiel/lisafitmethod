import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { hasTrackerAccess } from "@/lib/authTokens"

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

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  return auth.slice(7)
}

async function getUserEmail(accessToken: string): Promise<string | null> {
  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: accessToken }))
    return result.UserAttributes?.find((a) => a.Name === "email")?.Value ?? null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = await getUserEmail(token)
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const access = await hasTrackerAccess(email)
  return NextResponse.json({ hasAccess: access })
}
