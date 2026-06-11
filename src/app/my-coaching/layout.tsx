import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { hasCoachingAccess } from "@/lib/authTokens"
import CoachingClientLayout from "./CoachingLayout.client"

export default async function MyCoachingLayout({ children }: { children: React.ReactNode }) {
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
    redirect("/login?redirect=/my-coaching")
  }

  const hasAccess = await hasCoachingAccess(email as string)
  if (!hasAccess) {
    redirect("/account")
  }

  return <CoachingClientLayout>{children}</CoachingClientLayout>
}
