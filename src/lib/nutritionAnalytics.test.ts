import { test } from "node:test"
import assert from "node:assert/strict"
import { buildDailyTotals, summarizePeriod, averagesAgainstTargets, calorieRange } from "./nutritionAnalytics"
import type { NutritionLogRecord } from "./authTokens"

const entry = (date: string, v: Partial<NutritionLogRecord>): NutritionLogRecord => ({
  id: `${date}-${Math.random()}`, clientEmail: "c@example.com", date, loggedAt: `${date}T12:00:00Z`, kind: "quick", calories: 0, protein: 0, ...v,
} as NutritionLogRecord)
const target = { calories: 2000, protein: 150, carbs: 200, fat: 70 }

test("a day's macro is known only when every entry has it", () => {
  const [d] = buildDailyTotals({ logs: [entry("2026-11-02", { calories: 500, protein: 30, carbs: 50 }), entry("2026-11-02", { calories: 700, protein: 40 })], from: "2026-11-02", to: "2026-11-02", currentTarget: target })
  assert.equal(d.calories, 1200)
  assert.deepEqual(d.known, { protein: true, carbs: false, fat: false })
})

test("a typed 0 counts as known", () => {
  const [d] = buildDailyTotals({ logs: [entry("2026-11-02", { calories: 300, protein: 10, carbs: 0, fat: 0 })], from: "2026-11-02", to: "2026-11-02", currentTarget: target })
  assert.deepEqual(d.known, { protein: true, carbs: true, fat: true })
})

test("averages leave out days where a macro is unknown, and report how many days they use", () => {
  const logs = [
    entry("2026-11-02", { calories: 2000, protein: 150, carbs: 200, fat: 60 }),
    entry("2026-11-03", { calories: 1800, protein: 120 }),
    entry("2026-11-04", { calories: 2200, protein: 160, carbs: 260, fat: 80 }),
  ]
  const dailies = buildDailyTotals({ logs, from: "2026-11-02", to: "2026-11-05", currentTarget: target })
  const s = summarizePeriod({ dailies, today: "2026-11-05" })
  assert.equal(s.loggedDays, 3)
  assert.deepEqual(s.avgDays, { calories: 3, protein: 3, carbs: 2, fat: 2 })
  assert.equal(s.avg?.calories, 2000)
  assert.equal(s.avg?.carbs, 230)
  assert.equal(s.avg?.fat, 70)
})

test("a macro nobody logged has no days behind its average", () => {
  const dailies = buildDailyTotals({ logs: [entry("2026-11-02", { calories: 1500, protein: 90 })], from: "2026-11-02", to: "2026-11-02", currentTarget: target })
  const s = summarizePeriod({ dailies, today: "2026-11-03" })
  assert.equal(s.avgDays.carbs, 0)
  assert.equal(s.avgDays.fat, 0)
})

// Food page "Last 7 days" view. Expected values are worked by hand below,
// not copied from the function's output.
const week = (logs: NutritionLogRecord[], current = target) => {
  const dailies = buildDailyTotals({ logs, from: "2026-11-06", to: "2026-11-12", currentTarget: current })
  const summary = summarizePeriod({ dailies, today: "2026-11-12" })
  return { summary, a: averagesAgainstTargets({ dailies, summary, currentTarget: current }) }
}

test("weekly averages use logged days only, never zeros for unlogged days", () => {
  // 3 of 7 days logged. Two entries on 11-12 sum to 1,280 kcal / 130 g protein.
  const { summary, a } = week([
    entry("2026-11-12", { calories: 1060, protein: 90, carbs: 122, fat: 25 }),
    entry("2026-11-12", { calories: 220, protein: 40, carbs: 8, fat: 3 }),
    entry("2026-11-10", { calories: 1910, protein: 140, carbs: 162, fat: 70 }),
    entry("2026-11-07", { calories: 2010, protein: 176, carbs: 196, fat: 58 }),
  ])
  assert.equal(summary.loggedDays, 3)
  // (1280 + 1910 + 2010) / 3 = 5200 / 3 = 1733.3 → 1733. Over 7 days it would wrongly be 5200 / 7 = 742.9 → 743.
  assert.deepEqual(a.calories, { avg: 1733, target: 2000, days: 3 })
  // (130 + 140 + 176) / 3 = 148.7 → 149
  assert.deepEqual(a.protein, { avg: 149, target: 150, days: 3 })
  // (130 + 162 + 196) / 3 = 162.7 → 163
  assert.deepEqual(a.carbs, { avg: 163, target: 200, days: 3 })
  // (28 + 70 + 58) / 3 = 52
  assert.deepEqual(a.fat, { avg: 52, target: 70, days: 3 })
  assert.equal(a.targetChanged, false)
})

