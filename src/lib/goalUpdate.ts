// Fields the coach may change on an existing goal. Anything else in the
// request is refused, so a goal can't be moved to another client or given
// stray fields. Empty numbers clear the value; empty text clears the text.

import type { CoachingGoalRecord } from "./authTokens"

export const GOAL_TYPES = ["body-composition", "strength", "habit", "custom"] as const
export const GOAL_STATUSES = ["ON_TRACK", "NEEDS_ATTENTION", "ACHIEVED"] as const
const NUMBER_FIELDS = ["startValue", "targetValue", "currentValue"] as const
const TEXT_LIMITS = { label: 120, unit: 30, notes: 500 } as const
const DATE_FIELDS = ["targetDate", "startDate"] as const

type GoalUpdate = Partial<Omit<CoachingGoalRecord, "startValue" | "targetValue" | "currentValue">> & Partial<Record<(typeof NUMBER_FIELDS)[number], number | null>>

export function parseGoalUpdate(body: unknown): { ok: true; value: GoalUpdate } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "Invalid goal" }
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if ((NUMBER_FIELDS as readonly string[]).includes(k)) {
      if (v === "" || v === null) { out[k] = null; continue }
      const n = Number(v)
      if (!Number.isFinite(n)) return { ok: false, error: `${k} must be a number` }
      out[k] = n
    } else if (k in TEXT_LIMITS) {
      if (typeof v !== "string") return { ok: false, error: `${k} must be text` }
      const s = v.trim()
      if (s.length > TEXT_LIMITS[k as keyof typeof TEXT_LIMITS]) return { ok: false, error: `${k} is too long` }
      if (k === "label" && !s) return { ok: false, error: "Goal name is required" }
      out[k] = s
    } else if ((DATE_FIELDS as readonly string[]).includes(k)) {
      if (v !== "" && (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)))) return { ok: false, error: `${k} must be a date` }
      out[k] = v
    } else if (k === "type") {
      if (!(GOAL_TYPES as readonly unknown[]).includes(v)) return { ok: false, error: "Unknown goal type" }
      out[k] = v
    } else if (k === "status") {
      if (!(GOAL_STATUSES as readonly unknown[]).includes(v)) return { ok: false, error: "Unknown goal status" }
      out[k] = v
    } else {
      return { ok: false, error: `${k} can't be changed` }
    }
  }
  if (Object.keys(out).length === 0) return { ok: false, error: "Nothing to update" }
  return { ok: true, value: out as GoalUpdate }
}
