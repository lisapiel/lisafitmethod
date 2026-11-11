// Read-only summaries of a client's own logged sets for one exercise. Values
// are shown exactly as the client typed them; nothing is converted.

export type LoggedSet = {
  exerciseId: string
  setNumber: number
  weight: string
  reps: string
  rpe?: string
  completed?: boolean
}

const PLAIN_NUMBER = /^\d+(\.\d+)?$/
const PLAIN_INT = /^\d+$/

export function isPlainNumber(v: string): boolean {
  return PLAIN_NUMBER.test(v.trim())
}

export type BestSet = { weight: string; reps: number }

// Best = the heaviest weight on any completed set, with the most reps done at
// that exact weight. Entries that aren't plain numbers ("BW", "25/25") can't
// be compared, so they're skipped rather than guessed.
export function bestSet(sets: LoggedSet[]): BestSet | null {
  let best: { w: number; weight: string; reps: number } | null = null
  for (const s of sets) {
    if (!s.completed) continue
    const weight = String(s.weight ?? "").trim()
    const reps = String(s.reps ?? "").trim()
    if (!PLAIN_NUMBER.test(weight) || !PLAIN_INT.test(reps)) continue
    const w = Number(weight)
    const r = Number(reps)
    if (w <= 0 || r <= 0) continue
    if (!best || w > best.w || (w === best.w && r > best.reps)) best = { w, weight, reps: r }
  }
  return best ? { weight: best.weight, reps: best.reps } : null
}

export type LastTime = { kind: "same"; weight: string; reps: string[] } | { kind: "reps"; reps: string[] } | { kind: "lines"; lines: Array<{ weight: string; reps: string }> }

// Same weight on every set → one line ("40 lb × 8 / 8 / 7"). No weight at all
// → reps only. Different weights → one line per set, so nothing is averaged
// into a misleading summary.
export function lastTimeSummary(sets: LoggedSet[]): LastTime | null {
  const rows = [...sets]
    .sort((a, b) => a.setNumber - b.setNumber)
    .map((s) => ({ weight: String(s.weight ?? "").trim(), reps: String(s.reps ?? "").trim() }))
    .filter((s) => s.weight || s.reps)
  if (rows.length === 0) return null
  if (rows.every((s) => !s.weight)) return { kind: "reps", reps: rows.map((s) => s.reps || "—") }
  if (rows.every((s) => s.weight === rows[0].weight)) return { kind: "same", weight: rows[0].weight, reps: rows.map((s) => s.reps || "—") }
  return { kind: "lines", lines: rows.map((s) => ({ weight: s.weight || "—", reps: s.reps || "—" })) }
}

// Adds the unit only to plain numbers, so "BW" stays "BW".
export function withUnit(weight: string, unit: "lb" | "kg"): string {
  return isPlainNumber(weight) ? `${weight} ${unit}` : weight
}
