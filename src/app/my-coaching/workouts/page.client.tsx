"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { expandedWeeks } from "@/lib/programExpansion"
import { completedFor, currentWeekIndex, nextWorkout, weekProgress, type PortalLog, type PortalWeek } from "@/lib/portalProgram"
import WeekDayList from "@/components/portal/WeekDayList"

type Loaded = { id: string; name: string; weeks: PortalWeek[]; logs: PortalLog[] }

function Skeleton() {
  return (
    <div className="pt pt-stack" role="status" aria-label="Loading your program">
      <span className="pt-skel" style={{ display: "block", width: "70%", height: 34 }} />
      <span className="pt-skel" style={{ display: "block", height: 6 }} />
      <div style={{ display: "flex", gap: 8 }}>{[0, 1, 2, 3].map((i) => <span key={i} className="pt-skel" style={{ display: "block", width: 64, height: 48 }} />)}</div>
      {[0, 1, 2, 3].map((i) => <span key={i} className="pt-skel" style={{ display: "block", height: 68 }} />)}
    </div>
  )
}

export default function WorkoutsClient() {
  const [data, setData] = useState<Loaded | null>(null)
  const [state, setState] = useState<"loading" | "ready" | "none" | "error">("loading")
  const [picked, setPicked] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [programRes, logsRes] = await Promise.allSettled([
          fetch("/api/coaching/program?view=plan").then((r) => r.json()),
          fetch("/api/coaching/workout-log").then((r) => r.json()),
        ])
        if (!alive) return
        if (programRes.status !== "fulfilled") { setState("error"); return }
        const prog = programRes.value.program as Record<string, unknown> | null
        if (!prog) { setState("none"); return }
        const weeks = expandedWeeks({
          weeks: prog.weeks as string,
          durationWeeks: typeof prog.durationWeeks === "number" ? prog.durationWeeks : undefined,
        }) as unknown as PortalWeek[]
        const logs: PortalLog[] = logsRes.status === "fulfilled"
          ? (logsRes.value.logs ?? []).map((l: Record<string, unknown>) => ({ programId: l.programId as string, weekNumber: Number(l.weekNumber), dayLabel: l.dayLabel as string, completedAt: l.completedAt as string }))
          : []
        setData({ id: prog.id as string, name: prog.name as string, weeks, logs })
        setState("ready")
      } catch {
        if (alive) setState("error")
      }
    })()
    return () => { alive = false }
  }, [])

  const done = useMemo(() => (data ? completedFor(data.id, data.logs) : new Map<string, string>()), [data])
  const next = useMemo(() => (data ? nextWorkout(data.weeks, done) : null), [data, done])

  if (state === "loading") return <Skeleton />
  if (state === "error") {
    return (
      <div className="pt pt-stack">
        <section className="pt-empty">
          <h2>Your program didn&apos;t load</h2>
          <p>Check your connection and try again.</p>
          <button type="button" className="pt-btn" onClick={() => window.location.reload()}>Try again</button>
        </section>
      </div>
    )
  }
  if (state === "none" || !data) {
    return (
      <div className="pt pt-stack">
        <section className="pt-empty">
          <h2>Your program is on its way</h2>
          <p>I&apos;m building it around your goals and schedule. You&apos;ll get an email as soon as it&apos;s ready.</p>
          <Link className="pt-btn" href="/my-coaching/messages">Message me</Link>
        </section>
      </div>
    )
  }

  const weekIndex = picked ?? currentWeekIndex(data.weeks, done)
  const week = data.weeks[weekIndex]
  const totalDays = data.weeks.reduce((n, w) => n + w.days.length, 0)
  const doneDays = data.weeks.reduce((n, w) => n + weekProgress(w, done).finished, 0)

  return (
    <div className="pt pt-stack">
      <header className="pt-prog">
        <h1>{data.name}</h1>
        <p className="pt-date">{next ? `Week ${currentWeekIndex(data.weeks, done) + 1} of ${data.weeks.length}` : "Program complete"} · {doneDays} of {totalDays} workouts done</p>
        <div className="pt-bar" role="progressbar" aria-label="Program progress" aria-valuemin={0} aria-valuemax={totalDays} aria-valuenow={doneDays}>
          <i style={{ width: `${totalDays ? Math.round((doneDays / totalDays) * 100) : 0}%` }} />
        </div>
      </header>


      <div className="pt-weeks" role="group" aria-label="Choose a week">
        {data.weeks.map((w, wi) => {
          const p = weekProgress(w, done)
          return (
            <button key={w.weekNumber} type="button" className="pt-week" aria-pressed={wi === weekIndex} onClick={() => setPicked(wi)}>
              {w.label.replace(/^Week\s+/i, "Week ")}
              <small>{p.finished === p.total ? "Done" : `${p.finished}/${p.total}`}</small>
            </button>
          )
        })}
      </div>

      {week && <WeekDayList week={week} done={done} next={next ? { weekNumber: next.week.weekNumber, dayIndex: next.dayIndex } : null} />}
    </div>
  )
}
