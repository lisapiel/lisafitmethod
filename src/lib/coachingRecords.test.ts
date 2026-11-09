import { test } from "node:test"
import assert from "node:assert/strict"
import { assessmentEmailHtml, assessmentPlainText, toClientAssessment, type AssessmentRecord } from "./coachingRecords"

const base: AssessmentRecord = {
  checkInId: "c1", clientEmail: "c@example.com", status: "sent", version: 2, createdAt: "2026-11-09T10:00:00Z", updatedAt: "2026-11-09T11:00:00Z", sentAt: "2026-11-09T11:00:00Z",
  wentWell: "Three workouts.", toImprove: "Protein.", changes: "Nothing yet.", priorities: ["Protein at every meal", "Log 5 days"],
  privateNote: "PRIVATE-NOTE-xyz consider 2,200", priorityChecks: { "0": "2026-11-10T09:00:00Z" },
}

test("clients never receive the private note or internal fields", () => {
  const c = toClientAssessment(base)!
  const json = JSON.stringify(c)
  assert.ok(!json.includes("PRIVATE-NOTE"))
  assert.deepEqual(Object.keys(c).sort(), ["changes", "checkInId", "priorities", "priorityChecks", "sentAt", "toImprove", "version", "wentWell"])
})

test("drafts are invisible to clients", () => {
  assert.equal(toClientAssessment({ ...base, status: "draft", sentAt: undefined }), null)
})

test("the email and the plain-text copy are built from shared parts only", () => {
  const shared = { wentWell: base.wentWell, toImprove: base.toImprove, changes: base.changes, priorities: base.priorities }
  const html = assessmentEmailHtml(shared, "Marco", "https://lisafitmethod.com/my-coaching")
  assert.ok(html.includes("Three workouts.") && html.includes("Protein at every meal") && html.includes("Hi Marco"))
  assert.ok(!html.includes("PRIVATE-NOTE") && !assessmentPlainText(shared).includes("PRIVATE-NOTE"))
})

test("email text is escaped", () => {
  const html = assessmentEmailHtml({ wentWell: "<script>x</script>", toImprove: "", changes: "", priorities: [] }, "A&B", "https://x")
  assert.ok(!html.includes("<script>") && html.includes("&lt;script&gt;") && html.includes("A&amp;B"))
})

import { shouldEmailAssessment } from "./coachingRecords"

test("assessment emails go out at most once per version", () => {
  assert.equal(shouldEmailAssessment({ emailRequested: true, version: 1 }, false), true)
  assert.equal(shouldEmailAssessment({ emailRequested: false, version: 1 }, false), false)
  assert.equal(shouldEmailAssessment({ emailRequested: true, emailedVersion: 1, version: 1 }, false), false)
  assert.equal(shouldEmailAssessment({ emailRequested: true, emailedVersion: 1, version: 2 }, false), false)
  assert.equal(shouldEmailAssessment({ emailRequested: true, emailedVersion: 1, version: 2 }, true), true)
  assert.equal(shouldEmailAssessment({ emailRequested: true, emailedVersion: 2, version: 2 }, true), false)
})
