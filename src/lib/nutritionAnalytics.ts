// Canonical nutrition analytics for both client and coach surfaces.
//
// Every number you see on the admin dashboard, the client home, and (later)
// coach insights funnels through this file. Keeping the aggregation in one
// place is why coach and client views always agree on totals.
//
// Core rules locked by the product spec (2026-10-06):
//   - An unlogged day is NOT 0 kcal. It is UNLOGGED and does not pull averages
//     down. Averages are over logged days only.
//   - Days with any log entry are counted as "logged". There is no "partial"
//     distinction right now — a client can save a quick-add of 400 kcal and
//     the day is logged.
//   - Logging adherence = loggedDays / expectedDays, where expectedDays = the
//     number of days in the selected window ending today (inclusive) that are
//     not in the future.
//   - Historical adherence against a changed target uses the per-log
//     `targetAtLog` snapshot when it exists, falling back to the current
//     effective target otherwise. This way an old log is never judged by a
//     new target.
//   - Averages round to the nearest 5 kcal / 1 g at display time; raw totals
//     are kept exact for programmatic consumers (charts, exports).
//   - No wearable-based adjustment anywhere.
//
// The weight-trend helpers reuse the existing Progress source of truth
// (coaching_checkin_* and coaching_client_.startingWeight) and the canonical
// toLbs/normalizeUnit from src/lib/weight.ts. No independent weight-conversion
// logic lives here.

import type { NutritionLogRecord } from "./authTokens"
import type { ResolvedMacros } from "./nutrition"
import { addDaysToKey, daysBetweenKeys, keyRange, type LocalDateKey } from "./localDate"
import { toCm, fromCm, normalizeLengthUnit, type LengthUnit } from "./length"

// ─── Named thresholds / constants ───────────────────────────────────────────
//
// Centralised so they can be tuned in one place rather than scattered across
// the UI. Every rule is deterministic. These are NOT learned, NOT model-
// driven; they are templates triggered by explicit conditions.

export const ANALYTICS_THRESHOLDS = {
  // Period adherence buckets (fractions of logged days).
  LOGGING_SPARSE_BELOW: 0.5,
  LOGGING_STRONG_AT_OR_ABOVE: 0.85,
  // Minimum logged days before calorie/protein insights fire.
  MIN_LOGGED_DAYS_FOR_MACRO_INSIGHT: 7,
  // Confidence staircase for calorie/protein coverage.
  COVERAGE_HIGH_LOGGED_DAYS: 14,
  COVERAGE_MODERATE_LOGGED_DAYS: 7,
  // Calorie delta buckets (fractions of target).
  CAL_ON_TARGET_PCT: 0.03,  // ±3% → on target
  CAL_WINDOW_FOR_DAILY_SCORE: 0.07, // ±7% → on target for individual-day scoring
  // Protein thresholds.
  PROTEIN_SHORTFALL_WATCH_GRAMS: 15,
  PROTEIN_SHORTFALL_MATERIAL_GRAMS: 25,
  PROTEIN_DAYS_MET_POSITIVE_FRACTION: 0.7,
  PROTEIN_MET_DAILY_FRACTION: 0.95, // intake ≥ 95% of target counts as "met"
  // Weight trend confidence.
  WEIGHT_HIGH_CONFIDENCE_SPAN_DAYS: 21,
  WEIGHT_HIGH_CONFIDENCE_MIN_POINTS: 4,
  WEIGHT_MODERATE_CONFIDENCE_SPAN_DAYS: 10,
  WEIGHT_MODERATE_CONFIDENCE_MIN_POINTS: 2,
  // Weight trend narrative — rate per week in lb.
  WEIGHT_STABLE_ABS_LBS_PER_WEEK: 0.2, // under this → "stable"
  WEIGHT_NEUTRAL_ABS_LBS_PER_WEEK: 0.3, // under this → tone "neutral"
  // Measurement change — minimum absolute delta to surface (per unit).
  MEASUREMENT_MIN_DELTA_IN: 0.3,
  MEASUREMENT_MIN_DELTA_CM: 0.5,
  // Recent-meal grouping.
  REPEAT_MEAL_LIMIT_DEFAULT: 5,
  REPEAT_MEAL_DESCRIPTION_KEY_LEN: 40,
  REPEAT_MEAL_KCAL_BUCKET: 10,  // group logs within ±5 kcal of each other
  REPEAT_MEAL_PROTEIN_BUCKET: 5,
  REPEAT_MEAL_MIN_KCAL: 50,
} as const

