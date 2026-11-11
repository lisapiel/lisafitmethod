import { isLocalDateKey } from "./localDate"
import { formatReading, formatWeighInDay, MAX_LBS, MIN_LBS } from "./weightHistory"

// How a check-in answers the weight question. "new" is a fresh scale reading
// saved as the check-in's weight. "same" confirms the client's last reading
// and saves no weight, so it never adds a second copy to the weight history.
// "skipped" saves nothing. Check-ins from before this field have no status:
// a weight there is a reading and no weight means nothing was given.
export const WEIGHT_STATUSES = ["new", "same", "skipped"] as const
export type WeightStatus = typeof WEIGHT_STATUSES[number]

export type WeightConfirmedFrom = { lbs: number; unit: "LBS" | "KG"; at: string; source: "check-in" | "logged" }

export type CheckInWeightFields = {
  weight?: number
  weightUnit?: "LBS" | "KG"
  weightStatus?: WeightStatus
  weightConfirmedFrom?: WeightConfirmedFrom
}

export const NUTRITION_STATUSES = ["on-track", "mostly-on-track", "mixed", "struggled", "not-focusing"] as const
export type NutritionStatus = typeof NUTRITION_STATUSES[number]
export const ADJUSTMENT_AREAS = ["exercises", "volume-intensity", "schedule", "nutrition", "recovery", "other", "none"] as const
export type AdjustmentArea = typeof ADJUSTMENT_AREAS[number]

export const HUNGER_OPTIONS = [
  { value: "comfortable", label: "Comfortable most days" },
  { value: "some-days", label: "Hungry some days" },
  { value: "most-days", label: "Hungry most days" },
  { value: "less", label: "Less hungry than usual" },
] as const
export type Hunger = typeof HUNGER_OPTIONS[number]["value"]

export function parseHunger(v: unknown): Hunger | undefined {
  return HUNGER_OPTIONS.find((o) => o.value === v)?.value
}

export function hungerLabel(v: unknown): string | null {
  return HUNGER_OPTIONS.find((o) => o.value === v)?.label ?? null
}

export const NUTRITION_NOTE_MAX = 1000
export const FORM_FEEDBACK_MAX = 2000

// The optional "Anything about your eating this week?" answer. Trimmed; blank
// means not answered. Too long is refused, not cut, so nothing is lost silently.
export function parseNutritionNote(v: unknown): { ok: true; value?: string } | { ok: false; error: string } {
  if (v == null) return { ok: true }
  if (typeof v !== "string") return { ok: false, error: "Invalid note about your eating" }
  const t = v.trim()
  if (!t) return { ok: true }
  if (t.length > NUTRITION_NOTE_MAX) return { ok: false, error: "Please keep your note about your eating to 1,000 characters or fewer." }
  return { ok: true, value: t }
}

// Lisa's technique feedback on a check-in's form-review videos. Only kept when
// the check-in actually has videos; otherwise it is always empty.
export function parseFormFeedback(v: unknown, hasVideos: boolean): { ok: true; value: string } | { ok: false; error: string } {
  if (v == null || !hasVideos) return { ok: true, value: "" }
  if (typeof v !== "string") return { ok: false, error: "Invalid form feedback" }
  const t = v.trim()
  if (t.length > FORM_FEEDBACK_MAX) return { ok: false, error: "Form feedback is too long. Keep it to 2,000 characters or fewer." }
  return { ok: true, value: t }
}

// True when a check-in's stored formReviews (JSON string, or an already parsed
// array) holds at least one uploaded video.
export function hasFormReviewVideos(formReviews: unknown): boolean {
  let list: unknown = formReviews
  if (typeof list === "string") {
    try { list = JSON.parse(list) } catch { return false }
  }
  if (!Array.isArray(list)) return false
  return list.some((r) => {
    const keys = r && typeof r === "object" ? (r as { videoKeys?: unknown }).videoKeys : undefined
    return Array.isArray(keys) && keys.some((k) => typeof k === "string" && k.length > 0)
  })
}

function parseWeight(v: unknown): number | undefined {
  if (v == null || v === "") return undefined
  const n = parseFloat(String(v))
  return Number.isFinite(n) && n > 0 && n < 2000 ? n : undefined
}

function parseConfirmedFrom(v: unknown): WeightConfirmedFrom | undefined {
  if (!v || typeof v !== "object") return undefined
  const r = v as Record<string, unknown>
  const lbs = Number(r.lbs)
  const at = typeof r.at === "string" ? r.at : ""
  if (!Number.isFinite(lbs) || lbs < MIN_LBS || lbs > MAX_LBS) return undefined
  if (!at || at.length > 40 || !(isLocalDateKey(at) || Number.isFinite(Date.parse(at)))) return undefined
  if (r.source !== "check-in" && r.source !== "logged") return undefined
  return { lbs: +lbs.toFixed(2), unit: r.unit === "KG" ? "KG" : "LBS", at, source: r.source }
}

// Server-side reading of the weight part of a check-in body. "same" and
// "skipped" drop any weight that was sent. "new" needs a valid weight.
export function normalizeCheckInWeight(body: Record<string, unknown>): { ok: true; fields: CheckInWeightFields } | { ok: false; error: string } {
  const unit = body.weightUnit === "LBS" || body.weightUnit === "KG" ? body.weightUnit : undefined
  const weight = parseWeight(body.weight)
  const status = body.weightStatus

  if (status == null || status === "") {
    return { ok: true, fields: { ...(weight != null && { weight }), ...(unit && { weightUnit: unit }) } }
  }
  if (status === "skipped") return { ok: true, fields: { weightStatus: "skipped" } }
  if (status === "same") {
    const from = parseConfirmedFrom(body.weightConfirmedFrom)
    return { ok: true, fields: { weightStatus: "same", ...(from && { weightConfirmedFrom: from }) } }
  }
  if (status === "new") {
    if (weight == null) return { ok: false, error: "Please enter your weight, or choose another option." }
    return { ok: true, fields: { weight, weightUnit: unit ?? "LBS", weightStatus: "new" } }
  }
  return { ok: false, error: "Invalid weight choice" }
}

// One line describing a check-in's weight answer, for the coach review and
// the client's history. Null when nothing was given on an older check-in.
export function checkInWeightLine(ci: { weight?: unknown; weightUnit?: unknown; weightStatus?: unknown; weightConfirmedFrom?: unknown }): string | null {
  if (ci.weightStatus === "skipped") return "Skipped this week"
  if (ci.weightStatus === "same") {
    const from = parseConfirmedFrom(ci.weightConfirmedFrom)
    return from ? `Same as last time (${formatReading(from)} from ${formatWeighInDay(from.at)})` : "Same as last time"
  }
  const n = typeof ci.weight === "number" ? ci.weight : parseFloat(String(ci.weight ?? ""))
  if (!Number.isFinite(n) || n <= 0) return null
  return `${n} ${ci.weightUnit === "KG" ? "kg" : "lb"}`
}
