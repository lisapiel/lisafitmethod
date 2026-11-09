import { test } from "node:test"
import assert from "node:assert/strict"
import { toClientProgram, toClientRecord } from "./clientView"

test("a client's program never includes the coach's program notes", () => {
  const p = toClientProgram({ id: "p1", name: "Phase 1", status: "ACTIVE", weeks: "[]", durationWeeks: 6, introNote: "How to progress", notes: "Cervical disc history: monitor neck", clientEmail: "c@example.com", warmupOptions: { bands: true } })
  assert.equal("notes" in p, false)
  assert.deepEqual(Object.keys(p).sort(), ["durationWeeks", "id", "introNote", "name", "status", "weeks"])
  assert.equal(p.introNote, "How to progress")
})

test("a client's record never includes the coach's private notes", () => {
  const c = toClientRecord({ email: "c@example.com", displayName: "C", privateNotes: "Coach only", coachMessage: "Shown on Home", startingWeight: 140 })
  assert.equal("privateNotes" in c, false)
  assert.equal(c.coachMessage, "Shown on Home")
  assert.equal(c.startingWeight, 140)
})
