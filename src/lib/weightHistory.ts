import { fromLbs, normalizeUnit, toLbs, type WeightUnit } from "./weight"

// One weight history for every screen: weights the client submitted in a
// check-in plus weights they logged on the Progress page. The starting weight
// typed into setup is a profile value, not a dated weigh-in, so it is kept out
// of the history, the current weight and the change.

export type WeightSource = "check-in" | "logged"
export type WeightReading = { at: string; lbs: number; unit: WeightUnit; source: WeightSource }

// Outside this range a value is a typo or a placeholder, not a body weight.
const MIN_LBS = 50
const MAX_LBS = 700

// Logged measurements may carry a date only; place them at midday so they sort
// sensibly against timestamped check-ins on the same day.
function instant(d: unknown): number | null {
  if (typeof d !== "string" || !d) return null
  const t = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00` : d)
  return Number.isFinite(t) ? t : null
}

function reading(at: unknown, value: unknown, unit: unknown, source: WeightSource): (WeightReading & { t: number }) | null {
  const t = instant(at)
  const lbs = toLbs(value as number | string | null | undefined, typeof unit === "string" ? unit : null)
  if (t == null || lbs == null || lbs < MIN_LBS || lbs > MAX_LBS) return null
  return { at: at as string, t, lbs, unit: normalizeUnit(typeof unit === "string" ? unit : null), source }
}

export function buildWeightHistory(args: {
  checkIns: Array<{ submittedAt?: unknown; weight?: unknown; weightUnit?: unknown }>
  logged: Array<{ snapshotDate?: unknown; weight?: unknown; weightUnit?: unknown }>
}): WeightReading[] {
  const all = [
    ...args.checkIns.map((c) => reading(c.submittedAt, c.weight, c.weightUnit, "check-in")),
    ...args.logged.map((s) => reading(s.snapshotDate, s.weight, s.weightUnit, "logged")),
  ].filter((r): r is WeightReading & { t: number } => r != null)
  all.sort((a, b) => a.t - b.t)
  const seen = new Set<string>()
  const out: WeightReading[] = []
  for (const r of all) {
    const key = `${r.t}|${r.lbs.toFixed(2)}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ at: r.at, lbs: r.lbs, unit: r.unit, source: r.source })
  }
  return out
}

export type WeightSummary = {
  latest: WeightReading | null
  first: WeightReading | null
  // Only when there are at least two weigh-ins; never invented from one.
  change: number | null
  count: number
  unit: WeightUnit
}

export function summarizeWeight(readings: WeightReading[], fallbackUnit: WeightUnit = "LBS"): WeightSummary {
  const latest = readings[readings.length - 1] ?? null
  const first = readings[0] ?? null
  const unit = latest?.unit ?? fallbackUnit
  const change = latest && first && readings.length >= 2 ? +fromLbs(latest.lbs - first.lbs, unit).toFixed(1) : null
  return { latest, first, change, count: readings.length, unit }
}
