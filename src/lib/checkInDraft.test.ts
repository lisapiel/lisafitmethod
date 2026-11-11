import { test } from "node:test"
import assert from "node:assert/strict"
import {
  CHECK_IN_DRAFT_MAX_AGE_MS, checkInDraftKey, checkInStepComplete, clearCheckInDraft, clearStaleCheckInDrafts,
  decodeCheckInDraft, draftSignature, encodeCheckInDraft, loadCheckInDraft, resumeStep, sanitizeDraftAnswers,
  saveCheckInDraft, type CheckInDraftAnswers, type DraftStorage,
} from "./checkInDraft"

const SUB = "016b7530-80a1-70d0-c583-db882233b2bc"
const VIDEO = `media/coaching-form-reviews/${SUB}/abc123.mp4`

const blank: CheckInDraftAnswers = {
  weightChoice: "", weight: "", weightUnit: "LBS", measurements: [], progressPhotos: [], trainingRating: 0,
  painReported: "unset", painNotes: "", formReviewRequested: "unset", formReviews: [],
  sleepRating: 0, energyRating: 0, stressRating: 0, recoveryRating: 0,
  nutritionStatus: "", nutritionHelp: "", nutritionNote: "", hunger: "",
  weeklyWin: "", weeklyChallenge: "", adjustmentAreas: [], adjustmentNotes: "", questionForLisa: "",
}

class MemoryStorage implements DraftStorage {
  map = new Map<string, string>()
  get length() { return this.map.size }
  key(i: number) { return [...this.map.keys()][i] ?? null }
  getItem(k: string) { return this.map.get(k) ?? null }
  setItem(k: string, v: string) { this.map.set(k, v) }
  removeItem(k: string) { this.map.delete(k) }
}

const broken: DraftStorage = {
  get length(): number { throw new Error("blocked") },
  key() { throw new Error("blocked") },
  getItem() { throw new Error("blocked") },
  setItem() { throw new Error("quota") },
  removeItem() { throw new Error("blocked") },
}

test("draft keys are per client and per check-in period", () => {
  assert.equal(checkInDraftKey("", null), null)
  assert.equal(checkInDraftKey("  ", "2026-11-01T10:00:00.000Z"), null)
  const first = checkInDraftKey("Client2@Phase0.test", null)
  assert.equal(first, "lfm:check-in-draft:v1:client2%40phase0.test:first")
  assert.equal(checkInDraftKey("client2@phase0.test ", null), first)
  const next = checkInDraftKey("client2@phase0.test", "2026-11-01T10:00:00.000Z")
  assert.notEqual(next, first)
  assert.notEqual(checkInDraftKey("other@phase0.test", null), first)
})

test("a saved draft comes back with its answers, uploaded video keys and step", () => {
  const s = new MemoryStorage()
  const key = checkInDraftKey("c@x.test", null)!
  const answers: CheckInDraftAnswers = {
    ...blank, weightChoice: "new", weight: "141.2", painReported: "no", formReviewRequested: "yes",
    formReviews: [{ exercise: "Goblet Squat", note: "Depth?", videos: [{ s3Key: VIDEO, name: "squat.mov" }] }],
    nutritionNote: "Stuck to my plan on weekdays.", hunger: "some-days", adjustmentAreas: ["schedule"],
  }
  const now = new Date("2026-11-10T12:00:00Z")
  assert.equal(saveCheckInDraft(s, key, answers, 4, now), true)
  const back = loadCheckInDraft(s, key, now.getTime() + 60_000)
  assert.ok(back)
  assert.deepEqual(back.answers, answers)
  assert.equal(back.step, 4)
  assert.equal(draftSignature(back.answers), draftSignature(answers))
})

test("old, future, broken or wrong-version drafts are ignored", () => {
  const now = Date.parse("2026-11-10T12:00:00Z")
  const enc = (at: string) => encodeCheckInDraft(blank, 1, new Date(at))
  assert.equal(decodeCheckInDraft(null, now), null)
  assert.equal(decodeCheckInDraft("{not json", now), null)
  assert.equal(decodeCheckInDraft(JSON.stringify({ v: 2, savedAt: "2026-11-10T11:00:00Z", answers: blank }), now), null)
  assert.equal(decodeCheckInDraft(enc(new Date(now - CHECK_IN_DRAFT_MAX_AGE_MS - 1000).toISOString()), now), null)
  assert.equal(decodeCheckInDraft(enc("2026-11-12T12:00:00Z"), now), null)
  assert.ok(decodeCheckInDraft(enc("2026-11-09T12:00:00Z"), now))
  const s = new MemoryStorage()
  s.setItem("k", "{not json")
  assert.equal(loadCheckInDraft(s, "k", now), null)
  assert.equal(s.getItem("k"), null, "an unreadable draft is removed")
})

