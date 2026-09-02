import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { isAdminEmail, hasMasterclassAccess } from "@/lib/authTokens"
import { MASTERCLASS_CUSTOMER_VISIBLE } from "@/lib/productVisibility"

// Server-side visibility gate for customer-facing Masterclass sales /
// info surfaces (/masterclass-info, /masterclass/subscribe, and any
// future public marketing page). Call at the top of the page's default
// export before rendering.
//
// Passes (does nothing) when ANY of these hold:
//   1. MASTERCLASS_CUSTOMER_VISIBLE flag is on — product is launched
//   2. Caller is authenticated and is an authorized admin
//   3. Caller is authenticated AND already owns real Masterclass access
//      (so an existing subscriber isn't accidentally locked out of the
//      subscribe/info flow they might need to reach — e.g. billing).
//
// Otherwise redirects to "/". Protected Masterclass portal + backend
// entitlement logic + admin surfaces are unaffected.
export async function assertMasterclassPublicVisible(): Promise<void> {
  if (MASTERCLASS_CUSTOMER_VISIBLE) return

  const email = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (ctx): Promise<string | null> => {
      try {
        const s = await fetchAuthSession(ctx)
        return (s.tokens?.idToken?.payload?.email as string | undefined) ?? null
      } catch {
        return null
      }
    },
  })

  if (email && isAdminEmail(email)) return
  if (email && (await hasMasterclassAccess(email))) return

  redirect("/")
}
