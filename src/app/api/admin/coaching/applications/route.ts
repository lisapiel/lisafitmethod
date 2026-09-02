import { NextRequest, NextResponse } from "next/server"
import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider"
import { listCoachingApplications, getBundleCredit, isAdminEmail } from "@/lib/authTokens"
import { getCustomerHistory } from "@/lib/customerHistory"

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
    return callerEmail != null && isAdminEmail(callerEmail)
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const applications = await listCoachingApplications()
  // Enrich each application with:
  //   - bundleCredit — legacy pill data (kept for back-compat with any consumer
  //     that already reads it)
  //   - history — full customer purchase/history summary so the coach can see
  //     at a glance what the applicant has already purchased before approving.
  const enriched = await Promise.all(applications.map(async (app) => {
    const [bundleCredit, history] = await Promise.all([
      getBundleCredit(app.email).catch(() => null),
      getCustomerHistory(app.email).catch(() => null),
    ])
    return { ...app, bundleCredit, history }
  }))
  return NextResponse.json({ applications: enriched })
}
