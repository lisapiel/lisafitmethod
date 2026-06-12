import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { fetchAuthSession } from "aws-amplify/auth/server"
import { runWithAmplifyServerContext } from "@/lib/amplify-server"
import { getExerciseRecord } from "@/lib/authTokens"

export const dynamic = "force-dynamic"

// POST { ids: string[] } → { exercises: Record<id, { name, primaryMuscle, execution, coachingCues[], commonMistakes[] }> }
// Returns only client-safe fields (no admin-only notes).
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

  const out: Record<string, {
    name: string
    primaryMuscle: string | null
    secondaryMuscles: string[]
    equipment: string[]
    difficulty: string | null
    execution: string | null
    coachingCues: string[]
    commonMistakes: string[]
  }> = {}

  await Promise.all((ids as string[]).slice(0, 100).map(async (id) => {
    if (!id) return
    const ex = await getExerciseRecord(id)
    if (!ex) return
    const parseArr = (s?: string): string[] => {
      if (!s) return []
      try { const p = JSON.parse(s); return Array.isArray(p) ? p : [] } catch { return [] }
    }
    out[id] = {
      name: ex.name,
      primaryMuscle: ex.primaryMuscle ?? null,
      secondaryMuscles: parseArr(ex.secondaryMuscles),
      equipment: parseArr(ex.equipment),
      difficulty: ex.difficulty ?? null,
      execution: ex.execution ?? null,
      coachingCues: parseArr(ex.coachingCues),
      commonMistakes: parseArr(ex.commonMistakes),
    }
  }))

  return NextResponse.json({ exercises: out })
}
