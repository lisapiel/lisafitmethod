import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { hasTrainingAccess, hasNutritionAccess, hasTrackerAccess, hasCoachingAccess, hasMasterclassAccess } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

export async function GET() {
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
    return NextResponse.json({ email: null, training: false, nutrition: false, tracker: false, coaching: false })
  }

  const [training, nutrition, tracker, coaching, masterclass] = await Promise.all([
    hasTrainingAccess(email),
    hasNutritionAccess(email),
    hasTrackerAccess(email),
    hasCoachingAccess(email),
    hasMasterclassAccess(email),
  ])

  return NextResponse.json({ email, training, nutrition, tracker, coaching, masterclass })
}
