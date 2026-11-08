import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { buildOverview, weekStartFor, localDate } from "./coachingOverview"

const COACH = "coach@example.test"
const isCoach = (e: string) => e === COACH
const NOW = new Date("2026-11-11T15:00:00.000Z")

const day = (dayLabel: string) => ({ dayLabel, notes: "", exercises: [] })
const program = (id: string, clientEmail: string, weeks: number, extra: Record<string, unknown> = {}) => ({
  userId: `coaching_program_${id}`, id, name: `Program ${id}`, clientEmail,
  weeks: JSON.stringify(Array.from({ length: weeks }, (_, i) => ({ weekNumber: i + 1, label: `Week ${i + 1}`, days: [day("A"), day("B")] }))),
  ...extra,
})
const client = (email: string, extra: Record<string, unknown> = {}) => ({ userId: `coaching_client_${email}`, email, displayName: email.split("@")[0], status: "ACTIVE", ...extra })
const log = (id: string, clientEmail: string, programId: string, weekNumber: number, dayLabel: string, completedAt: string) => ({ userId: `coaching_workoutlog_${id}`, id, clientEmail, programId, weekNumber, dayLabel, completedAt })
const msg = (id: string, threadId: string, fromEmail: string, toEmail: string, sentAt: string, body = "hello", readAt?: string) => ({ userId: `coaching_msg_${threadId}_${sentAt}_${id}`, id, threadId, fromEmail, toEmail, sentAt, body, ...(readAt ? { readAt } : {}) })

describe("week boundaries", () => {
  test("the coaching week starts Monday midnight in the coach's time zone", () => {
    assert.equal(weekStartFor(NOW).toISOString(), "2026-11-09T05:00:00.000Z")
    assert.equal(weekStartFor(new Date("2026-11-09T04:59:00.000Z")).toISOString(), "2026-11-02T05:00:00.000Z")
    assert.equal(weekStartFor(new Date("2026-11-15T23:00:00.000Z")).toISOString(), "2026-11-09T05:00:00.000Z")
  })
  test("local dates follow the coach's time zone, not UTC", () => {
    assert.equal(localDate(new Date("2026-11-11T03:00:00.000Z")), "2026-11-10")
  })
})

describe("client summaries", () => {
  test("program week is the first week with an unfinished day, counting only this program's logs", () => {
    const o = buildOverview([
      client("a@x.test", { currentProgramId: "p1" }),
      program("p1", "a@x.test", 4),
      log("1", "a@x.test", "p1", 1, "A", "2026-11-02T12:00:00Z"),
      log("2", "a@x.test", "p1", 1, "B", "2026-11-04T12:00:00Z"),
      log("3", "a@x.test", "p1", 2, "A", "2026-11-10T12:00:00Z"),
      log("4", "a@x.test", "old", 2, "B", "2026-11-10T13:00:00Z"),
    ], { now: NOW, isCoach })
    const p = o.clients[0].program!
    assert.deepEqual([p.currentWeek, p.totalWeeks, p.doneThisWeek, p.daysThisWeek, p.finished], [2, 4, 1, 2, false])
    assert.equal(o.clients[0].training.workoutsThisWeek, 2)
    assert.equal(o.clients[0].training.lastWorkoutAt, "2026-11-10T13:00:00Z")
  })

  test("rotation programs count the expanded weeks", () => {
    const o = buildOverview([client("a@x.test", { currentProgramId: "p1" }), program("p1", "a@x.test", 1, { durationWeeks: 6 })], { now: NOW, isCoach })
    assert.equal(o.clients[0].program!.totalWeeks, 6)
  })

  test("a malformed program does not break the dashboard", () => {
    const o = buildOverview([client("a@x.test", { currentProgramId: "p1" }), { userId: "coaching_program_p1", id: "p1", name: "Broken", weeks: "{not json" }], { now: NOW, isCoach })
    assert.equal(o.clients[0].program!.totalWeeks, 0)
  })

  test("check-in state reflects this week only", () => {
    const items = [
      client("a@x.test"), client("b@x.test"), client("c@x.test"),
      { userId: "coaching_checkin_1", id: "1", clientEmail: "a@x.test", submittedAt: "2026-11-10T12:00:00Z", status: "PENDING" },
      { userId: "coaching_checkin_2", id: "2", clientEmail: "b@x.test", submittedAt: "2026-11-09T12:00:00Z", status: "REVIEWED" },
      { userId: "coaching_checkin_3", id: "3", clientEmail: "c@x.test", submittedAt: "2026-11-05T12:00:00Z", status: "REVIEWED" },
    ]
    const o = buildOverview(items, { now: NOW, isCoach })
    assert.deepEqual(o.clients.map((c) => c.checkIn.state), ["pending", "reviewed", "not-yet"])
    assert.equal(o.counts.pendingCheckIns, 1)
  })

  test("nutrition counts distinct logged days in the last seven", () => {
    const n = (id: string, date: string) => ({ userId: `nutrition_log_${id}`, id, clientEmail: "a@x.test", date })
    const o = buildOverview([client("a@x.test"), n("1", "2026-11-11"), n("2", "2026-11-11"), n("3", "2026-11-06"), n("4", "2026-11-04")], { now: NOW, isCoach })
    assert.deepEqual(o.clients[0].nutrition, { lastLogDate: "2026-11-11", daysLoggedLast7: 2 })
  })

  test("emails are matched case-insensitively across record types", () => {
    const o = buildOverview([client("Mixed@X.test"), log("1", "mixed@x.test", "p", 1, "A", "2026-11-10T00:00:00Z")], { now: NOW, isCoach })
    assert.equal(o.clients[0].training.workoutsThisWeek, 1)
  })
})

