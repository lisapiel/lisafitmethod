import { isLocalDateKey, localDateKey } from "./localDate"
import { fromLbs, normalizeUnit, toLbs, type WeightUnit } from "./weight"

// One weight history for every screen: weights the client submitted in a
// check-in plus weights they logged on the Progress page. The starting weight
// typed into setup is a profile value, not a dated weigh-in, so it is kept out
// of the history, the current weight and the change.
//
// A check-in marked "same" (the client confirmed their last reading) or
// "skipped" is not a new scale reading and adds nothing here, even if an old
// client sent a weight along with it.
//
// One weigh-in entered twice: when a check-in weight and a logged weight fall
// on the same local calendar day and are within 0.2 lb of each other, they are
// the same scale reading. The logged one is kept, because it carries the day
// the client chose on Progress; the check-in copy is dropped. Readings on
// different days are never merged.

export type WeightSource = "check-in" | "logged"
export type WeightReading = { at: string; lbs: number; unit: WeightUnit; source: WeightSource }

// Outside this range a value is a typo or a placeholder, not a body weight.
export const MIN_LBS = 50
export const MAX_LBS = 700
const SAME_READING_LBS = 0.2

// Logged measurements may carry a date only; place them at midday so they sort
// sensibly against timestamped check-ins on the same day.
function instant(d: unknown): number | null {
  if (typeof d !== "string" || !d) return null
  const t = Date.parse(isLocalDateKey(d) ? `${d}T12:00:00` : d)
  return Number.isFinite(t) ? t : null
}

// The client's calendar day for a reading. Date-only values already are one;
// timestamps are read in the given (or the device's) time zone.
export function weighInDayKey(at: string, timeZone?: string): string | null {
  if (isLocalDateKey(at)) return at
  const t = Date.parse(at)
  return Number.isFinite(t) ? localDateKey(new Date(t), timeZone) : null
}

// A Date for display. A date-only value is a local calendar day, so it is
// built from its parts instead of being parsed as UTC midnight.
export function weighInDate(at: string): Date | null {
  if (isLocalDateKey(at)) {
    const [y, m, d] = at.split("-").map(Number)
    return new Date(y, m - 1, d, 12)
  }
  const t = Date.parse(at)
  return Number.isFinite(t) ? new Date(t) : null
}

export function formatWeighInDay(at: string, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  const d = weighInDate(at)
  return d ? d.toLocaleDateString("en-US", opts) : ""
}

// "125 lb" or "56.7 kg", from a reading's canonical pounds in its own unit.
export function formatReading(r: { lbs: number; unit: WeightUnit }): string {
  const v = +fromLbs(r.lbs, r.unit).toFixed(1)
  return `${v} ${r.unit === "KG" ? "kg" : "lb"}`
}

function reading(at: unknown, value: unknown, unit: unknown, source: WeightSource): (WeightReading & { t: number }) | null {
  const t = instant(at)
  const lbs = toLbs(value as number | string | null | undefined, typeof unit === "string" ? unit : null)
  if (t == null || lbs == null || lbs < MIN_LBS || lbs > MAX_LBS) return null
  return { at: at as string, t, lbs, unit: normalizeUnit(typeof unit === "string" ? unit : null), source }
}

export function isNoNewWeight(status: unknown): boolean {
  return status === "same" || status === "skipped"
}

export function buildWeightHistory(args: {
  checkIns: Array<{ submittedAt?: unknown; weight?: unknown; weightUnit?: unknown; weightStatus?: unknown }>
  logged: Array<{ snapshotDate?: unknown; weight?: unknown; weightUnit?: unknown }>
  timeZone?: string
}): WeightReading[] {
  const all = [
    ...args.checkIns
      .filter((c) => !isNoNewWeight(c.weightStatus))
      .map((c) => reading(c.submittedAt, c.weight, c.weightUnit, "check-in")),
    ...args.logged.map((s) => reading(s.snapshotDate, s.weight, s.weightUnit, "logged")),
  ].filter((r): r is WeightReading & { t: number } => r != null)
  all.sort((a, b) => a.t - b.t)

  const loggedByDay = new Map<string, number[]>()
  for (const r of all) {
    if (r.source !== "logged") continue
    const day = weighInDayKey(r.at, args.timeZone)
    if (day) loggedByDay.set(day, [...(loggedByDay.get(day) ?? []), r.lbs])
  }

  const seen = new Set<string>()
  const out: WeightReading[] = []
  for (const r of all) {
    const key = `${r.t}|${r.lbs.toFixed(2)}`
    if (seen.has(key)) continue
    seen.add(key)
    if (r.source === "check-in") {
      const day = weighInDayKey(r.at, args.timeZone)
      const sameDay = day ? loggedByDay.get(day) ?? [] : []
      if (sameDay.some((lbs) => Math.abs(lbs - r.lbs) <= SAME_READING_LBS + 1e-9)) continue
    }
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
