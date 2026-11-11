import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { getExerciseRecord } from "@/lib/authTokens"
import { toClientExerciseInfo, type ClientExerciseInfo } from "@/lib/exerciseInfo"

export const dynamic = "force-dynamic"

// POST { ids: string[] } → { exercises: Record<id, { name, videoS3Key, primaryMuscle, execution, coachingCues[], commonMistakes[] }> }
// Returns only client-safe fields (no admin-only notes).
// videoS3Key is included so the client workout page can resolve the video
// from the canonical library at render time, rather than relying on the
// videoS3Key that was copied into the program's `weeks` JSON at save time
// (which can be missing/stale on older or bulk-created programs).
export async function POST(req: NextRequest) {
  const email = await runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async (ctx): Promise<string | null> => {
      try {
        const s = await fetchAuthSession(ctx)
        return (s.tokens?.idToken?.payload?.email as string | undefined) ?? null
      } catch { return null }
    },
  })
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ exercises: {} })
  }

  const out: Record<string, ClientExerciseInfo> = {}

  await Promise.all((ids as string[]).slice(0, 100).map(async (id) => {
    if (!id) return
    const ex = await getExerciseRecord(id)
    if (ex) out[id] = toClientExerciseInfo(ex)
  }))

  return NextResponse.json({ exercises: out })
}
