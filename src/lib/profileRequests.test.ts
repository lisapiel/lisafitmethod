import { test } from "node:test"
import assert from "node:assert/strict"
import {
  buildProfileRequest, decideProfileRequest, goalFromApplication, isCurrentActivityLevel, ownRequests,
  planSetupProfile, previewRequest, toClientProfileRequest, validateProfileRequest, type ProfileChangeRequest,
} from "./profileRequests"

// Expected numbers worked out by hand from Mifflin-St Jeor (see startingWeight.test.ts):
// female, 35, 64 in, 128 lb: BMR 1260.6.
//   1.42, fat loss:    1790.1 x 0.85 = 1521.5 -> 1520 kcal, P 104.5 -> 105, F 456 / 9 = 50.7 -> 50, C (1520 - 420 - 450) / 4 = 162.5 -> 165
//   1.30, maintain:    1638.8 x 1.00 -> 1640 kcal, P 58.06 x 1.6 = 92.9 -> 95, F 492 / 9 = 54.7 -> 55, C (1640 - 380 - 495) / 4 = 191.25 -> 190
//   1.42, muscle gain: 1790.1 x 1.08 = 1933.3 -> 1930 kcal, P 105, F 579 / 9 = 64.3 -> 65, C (1930 - 420 - 585) / 4 = 231.25 -> 230
const NOW_FAT_LOSS = { calories: 1520, protein: 105, carbs: 165, fat: 50 }
const MAINTAIN_LIGHT = { calories: 1640, protein: 95, carbs: 190, fat: 55 }
const MUSCLE_GAIN = { calories: 1930, protein: 105, carbs: 230, fat: 65 }

const client = { email: "c@example.com", sex: "female" as const, age: 35, heightInches: 64, activityLevel: 1.42, nutritionGoal: "fat-loss" as const, startingWeight: 128 }
const custom = { ...client, customMacros: { calories: 1800, protein: 130, carbs: 180, fat: 60, updatedAt: "2026-11-01T00:00:00Z" } }
const NOW = new Date("2026-11-09T12:00:00Z")

function pending(over: Partial<ProfileChangeRequest> = {}): ProfileChangeRequest {
  return { id: "r1", clientEmail: "c@example.com", requested: { activityLevel: 1.30, nutritionGoal: "maintain" }, current: { activityLevel: 1.42, nutritionGoal: "fat-loss" }, reason: "Desk job", status: "pending", createdAt: "2026-11-08T10:00:00Z", ...over }
}

test("only the five current activity values are accepted", () => {
  for (const v of [1.2, 1.3, 1.42, 1.55, 1.7]) assert.equal(isCurrentActivityLevel(v), true, String(v))
  for (const v of [1.35, 1.375, 1.5, 1.65, 1.725, 1.8, 1.9, 0, 2, NaN]) assert.equal(isCurrentActivityLevel(v), false, String(v))
  assert.equal(isCurrentActivityLevel("1.42"), false)
  assert.equal(isCurrentActivityLevel(undefined), false)
})

test("a new setup save needs a current activity value and a goal", () => {
  assert.deepEqual(planSetupProfile(null, { nutritionGoal: "fat-loss" }), { ok: false, status: 400, error: "Choose the option that matches a normal week." })
  assert.equal(planSetupProfile(null, { activityLevel: 1.35, nutritionGoal: "fat-loss" }).ok, false, "the old 1.35 default is refused")
  assert.equal(planSetupProfile(null, { activityLevel: 1.42 }).ok, false)
  assert.equal(planSetupProfile(null, { activityLevel: 1.42, nutritionGoal: "bulk" }).ok, false)
  assert.deepEqual(planSetupProfile(null, { activityLevel: 1.42, nutritionGoal: "recomp" }), { ok: true, updates: { activityLevel: 1.42, nutritionGoal: "recomp" } })
  assert.equal(planSetupProfile({ nutritionGoal: "fat-loss" }, { activityLevel: 1.3, nutritionGoal: "fat-loss" }).ok, true, "a half-finished profile can still be completed")
})

