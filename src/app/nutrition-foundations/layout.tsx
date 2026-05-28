import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { hasNutritionAccess } from "@/lib/authTokens"
import NutritionClientLayout from "./NutritionLayout.client"

export default async function NutritionFoundationsLayout({ children }: { children: React.ReactNode }) {
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
    redirect("/login?redirect=/nutrition-foundations")
  }

  const hasAccess = await hasNutritionAccess(email as string)
  if (!hasAccess) {
    redirect("/checkout?product=nutrition")
  }

  return <NutritionClientLayout>{children}</NutritionClientLayout>
}
