import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { grantTrainingAccess, grantNutritionAccess, isAdminEmail, ADMIN_EMAIL } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

export async function POST() {
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

  if (!isAdminEmail(email ?? "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  await grantTrainingAccess(ADMIN_EMAIL)
  await grantNutritionAccess(ADMIN_EMAIL)

  return NextResponse.json({ ok: true, message: "Access granted to Training + Nutrition Foundations" })
}
