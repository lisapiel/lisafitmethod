import type { Viewport } from "next"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { hasCoachingAccess } from "@/lib/authTokens"
import CoachingClientLayout from "./CoachingLayout.client"

// Lock the viewport for the coaching portal — prevents iOS auto-zoom when a
// user taps a weight/reps input and prevents accidental pinch-zoom on phones
// while logging a workout. The marketing site keeps the default viewport.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
}

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
