export type ThreadMessageBase = {
  id: string
  fromEmail: string
  sentAt: string
}

export type MessageRun<T> = { key: string; fromEmail: string; messages: T[] }
export type DayGroup<T> = { key: string; label: string; runs: MessageRun<T>[] }

const RUN_GAP_MS = 5 * 60 * 1000

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

export function dayLabel(d: Date, now: Date = new Date()) {
  if (dayKey(d) === dayKey(now)) return "Today"
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (dayKey(d) === dayKey(yesterday)) return "Yesterday"
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  })
}

export function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

export function formatFull(iso: string) {
  return new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
}

export function groupThread<T extends ThreadMessageBase>(messages: T[], now: Date = new Date()): DayGroup<T>[] {
  const days: DayGroup<T>[] = []
  for (const msg of messages) {
    const sent = new Date(msg.sentAt)
    const key = dayKey(sent)
    let day = days[days.length - 1]
    if (!day || day.key !== key) {
      day = { key, label: dayLabel(sent, now), runs: [] }
      days.push(day)
    }
    const run = day.runs[day.runs.length - 1]
    const prev = run?.messages[run.messages.length - 1]
    const sameSender = run && run.fromEmail.toLowerCase() === msg.fromEmail.toLowerCase()
    const closeInTime = prev && sent.getTime() - new Date(prev.sentAt).getTime() <= RUN_GAP_MS
    if (run && sameSender && closeInTime) {
      run.messages.push(msg)
    } else {
      day.runs.push({ key: msg.id, fromEmail: msg.fromEmail, messages: [msg] })
    }
  }
  return days
}
