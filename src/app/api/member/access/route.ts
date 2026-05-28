import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { hasTrainingAccess, hasNutritionAccess, hasTrackerAccess } from "@/lib/authTokens"

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
    return NextResponse.json({ email: null, training: false, nutrition: false, tracker: false })
  }

  const [training, nutrition, tracker] = await Promise.all([
    hasTrainingAccess(email),
    hasNutritionAccess(email),
    hasTrackerAccess(email),
  ])

  return NextResponse.json({ email, training, nutrition, tracker })
}
