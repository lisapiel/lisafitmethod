"use client"

import { useState } from "react"
import { dateTime, shortDate } from "./format"
import { RecoverForm } from "./RecoverForm"
import type { Recovery, RecoveryMessage } from "./types"

const LONG = 280

export function RecoveryMessageItem({ email, message, recovery, onRecovered }: {
  email: string
  message: RecoveryMessage
  recovery?: Recovery
  onRecovered: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [open, setOpen] = useState(false)
  const long = message.body.length > LONG
  const text = long && !expanded && !open ? `${message.body.slice(0, LONG).trimEnd()}…` : message.body

  return (
    <li className="can-msg">
      <div className="can-entry-top">
        <b>Sent {dateTime(message.sentAt)}</b>
        {recovery && (
          <span className="can-tag" data-tone={recovery.status === "active" ? undefined : "muted"}>
            {recovery.status === "active" ? `Recovered for ${shortDate(recovery.date)}` : "Recovery undone"}
          </span>
        )}
      </div>
      <p className="can-msg-body">{text}</p>
      {long && !open && (
        <div><button type="button" className="can-textbtn" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>{expanded ? "Show less" : "Show the whole message"}</button></div>
      )}
      {!recovery && !open && (
        <div className="can-actions">
          <button type="button" className="ca-btn" onClick={() => setOpen(true)}>Recover</button>
        </div>
      )}
      {open && <RecoverForm email={email} message={message} onCancel={() => setOpen(false)} onDone={() => { setOpen(false); onRecovered() }} />}
    </li>
  )
}