export type MacroTarget = Pick<ResolvedMacros, "calories" | "protein" | "carbs" | "fat">

export interface DailyTotals {
  date: LocalDateKey
  calories: number
  protein: number
  carbs: number
  fat: number
  entryCount: number
  target?: MacroTarget         // the target this day's adherence is scored against
  logged: boolean              // true iff entryCount > 0
}

export function groupLogsByDay(logs: NutritionLogRecord[]): Map<LocalDateKey, NutritionLogRecord[]> {
  const map = new Map<LocalDateKey, NutritionLogRecord[]>()
  for (const log of logs) {
    const arr = map.get(log.date)
    if (arr) arr.push(log); else map.set(log.date, [log])
  }
  return map
}

// Build DailyTotals rows for every day in [from, to]. Days with no logs
// render as unlogged (logged=false). Each day is scored against the target
// snapshotted on its logs (`targetAtLog` on the first log of the day); if
// no snapshot exists for a logged day, the current effective target is used.
export function buildDailyTotals(args: {
  logs: NutritionLogRecord[]
  from: LocalDateKey
  to: LocalDateKey
  currentTarget?: MacroTarget
}): DailyTotals[] {
  const { logs, from, to, currentTarget } = args
  const byDay = groupLogsByDay(logs)
  return keyRange(from, to).map((date) => {
    const dayLogs = byDay.get(date) ?? []
    const calories = dayLogs.reduce((a, l) => a + (l.calories || 0), 0)
    const protein = dayLogs.reduce((a, l) => a + (l.protein || 0), 0)
    const carbs = dayLogs.reduce((a, l) => a + (l.carbs ?? 0), 0)
    const fat = dayLogs.reduce((a, l) => a + (l.fat ?? 0), 0)
    const target: MacroTarget | undefined =
      dayLogs.length > 0
        ? dayLogs[0].targetAtLog ?? currentTarget
        : currentTarget
    return {
      date,
      calories, protein, carbs, fat,
      entryCount: dayLogs.length,
      target,
      logged: dayLogs.length > 0,
    }
  })
}

export interface PeriodSummary {
  from: LocalDateKey
  to: LocalDateKey
  loggedDays: number
  expectedDays: number
  loggingAdherence: number          // 0..1
  avg: { calories: number; protein: number; carbs: number; fat: number } | null
  // Adherence per macro = fraction of LOGGED days where intake met or exceeded
  // target × 0.95 (allows a small-rounding "close enough"). Null when no
  // logged days.
  macroAdherence: {
    calories: { underTarget: number; onTarget: number; overTarget: number } | null
    protein: { met: number } | null  // protein: "met" when within 95% of target
  }
}

