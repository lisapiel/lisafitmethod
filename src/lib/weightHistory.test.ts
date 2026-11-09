import { test } from "node:test"
import assert from "node:assert/strict"
import { buildWeightHistory, summarizeWeight } from "./weightHistory"

test("a logged weight with no check-ins is the current weight, with no change invented", () => {
  const r = buildWeightHistory({ checkIns: [], logged: [{ snapshotDate: "2026-11-08", weight: 125, weightUnit: "LBS" }] })
  const s = summarizeWeight(r)
  assert.equal(s.count, 1)
  assert.equal(s.latest?.lbs, 125)
  assert.equal(s.latest?.source, "logged")
  assert.equal(s.change, null)
})

test("check-ins and logged weights merge in date order and the newest is current", () => {
  const r = buildWeightHistory({
    checkIns: [{ submittedAt: "2026-10-20T15:00:00Z", weight: 130, weightUnit: "LBS" }, { submittedAt: "2026-11-03T15:00:00Z", weight: 127, weightUnit: "lbs" }],
    logged: [{ snapshotDate: "2026-11-08", weight: 125, weightUnit: "LBS" }, { snapshotDate: "2026-10-27", weight: 128.5 }],
  })
  assert.deepEqual(r.map((x) => x.lbs), [130, 128.5, 127, 125])
  assert.deepEqual(r.map((x) => x.source), ["check-in", "logged", "check-in", "logged"])
  const s = summarizeWeight(r)
  assert.equal(s.latest?.lbs, 125)
  assert.equal(s.change, -5)
})

test("missing, zero, placeholder-sized and undated values are not measurements", () => {
  const r = buildWeightHistory({
    checkIns: [{ submittedAt: "2026-11-01T10:00:00Z", weight: null }, { submittedAt: "2026-11-02T10:00:00Z", weight: 0 }, { submittedAt: "2026-11-03T10:00:00Z", weight: "" }, { weight: 140 }],
    logged: [{ snapshotDate: "2026-11-04", weight: 1 }, { snapshotDate: "not a date", weight: 140 }, { snapshotDate: "2026-11-05", weight: 9999 }],
  })
  assert.equal(r.length, 0)
  assert.equal(summarizeWeight(r).latest, null)
})

test("mixed units compare in pounds and display in the latest unit", () => {
  const r = buildWeightHistory({ checkIns: [{ submittedAt: "2026-10-01T10:00:00Z", weight: 60, weightUnit: "KG" }], logged: [{ snapshotDate: "2026-10-15", weight: 59, weightUnit: "KG" }] })
  const s = summarizeWeight(r)
  assert.equal(s.unit, "KG")
  assert.equal(s.change, -1)
})

test("the same weigh-in recorded twice at the same moment counts once", () => {
  const r = buildWeightHistory({ checkIns: [{ submittedAt: "2026-11-01T10:00:00Z", weight: 130 }, { submittedAt: "2026-11-01T10:00:00Z", weight: 130 }], logged: [] })
  assert.equal(r.length, 1)
})
