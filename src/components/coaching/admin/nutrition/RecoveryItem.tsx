"use client"

import { useState } from "react"
import { adminJson, clientPath, errorText } from "./api"
import { dateTime, kcal, macroLine, shortDate } from "./format"
import type { Recovery } from "./types"

export function RecoveryItem({ email, recovery, onUndone }: { email: string; recovery: Recovery; onUndone: () => void }) {
  const [undoing, setUndoing] = useState(false)
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const id = `can-u-${recovery.messageId}`

  async function undo() {
    if (reason.trim().length < 3) { setError("Add a short reason."); return }
    setSaving(true)
    setError("")
    try {
      const res = await adminJson<{ ok?: boolean }>(clientPath(email, "/nutrition-recovery"), {
        method: "DELETE",
        body: { messageId: recovery.messageId, reason: reason.trim() },
      })
      if (res.ok) { setUndoing(false); onUndone(); return }
      setError(errorText(res.data, `Nothing was changed (error ${res.status}).`))
    } catch {
      setError("Couldn't reach the server. Nothing was changed.")
    }
    setSaving(false)
  }

  return (
    <li className="can-entry" style={{ gap: 6 }}>
      <div className="can-entry-top">
        <b>{shortDate(recovery.date)}</b>
        <span className="can-num">{kcal(recovery.calories)} kcal</span>
        <span className="can-tag" data-tone={recovery.status === "active" ? undefined : "muted"}>{recovery.status === "active" ? "Active" : "Undone"}</span>
      </div>
      <p className="can-num">{macroLine(recovery)} · added {dateTime(recovery.confirmedAt)}</p>
      {recovery.clientFlag && (
        <p style={{ color: "var(--ca-text)" }}>Client note ({dateTime(recovery.clientFlag.at)}): {recovery.clientFlag.note}</p>
      )}
      {recovery.status === "active" && !undoing && (
        <div><button type="button" className="ca-btn" onClick={() => setUndoing(true)}>Undo</button></div>
      )}
      {undoing && (
        <form className="can-form" noValidate onSubmit={(e) => { e.preventDefault(); undo() }}>
          <div className="can-field">
            <label htmlFor={id}>Reason for undoing</label>
            <input id={id} type="text" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </div>
          <p className="can-note">The recovered entry is removed from this day. The original message stays as it is.</p>
          {error && <p className="can-err" role="alert">{error}</p>}
          <div className="can-actions">
            <button type="submit" className="ca-btn" data-variant="primary" disabled={saving}>{saving ? "Undoing…" : "Undo recovery"}</button>
            <button type="button" className="ca-btn" onClick={() => { setUndoing(false); setError("") }} disabled={saving}>Keep it</button>
          </div>
        </form>
      )}
    </li>
  )
}
