import { test } from "node:test"
import assert from "node:assert/strict"
import { expandedWeeks, phaseLengthFor, storedWeekCount, notesWithIntro, DEFAULT_PHASE_WEEKS } from "./programExpansion"
import { completedFor, nextWorkout, currentWeekIndex, type PortalWeek, type PortalLog } from "./portalProgram"

const oneWeek = (days: number) => JSON.stringify([{ weekNumber: 1, label: "4-Day Rotation", days: Array.from({ length: days }, (_, i) => ({ dayLabel: `Day ${i + 1}`, notes: i === 0 ? "Day one notes" : "", exercises: [{ exerciseId: `ex${i}`, name: `Exercise ${i}`, sets: "3", reps: "8-12", weight: "", rpe: "7-8" }] })) }])
const log = (programId: string, weekNumber: number, dayLabel: string, n: number): PortalLog => ({ programId, weekNumber, dayLabel, completedAt: `2026-11-${String(10 + n).padStart(2, "0")}T10:00:00Z` })

test("new and copied programs default to a 6-week phase when fewer weeks are written", () => {
  assert.equal(DEFAULT_PHASE_WEEKS, 6)
  assert.equal(phaseLengthFor(1), 6)
  assert.equal(phaseLengthFor(4), 6)
  assert.equal(phaseLengthFor(6), undefined)
  assert.equal(phaseLengthFor(8), undefined)
  assert.equal(phaseLengthFor(1, 8), 8)
  assert.equal(phaseLengthFor(8, 8), 8)
  assert.equal(phaseLengthFor(0), undefined)
  assert.equal(storedWeekCount(oneWeek(4)), 1)
})

for (const days of [3, 4, 6]) {
  test(`a ${days}-day week repeats for 6 weeks with sequential week numbers`, () => {
    const weeks = expandedWeeks({ weeks: oneWeek(days), durationWeeks: 6 }) as unknown as PortalWeek[]
    assert.equal(weeks.length, 6)
    assert.deepEqual(weeks.map((w) => w.weekNumber), [1, 2, 3, 4, 5, 6])
    assert.ok(weeks.every((w) => w.days.length === days))
    assert.deepEqual(weeks[5].days.map((d) => d.dayLabel), weeks[0].days.map((d) => d.dayLabel))
  })
}

test("finishing week 1 moves the client to week 2, day 1, not Program complete", () => {
  const weeks = expandedWeeks({ weeks: oneWeek(4), durationWeeks: 6 }) as unknown as PortalWeek[]
  const done = completedFor("p", [1, 2, 3, 4].map((d, i) => log("p", 1, `Day ${d}`, i)))
  const next = nextWorkout(weeks, done)
  assert.equal(next?.week.weekNumber, 2)
  assert.equal(next?.dayIndex, 0)
  assert.equal(currentWeekIndex(weeks, done), 1)
})

test("a one-week program with no length still ends after week 1 (why clients saw Week 1 of 1)", () => {
  const weeks = expandedWeeks({ weeks: oneWeek(4) }) as unknown as PortalWeek[]
  const done = completedFor("p", [1, 2, 3, 4].map((d, i) => log("p", 1, `Day ${d}`, i)))
  assert.equal(weeks.length, 1)
  assert.equal(nextWorkout(weeks, done), null)
})

test("completed workouts stay in their week when the phase is extended from 6 to 8 weeks", () => {
  const logs = [log("p", 1, "Day 1", 0), log("p", 1, "Day 2", 1), log("p", 2, "Day 1", 2)]
  const six = expandedWeeks({ weeks: oneWeek(4), durationWeeks: 6 }) as unknown as PortalWeek[]
  const eight = expandedWeeks({ weeks: oneWeek(4), durationWeeks: 8 }) as unknown as PortalWeek[]
  const done = completedFor("p", logs)
  assert.equal(eight.length, 8)
  assert.deepEqual(nextWorkout(six, done)?.week.weekNumber, nextWorkout(eight, done)?.week.weekNumber)
  assert.equal(nextWorkout(eight, done)?.week.weekNumber, 1)
  assert.equal(nextWorkout(eight, done)?.day.dayLabel, "Day 3")
  assert.equal(done.size, 3)
})

test("the phase ends after its last week", () => {
  const weeks = expandedWeeks({ weeks: oneWeek(3), durationWeeks: 6 }) as unknown as PortalWeek[]
  const all: PortalLog[] = []
  let n = 0
  for (const w of weeks) for (const d of w.days) all.push(log("p", w.weekNumber, d.dayLabel, n++ % 18))
  assert.equal(nextWorkout(weeks, completedFor("p", all)), null)
})

test("intentionally different weeks are kept as written", () => {
  const varied = JSON.stringify([1, 2, 3, 4, 5, 6].map((n) => ({ weekNumber: n, label: `Week ${n}`, days: [{ dayLabel: "Day 1", notes: `Week ${n} plan`, exercises: [] }] })))
  const weeks = expandedWeeks({ weeks: varied, durationWeeks: phaseLengthFor(6) })
  assert.equal(weeks.length, 6)
  assert.deepEqual(weeks.map((w) => w.days[0].notes), ["Week 1 plan", "Week 2 plan", "Week 3 plan", "Week 4 plan", "Week 5 plan", "Week 6 plan"])
})

test("logs from another program never count as done", () => {
  const weeks = expandedWeeks({ weeks: oneWeek(4), durationWeeks: 6 }) as unknown as PortalWeek[]
  const done = completedFor("p", [log("old", 1, "Day 1", 0)])
  assert.equal(nextWorkout(weeks, done)?.day.dayLabel, "Day 1")
})

test("the program introduction shows once, with Week 1, Day 1 notes only", () => {
  assert.equal(notesWithIntro("Day one notes", 1, 0, "How to progress"), "How to progress\n\nDay one notes")
  assert.equal(notesWithIntro("", 1, 0, "How to progress"), "How to progress")
  assert.equal(notesWithIntro("Day one notes", 2, 0, "How to progress"), "Day one notes")
  assert.equal(notesWithIntro("Day two notes", 1, 1, "How to progress"), "Day two notes")
  assert.equal(notesWithIntro("Day one notes", 1, 0, ""), "Day one notes")
})
