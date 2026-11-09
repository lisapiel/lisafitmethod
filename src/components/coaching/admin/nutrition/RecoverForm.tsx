"use client"

import { useState } from "react"
import { localDateKey } from "@/lib/localDate"
import { adminJson, clientPath, errorText } from "./api"
import type { RecoveryMessage } from "./types"

type ConflictBody = { error?: string; detail?: string }

const MACROS = [
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fat", label: "Fat (g)" },
] as const

export function RecoverForm({ email, message, onDone, onCancel }: { email: string; message: RecoveryMessage; onDone: () => void; onCancel: () => void }) {
  const [date, setDate] = useState(() => localDateKey(message.sentAt))
  const [calories, setCalories] = useState("")
  const [macros, setMacros] = useState({ protein: "", carbs: "", fat: "" })
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const idp = `can-r-${message.id}`

  async function submit() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { setError("Pick the day the report describes."); return }
    const cal = Number(calories)
    if (calories.trim() === "" || !Number.isFinite(cal) || cal <= 0) { setError("Enter the calories the client reported."); return }
    const opt = (v: string) => (v.trim() === "" ? undefined : Number(v))
    const body = { messageId: message.id, date, calories: cal, protein: opt(macros.protein), carbs: opt(macros.carbs), fat: opt(macros.fat) }
    if ([body.protein, body.carbs, body.fat].some((v) => v !== undefined && (!Number.isFinite(v) || v < 0))) {
      setError("Check the macro values, or leave them blank.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const res = await adminJson<ConflictBody>(clientPath(email, "/nutrition-recovery"), { method: "POST", body })
      if (res.ok) { onDone(); return }
      if (res.status === 409 && res.data?.error === "day-has-logs") setError(res.data.detail ?? "This day already has food logs, so they're kept as they are.")
      else setError(errorText(res.data, `Nothing was added (error ${res.status}).`))
    } catch {
      setError("Couldn't reach the server. Nothing was added.")
    }
    setSaving(false)
  }

  return (
    <form className="can-form" noValidate onSubmit={(e) => { e.preventDefault(); submit() }} aria-label="Recover this report">
      <div className="can-grid4">
        <div className="can-field" style={{ gridColumn: "1 / -1" }}>
          <label htmlFor={`${idp}-date`}>Day the report describes</label>
          <input id={`${idp}-date`} type="date" value={date} max={localDateKey()} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="can-field">
          <label htmlFor={`${idp}-cal`}>Calories (kcal)</label>
          <input id={`${idp}-cal`} type="text" inputMode="numeric" autoComplete="off" value={calories} onChange={(e) => setCalories(e.target.value)} />
        </div>
        {MACROS.map((m) => (
          <div className="can-field" key={m.key}>
            <label htmlFor={`${idp}-${m.key}`}>{m.label}, optional</label>
            <input
              id={`${idp}-${m.key}`} type="text" inputMode="numeric" autoComplete="off"
              value={macros[m.key]}
              onChange={(e) => setMacros((v) => ({ ...v, [m.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <p className="can-note">Type only what the client reported. Blank macros stay unknown.</p>
      {error && <p className="can-err" role="alert">{error}</p>}
      <div className="can-actions">
        <button type="submit" className="ca-btn" data-variant="primary" disabled={saving}>{saving ? "Adding…" : "Add to this day"}</button>
        <button type="button" className="ca-btn" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  )
}
