import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { getCoachingClientRecord, getProgramRecord, type ExerciseRecord } from "@/lib/authTokens"
import { toClientExerciseInfo } from "@/lib/exerciseInfo"
import { hydrateProgramVideos } from "@/lib/programHydration"
import { toClientProgram, toClientRecord } from "@/lib/clientView"

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

// ?view=client  → just the client record (pages that only need profile,
//                  units or nutrition settings skip the program entirely)
// ?view=plan    → client + program without the video lookups
// ?info=1       → also the exercise details for every exercise, read once
//                  during the video lookup (the workout logger uses this)
export async function GET(req: NextRequest) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const view = req.nextUrl.searchParams.get("view")
  const withInfo = req.nextUrl.searchParams.get("info") === "1"

  const client = await getCoachingClientRecord(email)
  if (view === "client") return NextResponse.json({ client: client ? toClientRecord(client) : client })
  if (!client?.currentProgramId) {
    return NextResponse.json({ program: null, client: client ? toClientRecord(client) : client, ...(withInfo && { exerciseInfo: {} }) })
  }

  const rawProgram = await getProgramRecord(client.currentProgramId)
  if (view === "plan") return NextResponse.json({ program: rawProgram ? toClientProgram(rawProgram) : rawProgram, client: toClientRecord(client) })
  // Resolve exercise videos from the canonical library before responding
  // so every downstream renderer (runner, workouts list, admin views)
  // sees a working videoS3Key even for programs whose embedded value
  // was empty or stale at save time.
  const records = withInfo ? new Map<string, ExerciseRecord>() : undefined
  const program = await hydrateProgramVideos(rawProgram, records)
  const exerciseInfo = records ? Object.fromEntries([...records].map(([id, rec]) => [id, toClientExerciseInfo(rec)])) : undefined
  return NextResponse.json({ program: program ? toClientProgram(program) : program, client: toClientRecord(client), ...(exerciseInfo && { exerciseInfo }) })
}