describe("messages", () => {
  test("a thread needs a reply when the client spoke last, even if already read", () => {
    const o = buildOverview([
      client("a@x.test"), client("b@x.test"),
      msg("1", "t1", "a@x.test", COACH, "2026-11-10T10:00:00Z", "first", "2026-11-10T11:00:00Z"),
      msg("2", "t2", "b@x.test", COACH, "2026-11-10T09:00:00Z"),
      msg("3", "t2", COACH, "b@x.test", "2026-11-10T12:00:00Z"),
    ], { now: NOW, isCoach })
    const a = o.clients.find((c) => c.email === "a@x.test")!
    const b = o.clients.find((c) => c.email === "b@x.test")!
    assert.deepEqual([a.messages.needsReply, a.messages.unread], [true, 0])
    assert.deepEqual([b.messages.needsReply, b.messages.unread], [false, 1])
    assert.equal(o.counts.needsReply, 1)
  })

  test("long previews are trimmed and nutrition shares get a readable label", () => {
    const o = buildOverview([
      client("a@x.test"), client("b@x.test"),
      msg("1", "t1", "a@x.test", COACH, "2026-11-10T10:00:00Z", "word ".repeat(80)),
      { ...msg("2", "t2", "b@x.test", COACH, "2026-11-10T10:00:00Z", "{}"), kind: "nutrition-day" },
    ], { now: NOW, isCoach })
    assert.ok(o.threads.find((t) => t.threadId === "t1")!.lastMessage.length <= 120)
    assert.equal(o.threads.find((t) => t.threadId === "t2")!.lastMessage, "Shared a day of eating")
  })
})

describe("attention list", () => {
  test("pain reports come first; inactive and payment items come last", () => {
    const o = buildOverview([
      client("pain@x.test", { currentProgramId: "p1" }), program("p1", "pain@x.test", 4),
      log("1", "pain@x.test", "p1", 1, "A", "2026-11-10T00:00:00Z"),
      { userId: "coaching_checkin_9", id: "9", clientEmail: "pain@x.test", submittedAt: "2026-11-10T12:00:00Z", status: "PENDING", painReported: true },
      client("idle@x.test", { currentProgramId: "p2" }), program("p2", "idle@x.test", 4),
      log("2", "idle@x.test", "p2", 1, "A", "2026-10-20T00:00:00Z"),
      client("pay@x.test", { status: "PENDING_PAYMENT" }),
      client("msg@x.test", { currentProgramId: "p3" }), program("p3", "msg@x.test", 4),
      log("3", "msg@x.test", "p3", 1, "A", "2026-11-10T00:00:00Z"),
      msg("1", "t1", "msg@x.test", COACH, "2026-11-10T10:00:00Z"),
    ], { now: NOW, isCoach })
    assert.deepEqual(o.attention.map((a) => a.kind), ["pain", "reply", "inactive", "payment"])
    assert.equal(o.attention[0].href, "/admin/coaching/check-ins/9")
  })

  test("idle threshold: ten days is fine, eleven is flagged", () => {
    const mk = (days: number) => buildOverview([
      client("a@x.test", { currentProgramId: "p1" }), program("p1", "a@x.test", 4),
      log("1", "a@x.test", "p1", 1, "A", new Date(NOW.getTime() - days * 86_400_000).toISOString()),
    ], { now: NOW, isCoach }).attention.filter((a) => a.kind === "inactive").length
    assert.equal(mk(10), 0)
    assert.equal(mk(11), 1)
  })

  test("paused clients and clients without a program are handled separately", () => {
    const o = buildOverview([client("p@x.test", { status: "PAUSED" }), client("n@x.test")], { now: NOW, isCoach })
    assert.deepEqual(o.attention.map((a) => [a.kind, a.clientEmail]), [["no-program", "n@x.test"]])
  })

  test("final week of a program prompts planning the next block", () => {
    const o = buildOverview([
      client("a@x.test", { currentProgramId: "p1" }), program("p1", "a@x.test", 2),
      log("1", "a@x.test", "p1", 1, "A", "2026-11-03T00:00:00Z"), log("2", "a@x.test", "p1", 1, "B", "2026-11-05T00:00:00Z"),
      log("3", "a@x.test", "p1", 2, "A", "2026-11-10T00:00:00Z"),
    ], { now: NOW, isCoach })
    assert.ok(o.attention.some((a) => a.kind === "program-ending"))
  })

  test("only tasks due today or overdue appear, completed tasks never", () => {
    const t = (id: string, dueDate: string, completedAt?: string) => ({ userId: `coaching_task_${id}`, id, title: `Task ${id}`, dueDate, ...(completedAt ? { completedAt } : {}) })
    const o = buildOverview([t("1", "2026-11-11"), t("2", "2026-11-01"), t("3", "2026-11-20"), t("4", "2026-11-01", "2026-11-02")], { now: NOW, isCoach })
    assert.deepEqual(o.attention.map((a) => a.id).sort(), ["task-1", "task-2"])
    assert.equal(o.counts.openTasks, 3)
  })

  test("pending applications and messages from people who are not clients are surfaced", () => {
    const o = buildOverview([
      { userId: "coaching_app_1", id: "1", name: "Applicant", email: "new@x.test", status: "PENDING", applicationDate: "2026-11-10" },
      { userId: "coaching_app_2", id: "2", name: "Done", email: "d@x.test", status: "APPROVED" },
      msg("1", "t9", "stranger@x.test", COACH, "2026-11-10T10:00:00Z"),
    ], { now: NOW, isCoach })
    assert.deepEqual(o.attention.map((a) => a.kind).sort(), ["application", "reply"])
  })
})
