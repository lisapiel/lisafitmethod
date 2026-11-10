import { expandedWeeks } from "@/lib/programExpansion"

export const COACH_TIME_ZONE = "America/New_York"
export const INACTIVE_AFTER_DAYS = 10

type Raw = Record<string, unknown>

export type ClientStatus = "PENDING_PAYMENT" | "ACTIVE" | "PAUSED" | "INACTIVE"

export type CheckInWeekState = "reviewed" | "pending" | "not-yet"

export type ClientSummary = {
  email: string
  displayName: string
  status: ClientStatus
  startDate: string | null
  goal: string | null
  program: {
    id: string
    name: string
    currentWeek: number
    totalWeeks: number
    daysThisWeek: number
    doneThisWeek: number
    finished: boolean
  } | null
  training: { lastWorkoutAt: string | null; daysSinceWorkout: number | null; workoutsThisWeek: number }
  nutrition: { lastLogDate: string | null; daysLoggedLast7: number }
  checkIn: { state: CheckInWeekState; lastSubmittedAt: string | null; pendingId: string | null; painReported: boolean; formReviewRequested: boolean }
  messages: { threadId: string | null; unread: number; needsReply: boolean; lastAt: string | null; preview: string | null }
  openTasks: number
}

export type AttentionKind =
  | "pain" | "reply" | "check-in" | "application" | "task" | "no-program" | "program-ending" | "inactive" | "payment" | "profile-request"

export type AttentionItem = {
  id: string
  kind: AttentionKind
  urgency: 1 | 2 | 3
  title: string
  detail: string
  href: string
  clientEmail: string | null
  clientName: string | null
  at: string | null
}

export type ThreadSummary = {
  threadId: string
  clientEmail: string
  clientName: string
  lastMessage: string
  lastAt: string
  lastFromClient: boolean
  unreadCount: number
}

export type CoachingOverview = {
  generatedAt: string
  weekStart: string
  clients: ClientSummary[]
  attention: AttentionItem[]
  threads: ThreadSummary[]
  counts: { active: number; paused: number; awaitingPayment: number; inactive: number; unread: number; needsReply: number; pendingCheckIns: number; pendingApplications: number; openTasks: number }
}

export const OVERVIEW_PREFIXES = [
  "coaching_client_", "coaching_program_", "coaching_workoutlog_", "coaching_checkin_",
  "coaching_msg_", "coaching_task_", "coaching_app_", "nutrition_log_", "profile_change_request_",
] as const

export const OVERVIEW_ATTRIBUTES = [
  "userId", "id", "email", "displayName", "status", "currentProgramId", "startDate", "createdAt", "goal",
  "clientEmail", "programId", "weekNumber", "dayLabel", "completedAt",
  "submittedAt", "painReported", "formReviewRequested",
  "threadId", "fromEmail", "toEmail", "body", "sentAt", "readAt", "kind",
  "title", "dueDate", "priority",
  "name", "applicationDate",
  "weeks", "durationWeeks", "isTemplate",
  "date", "loggedAt",
] as const

const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null)
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null)
const lower = (v: unknown) => (str(v) ?? "").toLowerCase()

function zonedParts(d: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ""
  return { y: Number(get("year")), m: Number(get("month")), d: Number(get("day")), weekday: get("weekday"), h: Number(get("hour")) % 24, min: Number(get("minute")), s: Number(get("second")) }
}

