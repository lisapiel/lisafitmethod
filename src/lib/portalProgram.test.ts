import { test } from "node:test"
import assert from "node:assert/strict"
import { checkInStatus, completedFor, currentWeekIndex, exercisePreview, minutesFor, nextWorkout, weekProgress, type PortalWeek } from "./portalProgram"

const day = (dayLabel: string, n = 3) => ({ dayLabel, notes: "", exercises: Array.from({ length: n }, (_, i) => ({ name: `Ex ${i + 1}` })) })
const weeks: PortalWeek[] = [1, 2, 3].map((w) => ({ weekNumber: w, label: `Week ${w}`, days: [day("A"), day("B")] }))

test("only this program's logs count as done", () => {
  const done = completedFor("p1", [
    { programId: "p1", weekNumber: 1, dayLabel: "A", completedAt: "2026-11-01" },
    { programId: "old", weekNumber: 1, dayLabel: "B", completedAt: "2026-11-02" },
  ])
  assert.deepEqual([...done.keys()], ["1::A"])
  const n = nextWorkout(weeks, done)!
  assert.deepEqual([n.week.weekNumber, n.dayIndex], [1, 1])
})

test("the current week is the week of the next workout, or the last week when finished", () => {
  const some = completedFor("p", [1, 2].flatMap((w) => ["A", "B"].map((d) => ({ programId: "p", weekNumber: w, dayLabel: d, completedAt: "x" }))))
  assert.equal(currentWeekIndex(weeks, some), 2)
  const all = completedFor("p", [1, 2, 3].flatMap((w) => ["A", "B"].map((d) => ({ programId: "p", weekNumber: w, dayLabel: d, completedAt: "x" }))))
  assert.equal(nextWorkout(weeks, all), null)
  assert.equal(currentWeekIndex(weeks, all), 2)
  assert.deepEqual(weekProgress(weeks[0], some), { finished: 2, total: 2 })
})

test("time estimate keeps the existing rule", () => {
  assert.equal(minutesFor(day("A", 1)), 20)
  assert.equal(minutesFor(day("A", 6)), 48)
})

test("exercise preview reads naturally", () => {
  assert.equal(exercisePreview(day("A", 1)), "Ex 1")
  assert.equal(exercisePreview(day("A", 2)), "Ex 1 and Ex 2")
  assert.equal(exercisePreview(day("A", 5)), "Ex 1, Ex 2, Ex 3 and 2 more")
  assert.equal(exercisePreview({ dayLabel: "Sport", exercises: [] }), "")
})

test("check-in is due after 7 days, as before", () => {
  const now = new Date("2026-11-10T12:00:00Z").getTime()
  assert.deepEqual(checkInStatus([], now), { due: true, daysAgo: null })
  assert.deepEqual(checkInStatus(["2026-11-05T12:00:00Z"], now), { due: false, daysAgo: 5 })
  assert.deepEqual(checkInStatus(["2026-10-01T00:00:00Z", "2026-11-03T12:00:00Z"], now), { due: true, daysAgo: 7 })
})