test("after setup, the setup save can't change goal or activity", () => {
  const done = { nutritionGoal: "fat-loss" as const, activityLevel: 1.42 }
  assert.deepEqual(planSetupProfile(done, {}), { ok: true, updates: {} })
  assert.deepEqual(planSetupProfile(done, { nutritionGoal: "fat-loss", activityLevel: 1.42 }), { ok: true, updates: {} })
  const r1 = planSetupProfile(done, { nutritionGoal: "muscle-gain" })
  assert.equal(r1.ok, false)
  assert.equal(!r1.ok && r1.status, 409)
  assert.equal(planSetupProfile(done, { activityLevel: 1.7 }).ok, false)
})

test("a legacy stored activity value still reads and isn't treated as a change", () => {
  const legacy = { nutritionGoal: "fat-loss" as const, activityLevel: 1.35 }
  assert.deepEqual(planSetupProfile(legacy, { activityLevel: 1.3 }), { ok: true, updates: {} })
  assert.deepEqual(planSetupProfile(legacy, {}), { ok: true, updates: {} })
  assert.equal(planSetupProfile(legacy, { activityLevel: 1.42 }).ok, false)
})

test("the application goal maps only when it says the same thing", () => {
  assert.equal(goalFromApplication("Lose fat"), "fat-loss")
  assert.equal(goalFromApplication("Build muscle"), "muscle-gain")
  assert.equal(goalFromApplication("Body recomposition"), "recomp")
  assert.equal(goalFromApplication(" body recomposition "), "recomp")
  for (const g of ["Build strength", "Improve mobility / movement", "General fitness & health", "Other", "", undefined, null]) {
    assert.equal(goalFromApplication(g), null, String(g))
  }
})

test("a request needs a finished setup, a real change and a short reason", () => {
  assert.equal(validateProfileRequest(null, [], { nutritionGoal: "maintain", reason: "x" }).ok, false)
  assert.equal(validateProfileRequest({ nutritionGoal: "fat-loss" }, [], { nutritionGoal: "maintain", reason: "x" }).ok, false)
  assert.equal(validateProfileRequest(client, [], { reason: "Desk job" }).ok, false, "nothing chosen")
  assert.equal(validateProfileRequest(client, [], { nutritionGoal: "fat-loss", activityLevel: 1.42, reason: "Same" }).ok, false, "same as now")
  assert.equal(validateProfileRequest(client, [], { activityLevel: 1.35, reason: "Old value" }).ok, false)
  assert.equal(validateProfileRequest(client, [], { nutritionGoal: "bulk", reason: "x" }).ok, false)
  assert.equal(validateProfileRequest(client, [], { nutritionGoal: "maintain", reason: "   " }).ok, false)
  assert.equal(validateProfileRequest(client, [], { nutritionGoal: "maintain", reason: "x".repeat(301) }).ok, false)
  const ok = validateProfileRequest(client, [], { nutritionGoal: "maintain", activityLevel: 1.42, reason: "  x".padEnd(300, "y") })
  assert.ok(ok.ok)
  assert.deepEqual(ok.ok && ok.requested, { nutritionGoal: "maintain" }, "an unchanged field isn't requested")
})

test("only one pending request at a time; a decided one doesn't block a new one", () => {
  const blocked = validateProfileRequest(client, [{ status: "pending" }], { nutritionGoal: "maintain", reason: "Again" })
  assert.equal(blocked.ok, false)
  assert.equal(!blocked.ok && blocked.status, 409)
  assert.equal(validateProfileRequest(client, [{ status: "approved" }, { status: "declined" }], { nutritionGoal: "maintain", reason: "Again" }).ok, true)
})

test("a new request records the current values and starts pending", () => {
  const r = buildProfileRequest(client, { requested: { activityLevel: 1.3 }, reason: "Desk job" }, "abc", NOW)
  assert.deepEqual(r, { id: "abc", clientEmail: "c@example.com", requested: { activityLevel: 1.3 }, current: { activityLevel: 1.42 }, reason: "Desk job", status: "pending", createdAt: NOW.toISOString() })
})

