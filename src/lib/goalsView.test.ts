import { test } from "node:test"
import assert from "node:assert/strict"
import { goalProgressPct, goalsForHome, toHomeGoal } from "./goalsView"
import { nextCheckInDue } from "./portalProgram"

test("goal progress works up and down, and needs all three values", () => {
  assert.equal(goalProgressPct({ startValue: 150, targetValue: 140, currentValue: 145 }), 50)
  assert.equal(goalProgressPct({ startValue: 100, targetValue: 150, currentValue: 160 }), 100)
  assert.equal(goalProgressPct({ startValue: 100, targetValue: 150, currentValue: null }), null)
})

test("Home shows active goals first, at most three", () => {
  const g = (id: string, status: string) => toHomeGoal({ id, type: "custom", status })
  assert.deepEqual(goalsForHome([g("a", "ACHIEVED"), g("b", "ON_TRACK"), g("c", "NEEDS_ATTENTION"), g("d", "ON_TRACK")]).map((x) => x.id), ["b", "c", "d"])
})

test("goal records are read safely", () => {
  const h = toHomeGoal({ id: "x", type: "strength", label: " ", targetValue: "95", currentValue: "", targetDate: "2026-12-01" })
  assert.equal(h.label, null); assert.equal(h.targetValue, 95); assert.equal(h.currentValue, null); assert.equal(h.targetDate, "2026-12-01")
})

test("next check-in follows the existing rolling 7-day rule", () => {
  const now = Date.parse("2026-11-11T12:00:00Z")
  const r = nextCheckInDue(["2026-11-02T10:00:00Z", "2026-11-09T10:00:00Z"], now)
  assert.equal(r.last?.toISOString(), "2026-11-09T10:00:00.000Z")
  assert.equal(r.next?.toISOString(), "2026-11-16T10:00:00.000Z")
  assert.equal(r.due, false)
  assert.equal(nextCheckInDue(["2026-11-01T10:00:00Z"], now).due, true)
  assert.deepEqual(nextCheckInDue([], now), { last: null, next: null, due: true })
})
