"use client"

import { useState } from "react"

export default function CoachNote({ text, updatedAt }: { text: string; updatedAt: string | null }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 180
  return (
    <section className="pt-from" aria-label="A note from Lisa">
      <div className="pt-from-head">
        <span className="pt-avatar" aria-hidden="true">L</span>
        <div>
          <p style={{ fontWeight: 600 }}>A note from me</p>
          {updatedAt && <p style={{ fontSize: "0.8125rem", color: "var(--pt-muted)" }}>{new Date(updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>}
        </div>
      </div>
      <p className={`pt-from-text${long && !open ? " pt-clamp3" : ""}`}>{text}</p>
      {long && (
        <button type="button" className="pt-textbtn" style={{ justifySelf: "start" }} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "Show less" : "Read the whole note"}
        </button>
      )}
    </section>
  )
}