export function summarizePeriod(args: {
  dailies: DailyTotals[]
  today: LocalDateKey
}): PeriodSummary {
  const { dailies, today } = args
  const from = dailies[0]?.date ?? today
  const to = dailies[dailies.length - 1]?.date ?? today
  // expectedDays = days in window up to today, inclusive. Future days don't
  // count against adherence.
  const expectedDays = Math.max(
    0,
    Math.min(dailies.length, daysBetweenKeys(from, today) + 1),
  )
  const logged = dailies.filter((d) => d.logged)
  const loggedDays = logged.length

  const avg = loggedDays === 0
    ? null
    : {
        calories: Math.round(logged.reduce((a, d) => a + d.calories, 0) / loggedDays),
        protein: Math.round(logged.reduce((a, d) => a + d.protein, 0) / loggedDays),
        carbs: Math.round(logged.reduce((a, d) => a + d.carbs, 0) / loggedDays),
        fat: Math.round(logged.reduce((a, d) => a + d.fat, 0) / loggedDays),
      }

  // Macro adherence — only over LOGGED days. A client never gets dinged for
  // not logging; that's the loggingAdherence number.
  let calBuckets: { underTarget: number; onTarget: number; overTarget: number } | null = null
  let proteinMet: { met: number } | null = null
  const withTarget = logged.filter((d) => d.target)
  if (withTarget.length > 0) {
    let under = 0, on = 0, over = 0, met = 0
    for (const d of withTarget) {
      const t = d.target!
      // Calorie "on target" window: within ±CAL_WINDOW_FOR_DAILY_SCORE.
      const kcalDelta = d.calories - t.calories
      const kcalPct = Math.abs(kcalDelta) / Math.max(1, t.calories)
      if (kcalPct <= ANALYTICS_THRESHOLDS.CAL_WINDOW_FOR_DAILY_SCORE) on += 1
      else if (kcalDelta < 0) under += 1
      else over += 1
      // Protein "met" when ≥ PROTEIN_MET_DAILY_FRACTION of target.
      if (d.protein >= t.protein * ANALYTICS_THRESHOLDS.PROTEIN_MET_DAILY_FRACTION) met += 1
    }
    calBuckets = { underTarget: under, onTarget: on, overTarget: over }
    proteinMet = { met }
  }

  return {
    from,
    to,
    loggedDays,
    expectedDays,
    loggingAdherence: expectedDays === 0 ? 0 : loggedDays / expectedDays,
    avg,
    macroAdherence: {
      calories: calBuckets,
      protein: proteinMet,
    },
  }
}

export function periodWindow(timeframe: "7D" | "30D" | "90D" | "ALL", todayKey: LocalDateKey, firstLogDate?: LocalDateKey): {
  from: LocalDateKey; to: LocalDateKey
} {
  if (timeframe === "ALL") {
    return { from: firstLogDate ?? todayKey, to: todayKey }
  }
  const days = timeframe === "7D" ? 7 : timeframe === "30D" ? 30 : 90
  return { from: addDaysToKey(todayKey, -(days - 1)), to: todayKey }
}

// ─── Weight trend ────────────────────────────────────────────────────────────
// Reuses the Progress source of truth. Pass in weight points you already pulled
// via src/lib/weight.ts normalization; this helper returns the summary stats.

export interface WeightPoint {
  date: string // YYYY-MM-DD or ISO; sorted ascending preferred
  lbs: number
}

export interface WeightTrend {
  first: WeightPoint | null
  latest: WeightPoint | null
  totalChangeLbs: number
  // Rate per week over the whole series (positive = gaining).
  ratePerWeekLbs: number | null
  // "confidence" is a soft label driven by span + point count.
  confidence: "low" | "moderate" | "high"
}

export function summarizeWeight(points: WeightPoint[]): WeightTrend {
  if (points.length === 0) return { first: null, latest: null, totalChangeLbs: 0, ratePerWeekLbs: null, confidence: "low" }
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0]
  const latest = sorted[sorted.length - 1]
  const totalChangeLbs = latest.lbs - first.lbs
  if (sorted.length < 2) return { first, latest, totalChangeLbs: 0, ratePerWeekLbs: null, confidence: "low" }
  const spanDays = daysBetweenKeys(first.date.slice(0, 10) as LocalDateKey, latest.date.slice(0, 10) as LocalDateKey)
  const ratePerWeekLbs = spanDays >= 7 ? (totalChangeLbs / spanDays) * 7 : null
  const T = ANALYTICS_THRESHOLDS
  const confidence: WeightTrend["confidence"] =
    spanDays >= T.WEIGHT_HIGH_CONFIDENCE_SPAN_DAYS && sorted.length >= T.WEIGHT_HIGH_CONFIDENCE_MIN_POINTS
      ? "high"
      : spanDays >= T.WEIGHT_MODERATE_CONFIDENCE_SPAN_DAYS && sorted.length >= T.WEIGHT_MODERATE_CONFIDENCE_MIN_POINTS
        ? "moderate"
        : "low"
  return { first, latest, totalChangeLbs, ratePerWeekLbs, confidence }
}