test("a week with nothing logged has no averages", () => {
  const { a } = week([])
  assert.equal(a.calories, null)
  assert.equal(a.protein, null)
  assert.equal(a.carbs, null)
  assert.equal(a.fat, null)
  assert.equal(a.targetChanged, false)
})

test("when the target changed mid-week, each day is judged by its own snapshot", () => {
  const old = { calories: 2050, protein: 140, carbs: 220, fat: 65 }
  const now = { calories: 1850, protein: 150, carbs: 180, fat: 60 }
  const { a } = week([
    entry("2026-11-06", { calories: 2100, protein: 138, carbs: 230, fat: 66, targetAtLog: old }),
    entry("2026-11-07", { calories: 2000, protein: 142, carbs: 210, fat: 64, targetAtLog: old }),
    entry("2026-11-08", { calories: 2080, protein: 136, carbs: 224, fat: 68, targetAtLog: old }),
    entry("2026-11-10", { calories: 1830, protein: 152, carbs: 176, fat: 60, targetAtLog: now }),
    entry("2026-11-11", { calories: 1880, protein: 148, carbs: 184, fat: 61, targetAtLog: now }),
  ], now)
  // Intake: 9890 / 5 = 1978. Target: (2050×3 + 1850×2) / 5 = 9850 / 5 = 1970.
  // Against today's 1,850 alone it would read 107% and "above target".
  assert.deepEqual(a.calories, { avg: 1978, target: 1970, days: 5 })
  // Protein 716 / 5 = 143.2 → 143; target (140×3 + 150×2) / 5 = 144
  assert.deepEqual(a.protein, { avg: 143, target: 144, days: 5 })
  // Carbs 1024 / 5 = 204.8 → 205; target (220×3 + 180×2) / 5 = 204
  assert.deepEqual(a.carbs, { avg: 205, target: 204, days: 5 })
  // Fat 319 / 5 = 63.8 → 64; target (65×3 + 60×2) / 5 = 63
  assert.deepEqual(a.fat, { avg: 64, target: 63, days: 5 })
  assert.equal(a.targetChanged, true)
})

test("a macro's target is averaged over the same days as its intake", () => {
  const old = { calories: 2000, protein: 140, carbs: 240, fat: 70 }
  const now = { calories: 1800, protein: 150, carbs: 180, fat: 60 }
  // Carbs known only on 11-11 (current target 180). The 11-09 day has no carbs,
  // so its old carb target (240) must not enter the carb comparison.
  const { a } = week([
    entry("2026-11-09", { calories: 2000, protein: 140, targetAtLog: old }),
    entry("2026-11-11", { calories: 1800, protein: 160, carbs: 170, fat: 62, targetAtLog: now }),
  ], now)
  assert.deepEqual(a.carbs, { avg: 170, target: 180, days: 1 })
  // Calories over both days: (2000 + 1800) / 2 = 1900; target (2000 + 1800) / 2 = 1900
  assert.deepEqual(a.calories, { avg: 1900, target: 1900, days: 2 })
})

test("days logged before snapshots existed fall back to the current target", () => {
  const { a } = week([entry("2026-11-10", { calories: 1500, protein: 100, carbs: 150, fat: 50 })])
  assert.deepEqual(a.calories, { avg: 1500, target: 2000, days: 1 })
  assert.equal(a.targetChanged, false)
})

test("calorie range is ±10% rounded to 10 kcal", () => {
  // 1850 × 0.9 = 1665 → 1670 (Math.round rounds .5 up); 1850 × 1.1 = 2035 → 2040
  assert.deepEqual(calorieRange(1850), { low: 1670, high: 2040 })
  // 1970 × 0.9 = 1773 → 1770; 1970 × 1.1 = 2167 → 2170
  assert.deepEqual(calorieRange(1970), { low: 1770, high: 2170 })
})
