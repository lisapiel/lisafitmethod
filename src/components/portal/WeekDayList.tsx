"use client"

import Link from "next/link"
import { dayKey, minutesFor, type PortalWeek } from "@/lib/portalProgram"
import { Check, ChevronRight, NoteIcon } from "./PortalIcons"

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

export default function WeekDayList({ week, done, next }: { week: PortalWeek; done: Map<string, string>; next: { weekNumber: number; dayIndex: number } | null }) {
  return (
    <ol className="pt-days" aria-label={`${week.label} workouts`}>
      {week.days.map((day, di) => {
        const doneAt = done.get(dayKey(week.weekNumber, day.dayLabel))
        const isNext = !doneAt && next?.weekNumber === week.weekNumber && next.dayIndex === di
        const state = doneAt ? "done" : isNext ? "next" : "open"
        const sport = day.dayType === "sport"
        return (
          <li key={`${day.dayLabel}-${di}`}>
            <Link className="pt-day" data-state={state} href={`/my-coaching/workouts/${week.weekNumber}/${di}`}>
              <span className="pt-num" aria-hidden="true">{doneAt ? <Check /> : di + 1}</span>
              <span style={{ display: "grid", gap: 3, minWidth: 0 }}>
                <span className="pt-day-title">{day.dayLabel}</span>
                <span className="pt-day-sub">
                  {doneAt ? <span>Done {shortDate(doneAt)}</span>
                    : sport ? <span>Sport day</span>
                    : <span>{day.exercises.length} exercises · about {minutesFor(day)} min</span>}
                  {day.notes?.trim() && !doneAt && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><NoteIcon size={14} /> Notes from me</span>
                  )}
                </span>
              </span>
              {isNext ? <span className="pt-btn pt-start">Start</span> : <span className="pt-chev"><ChevronRight /></span>}
              <span className="pt-sr">{doneAt ? "Completed" : isNext ? "Up next" : ""}</span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