test("approving changes only goal and activity, and records the estimate before and after", () => {
  const d = decideProfileRequest(pending(), client, { action: "approve" }, "Coach@Example.com", NOW)
  assert.ok(d.ok)
  if (!d.ok) return
  assert.deepEqual(d.clientUpdates, { activityLevel: 1.3, nutritionGoal: "maintain" })
  assert.deepEqual(Object.keys(d.clientUpdates).sort(), ["activityLevel", "nutritionGoal"])
  assert.equal(d.request.status, "approved")
  assert.equal(d.request.decidedBy, "coach@example.com")
  assert.equal(d.request.targetSetByCoach, false)
  assert.deepEqual(d.request.automaticEstimate, { previous: NOW_FAT_LOSS, next: MAINTAIN_LIGHT })
})

test("approving for a client with a coach-set target never touches it", () => {
  const d = decideProfileRequest(pending({ requested: { nutritionGoal: "muscle-gain" } }), custom, { action: "approve" }, "coach@example.com", NOW)
  assert.ok(d.ok)
  if (!d.ok) return
  assert.deepEqual(d.clientUpdates, { nutritionGoal: "muscle-gain" })
  assert.equal("customMacros" in d.clientUpdates, false)
  assert.equal(d.request.targetSetByCoach, true)
  assert.equal(d.request.automaticEstimate, undefined)
  const p = previewRequest(custom, { nutritionGoal: "muscle-gain" })
  assert.equal(p.targetSetByCoach, true)
  assert.deepEqual(p.next, MUSCLE_GAIN, "the estimate is still shown for reference")
})

test("declining changes nothing on the client and keeps the note", () => {
  const d = decideProfileRequest(pending(), client, { action: "decline", note: "  Let's keep it for 4 weeks  " }, "coach@example.com", NOW)
  assert.ok(d.ok)
  assert.deepEqual(d.ok && d.clientUpdates, {})
  assert.equal(d.ok && d.request.status, "declined")
  assert.equal(d.ok && d.request.coachNote, "Let's keep it for 4 weeks")
  const noNote = decideProfileRequest(pending(), client, { action: "decline" }, "coach@example.com", NOW)
  assert.equal(noNote.ok && "coachNote" in noNote.request, false)
})

test("a decided request can't be decided again; bad input is refused", () => {
  assert.equal(decideProfileRequest(pending({ status: "approved" }), client, { action: "approve" }, "c", NOW).ok, false)
  assert.equal(decideProfileRequest(pending({ status: "declined" }), client, { action: "decline" }, "c", NOW).ok, false)
  assert.equal(decideProfileRequest(null, client, { action: "approve" }, "c", NOW).ok, false)
  assert.equal(decideProfileRequest(pending(), null, { action: "approve" }, "c", NOW).ok, false)
  assert.equal(decideProfileRequest(pending(), client, { action: "maybe" }, "c", NOW).ok, false)
  assert.equal(decideProfileRequest(pending(), client, { action: "decline", note: "x".repeat(501) }, "c", NOW).ok, false)
})

test("a client only sees their own requests", () => {
  const all = [pending({ id: "a", clientEmail: "c@example.com" }), pending({ id: "b", clientEmail: "other@example.com" }), pending({ id: "c", clientEmail: "C@Example.com" })]
  assert.deepEqual(ownRequests(all, "c@example.com").map((r) => r.id), ["a", "c"])
  assert.deepEqual(ownRequests(all, " C@EXAMPLE.COM ").map((r) => r.id), ["a", "c"])
  assert.deepEqual(ownRequests(all, "nobody@example.com"), [])
})

test("the client view leaves out coach identity, estimates and notes on approved requests", () => {
  const approved = pending({ status: "approved", decidedAt: "2026-11-09T12:00:00Z", decidedBy: "coach@example.com", coachNote: "internal", targetSetByCoach: false, automaticEstimate: { previous: NOW_FAT_LOSS, next: MAINTAIN_LIGHT } })
  const v = toClientProfileRequest(approved)
  assert.deepEqual(Object.keys(v).sort(), ["createdAt", "current", "decidedAt", "id", "reason", "requested", "status"])
  const declined = toClientProfileRequest(pending({ status: "declined", decidedAt: "2026-11-09T12:00:00Z", decidedBy: "coach@example.com", coachNote: "Not yet" }))
  assert.equal(declined.coachNote, "Not yet")
  assert.equal("decidedBy" in declined, false)
})
