import { NextRequest, NextResponse } from "next/server"
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider"
import { listCoachingApplications, getBundleCredit } from "@/lib/authTokens"
import { ADMIN_EMAIL } from "@/lib/authTokens"

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

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const applications = await listCoachingApplications()
  // Enrich with bundleCredit so the queue can show a "Bundle credit $137" pill
  const enriched = await Promise.all(applications.map(async (app) => {
    const bundleCredit = await getBundleCredit(app.email).catch(() => null)
    return { ...app, bundleCredit }
  }))
  return NextResponse.json({ applications: enriched })
}
