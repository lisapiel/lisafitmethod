import { test } from "node:test"
import assert from "node:assert/strict"
import { buildWeightHistory, formatReading, formatWeighInDay, summarizeWeight, weighInDayKey } from "./weightHistory"

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

// All same-day tests pin the time zone so "local day" doesn't depend on the
// machine running them. 2026-11-08T23:30:00Z is 6:30 pm on Nov 8 in New York.
const NY = "America/New_York"

test("a check-in and a logged weight on the same local day with the same weight are one weigh-in", () => {
  const r = buildWeightHistory({
    checkIns: [{ submittedAt: "2026-11-08T23:30:00Z", weight: 125, weightUnit: "LBS" }],
    logged: [{ snapshotDate: "2026-11-08", weight: 125, weightUnit: "LBS" }],
    timeZone: NY,
  })
  assert.equal(r.length, 1)
  assert.equal(r[0].source, "logged")
  assert.equal(summarizeWeight(r).count, 1)
})

test("within 0.2 lb is the same reading, more than that is two", () => {
  const near = buildWeightHistory({ checkIns: [{ submittedAt: "2026-11-08T15:00:00Z", weight: 125.2 }], logged: [{ snapshotDate: "2026-11-08", weight: 125 }], timeZone: NY })
  assert.equal(near.length, 1)
  const far = buildWeightHistory({ checkIns: [{ submittedAt: "2026-11-08T15:00:00Z", weight: 125.4 }], logged: [{ snapshotDate: "2026-11-08", weight: 125 }], timeZone: NY })
  assert.equal(far.length, 2)
})

test("same local day with a different weight keeps both", () => {
  const r = buildWeightHistory({
    checkIns: [{ submittedAt: "2026-11-08T23:30:00Z", weight: 124, weightUnit: "LBS" }],
    logged: [{ snapshotDate: "2026-11-08", weight: 125, weightUnit: "LBS" }],
    timeZone: NY,
  })
  assert.equal(r.length, 2)
})

test("the same weight on different days is two weigh-ins", () => {
  const r = buildWeightHistory({
    checkIns: [{ submittedAt: "2026-11-09T15:00:00Z", weight: 125 }],
    logged: [{ snapshotDate: "2026-11-08", weight: 125 }],
    timeZone: NY,
  })
  assert.equal(r.length, 2)
})

test("the local day decides, not the UTC day", () => {
  // 2026-11-09T02:00:00Z is still Nov 8 in New York, so it matches a Nov 8 log.
  const ny = buildWeightHistory({ checkIns: [{ submittedAt: "2026-11-09T02:00:00Z", weight: 125 }], logged: [{ snapshotDate: "2026-11-08", weight: 125 }], timeZone: NY })
  assert.equal(ny.length, 1)
  // In Berlin the same moment is Nov 9, a different day from the log.
  const berlin = buildWeightHistory({ checkIns: [{ submittedAt: "2026-11-09T02:00:00Z", weight: 125 }], logged: [{ snapshotDate: "2026-11-08", weight: 125 }], timeZone: "Europe/Berlin" })
  assert.equal(berlin.length, 2)
})

test("kilograms and pounds for the same reading on the same day count once", () => {
  // 60 kg = 132.28 lb.
  const r = buildWeightHistory({
    checkIns: [{ submittedAt: "2026-11-08T15:00:00Z", weight: 132.3, weightUnit: "LBS" }],
    logged: [{ snapshotDate: "2026-11-08", weight: 60, weightUnit: "KG" }],
    timeZone: NY,
  })
  assert.equal(r.length, 1)
  assert.equal(r[0].unit, "KG")
})

test("check-ins marked same or skipped add no weigh-in, even if a weight came along", () => {
  const r = buildWeightHistory({
    checkIns: [
      { submittedAt: "2026-11-01T15:00:00Z", weight: 126, weightStatus: "new" },
      { submittedAt: "2026-11-08T15:00:00Z", weightStatus: "same" },
      { submittedAt: "2026-11-15T15:00:00Z", weight: 999, weightStatus: "same" },
      { submittedAt: "2026-11-22T15:00:00Z", weight: 124, weightStatus: "skipped" },
    ],
    logged: [],
    timeZone: NY,
  })
  assert.deepEqual(r.map((x) => x.lbs), [126])
})

test("a logged date-only value displays as its own calendar day", () => {
  assert.equal(formatWeighInDay("2026-11-08"), "Nov 8")
  assert.equal(weighInDayKey("2026-11-08", "Pacific/Kiritimati"), "2026-11-08")
  assert.equal(formatReading({ lbs: 125, unit: "LBS" }), "125 lb")
  assert.equal(formatReading({ lbs: 60 * 2.20462, unit: "KG" }), "60 kg")
})
