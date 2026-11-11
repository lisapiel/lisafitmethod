// Shared client-portal program logic. Rules match the existing portal:
// completion is keyed by programId + weekNumber + dayLabel, the next workout
// is the first unfinished day, and the time estimate is 8 minutes per
// exercise with a 20 minute floor.

export type PortalDay = { dayLabel: string; notes?: string; exercises: Array<{ name: string }>; dayType?: "sport" }
export type PortalWeek = { weekNumber: number; label: string; days: PortalDay[] }
export type PortalLog = { programId?: string; weekNumber: number; dayLabel: string; completedAt: string }

export const dayKey = (weekNumber: number, dayLabel: string) => `${weekNumber}::${dayLabel}`

export function completedFor(programId: string, logs: PortalLog[]) {
  const done = new Map<string, string>()
  for (const l of logs) {
    if (l.programId !== programId) continue
    const k = dayKey(l.weekNumber, l.dayLabel)
    if (!done.has(k) || l.completedAt > (done.get(k) ?? "")) done.set(k, l.completedAt)
  }
  return done
}

export function nextWorkout(weeks: PortalWeek[], done: Map<string, string>) {
  for (let wi = 0; wi < weeks.length; wi++) {
    const week = weeks[wi]
    for (let di = 0; di < week.days.length; di++) {
      if (!done.has(dayKey(week.weekNumber, week.days[di].dayLabel))) return { weekIndex: wi, week, day: week.days[di], dayIndex: di }
    }
  }
  return null
}

export function currentWeekIndex(weeks: PortalWeek[], done: Map<string, string>) {
  const next = nextWorkout(weeks, done)
  return next ? next.weekIndex : Math.max(0, weeks.length - 1)
}

export function minutesFor(day: PortalDay) {
  return Math.max(20, day.exercises.length * 8)
}

export function exercisePreview(day: PortalDay, show = 3) {
  const names = day.exercises.map((e) => e.name.trim()).filter(Boolean)
  if (names.length === 0) return ""
  if (names.length <= show) return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
  return `${names.slice(0, show).join(", ")} and ${names.length - show} more`
}

// Same rule as before: due when there is no check-in in the last 7 days.
export function checkInStatus(submittedAt: string[], now = Date.now()) {
  if (submittedAt.length === 0) return { due: true, daysAgo: null as number | null }
  const latest = [...submittedAt].sort().pop() as string
  const daysAgo = Math.floor((now - new Date(latest).getTime()) / 86_400_000)
  return { due: daysAgo >= 7, daysAgo }
}

// Same rolling 7-day rule as checkInStatus and the check-in page: the next
// one is due 7 days after the latest submitted check-in.
export function nextCheckInDue(submittedAt: string[], now = Date.now()): { last: Date | null; next: Date | null; due: boolean } {
  const valid = submittedAt.filter((s) => Number.isFinite(Date.parse(s)))
  if (valid.length === 0) return { last: null, next: null, due: true }
  const last = new Date([...valid].sort().pop() as string)
  const next = new Date(last.getTime() + 7 * 86_400_000)
  return { last, next, due: checkInStatus(valid, now).due }
}

export function weekProgress(week: PortalWeek, done: Map<string, string>) {
  const total = week.days.length
  const finished = week.days.filter((d) => done.has(dayKey(week.weekNumber, d.dayLabel))).length
  return { finished, total }
}
