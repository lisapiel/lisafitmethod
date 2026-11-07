import { test, describe, before, after } from "node:test"
import assert from "node:assert/strict"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { FakeTable } from "./testing/fakeDynamo"

// Runs the real list functions in authTokens against a fake multi-page table.
// The document client's send is replaced before anything is called, so no
// request can leave this process.
process.env.COGNITO_AWS_ACCESS_KEY_ID = "test-only"
process.env.COGNITO_AWS_SECRET_ACCESS_KEY = "test-only"

const table = new FakeTable(4)
const originalSend = DynamoDBDocumentClient.prototype.send

before(() => {
  ;(DynamoDBDocumentClient.prototype as unknown as { send: (c: unknown) => Promise<unknown> }).send =
    (command: unknown) => table.send(command)

  for (let i = 0; i < 60; i++) table.put({ userId: `aaa_padding_${String(i).padStart(3, "0")}` })
  const clients = ["Zoe Test", "Ana Test", "Mia Test"]
  clients.forEach((name, i) =>
    table.put({ userId: `coaching_client_c${i}@example.test`, email: `c${i}@example.test`, displayName: name }))
  for (let i = 0; i < 7; i++) {
    table.put({
      userId: `coaching_workoutlog_${i}`, id: String(i), clientEmail: i < 5 ? "c0@example.test" : "c1@example.test",
      programId: "p1", weekNumber: 1, dayLabel: `Day ${i}`, completedAt: `2026-11-0${i + 1}T10:00:00.000Z`, setData: "[]",
    })
  }
  for (let i = 0; i < 6; i++) {
    table.put({ userId: `coaching_msg_t1_${i}`, id: String(i), threadId: "t1", sentAt: `2026-11-01T0${i}:00:00.000Z` })
  }
  table.put({ userId: "coaching_goal_g1", id: "g1", clientEmail: "c0@example.test" })
  for (let i = 0; i < 5; i++) {
    table.put({ userId: `nutrition_log_${i}`, id: String(i), clientEmail: "c0@example.test", date: `2026-11-0${i + 1}`, loggedAt: `2026-11-0${i + 1}T12:00:00.000Z` })
  }
  for (let i = 0; i < 3; i++) {
    table.put({ userId: `coaching_checkin_${i}`, id: String(i), clientEmail: "c2@example.test", submittedAt: `2026-11-0${i + 1}T09:00:00.000Z` })
  }
})

after(() => {
  DynamoDBDocumentClient.prototype.send = originalSend
})

describe("coaching list functions read every page", () => {
  test("clients: all returned, sorted by name", async () => {
    const { listCoachingClientRecords } = await import("./authTokens")
    const r = await listCoachingClientRecords()
    assert.deepEqual(r.map((c) => c.displayName), ["Ana Test", "Mia Test", "Zoe Test"])
  })

  test("workout logs: per-client filter kept, newest first", async () => {
    const { listWorkoutLogRecords } = await import("./authTokens")
    const mine = await listWorkoutLogRecords("C0@example.test")
    assert.equal(mine.length, 5)
    assert.ok(mine.every((l) => l.clientEmail === "c0@example.test"), "never another client's logs")
    assert.deepEqual(mine.map((l) => l.id), ["4", "3", "2", "1", "0"])
    assert.equal((await listWorkoutLogRecords()).length, 7)
  })

  test("messages in a thread, oldest first", async () => {
    const { listCoachingMessages } = await import("./authTokens")
    const r = await listCoachingMessages("t1")
    assert.deepEqual(r.map((m) => m.id), ["0", "1", "2", "3", "4", "5"])
  })

  test("goals, nutrition date range and check-ins", async () => {
    const { listGoalRecords, listNutritionLogsForClient, listCoachingCheckIns } = await import("./authTokens")
    assert.equal((await listGoalRecords("c0@example.test")).length, 1)
    const nut = await listNutritionLogsForClient("c0@example.test", { fromDate: "2026-11-02", toDate: "2026-11-04" })
    assert.deepEqual(nut.map((n) => n.date), ["2026-11-04", "2026-11-03", "2026-11-02"])
    assert.equal((await listCoachingCheckIns("c2@example.test")).length, 3)
    assert.equal((await listCoachingCheckIns("c0@example.test")).length, 0)
  })
})
