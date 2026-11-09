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
