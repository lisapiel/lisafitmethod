import { NextRequest } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { isAdminEmail } from "./authTokens"
import { adminMfaRequired, decideAdminAccess, type AdminAccess, type AdminUserFacts } from "./adminMfa"

export { adminMfaOk } from "./adminMfa"
export type { AdminAccess } from "./adminMfa"

function makeCognito() {
  return new CognitoIdentityProviderClient({
    region: process.env.COGNITO_REGION ?? "us-east-2",
    credentials: {
      accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
    },
  })
}

async function userFacts(accessToken: string): Promise<AdminUserFacts | null> {
  try {
    const result = await makeCognito().send(new GetUserCommand({ AccessToken: accessToken }))
    return {
      email: result.UserAttributes?.find((a) => a.Name === "email")?.Value ?? null,
      mfaSettings: result.UserMFASettingList ?? [],
    }
  } catch {
    return null
  }
}

function bearer(req: NextRequest): string | null {
  const auth = req.headers.get("authorization")
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null
}

// The full decision, with the reason when the caller is refused. `exempt` is
// only for the two-factor setup page and its status API, so an admin who has
// not enrolled yet can still reach the place where they enrol.
export async function checkAdminAccess(
  accessToken: string | null | undefined,
  options: { exempt?: boolean } = {},
): Promise<AdminAccess> {
  if (!accessToken) return { ok: false, reason: "signed-out" }
  const facts = await userFacts(accessToken)
  return decideAdminAccess(facts, { required: adminMfaRequired(), exempt: options.exempt ?? false })
}

export async function checkAdminRequest(req: NextRequest, options: { exempt?: boolean } = {}): Promise<AdminAccess> {
  return checkAdminAccess(bearer(req), options)
}

export async function verifyAdminRequest(req: NextRequest): Promise<string | null> {
  return verifyAdminToken(bearer(req))
}

// For server actions, which receive the admin's access token as an argument.
export async function verifyAdminToken(accessToken: string | null | undefined): Promise<string | null> {
  const access = await checkAdminAccess(accessToken)
  return access.ok ? access.email : null
}

// For server components: the signed-in coach's email from the session cookie, or null.
export async function adminSessionEmail(): Promise<string | null> {
  const { cookies } = await import("next/headers")
  const { fetchAuthSession } = await import("aws-amplify/auth/server")
  const { runWithAmplifyServerContext } = await import("@/lib/amplify-server")
  const session = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec): Promise<{ email: string | null; accessToken: string | null }> => {
      try {
        const s = await fetchAuthSession(contextSpec)
        return {
          email: (s.tokens?.idToken?.payload?.email as string | undefined) ?? null,
          accessToken: s.tokens?.accessToken?.toString() ?? null,
        }
      } catch {
        return { email: null, accessToken: null }
      }
    },
  })
  const email = session.email && isAdminEmail(session.email) ? session.email : null
  if (!email || !adminMfaRequired()) return email
  return (await verifyAdminToken(session.accessToken)) ? email : null
}
