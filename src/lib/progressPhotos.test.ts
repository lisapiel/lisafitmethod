import { test } from "node:test"
import assert from "node:assert/strict"
import { decodeProgressPhotos, parseProgressPhotosInput, phaseProgress, photoMilestone, type PhaseProgress } from "./progressPhotos"
import { planClientUpload } from "./mediaKeys"

const ME = "016b7530-80a1-70d0-c583-db882233b2bc"
const OTHER = "a1b2c3d4-0000-4000-8000-000000000001"
const mine = (n: string) => `media/coaching-progress-photos/${ME}/${n}.jpg`

test("upload keys for progress photos land in the client's own private folder", () => {
  const plan = planClientUpload({ kind: "progress-photo", ext: "jpg", contentType: "image/jpeg", size: 4_000_000 }, ME, 1, "z")
  assert.deepEqual(plan, { key: `media/coaching-progress-photos/${ME}/1-z.jpg`, contentType: "image/jpeg", size: 4_000_000 })
  const big = planClientUpload({ kind: "progress-photo", ext: "jpg", contentType: "image/jpeg", size: 15 * 1024 * 1024 + 1 }, ME)
  assert.ok("error" in big && big.status === 413 && big.error.includes("15 MB"))
  const video = planClientUpload({ kind: "progress-photo", ext: "mp4", contentType: "video/mp4", size: 10 }, ME)
  assert.ok("error" in video && video.status === 400)
})

test("photos must be the caller's own progress photos, one per pose", () => {
  const ok = parseProgressPhotosInput([{ pose: "back", key: mine("b") }, { pose: "front", key: mine("f") }], ME)
  assert.deepEqual(ok, { ok: true, value: [{ pose: "front", key: mine("f") }, { pose: "back", key: mine("b") }] })
  assert.deepEqual(parseProgressPhotosInput(undefined, ME), { ok: true, value: [] })
  assert.deepEqual(parseProgressPhotosInput([], ME), { ok: true, value: [] })
})

test("another client's photo, other folders and odd input are refused", () => {
  const bad = [
    [{ pose: "front", key: `media/coaching-progress-photos/${OTHER}/x.jpg` }],
    [{ pose: "front", key: `media/coaching-form-reviews/${ME}/x.jpg` }],
    [{ pose: "front", key: `media/nutrition-messages/${ME}/x.jpg` }],
    [{ pose: "front", key: `media/photos/x.jpg` }],
    [{ pose: "front", key: `media/coaching-progress-photos/${ME}/../${OTHER}/x.jpg` }],
    [{ pose: "front", key: `media/coaching-progress-photos/${ME}/a/x.jpg` }],
    [{ pose: "front", key: mine("a") }, { pose: "front", key: mine("b") }],
    [{ pose: "top", key: mine("a") }],
    [{ pose: "front", key: mine("a") }, { pose: "side", key: mine("b") }, { pose: "back", key: mine("c") }, { pose: "back", key: mine("d") }],
    "media/coaching-progress-photos/x",
    [null],
  ]
  for (const b of bad) assert.equal(parseProgressPhotosInput(b, ME).ok, false, JSON.stringify(b))
})

test("stored photos decode safely", () => {
  assert.deepEqual(decodeProgressPhotos(JSON.stringify([{ pose: "side", key: mine("s") }, { pose: "front", key: mine("f") }])), [
    { pose: "front", key: mine("f") }, { pose: "side", key: mine("s") },
  ])
  assert.deepEqual(decodeProgressPhotos("not json"), [])
  assert.deepEqual(decodeProgressPhotos(undefined), [])
  assert.deepEqual(decodeProgressPhotos(JSON.stringify([{ pose: "front", key: "media/photos/public.jpg" }])), [])
})

// A 6-week program written as one week of three days, repeated.
const program = (createdAt = "2026-11-01T00:00:00.000Z", durationWeeks = 6) => ({
  id: "p1", createdAt, durationWeeks,
  weeks: JSON.stringify([{ weekNumber: 1, label: "Week 1", days: [{ dayLabel: "A", exercises: [] }, { dayLabel: "B", exercises: [] }, { dayLabel: "C", exercises: [] }] }]),
})
const logsThrough = (weeks: number, extraDays = 0) => {
  const out = []
  for (let w = 1; w <= weeks; w++) for (const d of ["A", "B", "C"]) out.push({ programId: "p1", weekNumber: w, dayLabel: d, completedAt: "2026-11-02" })
  for (const d of ["A", "B", "C"].slice(0, extraDays)) out.push({ programId: "p1", weekNumber: weeks + 1, dayLabel: d, completedAt: "2026-11-02" })
  return out
}

test("phase progress follows logged workouts, not the calendar", () => {
  assert.deepEqual(phaseProgress(program(), []), { programId: "p1", programCreatedAt: "2026-11-01T00:00:00.000Z", week: 1, weeks: 6, allDone: false })
  assert.equal(phaseProgress(program(), logsThrough(2, 1))?.week, 3)
  assert.deepEqual(phaseProgress(program(), logsThrough(6))?.allDone, true)
  assert.equal(phaseProgress(program("x", 8), logsThrough(7))?.weeks, 8)
  assert.equal(phaseProgress(null, []), null)
})

const at = (week: number, weeks = 6, allDone = false): PhaseProgress => ({ programId: "p1", programCreatedAt: "2026-11-01T00:00:00.000Z", week, weeks, allDone })

test("starting prompt: first check-in of the phase, in week 1 or 2 only", () => {
  assert.equal(photoMilestone(at(1), []), "start")
  assert.equal(photoMilestone(at(2), [{ submittedAt: "2026-10-20T00:00:00.000Z", phaseProgramId: "old" }]), "start")
  assert.equal(photoMilestone(at(3), []), null, "already partway through")
})

test("starting prompt never repeats once the phase has a check-in", () => {
  assert.equal(photoMilestone(at(2), [{ submittedAt: "2026-11-05T00:00:00.000Z", phaseProgramId: "p1", phaseWeek: 1, phaseWeeks: 6 }]), null)
  assert.equal(photoMilestone(at(1), [{ submittedAt: "2026-11-03T00:00:00.000Z" }]), null, "check-in sent after assignment, before phases were recorded")
})

test("final prompt: the actual last week of the phase, once", () => {
  assert.equal(photoMilestone(at(5), [{ submittedAt: "2026-11-05T00:00:00.000Z", phaseProgramId: "p1", phaseWeek: 1, phaseWeeks: 6 }]), null)
  assert.equal(photoMilestone(at(6), [{ submittedAt: "2026-11-05T00:00:00.000Z", phaseProgramId: "p1", phaseWeek: 5, phaseWeeks: 6 }]), "final")
  assert.equal(photoMilestone(at(6, 6, true), []), "final")
  assert.equal(photoMilestone(at(8, 8), [{ submittedAt: "2026-12-01T00:00:00.000Z", phaseProgramId: "p1", phaseWeek: 6, phaseWeeks: 6 }]), "final", "phase extended from 6 to 8 weeks")
  assert.equal(photoMilestone(at(6, 6, true), [{ submittedAt: "2026-12-10T00:00:00.000Z", phaseProgramId: "p1", phaseWeek: 6, phaseWeeks: 6 }]), null, "final already sent")
  assert.equal(photoMilestone(null, []), null)
})
