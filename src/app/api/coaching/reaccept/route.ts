import { NextRequest, NextResponse } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import {
  recordTermsAcceptance,
  stampCoachingAccessVersions,
  TERMS_VERSION,
  LIABILITY_WAIVER_VERSION,
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

async function getCallerEmail(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  try {
    const cognito = makeCognito()
    const result = await cognito.send(new GetUserCommand({ AccessToken: auth.slice(7) }))
    return result.UserAttributes?.find((a) => a.Name === "email")?.Value?.toLowerCase() ?? null
  } catch {
    return null
  }
}

// POST /api/coaching/reaccept
// Called from the in-portal reacceptance interstitial when an existing
// coaching client accepts the updated Terms & Conditions and Liability Waiver.
// Records a durable acceptance row and stamps the current versions on the
// coaching_access_ record so the layout gate clears immediately.
export async function POST(req: NextRequest) {
  const email = await getCallerEmail(req)
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const forwardedFor = req.headers.get("x-forwarded-for") ?? ""
  const ipAddress = forwardedFor.split(",")[0].trim() || undefined
  const userAgent = req.headers.get("user-agent") ?? undefined

  try {
    await recordTermsAcceptance({
      kind: "coaching-subscription",
      customerEmail: email,
      product: "coaching",
      termsVersion: TERMS_VERSION,
      liabilityWaiverVersion: LIABILITY_WAIVER_VERSION,
      ipAddress,
      userAgent,
      termsUrl: "/terms#coaching",
      liabilityWaiverUrl: "/terms#risk",
    })
    await stampCoachingAccessVersions(email, TERMS_VERSION, LIABILITY_WAIVER_VERSION)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("coaching reaccept failed:", err)
    return NextResponse.json({ error: "Failed to record acceptance" }, { status: 500 })
  }
}
