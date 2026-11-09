import { isLocalDateKey } from "./localDate"
import { MAX_LBS, MIN_LBS } from "./weightHistory"

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
