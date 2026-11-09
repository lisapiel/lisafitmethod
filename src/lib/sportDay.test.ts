import { test } from "node:test"
import assert from "node:assert/strict"
import { sportLogSummary, sportSummary } from "./sportDay"

test("sport summary joins what was logged", () => {
  assert.equal(sportSummary({ name: "Soccer", durationMinutes: 60, intensity: "moderate" }), "Soccer · 60 min · Moderate")
  assert.equal(sportSummary({ name: "Tennis" }), "Tennis")
})

test("log summary is only for sport logs", () => {
  assert.equal(sportLogSummary({}), null)
  assert.equal(sportLogSummary({ dayType: "sport", sportName: "Hockey", sportDurationMinutes: 45, sportIntensity: "hard" }), "Hockey · 45 min · Hard")
  assert.equal(sportLogSummary({ dayType: "sport" }), "Sport day")
})
