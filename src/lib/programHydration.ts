import { getExerciseRecord, type CoachingProgramRecord } from "./authTokens"

// Minimal shapes — mirrors the ProgramExercise / Day / Week schema
// serialized into CoachingProgramRecord.weeks. Deliberately narrow so
// this file only depends on the two fields it touches.
type HydExercise = { exerciseId?: string; videoS3Key?: string; [k: string]: unknown }
type HydDay = {
  exercises?: HydExercise[]
  warmup?: { exercises?: HydExercise[]; [k: string]: unknown }
  cooldown?: { exercises?: HydExercise[]; [k: string]: unknown }
  [k: string]: unknown
}
type HydWeek = { days?: HydDay[]; [k: string]: unknown }

/**
 * Rewrites `videoS3Key` on every warm-up / main / cool-down exercise
 * inside `program.weeks` to prefer the canonical exercise-library
 * value over whatever was embedded when the program was saved.
 *
 * Resolution rule (library-first, embed-fallback):
 *   videoS3Key = library[exerciseId].videoS3Key || embedded.videoS3Key || ""
 *
 * Why this exists — the program builder copies videoS3Key into the
 * weeks JSON at save time. Older programs, bulk-imported programs,
 * and any exercise whose library video was uploaded after the program
 * was saved end up with a stale or empty embedded value, which
 * renders as a missing thumbnail on every downstream coaching
 * surface (workouts list, admin program view, admin log viewer, and
 * the workout runner). Hydrating here means every read consumer
 * gets a working thumbnail without each renderer needing its own
 * library lookup.
 *
 * Returns a NEW program object with a re-serialized weeks JSON.
 * Never writes to DynamoDB — this is a read-side hydration only, so
 * an intentional custom videoS3Key override in the source record is
 * preserved on disk even though the response uses the library value.
 */
export async function hydrateProgramVideos(program: CoachingProgramRecord | null): Promise<CoachingProgramRecord | null> {
  if (!program || !program.weeks) return program

  let weeks: HydWeek[]
  try {
    weeks = JSON.parse(program.weeks)
  } catch {
    return program
  }
  if (!Array.isArray(weeks) || weeks.length === 0) return program

  // Collect every referenced exerciseId across all days + sections.
  const ids = new Set<string>()
  for (const w of weeks) {
    for (const d of w.days ?? []) {
      for (const ex of d.warmup?.exercises ?? [])   if (ex.exerciseId) ids.add(ex.exerciseId)
      for (const ex of d.exercises ?? [])           if (ex.exerciseId) ids.add(ex.exerciseId)
      for (const ex of d.cooldown?.exercises ?? []) if (ex.exerciseId) ids.add(ex.exerciseId)
    }
  }
  if (ids.size === 0) return program

  // Batch fetch — same pattern the exercise-info API uses.
  const entries = await Promise.all([...ids].map(async (id) => {
    const rec = await getExerciseRecord(id)
    return [id, rec?.videoS3Key ?? ""] as const
  }))
  const lib = new Map(entries)

  const resolve = (ex: HydExercise): HydExercise => {
    const canonical = ex.exerciseId ? lib.get(ex.exerciseId) : undefined
    if (canonical) return { ...ex, videoS3Key: canonical || ex.videoS3Key || "" }
    return ex
  }

  const hydrated: HydWeek[] = weeks.map((w) => ({
    ...w,
    days: (w.days ?? []).map((d) => ({
      ...d,
      warmup: d.warmup   ? { ...d.warmup,   exercises: (d.warmup.exercises   ?? []).map(resolve) } : d.warmup,
      exercises:          (d.exercises ?? []).map(resolve),
      cooldown: d.cooldown ? { ...d.cooldown, exercises: (d.cooldown.exercises ?? []).map(resolve) } : d.cooldown,
    })),
  }))

  return { ...program, weeks: JSON.stringify(hydrated) }
}
