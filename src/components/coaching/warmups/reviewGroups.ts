import type { ReviewItem, ReviewSelection } from "@/lib/warmups/review"

export interface ReviewProgram {
  id: string
  name: string
  isTemplate: boolean
  status: string
  updatedAt: string
  client: { email: string; displayName: string; status: string | null; isCurrent: boolean } | null
  options: { beginner: boolean; bands: boolean; backSafe: boolean; foamRoller: boolean }
  reasons: Record<string, string>
  profileFlags: string[]
  profileSaved: boolean
  items: ReviewItem[]
}

export interface DayGroup {
  key: string
  dayIndex: number
  dayLabel: string
  sessionType: string
  decidedBy: string
  weeks: number[]
  warmup: ReviewItem | null
  cooldown: ReviewItem | null
  flags: string[]
  selection: ReviewSelection[]
}

// Days that would receive the same additions are shown once with the weeks
// they cover, so a six-week program reads as its weekly pattern.
export function groupDays(items: ReviewItem[]): DayGroup[] {
  const byDay = new Map<string, { week: number; dayIndex: number; dayLabel: string; warmup: ReviewItem | null; cooldown: ReviewItem | null }>()
  for (const it of items) {
    const k = `${it.week}:${it.dayIndex}`
    const entry = byDay.get(k) ?? { week: it.week, dayIndex: it.dayIndex, dayLabel: it.dayLabel, warmup: null, cooldown: null }
    entry[it.kind] = it
    byDay.set(k, entry)
  }
  const groups = new Map<string, DayGroup>()
  for (const d of [...byDay.values()].sort((a, b) => a.dayIndex - b.dayIndex || a.week - b.week)) {
    const sig = (it: ReviewItem | null) => (it ? it.drills.map((x) => `${x.name}/${x.dose}`).join("|") : "-")
    const any = d.warmup ?? d.cooldown!
    const key = [d.dayIndex, d.dayLabel, any.sessionType, sig(d.warmup), sig(d.cooldown)].join("§")
    const g = groups.get(key) ?? {
      key, dayIndex: d.dayIndex, dayLabel: d.dayLabel, sessionType: any.sessionType, decidedBy: any.decidedBy,
      weeks: [], warmup: d.warmup, cooldown: d.cooldown, flags: any.flags, selection: [],
    }
    g.weeks.push(d.week)
    if (d.warmup) g.selection.push({ week: d.week, dayIndex: d.dayIndex, kind: "warmup" })
    if (d.cooldown) g.selection.push({ week: d.week, dayIndex: d.dayIndex, kind: "cooldown" })
    groups.set(key, g)
  }
  return [...groups.values()]
}

export function weekRange(weeks: number[]): string {
  const w = [...weeks].sort((a, b) => a - b)
  const parts: string[] = []
  for (let i = 0; i < w.length; i++) {
    let j = i
    while (j + 1 < w.length && w[j + 1] === w[j] + 1) j++
    parts.push(i === j ? `${w[i]}` : `${w[i]}–${w[j]}`)
    i = j
  }
  return `${w.length === 1 ? "Week" : "Weeks"} ${parts.join(", ")}`
}
