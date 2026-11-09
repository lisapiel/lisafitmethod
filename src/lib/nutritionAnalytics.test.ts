import { test } from "node:test"
import assert from "node:assert/strict"
import { buildDailyTotals, summarizePeriod } from "./nutritionAnalytics"
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
