import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { hasMasterclassAccess } from "@/lib/authTokens"
import MasterclassClientLayout from "./MasterclassLayout.client"

export default async function MasterclassLayout({ children }: { children: React.ReactNode }) {
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

  if (!email) {
    redirect("/login?redirect=/masterclass")
  }

  const hasAccess = await hasMasterclassAccess(email as string)
  if (!hasAccess) {
    redirect("/masterclass/subscribe")
  }

  return <MasterclassClientLayout>{children}</MasterclassClientLayout>
}
