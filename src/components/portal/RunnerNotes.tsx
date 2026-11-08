"use client"

import { useState } from "react"

export default function RunnerNotes({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 160 || text.split("\n").length > 3
  return (
    <section className="pt pt-runner-notes" aria-label="Notes from Lisa for this workout">
      <p className="pt-runner-notes-title">Notes from me</p>
      <p className={`pt-from-text${long && !open ? " pt-clamp3" : ""}`}>{text}</p>
      {long && (
        <button type="button" className="pt-textbtn" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "Show less" : "Read all my notes"}
        </button>
      )}
    </section>
  )
}
