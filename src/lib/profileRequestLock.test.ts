import { test, describe, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb"
import { FakeTable } from "./testing/fakeDynamo"
import { PROFILE_REQUEST_LOCK_GRACE_MS, isProfileRequestLockStale } from "./profileRequests"

// The lock functions run against an in-memory table. The document client's
// send is replaced before anything is called, so no request leaves the process.
process.env.COGNITO_AWS_ACCESS_KEY_ID = "test-only"
process.env.COGNITO_AWS_SECRET_ACCESS_KEY = "test-only"

let table = new FakeTable(50)
const originalSend = DynamoDBDocumentClient.prototype.send
const EMAIL = "client@example.test"
const LOCK = `profile_request_lock_${EMAIL}`
const now = new Date("2026-11-09T12:00:00.000Z")

before(() => {
  ;(DynamoDBDocumentClient.prototype as unknown as { send: (c: unknown) => Promise<unknown> }).send =
    (command: unknown) => table.send(command)
})
after(() => {
  DynamoDBDocumentClient.prototype.send = originalSend
})
beforeEach(() => {
  table = new FakeTable(50)
})

const request = (id: string, status: string) => ({
  userId: `profile_change_request_${id}`, id, clientEmail: EMAIL, status,
  requested: { activityLevel: 1.55 }, current: { activityLevel: 1.375 }, reason: "r", createdAt: "2026-11-01T00:00:00.000Z",
})

describe("isProfileRequestLockStale", () => {
  test("a lock on a pending request is held", () => {
    assert.equal(isProfileRequestLockStale({ requestId: "a", createdAt: "2020-01-01T00:00:00.000Z" }, { status: "pending" }, now), false)
  })
  test("a lock on a decided request is stale", () => {
    assert.equal(isProfileRequestLockStale({ requestId: "a" }, { status: "approved" }, now), true)
    assert.equal(isProfileRequestLockStale({ requestId: "a" }, { status: "declined" }, now), true)
  })
  test("a lock whose request was never written is held only for the grace period", () => {
    const fresh = new Date(now.getTime() - 1000).toISOString()
    const old = new Date(now.getTime() - PROFILE_REQUEST_LOCK_GRACE_MS - 1).toISOString()
    assert.equal(isProfileRequestLockStale({ requestId: "a", createdAt: fresh }, null, now), false)
    assert.equal(isProfileRequestLockStale({ requestId: "a", createdAt: old }, null, now), true)
    assert.equal(isProfileRequestLockStale({}, null, now), true)
  })
})

describe("acquireProfileRequestLock", () => {
  test("two submissions at once: exactly one gets the lock", async () => {
    const { acquireProfileRequestLock } = await import("./coachingRecords")
    const results = await Promise.all([
      acquireProfileRequestLock(EMAIL, "r1", now),
      acquireProfileRequestLock(EMAIL, "r2", now),
    ])
    assert.deepEqual(results.filter(Boolean).length, 1)
    assert.ok(["r1", "r2"].includes(String(table.items.get(LOCK)?.requestId)))
  })

  test("refused while the locked request is pending", async () => {
    const { acquireProfileRequestLock } = await import("./coachingRecords")
    table.put(request("r1", "pending"))
    table.put({ userId: LOCK, requestId: "r1", createdAt: "2026-11-01T00:00:00.000Z" })
    assert.equal(await acquireProfileRequestLock(EMAIL, "r2", now), false)
    assert.equal(table.items.get(LOCK)?.requestId, "r1")
  })

  test("a stale lock on a decided request is taken over", async () => {
    const { acquireProfileRequestLock } = await import("./coachingRecords")
    table.put(request("r1", "approved"))
    table.put({ userId: LOCK, requestId: "r1", createdAt: "2026-11-01T00:00:00.000Z" })
    assert.equal(await acquireProfileRequestLock(EMAIL, "r2", now), true)
    assert.equal(table.items.get(LOCK)?.requestId, "r2")
    assert.equal(table.items.get("profile_change_request_r1")?.status, "approved", "history untouched")
  })

  test("a stale lock is won by only one of two racers", async () => {
    const { acquireProfileRequestLock } = await import("./coachingRecords")
    table.put(request("r1", "declined"))
    table.put({ userId: LOCK, requestId: "r1", createdAt: "2026-11-01T00:00:00.000Z" })
    const results = await Promise.all([
      acquireProfileRequestLock(EMAIL, "r2", now),
      acquireProfileRequestLock(EMAIL, "r3", now),
    ])
    assert.equal(results.filter(Boolean).length, 1)
  })

  test("the lock uses its own prefix, so request listings never see it", async () => {
    const { acquireProfileRequestLock, listProfileChangeRequests } = await import("./coachingRecords")
    table.put(request("r1", "approved"))
    await acquireProfileRequestLock(EMAIL, "r2", now)
    assert.ok(!LOCK.startsWith("profile_change_request_"))
    assert.deepEqual((await listProfileChangeRequests(EMAIL)).map((r) => r.id), ["r1"])
  })
})

describe("releaseProfileRequestLock", () => {
  test("frees the lock for its own request only", async () => {
    const { releaseProfileRequestLock } = await import("./coachingRecords")
    table.put({ userId: LOCK, requestId: "r2", createdAt: now.toISOString() })
    await releaseProfileRequestLock(EMAIL, "r1")
    assert.equal(table.items.get(LOCK)?.requestId, "r2")
    await releaseProfileRequestLock(EMAIL, "r2")
    assert.equal(table.items.has(LOCK), false)
    await releaseProfileRequestLock(EMAIL, "r2")
  })
})
