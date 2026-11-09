import { test } from "node:test"
import assert from "node:assert/strict"
import { COACH_THREAD_KEY, coachThreadId } from "./coachThreadKey"

test("thread id matches the format every stored conversation already uses", () => {
  assert.equal(coachThreadId("client@example.com"), ["client@example.com", COACH_THREAD_KEY].sort().join("_"))
})

test("thread id ignores letter case in the client's email", () => {
  assert.equal(coachThreadId("Client@Example.com"), coachThreadId("client@example.com"))
})
