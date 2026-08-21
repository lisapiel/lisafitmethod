import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { hasTrackerAccess } from "@/lib/authTokens"

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lisa Fit",
  },
}

// Server-side entitlement gate. Middleware only enforces authentication —
// this layout enforces product ownership so a logged-in user without a
// tracker purchase can't reach the tracker just by pasting the URL.
// hasTrackerAccess admin-bypasses via isAdminEmail so authorized admins
// still get in. Unowned users are routed to the tracker purchase page
// rather than the public homepage.
export default async function MyTrackerLayout({ children }: { children: React.ReactNode }) {
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
    redirect("/login?redirect=/my-tracker")
  }

  const hasAccess = await hasTrackerAccess(email as string)
  if (!hasAccess) {
    redirect("/tracker-checkout")
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#0a0a0a",
        color: "#f0e6d3",
        fontFamily: "var(--font-montserrat), sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  )
}