test("draft answers are cleaned: unknown values dropped, foreign video keys refused", () => {
  const a = sanitizeDraftAnswers({
    weightChoice: "maybe", weightUnit: "KG", trainingRating: 9, sleepRating: 3.5, painReported: "yes",
    nutritionStatus: "on-track", hunger: "starving", adjustmentAreas: ["schedule", "bogus", "schedule"],
    nutritionNote: "x".repeat(1500),
    formReviews: [{ exercise: "Row", note: 5, videos: [{ s3Key: "media/other/evil.mp4", name: "a" }, { s3Key: VIDEO }] }],
    measurements: [{ label: "Waist", value: "32", unit: "in" }, "junk"],
  })
  assert.ok(a)
  assert.equal(a.weightChoice, "")
  assert.equal(a.weightUnit, "KG")
  assert.equal(a.trainingRating, 0)
  assert.equal(a.sleepRating, 0)
  assert.equal(a.painReported, "yes")
  assert.equal(a.formReviewRequested, "unset")
  assert.equal(a.nutritionStatus, "on-track")
  assert.equal(a.hunger, "")
  assert.deepEqual(a.adjustmentAreas, ["schedule"])
  assert.equal(a.nutritionNote.length, 1000)
  assert.deepEqual(a.formReviews, [{ exercise: "Row", note: "", videos: [{ s3Key: VIDEO, name: "Video" }] }])
  assert.deepEqual(a.measurements, [{ label: "Waist", value: "32", unit: "in" }])
  assert.equal(sanitizeDraftAnswers(null), null)
  assert.equal(sanitizeDraftAnswers([1, 2]), null)
})

test("storage errors never throw", () => {
  assert.equal(saveCheckInDraft(broken, "k", blank, 1), false)
  assert.equal(loadCheckInDraft(broken, "k"), null)
  assert.doesNotThrow(() => clearCheckInDraft(broken, "k"))
  assert.equal(clearStaleCheckInDrafts(broken, "c@x.test", null), 0)
  assert.equal(saveCheckInDraft(null, "k", blank, 1), false)
  assert.equal(loadCheckInDraft(null, "k"), null)
})

test("clearing removes the draft; stale periods for the same client go, others stay", () => {
  const s = new MemoryStorage()
  const old = checkInDraftKey("c@x.test", null)!
  const cur = checkInDraftKey("c@x.test", "2026-11-03T09:00:00.000Z")!
  const otherClient = checkInDraftKey("d@x.test", null)!
  for (const k of [old, cur, otherClient, "unrelated"]) s.setItem(k, "1")
  assert.equal(clearStaleCheckInDrafts(s, "c@x.test", cur), 1)
  assert.deepEqual([...s.map.keys()].sort(), [cur, otherClient, "unrelated"].sort())
  clearCheckInDraft(s, cur)
  assert.equal(s.getItem(cur), null)
  s.setItem(cur, "1")
  assert.equal(clearStaleCheckInDrafts(s, "c@x.test", null), 1, "after a submission every draft for the client goes")
})

test("steps need their required answers, and a draft never resumes past a gap", () => {
  assert.equal(checkInStepComplete(1, blank), false)
  assert.equal(checkInStepComplete(1, { ...blank, weightChoice: "new", weight: "abc" }), false)
  assert.equal(checkInStepComplete(1, { ...blank, weightChoice: "new", weight: "140" }), true)
  assert.equal(checkInStepComplete(1, { ...blank, weightChoice: "skipped" }), true)
  assert.equal(checkInStepComplete(2, { ...blank, painReported: "no" }), false)
  assert.equal(checkInStepComplete(2, { ...blank, painReported: "no", formReviewRequested: "yes" }), true)
  assert.equal(checkInStepComplete(3, { ...blank, sleepRating: 3, energyRating: 3, stressRating: 3 }), false)
  assert.equal(checkInStepComplete(4, { ...blank, nutritionStatus: "mixed" }), true)
  assert.equal(checkInStepComplete(5, blank), true)

  const done12 = { ...blank, weightChoice: "same" as const, painReported: "no" as const, formReviewRequested: "no" as const }
  assert.equal(resumeStep(4, done12), 3)
  assert.equal(resumeStep(2, done12), 2)
  assert.equal(resumeStep(4, blank), 1)
  assert.equal(resumeStep(99, { ...done12, sleepRating: 1, energyRating: 1, stressRating: 1, recoveryRating: 1, nutritionStatus: "mixed" }), 5)
  assert.equal(resumeStep(Number.NaN, done12), 1)
})

test("the signature ignores key order", () => {
  const reordered = Object.fromEntries(Object.entries(blank).reverse()) as CheckInDraftAnswers
  assert.equal(draftSignature(reordered), draftSignature(blank))
  assert.notEqual(draftSignature({ ...blank, weeklyWin: "PR" }), draftSignature(blank))
})

test("uploaded progress photos are kept in the draft, one per pose, own prefix only", () => {
  const PHOTO = `media/coaching-progress-photos/${SUB}/p1.jpg`
  const a = sanitizeDraftAnswers({
    ...blank,
    progressPhotos: [
      { pose: "front", s3Key: PHOTO, name: "front.jpg" },
      { pose: "front", s3Key: PHOTO, name: "dupe.jpg" },
      { pose: "side", s3Key: VIDEO, name: "wrong-folder.mp4" },
      { pose: "top", s3Key: PHOTO, name: "bad-pose.jpg" },
    ],
  })
  assert.deepEqual(a?.progressPhotos, [{ pose: "front", s3Key: PHOTO, name: "front.jpg" }])
  assert.deepEqual(sanitizeDraftAnswers({ ...blank, progressPhotos: undefined })?.progressPhotos, [])
})
