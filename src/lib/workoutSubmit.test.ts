import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { submitWorkoutLog, newSubmissionId, submitFailureMessage } from "./workoutSubmit"
import { saveWorkoutLogOnce } from "./workoutLogSave"
import { FakeTable } from "./testing/fakeDynamo"

const body = { submissionId: "sub-1111-aaaa", programId: "p1", weekNumber: 1, dayLabel: "Day 1", setData: "[]" }

function reply(status: number, json: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => json }
}

describe("submitWorkoutLog", () => {
  test("success only when the server returns the stored log", async () => {
    assert.deepEqual(await submitWorkoutLog(body, async () => reply(200, { log: { id: "x" } })), { ok: true, duplicate: false })
    assert.deepEqual(await submitWorkoutLog(body, async () => reply(200, {})), { ok: false, reason: "server" })
    assert.deepEqual(await submitWorkoutLog(body, async () => reply(500, { error: "x" })), { ok: false, reason: "server" })
    assert.deepEqual(await submitWorkoutLog(body, async () => reply(401, {})), { ok: false, reason: "signed-out" })
  })

  test("a dropped connection is reported, not shown as success", async () => {
    const r = await submitWorkoutLog(body, async () => { throw new TypeError("Failed to fetch") })
    assert.deepEqual(r, { ok: false, reason: "offline" })
  })

  test("a request that hangs times out", async () => {
    const hang = (_: string, init: RequestInit) =>
      new Promise<never>((_, reject) => init.signal?.addEventListener("abort", () => reject(new Error("aborted"))))
    const r = await submitWorkoutLog(body, hang, 30)
    assert.deepEqual(r, { ok: false, reason: "timeout" })
  })

  test("every failure message says it is not saved and the entries are kept", () => {
    for (const reason of ["offline", "timeout", "signed-out", "server"] as const) {
      const m = submitFailureMessage(reason)
      assert.match(m, /^Not saved yet/)
      assert.match(m, /entries are kept/)
    }
  })

  test("ids are unique and valid for the server", () => {
    const a = newSubmissionId()
    assert.notEqual(a, newSubmissionId())
    assert.match(a, /^[A-Za-z0-9-]{8,64}$/)
  })
})

describe("interrupted save, then retry (client and server together)", () => {
  test("the reply is lost after the server stored it: retry succeeds and the coach is notified once", async () => {
    const t = new FakeTable()
    let notifications = 0
    let dropReply = true
    const server = async (_: string, init: RequestInit) => {
      const data = JSON.parse(String(init.body))
      const saved = await saveWorkoutLogOnce(t, "t", {
        clientEmail: "client@example.test", programId: data.programId, weekNumber: data.weekNumber,
        dayLabel: data.dayLabel, completedAt: new Date().toISOString(), setData: data.setData,
      }, data.submissionId)
      if (saved.created) notifications += 1
      if (dropReply) { dropReply = false; throw new TypeError("Failed to fetch") }
      return reply(200, { log: saved.record, ...(saved.created ? {} : { duplicate: true }) })
    }
    const first = await submitWorkoutLog(body, server)
    assert.deepEqual(first, { ok: false, reason: "offline" })
    const retry = await submitWorkoutLog(body, server)
    assert.deepEqual(retry, { ok: true, duplicate: true })
    assert.equal(t.items.size, 1)
    assert.equal(notifications, 1)
  })
})
