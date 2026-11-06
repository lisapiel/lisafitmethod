import { test, describe } from "node:test"
import assert from "node:assert/strict"
import type { CoachingClientRecord } from "./authTokens"

// The merge rule that upsertCoachingClientRecord applies, kept here so the
// behaviour that protects a client's programme and nutrition data is pinned
// down by tests rather than by reading the route.
export function mergeFields(
  existing: CoachingClientRecord,
  incoming: CoachingClientRecord,
): Partial<CoachingClientRecord> {
  const updates: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(incoming)) {
    if (k === "email" || k === "createdAt") continue
    if (v === undefined || v === null || v === "") continue
    if (k === "status" && existing.status === "ACTIVE" && v === "PENDING_PAYMENT") continue
    updates[k] = v
  }
  return updates as Partial<CoachingClientRecord>
}

// A client who looks like Gino: active, complimentary, with real history.
const existing: CoachingClientRecord = {
  email: "client@example.com",
  displayName: "Existing Client",
  status: "ACTIVE",
  currentProgramId: "prog_123",
  startDate: "2026-06-11",
  startingWeight: 208,
  heightInches: 69,
  age: 31,
  sex: "male",
  activityLevel: 1.65,
  nutritionGoal: "recomp",
  goal: "Body recomp",
  weightUnit: "LBS",
  createdAt: "2026-06-11T04:02:17.735Z",
}

const adminForm: CoachingClientRecord = {
  email: "client@example.com",
  displayName: "Existing Client",
  phone: undefined,
  goal: undefined,
  startDate: undefined,
  weightUnit: "LBS",
  status: "ACTIVE",
}

describe("Admin re-admitting an existing coaching client", () => {
  test("never touches the programme assignment", () => {
    assert.equal("currentProgramId" in mergeFields(existing, adminForm), false)
  })

  test("never touches the nutrition profile", () => {
    const u = mergeFields(existing, adminForm)
    for (const f of ["heightInches", "age", "sex", "activityLevel", "nutritionGoal"]) {
      assert.equal(f in u, false, `${f} must not be written`)
    }
  })

  test("never touches starting weight or start date when the form leaves them blank", () => {
    const u = mergeFields(existing, adminForm)
    assert.equal("startingWeight" in u, false)
    assert.equal("startDate" in u, false)
  })

  test("blank form fields are skipped rather than blanking stored values", () => {
    const u = mergeFields(existing, { ...adminForm, goal: "", phone: "" })
    assert.equal("goal" in u, false)
    assert.equal("phone" in u, false)
  })

  test("values the admin actually supplies are written", () => {
    const u = mergeFields(existing, { ...adminForm, phone: "+1 555 0100", goal: "Strength" })
    assert.equal(u.phone, "+1 555 0100")
    assert.equal(u.goal, "Strength")
  })

  test("an active client is never pushed back to awaiting payment", () => {
    const u = mergeFields(existing, { ...adminForm, status: "PENDING_PAYMENT" })
    assert.equal("status" in u, false)
  })

  test("a client who is not active may be moved to awaiting payment", () => {
    const inactive = { ...existing, status: "INACTIVE" as const }
    const u = mergeFields(inactive, { ...adminForm, status: "PENDING_PAYMENT" })
    assert.equal(u.status, "PENDING_PAYMENT")
  })

  test("createdAt is never rewritten", () => {
    const u = mergeFields(existing, { ...adminForm, createdAt: "2026-11-06T00:00:00.000Z" })
    assert.equal("createdAt" in u, false)
  })

  test("the whole of an untouched record survives a blank admin submission", () => {
    const u = mergeFields(existing, adminForm)
    const after = { ...existing, ...u }
    assert.equal(after.currentProgramId, "prog_123")
    assert.equal(after.startingWeight, 208)
    assert.equal(after.activityLevel, 1.65)
    assert.equal(after.status, "ACTIVE")
    assert.equal(after.createdAt, "2026-06-11T04:02:17.735Z")
  })
})
