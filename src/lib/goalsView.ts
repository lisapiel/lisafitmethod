// Client-side view of coach-set goals. Read-only helpers; goals only ever
// come from what the coach entered.

export type HomeGoal = {
  id: string
  type: string
  label: string | null
  startValue: number | null
  targetValue: number | null
  currentValue: number | null
  unit: string | null
  status: string | null
  targetDate: string | null
}

const numOrNull = (v: unknown): number | null => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v))
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null)

export function toHomeGoal(g: Record<string, unknown>): HomeGoal {
  return {
    id: String(g.id ?? ""),
    type: String(g.type ?? ""),
    label: strOrNull(g.label),
    startValue: numOrNull(g.startValue),
    targetValue: numOrNull(g.targetValue),
    currentValue: numOrNull(g.currentValue),
    unit: strOrNull(g.unit),
    status: strOrNull(g.status),
    targetDate: strOrNull(g.targetDate),
  }
}

// How far from start to target, 0–100. Works for targets above or below the start.
export function goalProgressPct(g: Pick<HomeGoal, "startValue" | "targetValue" | "currentValue">): number | null {
  if (g.startValue == null || g.targetValue == null || g.currentValue == null) return null
  const span = g.targetValue - g.startValue
  if (span === 0) return g.currentValue === g.targetValue ? 100 : 0
  return Math.max(0, Math.min(100, Math.round(((g.currentValue - g.startValue) / span) * 100)))
}

// Active goals first, then achieved ones; at most three on Home.
export function goalsForHome(goals: HomeGoal[], max = 3): HomeGoal[] {
  const active = goals.filter((g) => g.status !== "ACHIEVED")
  const done = goals.filter((g) => g.status === "ACHIEVED")
  return [...active, ...done].slice(0, max)
}
