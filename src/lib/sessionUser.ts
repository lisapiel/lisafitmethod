import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"

// Who is making this request, as the server sees it.
//
// `sub` is Cognito's immutable user id. It is the only identifier that stays
// put when someone changes their email, so ownership is recorded against it
// and the email is carried alongside for display and for the records that are
// still keyed by address.
export type SessionUser = { email: string; sub: string }

export async function getSessionUser(): Promise<SessionUser | null> {
  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (contextSpec): Promise<SessionUser | null> => {
      try {
        const session = await fetchAuthSession(contextSpec)
        const payload = session.tokens?.idToken?.payload
        if (!payload) return null
        const email = typeof payload.email === "string" ? payload.email.toLowerCase() : ""
        const sub = typeof payload.sub === "string" ? payload.sub : ""
        if (!email || !sub) return null
        return { email, sub }
      } catch {
        return null
      }
    },
  })
}
