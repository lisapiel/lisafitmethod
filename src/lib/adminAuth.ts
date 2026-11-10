import { NextRequest } from "next/server"
import { CognitoIdentityProviderClient, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider"
import { isAdminEmail } from "./authTokens"

export async function verifyAdminRequest(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  return verifyAdminToken(auth.slice(7))
}

// For server actions, which receive the admin's access token as an argument.
export async function verifyAdminToken(accessToken: string | null | undefined): Promise<string | null> {
  if (!accessToken) return null
  try {
    const cognito = new CognitoIdentityProviderClient({
      region: process.env.COGNITO_REGION ?? "us-east-2",
      credentials: {
        accessKeyId: process.env.COGNITO_AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.COGNITO_AWS_SECRET_ACCESS_KEY ?? "",
      },
    })
    const result = await cognito.send(new GetUserCommand({ AccessToken: accessToken }))
    const callerEmail = result.UserAttributes?.find((a) => a.Name === "email")?.Value
    return callerEmail && isAdminEmail(callerEmail) ? callerEmail : null
  } catch {
    return null
  }
}

// For server components: the signed-in coach's email from the session cookie, or null.
export async function adminSessionEmail(): Promise<string | null> {
  const { cookies } = await import("next/headers")
  const { fetchAuthSession } = await import("aws-amplify/auth/server")
  const { runWithAmplifyServerContext } = await import("@/lib/amplify-server")
  const email = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec): Promise<string | null> => {
      try {
        const session = await fetchAuthSession(contextSpec)
        return (session.tokens?.idToken?.payload?.email as string | undefined) ?? null
      } catch {
        return null
      }
    },
  })
  return email && isAdminEmail(email) ? email : null
}
