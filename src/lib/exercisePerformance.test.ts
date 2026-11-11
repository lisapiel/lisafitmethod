import { test } from "node:test"
import assert from "node:assert/strict"
import { bestSet, lastTimeSummary, withUnit, type LoggedSet } from "./exercisePerformance"
import { weightGuideKind, weightGuide } from "./weightGuide"

const s = (setNumber: number, weight: string, reps: string, completed = true): LoggedSet => ({ exerciseId: "x", setNumber, weight, reps, completed })

test("best is the heaviest weight, with the most reps at that weight", () => {
  assert.deepEqual(bestSet([s(1, "50", "10"), s(2, "55", "3"), s(3, "55", "2")]), { weight: "55", reps: 3 })
  assert.deepEqual(bestSet([s(1, "40", "8"), s(2, "40", "10"), s(3, "35", "12")]), { weight: "40", reps: 10 })
})

test("best ignores unfinished sets and values that aren't plain numbers", () => {
  assert.deepEqual(bestSet([s(1, "100", "5", false), s(2, "60", "8")]), { weight: "60", reps: 8 })
  assert.equal(bestSet([s(1, "BW", "12"), s(2, "25/25", "10"), s(3, "", "15")]), null)
  assert.equal(bestSet([s(1, "40", "8/side")]), null)
  assert.equal(bestSet([]), null)
})

test("best keeps the weight exactly as typed", () => {
  assert.deepEqual(bestSet([s(1, "52.5", "6")]), { weight: "52.5", reps: 6 })
})

test("last time: same weight on every set reads as one line", () => {
  assert.deepEqual(lastTimeSummary([s(2, "40", "8"), s(1, "40", "8"), s(3, "40", "7")]), { kind: "same", weight: "40", reps: ["8", "8", "7"] })
})

test("last time: different weights get one line per set", () => {
  assert.deepEqual(lastTimeSummary([s(1, "60", "10"), s(2, "60", "9"), s(3, "50", "10")]), {
    kind: "lines", lines: [{ weight: "60", reps: "10" }, { weight: "60", reps: "9" }, { weight: "50", reps: "10" }],
  })
})

test("last time: no weights shows reps only; empty sets are left out", () => {
  assert.deepEqual(lastTimeSummary([s(1, "", "15"), s(2, "", "15"), s(3, "", "")]), { kind: "reps", reps: ["15", "15"] })
  assert.equal(lastTimeSummary([s(1, "", "")]), null)
})

test("units are added only to plain numbers", () => {
  assert.equal(withUnit("40", "lb"), "40 lb")
  assert.equal(withUnit("BW", "kg"), "BW")
})

test("weight guide picks the right convention from library tags", () => {
  assert.equal(weightGuideKind("upper, push, free weight", ["Dumbbell", "Bench"]), "db-upper")
  assert.equal(weightGuideKind("leg, glute, free weight", ["Dumbbell"]), "db-lower")
  assert.equal(weightGuideKind("posterior chain, leg, free weight", ["Dumbbell"]), "db-lower")
  assert.equal(weightGuideKind("leg, glute, free weight", ["Barbell"]), "barbell")
  assert.equal(weightGuideKind("upper, pull, cable", ["Cable Machine"]), "machine")
  assert.equal(weightGuideKind("core, stability, bodyweight", ["Mat"]), "bodyweight")
  assert.equal(weightGuideKind("upper, push, free weight", ["Kettlebell"]), "kb-upper")
})

test("unclear cases get the general guide instead of a guess", () => {
  assert.equal(weightGuideKind("", []), "general")
  assert.equal(weightGuideKind(null, undefined), "general")
  assert.equal(weightGuideKind("full body, free weight", ["Dumbbell"]), "general")
  assert.equal(weightGuideKind("core, free weight", ["Dumbbell"]), "general")
  assert.equal(weightGuideKind("leg, glute", ["Smith Machine"]), "general")
  assert.equal(weightGuideKind("leg", ["Leg Press"]), "general")
  assert.equal(weightGuideKind("upper, push", ["Band"]), "general")
  assert.equal(weightGuideKind("upper, push", ["Landmine"]), "general")
  assert.equal(weightGuideKind("upper, pull", ["Dumbbell", "Barbell"]), "general")
  assert.equal(weightGuideKind("upper, push", ["Weight"]), "general")
})

test("every guide has a title and uses the client's unit in examples", () => {
  for (const k of ["db-upper", "db-lower", "barbell", "kb-upper", "kb-lower", "kettlebell", "machine", "bodyweight", "general"] as const) {
    const lb = weightGuide(k, "lb"); const kg = weightGuide(k, "kg")
    assert.ok(lb.title && kg.title)
    assert.ok(kg.examples.every((e) => !/\blb\b/.test(e)), k)
    assert.ok(lb.examples.every((e) => !/\bkg\b/.test(e)), k)
    assert.ok([...lb.body, ...lb.examples, lb.title].every((t) => !t.includes("—")), `no em dash in ${k}`)
  }
})
