import type { Metadata } from "next"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { hasTrainingAccess, hasNutritionAccess, hasTrackerAccess, hasMasterclassAccess, hasCoachingAccess } from "@/lib/authTokens"
import { AccountClient } from "./page.client"

export const metadata: Metadata = {
  title: "My Account — Lisa Fit Method",
}

export const dynamic = "force-dynamic"

export default async function AccountPage() {
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
    return null
  }

  const emailStr = email as string

  const [training, nutrition, tracker, masterclass, coaching] = await Promise.all([
    hasTrainingAccess(emailStr),
    hasNutritionAccess(emailStr),
    hasTrackerAccess(emailStr),
    hasMasterclassAccess(emailStr),
    hasCoachingAccess(emailStr),
  ])

  const isAdmin = emailStr.toLowerCase() === "lisa.p.mcpherson@gmail.com"

  return <AccountClient email={emailStr} training={training} nutrition={nutrition} tracker={tracker} masterclass={masterclass} coaching={coaching} isAdmin={isAdmin} />
}
