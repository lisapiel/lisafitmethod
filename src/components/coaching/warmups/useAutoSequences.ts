"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import {
  fillEmptySequences, indexLibrary, planDay, sequenceState,
  type DayLike, type DayPlan, type LibraryExercise, type LibraryIndex, type Sequence,
  type SequenceKind, type SequenceState, type WarmupOptions,
} from "@/lib/warmups/engine"

// "template": unassigned programs and new programs. Empty sequences fill
// automatically. "client": an assigned program. Nothing changes until the
// coach applies a suggestion and saves.
export type AutoMode = "template" | "client"

type Week<D> = { days: D[] }

// Counted as a difference, not a running total, so a re-run of the effect
// (React does this in development) never inflates the number.
function countFilled<D extends DayLike>(before: Array<{ days: D[] }>, after: Array<{ days: D[] }>): number {
  let n = 0
  after.forEach((w, wi) => w.days.forEach((d, di) => {
    const prev = before[wi]?.days[di]
    for (const kind of ["warmup", "cooldown"] as const) {
      if (d[kind]?.source === "auto" && (prev?.[kind]?.exercises.length ?? 0) === 0) n += 1
    }
  }))
  return n
}

export function markManual<S extends Sequence>(seq: S): S {
  return { ...seq, source: "manual", rule: undefined }
}

export function useAutoSequences<D extends DayLike, W extends Week<D>>({ weeks, setWeeks, mode, options }: {
  weeks: W[]
  setWeeks: (updater: (ws: W[]) => W[]) => void
  mode: AutoMode
  options: WarmupOptions | null
}) {
  const [index, setIndex] = useState<LibraryIndex | null>(null)
  const [notice, setNotice] = useState<{ count: number; before: W[] } | null>(null)
  const [paused, setPaused] = useState(false)
  const optionsKey = JSON.stringify(options)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const token = (await fetchAuthSession()).tokens?.accessToken?.toString()
        if (!token) return
        const res = await fetch("/api/admin/coaching/exercises", { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) return
        const data = (await res.json()) as { exercises: LibraryExercise[] }
        if (alive) setIndex(indexLibrary(data.exercises ?? []))
      } catch { /* the editor still works without suggestions */ }
    })()
    return () => { alive = false }
  }, [])

  const planFor = useCallback((day: D): DayPlan | null => {
    if (!index || !options) return null
    return planDay(day, index, options)
  }, [index, options])

  // Template mode: fill any empty sequence as soon as the day has exercises
  // to read. The coach sees a notice with Undo, and nothing is stored until
  // they save the program.
  const weeksRef = useRef(weeks)
  weeksRef.current = weeks
  useEffect(() => {
    if (mode !== "template" || paused || !index || !options) return
    const before = weeksRef.current
    let count = 0
    const next = before.map((w) => ({
      ...w,
      days: w.days.map((d) => {
        const { day, filled } = fillEmptySequences(d, planDay(d, index, options))
        count += filled.length
        return day
      }),
    })) as W[]
    if (count === 0) return
    setWeeks(() => next)
    setNotice((n) => {
      const base = n?.before ?? before
      return { count: countFilled(base, next), before: base }
    })
  }, [weeks, index, optionsKey, mode, options, setWeeks, paused])

  const stateFor = useCallback((day: D, kind: SequenceKind): { state: SequenceState; plan: DayPlan | null } => {
    const plan = planFor(day)
    return { state: sequenceState(day, kind, plan), plan }
  }, [planFor])

  const totals = useMemo(() => {
    let empty = 0
    let outdated = 0
    if (!index || !options) return { empty, outdated }
    for (const w of weeks) for (const d of w.days) {
      const plan = planDay(d, index, options)
      for (const kind of ["warmup", "cooldown"] as const) {
        const s = sequenceState(d, kind, plan).status
        if (s === "empty") empty += 1
        if (s === "auto-outdated") outdated += 1
      }
    }
    return { empty, outdated }
  }, [weeks, index, options])

  const applyWhere = useCallback((pick: (s: SequenceState["status"]) => boolean) => {
    if (!index || !options) return
    setWeeks((ws) => ws.map((w) => ({
      ...w,
      days: w.days.map((d) => {
        const plan = planDay(d, index, options)
        let next = d
        for (const kind of ["warmup", "cooldown"] as const) {
          const st = sequenceState(next, kind, plan)
          if (pick(st.status) && "proposal" in st) next = { ...next, [kind]: st.proposal }
        }
        return next
      }),
    })) as W[])
  }, [index, options, setWeeks])

  return {
    ready: !!index && !!options,
    stateFor,
    totals,
    notice,
    dismissNotice: () => setNotice(null),
    undoNotice: () => { if (notice) { setPaused(true); setWeeks(() => notice.before); setNotice(null) } },
    paused,
    resume: () => setPaused(false),
    addAllEmpty: () => applyWhere((s) => s === "empty"),
    updateAllOutdated: () => applyWhere((s) => s === "auto-outdated"),
  }
}
