import { adminMfaSatisfied } from "@/lib/adminBypass"
import type { Viewport } from "next"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { hasCoachingAccess, getCoachingAccessVersions, termsAcceptanceCurrent, LIABILITY_WAIVER_VERSION, isAdminEmail } from "@/lib/authTokens"
import CoachingClientLayout from "./CoachingLayout.client"

// Keep accessibility pinch-zoom available for clients who need it. iOS Safari
// auto-zoom into inputs is prevented at the input level (font-size ≥ 16px on
// every workout / check-in field) rather than by disabling the whole viewport.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // cover lets env(safe-area-inset-*) work, so the bottom bar clears the iPhone home indicator.
  viewportFit: "cover",
  themeColor: "#faf8f5",
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

  const isAdmin = isAdminEmail(email as string) && (await adminMfaSatisfied(email as string))
  let needsReaccept = false
  if (!isAdmin) {
    const versions = await getCoachingAccessVersions(email as string)
    needsReaccept = !versions
      || !termsAcceptanceCurrent(versions.acceptedTermsVersion)
      || versions.acceptedWaiverVersion !== LIABILITY_WAIVER_VERSION
  }

  return <CoachingClientLayout needsReaccept={needsReaccept}>{children}</CoachingClientLayout>
}