// ─── Coach insights ─────────────────────────────────────────────────────────
//
// Decision-support narratives. These are what the coach reads to decide
// whether to adjust something; they NEVER mutate client targets or logs.
//
// Rules:
//   - Minimum 7 logged days in the window to emit any calorie/protein insight.
//   - Minimum 2 weight points and ≥10-day span to emit a weight-trend insight.
//   - Insights carry a confidence label ("low" | "moderate" | "high") that is
//     downgraded automatically when coverage is thin.
//   - Narratives report facts, not conclusions. Lisa decides what to change.

export type InsightConfidence = "low" | "moderate" | "high"
export interface CoachInsight {
  key: string                    // stable id for React keys
  tone: "neutral" | "positive" | "watch"
  headline: string               // short, scannable
  detail?: string                // longer explanation
  confidence: InsightConfidence
}

function pct(a: number, b: number): number { return b === 0 ? 0 : a / b }

export function generateCoachInsights(args: {
  summary: PeriodSummary
  weight: WeightTrend
  currentTarget?: MacroTarget
}): CoachInsight[] {
  const { summary, weight, currentTarget } = args
  const insights: CoachInsight[] = []
  const T = ANALYTICS_THRESHOLDS
  const loggedDays = summary.loggedDays
  const coverageConfidence: InsightConfidence =
    loggedDays >= T.COVERAGE_HIGH_LOGGED_DAYS ? "high"
      : loggedDays >= T.COVERAGE_MODERATE_LOGGED_DAYS ? "moderate"
        : "low"

  // Logging adherence framing — always worth noting.
  if (summary.expectedDays >= 4) {
    const ad = summary.loggingAdherence
    if (ad < T.LOGGING_SPARSE_BELOW) {
      insights.push({
        key: "log-sparse",
        tone: "watch",
        headline: `Logging ${Math.round(ad * 100)}% of days (${loggedDays}/${summary.expectedDays}).`,
        detail: "Everything below is based on fewer days than ideal — consider nudging consistency before changing the plan.",
        confidence: "high",
      })
    } else if (ad >= T.LOGGING_STRONG_AT_OR_ABOVE) {
      insights.push({
        key: "log-strong",
        tone: "positive",
        headline: `Strong logging — ${loggedDays}/${summary.expectedDays} days (${Math.round(ad * 100)}%).`,
        confidence: "high",
      })
    }
  }

  // Calorie average vs target.
  if (summary.avg && currentTarget && loggedDays >= T.MIN_LOGGED_DAYS_FOR_MACRO_INSIGHT) {
    const delta = summary.avg.calories - currentTarget.calories
    const pctOff = Math.abs(delta) / Math.max(1, currentTarget.calories)
    if (pctOff <= T.CAL_ON_TARGET_PCT) {
      insights.push({
        key: "cal-on",
        tone: "positive",
        headline: `Calories averaged ${summary.avg.calories.toLocaleString()} vs ${currentTarget.calories.toLocaleString()} target — within ${Math.round(pctOff * 100)}%.`,
        confidence: coverageConfidence,
      })
    } else if (delta > 0) {
      insights.push({
        key: "cal-over",
        tone: "watch",
        headline: `Calories averaged ${summary.avg.calories.toLocaleString()} — ${Math.round(delta)} over target.`,
        detail: `~${Math.round(pctOff * 100)}% above the ${currentTarget.calories.toLocaleString()} kcal target across ${loggedDays} logged days.`,
        confidence: coverageConfidence,
      })
    } else {
      insights.push({
        key: "cal-under",
        tone: "watch",
        headline: `Calories averaged ${summary.avg.calories.toLocaleString()} — ${Math.round(Math.abs(delta))} under target.`,
        detail: `~${Math.round(pctOff * 100)}% below the ${currentTarget.calories.toLocaleString()} kcal target across ${loggedDays} logged days.`,
        confidence: coverageConfidence,
      })
    }
  }

  // Protein average + days target met.
  if (summary.avg && currentTarget && loggedDays >= T.MIN_LOGGED_DAYS_FOR_MACRO_INSIGHT) {
    const met = summary.macroAdherence.protein?.met ?? 0
    const metFrac = pct(met, loggedDays)
    const proDelta = summary.avg.protein - currentTarget.protein
    const proShortfall = currentTarget.protein - summary.avg.protein
    if (proShortfall >= T.PROTEIN_SHORTFALL_WATCH_GRAMS) {
      insights.push({
        key: "pro-under",
        tone: "watch",
        headline: `Protein averaged ${summary.avg.protein}g vs ${currentTarget.protein}g target — ${met} of ${loggedDays} days reached target.`,
        detail: proShortfall >= T.PROTEIN_SHORTFALL_MATERIAL_GRAMS
          ? "Material shortfall — worth a conversation about meal structure or protein sources."
          : "Within range on most days but trending low — a small nudge may close the gap.",
        confidence: coverageConfidence,
      })
    } else if (metFrac >= T.PROTEIN_DAYS_MET_POSITIVE_FRACTION) {
      insights.push({
        key: "pro-good",
        tone: "positive",
        headline: `Protein target reached on ${met} of ${loggedDays} days (${Math.round(metFrac * 100)}%).`,
        detail: `Averaged ${summary.avg.protein}g (${proDelta >= 0 ? "+" : ""}${proDelta}g vs ${currentTarget.protein}g target).`,
        confidence: coverageConfidence,
      })
    }
  }

  // Weight trend — only when span and point count justify it.
  if (weight.ratePerWeekLbs != null && weight.first && weight.latest) {
    const rate = weight.ratePerWeekLbs
    const abs = Math.abs(rate)
    const dir = rate > 0 ? "+" : ""
    insights.push({
      key: "weight-trend",
      tone: abs < T.WEIGHT_NEUTRAL_ABS_LBS_PER_WEEK ? "neutral" : "positive",
      headline: `Weight trend ≈ ${dir}${rate.toFixed(1)} lb/wk.`,
      detail: abs < T.WEIGHT_STABLE_ABS_LBS_PER_WEEK
        ? `Stable — ${weight.latest.lbs.toFixed(1)} lb now vs ${weight.first.lbs.toFixed(1)} lb at start of window.`
        : `${weight.first.lbs.toFixed(1)} → ${weight.latest.lbs.toFixed(1)} lb across the window.`,
      confidence: weight.confidence,
    })
  }

  if (insights.length === 0) {
    insights.push({
      key: "need-data",
      tone: "neutral",
      headline: loggedDays === 0
        ? "No nutrition logs yet in this window."
        : `Need at least ${T.MIN_LOGGED_DAYS_FOR_MACRO_INSIGHT} logged days for calorie/protein insights (currently ${loggedDays}).`,
      confidence: "low",
    })
  }

  return insights
}

