import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { saveWorkoutLogOnce, isValidSubmissionId, workoutLogIdFor } from "./workoutLogSave"
import { FakeTable } from "./testing/fakeDynamo"

const base = {
  clientEmail: "client@example.test",
  programId: "p1",
  weekNumber: 2,
  dayLabel: "Upper Body",
  completedAt: "2026-11-07T10:00:00.000Z",
  setData: "[]",
}

describe("saveWorkoutLogOnce", () => {
  test("the first save creates the log; a retry with the same id returns it unchanged", async () => {
    const t = new FakeTable()
    const first = await saveWorkoutLogOnce(t, "t", base, "sub-0001-aaaa")
    assert.equal(first.created, true)
    const retry = await saveWorkoutLogOnce(t, "t", { ...base, completedAt: "2026-11-07T10:05:00.000Z" }, "sub-0001-aaaa")
    assert.equal(retry.created, false)
    assert.equal(retry.record.id, first.record.id)
    assert.equal(retry.record.completedAt, base.completedAt, "the original stays as stored")
    assert.equal(t.items.size, 1)
  })

  test("a double tap (two saves at once) still stores one log", async () => {
    const t = new FakeTable()
    const results = await Promise.all([
      saveWorkoutLogOnce(t, "t", base, "sub-0002-bbbb"),
      saveWorkoutLogOnce(t, "t", base, "sub-0002-bbbb"),
    ])
    assert.equal(results.filter((r) => r.created).length, 1)
    assert.equal(t.items.size, 1)
  })

  test("different workouts get different logs", async () => {
    const t = new FakeTable()
    await saveWorkoutLogOnce(t, "t", base, "sub-0003-cccc")
    await saveWorkoutLogOnce(t, "t", base, "sub-0004-dddd")
    assert.equal(t.items.size, 2)
  })

  test("the same submission id from another account cannot reach this client's log", async () => {
    assert.notEqual(workoutLogIdFor("a@example.test", "sub-0005-eeee"), workoutLogIdFor("b@example.test", "sub-0005-eeee"))
    assert.equal(workoutLogIdFor("A@Example.test", "sub-0005-eeee"), workoutLogIdFor("a@example.test", "sub-0005-eeee"))
  })

  test("other database errors are not mistaken for a duplicate", async () => {
    const broken = { send: async () => { throw Object.assign(new Error("throttled"), { name: "ProvisionedThroughputExceededException" }) } }
    await assert.rejects(saveWorkoutLogOnce(broken, "t", base, "sub-0006-ffff"), /throttled/)
  })

  test("submission ids are validated", () => {
    assert.equal(isValidSubmissionId("0b8f3c1e-7a1d-4a51-9c39-2f7f2a3f6d10"), true)
    assert.equal(isValidSubmissionId("short"), false)
    assert.equal(isValidSubmissionId("has spaces in it"), false)
    assert.equal(isValidSubmissionId(undefined), false)
    assert.equal(isValidSubmissionId("x".repeat(65)), false)
  })
})
