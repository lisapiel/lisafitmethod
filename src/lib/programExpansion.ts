// Expands a coaching program's week array to the number of weeks the client
// should see. For a traditional multi-week program (Phase I / Phase II) that
// was authored with N weeks of distinct content, this returns the stored
// array unchanged. For a rotation-style program (Phase III: one or two weeks
// of distinct content, intended to repeat for N weeks of calendar time), the
// stored week(s) are CYCLED to fill `durationWeeks` and each virtual week's
// weekNumber + label is sequential (1..durationWeeks).
//
// This isolates the "the client sees more weeks than are stored" idea in
// exactly one place so every surface (list page, workout runner, home-page
// nextWorkout, admin preview if any) stays in agreement. Nothing else in
// the codebase needs to understand rotation.
//
// Completion keying is unchanged: `(programId, weekNumber, dayLabel)`. Week N
// of the rotation is its own tuple and its logs are independent of Week 1's.

export type ExpandedExercise = {
  exerciseId: string
  name: string
  videoS3Key: string
  sets: string
  reps: string
  weight: string
  rpe: string
  // Any additional keys on the stored exercise flow through untouched —
  // cycleWeeks never introspects the exercise shape.
  [k: string]: unknown
}

export type ExpandedDay = {
  dayLabel: string
  notes: string
  exercises: ExpandedExercise[]
  // Optional warmup/cooldown and anything else on the stored day — passed
  // through verbatim.
  [k: string]: unknown
}

export type ExpandedWeek = {
  weekNumber: number
  label: string
  days: ExpandedDay[]
}

export interface ProgramForExpansion {
  weeks: string | ExpandedWeek[]
  durationWeeks?: number
}

// Parse the stored `weeks` field. Accepts either the raw JSON string (as
// stored on CoachingProgramRecord) or an already-parsed array (as surfaces
// often work with).
function parseStoredWeeks(input: string | ExpandedWeek[]): ExpandedWeek[] {
  if (Array.isArray(input)) return input
  try {
    const parsed = JSON.parse(input) as unknown
    return Array.isArray(parsed) ? (parsed as ExpandedWeek[]) : []
  } catch {
    return []
  }
}

// Returns the array of weeks the client should render. Rules:
//   - If `durationWeeks` is missing / not a positive integer / ≤ stored
//     week count, returns the stored weeks unchanged (Phase I/II behaviour).
//   - Otherwise returns `durationWeeks` weeks, each cycling the stored
//     weeks' days in order. Week N (1-indexed) copies from stored week
//     `((N - 1) mod storedCount)`. weekNumber + label are re-labelled to
//     `Week N` so the UI always shows a strictly sequential week picker.
//   - Exercises/warmup/cooldown pass through unchanged. The output is a
//     NEW array — the caller never gets the stored object by reference, so
//     mutating the expanded result does not affect the record.
export function expandedWeeks(program: ProgramForExpansion): ExpandedWeek[] {
  const stored = parseStoredWeeks(program.weeks)
  if (stored.length === 0) return []
  const requested = program.durationWeeks
  if (!Number.isFinite(requested as number) || (requested as number) <= stored.length) {
    // Guarantee weekNumber + label are sequential 1..N for consistency even
    // when the stored array has odd values. Admin may still author Week
    // labels like "Deload" — those pass through.
    return stored.map((w, i) => ({
      weekNumber: w.weekNumber ?? i + 1,
      label: w.label ?? `Week ${i + 1}`,
      days: w.days,
    }))
  }
  const n = Math.min(Math.floor(requested as number), 52) // hard cap to keep accidents sane
  const out: ExpandedWeek[] = []
  for (let i = 0; i < n; i++) {
    const source = stored[i % stored.length]
    out.push({
      weekNumber: i + 1,
      // For a rotation we always re-label "Week N" so the client sees a
      // normal counter. If the admin's stored week had a special label
      // (e.g. "Deload"), it's included in a bracket so it's not lost.
      label: source.label && !/^week\s/i.test(source.label)
        ? `Week ${i + 1} · ${source.label}`
        : `Week ${i + 1}`,
      // DEEP CLONE every day for each virtual week. The rotation output
      // used to share `source.days` across all N virtual weeks by
      // reference — if any downstream code (React effect, hydration pass,
      // group-by builder) accidentally mutated `day.exercises`, `.warmup`,
      // or `.cooldown`, that mutation would propagate to every other
      // virtual week sharing the same object graph. Cloning here means
      // each week owns its own day/exercise/warmup/cooldown objects, so
      // Week N's render can never corrupt Week N+1's content. The clone
      // is week-local (small, bounded by day/exercise count), so this is
      // cheap even for a 52-week × 7-day expansion.
      days: cloneDays(source.days),
    })
  }
  return out
}

// Cheap structural clone for program day arrays. Uses JSON round-trip
// because the stored shape is already JSON-safe (nothing in a program day
// is a Date, Map, Set, function, or circular reference — just strings,
// numbers, booleans, arrays, and plain objects). structuredClone is also
// available in modern runtimes but has slightly uneven ESLint recognition;
// JSON round-trip is explicit, dependency-free, and bulletproof here.
function cloneDays(days: ExpandedDay[] | undefined): ExpandedDay[] {
  if (!Array.isArray(days)) return []
  try {
    return JSON.parse(JSON.stringify(days)) as ExpandedDay[]
  } catch {
    return days.slice()
  }
}
