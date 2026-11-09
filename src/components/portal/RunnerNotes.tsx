"use client"

import { useId, useState } from "react"

// Coach notes stay folded until the client asks for them, matching the
// "My notes for this workout" toggle on Home, so the workout controls stay clear.
export default function RunnerNotes({ text, sport = false }: { text: string; sport?: boolean }) {
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  return (
    <section className="pt pt-runner-notes" aria-label="My notes for you">
      <button type="button" className="pt-textbtn pt-runner-notes-toggle" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((v) => !v)}>
        {open ? "Hide my notes" : sport ? "My notes for this day" : "My notes for this workout"}
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : undefined }}><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <p id={bodyId} className="pt-from-text" hidden={!open}>{text}</p>
    </section>
  )
}
