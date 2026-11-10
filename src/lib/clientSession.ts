import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"

// The signed-in client's email, lowercased, or null.
export async function clientSessionEmail(): Promise<string | null> {
  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (ctx) => {
      try {
        const e = (await fetchAuthSession(ctx)).tokens?.idToken?.payload?.email
        return typeof e === "string" ? e.toLowerCase() : null
      } catch { return null }
    },
  })
}

// The signed-in client's email (lowercased) and Cognito user id, or null.
export async function clientSessionIdentity(): Promise<{ email: string; sub: string } | null> {
  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (ctx) => {
      try {
        const payload = (await fetchAuthSession(ctx)).tokens?.idToken?.payload
        const e = payload?.email
        const sub = payload?.sub
        return typeof e === "string" && typeof sub === "string" && sub ? { email: e.toLowerCase(), sub } : null
      } catch { return null }
    },
  })
}
