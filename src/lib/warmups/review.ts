import {
  planDay, sequenceFromPlan, sequenceState, isEmptySequence,
  type DayLike, type LibraryIndex, type Sequence, type SequenceKind, type WarmupOptions,
} from "./engine"

type Week = { weekNumber: number; days: DayLike[]; [k: string]: unknown }

export interface ReviewItem {
  week: number
  dayIndex: number
  dayLabel: string
  kind: SequenceKind
  sessionType: string
  decidedBy: string
  rule: string
  adjustments: string[]
  drills: Array<{ name: string; dose: string; note: string; hasVideo: boolean }>
  flags: string[]
}

export interface ReviewSelection { week: number; dayIndex: number; kind: SequenceKind }

function parseWeeks(weeksJson: string): Week[] {
  const weeks = JSON.parse(weeksJson) as Week[]
  if (!Array.isArray(weeks)) throw new Error("weeks is not an array")
  return weeks
}

// Every empty warm-up or cool-down in a program, with the sequence the rules
// would add. Days with content are never listed.
export function reviewProgram(weeksJson: string, index: LibraryIndex, opts: WarmupOptions): ReviewItem[] {
  const items: ReviewItem[] = []
  for (const w of parseWeeks(weeksJson)) {
    w.days.forEach((day, dayIndex) => {
      const plan = planDay(day, index, opts)
      for (const kind of ["warmup", "cooldown"] as const) {
        const st = sequenceState(day, kind, plan)
        if (st.status !== "empty" || !plan) continue
        items.push({
          week: w.weekNumber, dayIndex, dayLabel: day.dayLabel, kind,
          sessionType: plan.typeLabel, decidedBy: plan.decidedBy,
          rule: plan[kind].rule, adjustments: plan[kind].adjustments,
          drills: st.proposal.exercises.map((e) => ({ name: e.name, dose: e.reps, note: e.coachNotes, hasVideo: !!e.videoS3Key })),
          flags: plan.flags,
        })
      }
    })
  }
  return items
}

// Fills only the selected sequences, and only if each is still empty when
// applied. Main exercises, notes and every other field are left untouched.
export function applyReview(weeksJson: string, index: LibraryIndex, opts: WarmupOptions, selection: ReviewSelection[]): { weeks: string; applied: number; skipped: number } {
  const weeks = parseWeeks(weeksJson)
  let applied = 0
  let skipped = 0
  for (const sel of selection) {
    const w = weeks.find((x) => x.weekNumber === sel.week)
    const day = w?.days[sel.dayIndex]
    if (!w || !day || !isEmptySequence(day[sel.kind])) { skipped += 1; continue }
    const plan = planDay(day, index, opts)
    if (sequenceState(day, sel.kind, plan).status !== "empty" || !plan) { skipped += 1; continue }
    w.days[sel.dayIndex] = { ...day, [sel.kind]: sequenceFromPlan(plan[sel.kind]) }
    applied += 1
  }
  return { weeks: JSON.stringify(weeks), applied, skipped }
}

// A program being assigned to a client is new to them, so empty sequences
// are filled and automatic ones re-chosen for that client's options.
// Hand-built sequences are kept exactly as they are.
export function prepareForClient(weeksJson: string, index: LibraryIndex, opts: WarmupOptions): { weeks: string; filled: number; updated: number } {
  const weeks = parseWeeks(weeksJson)
  let filled = 0
  let updated = 0
  for (const w of weeks) {
    w.days = w.days.map((day) => {
      const plan = planDay(day, index, opts)
      let next = day
      for (const kind of ["warmup", "cooldown"] as const) {
        const st = sequenceState(next, kind, plan)
        if (st.status === "empty") { next = { ...next, [kind]: st.proposal as Sequence }; filled += 1 }
        if (st.status === "auto-outdated") { next = { ...next, [kind]: st.proposal as Sequence }; updated += 1 }
      }
      return next
    })
  }
  return { weeks: JSON.stringify(weeks), filled, updated }
}