export function localDate(d: Date, timeZone = COACH_TIME_ZONE): string {
  const p = zonedParts(d, timeZone)
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`
}

export function weekStartFor(now: Date, timeZone = COACH_TIME_ZONE): Date {
  const p = zonedParts(now, timeZone)
  const offsetDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday)
  const sinceMidnightMs = ((p.h * 60 + p.min) * 60 + p.s) * 1000 + now.getUTCMilliseconds()
  return new Date(now.getTime() - sinceMidnightMs - Math.max(0, offsetDays) * 86_400_000)
}

const shortDate = (ymd: string) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })

const daysBetween = (fromIso: string, now: Date) => Math.floor((now.getTime() - new Date(fromIso).getTime()) / 86_400_000)

function programProgress(program: Raw, logs: Raw[]): ClientSummary["program"] {
  let weeks: ReturnType<typeof expandedWeeks>
  try {
    weeks = expandedWeeks({ weeks: str(program.weeks) ?? "[]", durationWeeks: num(program.durationWeeks) ?? undefined })
  } catch {
    weeks = []
  }
  const id = str(program.id) ?? ""
  const done = new Set(logs.filter((l) => str(l.programId) === id).map((l) => `${num(l.weekNumber)}::${str(l.dayLabel)}`))
  if (weeks.length === 0) return { id, name: str(program.name) ?? "Program", currentWeek: 0, totalWeeks: 0, daysThisWeek: 0, doneThisWeek: 0, finished: false }
  const idx = weeks.findIndex((w) => w.days.some((d) => !done.has(`${w.weekNumber}::${d.dayLabel}`)))
  const finished = idx === -1
  const week = weeks[finished ? weeks.length - 1 : idx]
  return {
    id,
    name: str(program.name) ?? "Program",
    currentWeek: week.weekNumber,
    totalWeeks: weeks.length,
    daysThisWeek: week.days.length,
    doneThisWeek: week.days.filter((d) => done.has(`${week.weekNumber}::${d.dayLabel}`)).length,
    finished,
  }
}

function preview(body: string, kind: string | null) {
  if (kind === "nutrition-meal") return "Shared a meal"
  if (kind === "nutrition-day") return "Shared a day of eating"
  if (kind === "nutrition-question") return "Asked a nutrition question"
  const flat = body.replace(/\s+/g, " ").trim()
  return flat.length > 120 ? `${flat.slice(0, 119)}…` : flat
}

export function buildOverview(items: Raw[], opts: { now: Date; isCoach: (email: string) => boolean; timeZone?: string }): CoachingOverview {
  const { now, isCoach } = opts
  const tz = opts.timeZone ?? COACH_TIME_ZONE
  const weekStart = weekStartFor(now, tz)
  const weekStartIso = weekStart.toISOString()
  const sevenDaysAgo = localDate(new Date(now.getTime() - 6 * 86_400_000), tz)

  const by = (prefix: string) => items.filter((i) => (str(i.userId) ?? "").startsWith(prefix))
  const clientsRaw = by("coaching_client_")
  const programs = new Map(by("coaching_program_").map((p) => [str(p.id) ?? "", p]))
  const groupByClient = (rows: Raw[]) => {
    const m = new Map<string, Raw[]>()
    for (const r of rows) {
      const k = lower(r.clientEmail)
      if (!k) continue
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(r)
    }
    return m
  }
  const logs = groupByClient(by("coaching_workoutlog_"))
  const checkIns = groupByClient(by("coaching_checkin_"))
  const nutrition = groupByClient(by("nutrition_log_"))
  const tasks = by("coaching_task_")
  const apps = by("coaching_app_")

  const nameFor = new Map(clientsRaw.map((c) => [lower(c.email), str(c.displayName) ?? str(c.email) ?? ""]))

  const threadMap = new Map<string, Raw[]>()
  for (const m of by("coaching_msg_")) {
    const t = str(m.threadId)
    if (!t) continue
    if (!threadMap.has(t)) threadMap.set(t, [])
    threadMap.get(t)!.push(m)
  }
  const threads: ThreadSummary[] = []
  for (const [threadId, msgs] of threadMap) {
    msgs.sort((a, b) => (str(a.sentAt) ?? "").localeCompare(str(b.sentAt) ?? ""))
    const last = msgs[msgs.length - 1]
    const fromCoach = isCoach(lower(last.fromEmail))
    const clientEmail = fromCoach ? lower(last.toEmail) : lower(last.fromEmail)
    threads.push({
      threadId,
      clientEmail,
      clientName: nameFor.get(clientEmail) ?? clientEmail,
      lastMessage: preview(str(last.body) ?? "", str(last.kind)),
      lastAt: str(last.sentAt) ?? "",
      lastFromClient: !fromCoach,
      unreadCount: msgs.filter((m) => !isCoach(lower(m.fromEmail)) && !str(m.readAt)).length,
    })
  }
  threads.sort((a, b) => b.lastAt.localeCompare(a.lastAt))
  const threadByClient = new Map<string, ThreadSummary>()
  for (const t of threads) if (!threadByClient.has(t.clientEmail)) threadByClient.set(t.clientEmail, t)

  const openTasks = tasks.filter((t) => !str(t.completedAt))
  const clients: ClientSummary[] = clientsRaw.map((c) => {
    const email = lower(c.email)
    const clientLogs = (logs.get(email) ?? []).slice().sort((a, b) => (str(b.completedAt) ?? "").localeCompare(str(a.completedAt) ?? ""))
    const lastWorkoutAt = str(clientLogs[0]?.completedAt)
    const program = programs.get(str(c.currentProgramId) ?? "")
    const cis = (checkIns.get(email) ?? []).slice().sort((a, b) => (str(b.submittedAt) ?? "").localeCompare(str(a.submittedAt) ?? ""))
    const pending = cis.find((ci) => (str(ci.status) ?? "PENDING") === "PENDING")
    const thisWeek = cis.filter((ci) => (str(ci.submittedAt) ?? "") >= weekStartIso)
    const state: CheckInWeekState = thisWeek.length === 0 ? "not-yet" : thisWeek.some((ci) => (str(ci.status) ?? "PENDING") === "PENDING") ? "pending" : "reviewed"
    const nutritionDates = new Set((nutrition.get(email) ?? []).map((n) => str(n.date)).filter((d): d is string => !!d))
    const lastLogDate = [...nutritionDates].sort().pop() ?? null
    const thread = threadByClient.get(email)
    return {
      email,
      displayName: str(c.displayName) ?? email,
      status: (str(c.status) ?? "ACTIVE") as ClientStatus,
      startDate: str(c.startDate),
      goal: str(c.goal),
      program: program ? programProgress(program, clientLogs) : null,
      training: {
        lastWorkoutAt,
        daysSinceWorkout: lastWorkoutAt ? daysBetween(lastWorkoutAt, now) : null,
        workoutsThisWeek: clientLogs.filter((l) => (str(l.completedAt) ?? "") >= weekStartIso).length,
      },
      nutrition: { lastLogDate, daysLoggedLast7: [...nutritionDates].filter((d) => d >= sevenDaysAgo).length },
      checkIn: {
        state,
        lastSubmittedAt: str(cis[0]?.submittedAt),
        pendingId: str(pending?.id),
        painReported: pending?.painReported === true,
        formReviewRequested: pending?.formReviewRequested === true,
      },
      messages: {
        threadId: thread?.threadId ?? null,
        unread: thread?.unreadCount ?? 0,
        needsReply: thread?.lastFromClient ?? false,
        lastAt: thread?.lastAt ?? null,
        preview: thread?.lastMessage ?? null,
      },
      openTasks: openTasks.filter((t) => lower(t.clientEmail) === email).length,
    }
  }).sort((a, b) => a.displayName.localeCompare(b.displayName))

  const attention: AttentionItem[] = []
  const clientHref = (email: string, sub = "") => `/admin/coaching/clients/${encodeURIComponent(email)}${sub}`
  for (const c of clients) {
    const base = { clientEmail: c.email, clientName: c.displayName }
    if (c.checkIn.pendingId && c.checkIn.painReported) {
      attention.push({ ...base, id: `pain-${c.checkIn.pendingId}`, kind: "pain", urgency: 1, title: `${c.displayName} reported pain`, detail: "In this week's check-in. Review before their next session.", href: `/admin/coaching/check-ins/${c.checkIn.pendingId}`, at: c.checkIn.lastSubmittedAt })
    } else if (c.checkIn.pendingId) {
      attention.push({ ...base, id: `ci-${c.checkIn.pendingId}`, kind: "check-in", urgency: 2, title: `Review ${c.displayName}'s check-in`, detail: c.checkIn.formReviewRequested ? "Includes a form review request" : "Submitted and waiting for your feedback", href: `/admin/coaching/check-ins/${c.checkIn.pendingId}`, at: c.checkIn.lastSubmittedAt })
    }
    if (c.messages.needsReply && c.messages.threadId) {
      attention.push({ ...base, id: `msg-${c.messages.threadId}`, kind: "reply", urgency: 2, title: `Reply to ${c.displayName}`, detail: c.messages.preview ?? "", href: clientHref(c.email, "/messages"), at: c.messages.lastAt })
    }
    if (c.status === "PENDING_PAYMENT") {
      attention.push({ ...base, id: `pay-${c.email}`, kind: "payment", urgency: 3, title: `${c.displayName} hasn't paid yet`, detail: "Accepted, waiting on first payment", href: clientHref(c.email), at: null })
      continue
    }
    if (c.status !== "ACTIVE") continue
    if (!c.program) {
      attention.push({ ...base, id: `noprog-${c.email}`, kind: "no-program", urgency: 2, title: `Assign a program to ${c.displayName}`, detail: "No current program", href: clientHref(c.email, "/program"), at: null })
    } else if (c.program.finished || (c.program.totalWeeks > 0 && c.program.currentWeek === c.program.totalWeeks)) {
      attention.push({ ...base, id: `end-${c.program.id}`, kind: "program-ending", urgency: 3, title: `Plan ${c.displayName}'s next block`, detail: c.program.finished ? `${c.program.name} is complete` : `Final week of ${c.program.name}`, href: clientHref(c.email, "/program"), at: null })
    }
    const idle = c.training.daysSinceWorkout
    if (c.program && (idle === null || idle > INACTIVE_AFTER_DAYS)) {
      attention.push({ ...base, id: `idle-${c.email}`, kind: "inactive", urgency: 3, title: `Check on ${c.displayName}`, detail: idle === null ? "No workouts logged yet" : `No workout in ${idle} days`, href: clientHref(c.email, "/workouts"), at: c.training.lastWorkoutAt })
    }
  }
  const knownClients = new Set(clients.map((c) => c.email))
  for (const t of threads) {
    if (t.lastFromClient && !knownClients.has(t.clientEmail)) {
      attention.push({ id: `msg-${t.threadId}`, kind: "reply", urgency: 2, title: `Reply to ${t.clientName}`, detail: t.lastMessage, href: clientHref(t.clientEmail, "/messages"), clientEmail: t.clientEmail, clientName: t.clientName, at: t.lastAt })
    }
  }
  const pendingApps = apps.filter((a) => str(a.status) === "PENDING")
  for (const a of pendingApps) {
    attention.push({ id: `app-${str(a.id)}`, kind: "application", urgency: 2, title: `New application from ${str(a.name) ?? "an applicant"}`, detail: "Waiting for your decision", href: "/admin/coaching/applications", clientEmail: lower(a.email) || null, clientName: str(a.name), at: str(a.applicationDate) })
  }
  for (const r of by("profile_change_request_")) {
    if (str(r.status) !== "pending") continue
    const email = lower(r.clientEmail)
    if (!email) continue
    const name = nameFor.get(email) ?? email
    attention.push({ id: `profile-${str(r.id)}`, kind: "profile-request", urgency: 3, title: `${name} asked to change their goal or activity`, detail: "Waiting for your review on their Nutrition tab", href: clientHref(email, "/nutrition"), clientEmail: email, clientName: name, at: str(r.createdAt) })
  }
  const today = localDate(now, tz)
  for (const t of openTasks) {
    const due = str(t.dueDate)
    if (!due || due.slice(0, 10) > today) continue
    const email = lower(t.clientEmail) || null
    attention.push({ id: `task-${str(t.id)}`, kind: "task", urgency: due.slice(0, 10) < today || str(t.priority) === "HIGH" ? 2 : 3, title: str(t.title) ?? "Task", detail: due.slice(0, 10) < today ? `Overdue since ${shortDate(due.slice(0, 10))}` : "Due today", href: "/admin/coaching/tasks", clientEmail: email, clientName: email ? nameFor.get(email) ?? email : null, at: due })
  }
  attention.sort((a, b) => a.urgency - b.urgency || (a.at ?? "9").localeCompare(b.at ?? "9"))

  const active = clients.filter((c) => c.status === "ACTIVE")
  return {
    generatedAt: now.toISOString(),
    weekStart: weekStartIso,
    clients,
    attention,
    threads,
    counts: {
      active: active.length,
      paused: clients.filter((c) => c.status === "PAUSED").length,
      awaitingPayment: clients.filter((c) => c.status === "PENDING_PAYMENT").length,
      inactive: clients.filter((c) => c.status === "INACTIVE").length,
      unread: threads.reduce((n, t) => n + t.unreadCount, 0),
      needsReply: threads.filter((t) => t.lastFromClient).length,
      pendingCheckIns: by("coaching_checkin_").filter((ci) => (str(ci.status) ?? "PENDING") === "PENDING").length,
      pendingApplications: pendingApps.length,
      openTasks: openTasks.length,
    },
  }
}