// ─── Weekly comparison (this week vs previous week) ─────────────────────────
//
// Builds two side-by-side summaries using the SAME canonical analytics. The
// comparison yields deltas you can read in a sentence; low-data cases return
// null so the UI can hide the section instead of showing noisy numbers.

export interface WeeklyComparison {
  thisWeek: { from: LocalDateKey; to: LocalDateKey; avg: PeriodSummary["avg"]; loggedDays: number }
  previousWeek: { from: LocalDateKey; to: LocalDateKey; avg: PeriodSummary["avg"]; loggedDays: number }
  caloriesDelta: number | null
  proteinDelta: number | null
  loggingDelta: number
}

export function compareWeeks(args: {
  logs: NutritionLogRecord[]
  today: LocalDateKey
  currentTarget?: MacroTarget
}): WeeklyComparison {
  const { logs, today, currentTarget } = args
  const thisFrom = addDaysToKey(today, -6)
  const prevTo = addDaysToKey(thisFrom, -1)
  const prevFrom = addDaysToKey(prevTo, -6)
  const thisDailies = buildDailyTotals({ logs, from: thisFrom, to: today, currentTarget })
  const prevDailies = buildDailyTotals({ logs, from: prevFrom, to: prevTo, currentTarget })
  const thisSummary = summarizePeriod({ dailies: thisDailies, today })
  const prevSummary = summarizePeriod({ dailies: prevDailies, today })

  const caloriesDelta = thisSummary.avg && prevSummary.avg ? thisSummary.avg.calories - prevSummary.avg.calories : null
  const proteinDelta = thisSummary.avg && prevSummary.avg ? thisSummary.avg.protein - prevSummary.avg.protein : null

  return {
    thisWeek: { from: thisFrom, to: today, avg: thisSummary.avg, loggedDays: thisSummary.loggedDays },
    previousWeek: { from: prevFrom, to: prevTo, avg: prevSummary.avg, loggedDays: prevSummary.loggedDays },
    caloriesDelta,
    proteinDelta,
    loggingDelta: thisSummary.loggedDays - prevSummary.loggedDays,
  }
}

