import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { scanAll } from "./dynamoScan"
import { FakeTable } from "./testing/fakeDynamo"

describe("scanAll", () => {
  test("follows LastEvaluatedKey across pages, including pages the filter empties", async () => {
    const t = new FakeTable(3)
    for (let i = 0; i < 10; i++) t.put({ userId: `aaa_noise_${i}` })
    for (let i = 0; i < 4; i++) t.put({ userId: `coaching_client_${i}@example.test`, n: i })
    const firstPageOnly = (await t.send(new (await import("@aws-sdk/lib-dynamodb")).ScanCommand({
      TableName: "t", FilterExpression: "begins_with(userId, :p)", ExpressionAttributeValues: { ":p": "coaching_client_" },
    }))).Items as unknown[]
    assert.equal(firstPageOnly.length, 0, "a single page sees none of them: the bug being fixed")

    t.scanCalls = 0
    const all = await scanAll<{ n: number }>(t, {
      TableName: "t", FilterExpression: "begins_with(userId, :p)", ExpressionAttributeValues: { ":p": "coaching_client_" },
    })
    assert.equal(all.length, 4)
    assert.equal(t.scanCalls, 5, "14 records at 3 per page is 5 pages")
  })

  test("keeps the filter on every page", async () => {
    const t = new FakeTable(2)
    for (let i = 0; i < 9; i++) t.put({ userId: `coaching_checkin_${i}`, clientEmail: i % 3 === 0 ? "a@example.test" : "b@example.test" })
    const mine = await scanAll<{ clientEmail: string }>(t, {
      TableName: "t",
      FilterExpression: "begins_with(userId, :p) AND clientEmail = :e",
      ExpressionAttributeValues: { ":p": "coaching_checkin_", ":e": "a@example.test" },
    })
    assert.equal(mine.length, 3)
    assert.ok(mine.every((m) => m.clientEmail === "a@example.test"))
  })

  test("a single page with no LastEvaluatedKey makes one call", async () => {
    const t = new FakeTable(100)
    t.put({ userId: "coaching_goal_1" })
    t.scanCalls = 0
    const r = await scanAll(t, { TableName: "t" })
    assert.equal(r.length, 1)
    assert.equal(t.scanCalls, 1)
  })

  test("stops instead of looping forever on a table that never ends", async () => {
    const endless = { send: async () => ({ Items: [], LastEvaluatedKey: { userId: "x" } }) }
    await assert.rejects(scanAll(endless, { TableName: "t" }), /stopped after 1000 pages/)
  })
})
