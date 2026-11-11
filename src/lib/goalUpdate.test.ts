import { test } from "node:test"
import assert from "node:assert/strict"
import { parseGoalUpdate } from "./goalUpdate"

test("coach edits: allowed fields are cleaned", () => {
  assert.deepEqual(parseGoalUpdate({ label: " Squat 135 ", targetValue: "135", startValue: "", targetDate: "2026-12-31", notes: " steady ", unit: "lb", status: "ON_TRACK", type: "strength" }),
    { ok: true, value: { label: "Squat 135", targetValue: 135, startValue: null, targetDate: "2026-12-31", notes: "steady", unit: "lb", status: "ON_TRACK", type: "strength" } })
  assert.deepEqual(parseGoalUpdate({ targetDate: "" }), { ok: true, value: { targetDate: "" } })
})

test("coach edits: anything else is refused", () => {
  for (const b of [{ clientEmail: "x@y.z" }, { id: "a" }, { status: "DONE" }, { type: "fun" }, { label: "" }, { targetValue: "abc" }, { targetDate: "31/12/2026" }, { notes: "x".repeat(501) }, {}, null, []]) {
    assert.equal(parseGoalUpdate(b).ok, false, JSON.stringify(b))
  }
})
