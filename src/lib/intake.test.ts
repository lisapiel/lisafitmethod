import { test } from "node:test"
import assert from "node:assert/strict"
import { buildIntakeSummary, isStrengthConfidence, pickApplicationFor, strengthConfidenceLabel } from "./intake"

type App = { id: string; email: string; ownerEmail?: string; status: "PENDING" | "APPROVED" | "DECLINED" | "PAID"; applicationDate: string }

test("strength confidence accepts only the three answers", () => {
  for (const v of ["learning", "regular", "confident"]) assert.equal(isStrengthConfidence(v), true)
  for (const v of ["", "expert", undefined, null, 1]) assert.equal(isStrengthConfidence(v), false)
  assert.equal(strengthConfidenceLabel("regular"), "I know them and train them regularly.")
})

test("the client's application is the one they own, then the one sent from their address", () => {
  const apps: App[] = [
    { id: "old", email: "c@example.com", status: "DECLINED", applicationDate: "2026-01-01" },
    { id: "paid", email: "c@example.com", status: "PAID", applicationDate: "2026-02-01" },
    { id: "elsewhere", email: "c@example.com", ownerEmail: "someone@example.com", status: "PAID", applicationDate: "2026-03-01" },
    { id: "linked", email: "alias@example.com", ownerEmail: "main@example.com", status: "PAID", applicationDate: "2026-02-15" },
  ]
  assert.equal(pickApplicationFor(apps, "C@example.com")?.id, "paid")
  assert.equal(pickApplicationFor(apps, "main@example.com")?.id, "linked")
  assert.equal(pickApplicationFor(apps, "alias@example.com"), null, "an application linked to another account isn't theirs")
  assert.equal(pickApplicationFor(apps, "nobody@example.com"), null)
})

test("the intake summary shows Not asked for older applications", () => {
  const s = buildIntakeSummary({ id: "a", trainingExperience: "1–2 years", daysPerWeek: "3", sessionDuration: "45 min", equipment: "Other / limited setup", equipmentDetails: "Dumbbells to 25 lb", injuries: "Old knee injury", primaryGoal: "Lose fat" }, { nutritionGoal: "recomp" })
  assert.equal(s.strengthConfidence, "Not asked")
  assert.equal(s.trainingHistory, "1–2 years")
  assert.equal(s.equipment, "Other / limited setup. Dumbbells to 25 lb")
  assert.equal(s.applicationGoal, "Lose fat")
  assert.equal(s.nutritionGoal, "Body Recomposition")
})

test("the intake summary uses the answer when there is one", () => {
  const s = buildIntakeSummary({ id: "a", strengthConfidence: "confident", primaryGoal: "Other", primaryGoalOther: "Hike a 14er" }, null)
  assert.equal(s.strengthConfidence, "I'm confident with them and follow a progressive training plan.")
  assert.equal(s.applicationGoal, "Other: Hike a 14er")
  assert.equal(s.nutritionGoal, null)
  assert.equal(s.injuries, null)
})
