"use client"

import { useEffect, useState } from "react"
import type { ClientAssessment } from "@/lib/coachingRecords"

// "Your week, from Lisa": the shared parts of an assessment and a checklist the
// client can tick. Shows the newest one, or the one for a given check-in.
export default function WeekFromLisa({ checkInId, initial, compact = false }: { checkInId?: string; initial?: ClientAssessment | null; compact?: boolean }) {
  const [a, setA] = useState<ClientAssessment | null>(initial ?? null)
  const [open, setOpen] = useState(!compact)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    if (initial !== undefined) return
    fetch("/api/coaching/assessments")
      .then((r) => (r.ok ? r.json() : { assessments: [] }))
      .then((d: { assessments: ClientAssessment[] }) => {
        const list = d.assessments ?? []
        const pick = checkInId ? list.find((x) => x.checkInId === checkInId) : list[0]
        // On Home, only show recent feedback (last 3 weeks).
        if (!checkInId && pick && Date.now() - Date.parse(pick.sentAt) > 21 * 864e5) return
        setA(pick ?? null)
      })
      .catch(() => {})
  }, [checkInId, initial])

  if (!a) return null

  async function toggle(i: number) {
    if (!a) return
    const done = !a.priorityChecks[String(i)]
    setBusy(i); setError("")
    try {
      const r = await fetch(`/api/coaching/assessments/${encodeURIComponent(a.checkInId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index: i, done }) })
      const d = await r.json()
      if (!r.ok) throw new Error()
      setA(d.assessment)
    } catch { setError("That didn't save. Try again.") } finally { setBusy(null) }
  }

  const sent = new Date(a.sentAt).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
  const parts: Array<[string, string]> = [["What's going well", a.wentWell], ["What to improve", a.toImprove], ["What we're changing", a.changes]]
  const doneCount = a.priorities.filter((_, i) => a.priorityChecks[String(i)]).length

  return (
    <section className="pt-week-lisa" aria-label="Your week, from Lisa">
      <div className="pt-week-lisa-head">
        <h2>Your week, from Lisa</h2>
        <span>{sent}</span>
      </div>
      {a.priorities.length > 0 && (
        <div className="pt-week-lisa-list" role="group" aria-label="Priorities this week">
          <p>Priorities this week{doneCount > 0 ? ` · ${doneCount} of ${a.priorities.length} done` : ""}</p>
          {a.priorities.map((p, i) => {
            const checked = !!a.priorityChecks[String(i)]
            return (
              <label key={i} className="pt-check" data-checked={checked ? "" : undefined}>
                <input type="checkbox" checked={checked} disabled={busy === i} onChange={() => toggle(i)} />
                <span>{p}</span>
              </label>
            )
          })}
          {error && <p className="pt-error" role="alert">{error}</p>}
        </div>
      )}
      {compact && (
        <button type="button" className="pt-textbtn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? "Hide my feedback" : "Read my feedback"}</button>
      )}
      {open && parts.filter(([, t]) => t.trim()).map(([title, text]) => (
        <div key={title} className="pt-week-lisa-part"><b>{title}</b><p>{text}</p></div>
      ))}
    </section>
  )
}
