import type { Metadata } from "next"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { hasNutritionAccess } from "@/lib/authTokens"
import NutritionClient from "./page.client"

export const metadata: Metadata = {
  title: "Nutrition — Lisa Fit Method Coaching",
  robots: "noindex, nofollow",
}

export default async function NutritionPage() {
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

  // Parent MyCoachingLayout has already validated auth + coaching access.
  // If email is somehow missing here, default to false so we show the neutral
  // "explore" CTA rather than falsely claiming the client owns the course.
  const ownsNutritionCourse = email ? await hasNutritionAccess(email) : false

  return <NutritionClient ownsNutritionCourse={ownsNutritionCourse} email={email ?? ""} />
}
