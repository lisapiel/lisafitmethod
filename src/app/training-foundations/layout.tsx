import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { hasTrainingAccess } from "@/lib/authTokens"
import TrainingFoundationsShell from "./TrainingFoundationsShell.client"

// Server-side entitlement gate. Middleware only enforces authentication —
// this layout enforces product ownership so a logged-in user without a
// training purchase can't reach the course modules by pasting the URL.
// hasTrainingAccess admin-bypasses via isAdminEmail, so authorized
// admins still get in. Unowned users are routed to the training
// purchase page rather than the public homepage.
//
// The existing course-shell UI (header, sidebar, scroll area, progress
// context) is a client component; this server layout gates access and
// then delegates rendering to it.
export default async function TrainingFoundationsLayout({ children }: { children: React.ReactNode }) {
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
    redirect("/login?redirect=/training-foundations")
  }

  const hasAccess = await hasTrainingAccess(email as string)
  if (!hasAccess) {
    redirect("/checkout?product=training")
  }

  return <TrainingFoundationsShell>{children}</TrainingFoundationsShell>
}
