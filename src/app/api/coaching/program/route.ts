import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { getCoachingClientRecord, getProgramRecord } from "@/lib/authTokens"
import { hydrateProgramVideos } from "@/lib/programHydration"

export const dynamic = "force-dynamic"

async function getSessionEmail(): Promise<string | null> {
  return runWithAmplifyServerContext({
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
}

export async function GET() {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const client = await getCoachingClientRecord(email)
  if (!client?.currentProgramId) {
    return NextResponse.json({ program: null, client })
  }

  const rawProgram = await getProgramRecord(client.currentProgramId)
  // Resolve exercise videos from the canonical library before responding
  // so every downstream renderer (runner, workouts list, admin views)
  // sees a working videoS3Key even for programs whose embedded value
  // was empty or stale at save time.
  const program = await hydrateProgramVideos(rawProgram)
  return NextResponse.json({ program, client })
}