// ─── Recent / repeated meals ────────────────────────────────────────────────
//
// Groups prior logs by a "fingerprint" (mealType + rounded calories + rounded
// protein + first 40 chars of description) and returns the most-logged
// variants. Used by the client logging UI to offer one-tap re-log of a
// client's typical breakfast, snack, etc.
//
// Rules:
//   - A fingerprint collapses identical repeats (same meal + same macros + same
//     description) but keeps slight variations separate (e.g. "3 eggs" vs
//     "3 eggs with avocado" won't merge).
//   - Returns at most `limit` items, sorted by (count desc, mostRecentAt desc).
//   - Skips descriptions-only / zero-calorie entries.

export interface RepeatedMeal {
  key: string
  mealType?: NutritionLogRecord["mealType"]
  calories: number
  protein: number
  carbs?: number
  fat?: number
  description?: string
  count: number
  mostRecentAt: string
}

export function recentRepeatedMeals(logs: NutritionLogRecord[], opts?: { limit?: number }): RepeatedMeal[] {
  const T = ANALYTICS_THRESHOLDS
  const limit = opts?.limit ?? T.REPEAT_MEAL_LIMIT_DEFAULT
  const groups = new Map<string, RepeatedMeal>()
  for (const l of logs) {
    if (!l.calories || l.calories < T.REPEAT_MEAL_MIN_KCAL) continue
    const descKey = (l.description ?? "").trim().toLowerCase().slice(0, T.REPEAT_MEAL_DESCRIPTION_KEY_LEN)
    const roundedKcal = Math.round(l.calories / T.REPEAT_MEAL_KCAL_BUCKET) * T.REPEAT_MEAL_KCAL_BUCKET
    const roundedProt = Math.round(l.protein / T.REPEAT_MEAL_PROTEIN_BUCKET) * T.REPEAT_MEAL_PROTEIN_BUCKET
    const key = `${l.mealType ?? "any"}|${roundedKcal}|${roundedProt}|${descKey}`
    const existing = groups.get(key)
    if (existing) {
      existing.count += 1
      if (l.loggedAt > existing.mostRecentAt) existing.mostRecentAt = l.loggedAt
    } else {
      groups.set(key, {
        key,
        mealType: l.mealType,
        calories: l.calories,
        protein: l.protein,
        carbs: l.carbs,
        fat: l.fat,
        description: l.description,
        count: 1,
        mostRecentAt: l.loggedAt,
      })
    }
  }
  return Array.from(groups.values())
    .sort((a, b) => (b.count - a.count) || b.mostRecentAt.localeCompare(a.mostRecentAt))
    .slice(0, limit)
}

