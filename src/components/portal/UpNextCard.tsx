"use client"

import Link from "next/link"
import { useId, useState } from "react"
import { exercisePreview, minutesFor, type PortalDay, type PortalWeek } from "@/lib/portalProgram"
import { ChevronDown, Play } from "./PortalIcons"

export default function UpNextCard({ week, day, dayIndex, inProgress }: { week: PortalWeek; day: PortalDay; dayIndex: number; inProgress: boolean }) {
  const [showNotes, setShowNotes] = useState(false)
  const notesId = useId()
  const sport = day.dayType === "sport"
  const notes = day.notes?.trim() ?? ""
  return (
    <section className="pt-next" aria-labelledby={`${notesId}-title`}>
      <p className="pt-next-meta">{week.label} · Day {dayIndex + 1}{inProgress ? " · In progress" : ""}</p>
      <h2 id={`${notesId}-title`}>{day.dayLabel}</h2>
      {sport ? (
        <p className="pt-next-list">A sport day. Log what you played and how long.</p>
      ) : day.exercises.length > 0 ? (
        <p className="pt-next-list">{day.exercises.length} exercises · about {minutesFor(day)} min<br />{exercisePreview(day)}</p>
      ) : null}
      <div className="pt-next-actions">
        <Link className="pt-btn" href={`/my-coaching/workouts/${week.weekNumber}/${dayIndex}`}>
          <Play /> {inProgress ? "Continue workout" : "Start workout"}
        </Link>
      </div>
      {notes && (
        <div className="pt-note">
          <button type="button" className="pt-textbtn" aria-expanded={showNotes} aria-controls={notesId} onClick={() => setShowNotes((v) => !v)}>
            {showNotes ? "Hide my notes" : "My notes for this workout"}
            <span style={{ display: "inline-flex", transform: showNotes ? "rotate(180deg)" : undefined }}><ChevronDown /></span>
          </button>
          <p id={notesId} className="pt-note-body" hidden={!showNotes}>{notes}</p>
        </div>
      )}
    </section>
  )
}