// ─── Measurement change ─────────────────────────────────────────────────────
//
// Deterministic diff between the earliest and the latest measurement reading
// per label within a date window. Reads from the exact rows the dedicated
// Progress page already surfaces (admin side feeds in a flat
// MeasurementRow[] built from ProgressSnapshotRecord + CoachingCheckInRecord
// measurementSnapshot). Progress page itself is unchanged.
//
// Rules:
//   - Needs ≥ 2 readings for the same label inside the window to emit a row.
//     Labels with only 1 reading are silently dropped (no spurious deltas).
//   - "No change" rows are kept so the coach can see at a glance that we
//     measured and nothing moved.
//   - All comparison happens in a canonical unit (centimetres) so a client
//     who switched the per-row in/cm toggle mid-period doesn't produce
//     garbage deltas (e.g. 38 in → 94 cm actually = ~96.5 cm → 94 cm = −2.5 cm,
//     NOT +56). Historical records are never rewritten — the toCm/fromCm
//     helpers from src/lib/length.ts only canonicalise at compute time.
//   - Display unit = the latest reading's unit (or the caller-supplied
//     `preferredUnit`), to match what the client last chose.
//   - Noise floor (MEASUREMENT_MIN_DELTA_IN / _CM) is applied in the display
//     unit so the threshold matches what the coach sees — a ±0.3 in note
//     is noise in inches whether or not the stored row was in cm.

export interface MeasurementReading {
  date: string          // YYYY-MM-DD or ISO prefix — only used for sort/filter
  label: string         // e.g. "Waist"
  value: number
  unit: string          // "in" | "cm" (anything else normalizes to "in")
}

export type MeasurementChangeTone = "down" | "up" | "flat"
export interface MeasurementChange {
  label: string
  startValue: number
  endValue: number
  unit: LengthUnit      // the display unit of startValue/endValue/deltaValue
  deltaValue: number    // endValue - startValue, in `unit`
  tone: MeasurementChangeTone
  readings: number      // how many readings informed this row
}

export function measurementChanges(args: {
  rows: MeasurementReading[]
  from: LocalDateKey
  to: LocalDateKey
  preferredUnit?: LengthUnit        // override the "latest reading wins" default
}): MeasurementChange[] {
  const { rows, from, to, preferredUnit } = args
  const T = ANALYTICS_THRESHOLDS
  const inWindow = rows.filter((r) => {
    const d = r.date.slice(0, 10)
    return d >= from && d <= to
  })
  // Normalize every valid reading to centimetres and group per label.
  type Normalized = { date: string; cm: number; sourceUnit: LengthUnit }
  const byLabel = new Map<string, Normalized[]>()
  for (const r of inWindow) {
    const cm = toCm(r.value, r.unit)
    if (cm == null) continue
    const sourceUnit = normalizeLengthUnit(r.unit)
    const entry: Normalized = { date: r.date, cm, sourceUnit }
    const arr = byLabel.get(r.label)
    if (arr) arr.push(entry); else byLabel.set(r.label, [entry])
  }
  const out: MeasurementChange[] = []
  for (const [label, arr] of byLabel) {
    if (arr.length < 2) continue
    const sorted = [...arr].sort((a, b) => a.date.localeCompare(b.date))
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    // Display unit: caller preference wins, otherwise follow the latest
    // reading's own unit so the number matches what the client last entered.
    const displayUnit: LengthUnit = preferredUnit ?? last.sourceUnit
    const startValue = round1(fromCm(first.cm, displayUnit))
    const endValue = round1(fromCm(last.cm, displayUnit))
    // Delta is computed from the rounded display values so the printed
    // start/end/delta always reconcile exactly (end − start === delta).
    const deltaValue = round1(endValue - startValue)
    const noiseFloor = displayUnit === "cm" ? T.MEASUREMENT_MIN_DELTA_CM : T.MEASUREMENT_MIN_DELTA_IN
    const absDelta = Math.abs(deltaValue)
    const tone: MeasurementChangeTone = absDelta < noiseFloor ? "flat" : deltaValue < 0 ? "down" : "up"
    out.push({
      label,
      startValue,
      endValue,
      unit: displayUnit,
      deltaValue,
      tone,
      readings: sorted.length,
    })
  }
  // Stable, scannable ordering — biggest absolute change first (down and up
  // both count), then flat rows at the bottom.
  return out.sort((a, b) => {
    if (a.tone === "flat" && b.tone !== "flat") return 1
    if (b.tone === "flat" && a.tone !== "flat") return -1
    return Math.abs(b.deltaValue) - Math.abs(a.deltaValue)
  })
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
