"use client"

import { useState } from "react"

export type GoalFormValues = {
  type: string
  label: string
  startValue: string
  currentValue: string
  targetValue: string
  unit: string
  targetDate: string
  notes: string
}

export const EMPTY_GOAL: GoalFormValues = { type: "body-composition", label: "", startValue: "", currentValue: "", targetValue: "", unit: "", targetDate: "", notes: "" }

const font = "var(--font-montserrat), sans-serif"
const field: React.CSSProperties = { width: "100%", minWidth: 0, background: "var(--ca-raised)", border: "1px solid var(--ca-line)", color: "var(--ca-text)", padding: "9px 10px", fontFamily: font, fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }
const label: React.CSSProperties = { display: "grid", gap: 4, fontFamily: font, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ca-muted)" }

// Create or edit one coaching goal. The client sees the name, values, unit,
// target date and notes; they can only update the current value themselves.
export default function GoalForm({ heading, initial, saveLabel, onSave, onCancel }: {
  heading: string
  initial: GoalFormValues
  saveLabel: string
  onSave: (v: GoalFormValues) => Promise<boolean>
  onCancel: () => void
}) {
  const [v, setV] = useState<GoalFormValues>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const set = (k: keyof GoalFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value })
  const ok = v.label.trim().length > 0

  async function save() {
    if (!ok || saving) return
    setSaving(true); setError("")
    const done = await onSave(v)
    setSaving(false)
    if (!done) setError("That didn't save. Try again.")
  }

  return (
    <div style={{ marginTop: 14, padding: 14, background: "var(--ca-bg)", border: "1px solid var(--ca-line)", display: "grid", gap: 10 }}>
      <p style={{ fontFamily: font, fontSize: "0.75rem", color: "var(--ca-accent-mark)", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>{heading}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
        <label style={label}>Type
          <select value={v.type} onChange={set("type")} style={field}>
            <option value="body-composition">Body Composition</option>
            <option value="strength">Strength</option>
            <option value="habit">Habit</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label style={label}>Goal name
          <input type="text" placeholder="e.g. Lose 15 lbs" value={v.label} onChange={set("label")} style={field} />
        </label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
        <label style={label}>Start<input inputMode="decimal" value={v.startValue} onChange={set("startValue")} style={field} /></label>
        <label style={label}>Current<input inputMode="decimal" value={v.currentValue} onChange={set("currentValue")} style={field} /></label>
        <label style={label}>Target<input inputMode="decimal" value={v.targetValue} onChange={set("targetValue")} style={field} /></label>
        <label style={label}>Unit<input placeholder="lbs, reps" value={v.unit} onChange={set("unit")} style={field} /></label>
        <label style={label}>Target date<input type="date" value={v.targetDate} onChange={set("targetDate")} style={field} /></label>
      </div>
      <label style={label}>Notes for the client (optional)
        <textarea rows={2} maxLength={500} value={v.notes} onChange={set("notes")} placeholder="Why this goal matters, or how we'll get there" style={{ ...field, resize: "vertical", textTransform: "none", letterSpacing: 0 }} />
      </label>
      {error && <p role="alert" style={{ margin: 0, fontFamily: font, fontSize: "0.75rem", color: "var(--ca-danger)" }}>{error}</p>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={save} disabled={!ok || saving} style={{ background: ok ? "var(--ca-accent)" : "var(--ca-line)", color: ok ? "var(--ca-on-accent)" : "var(--ca-muted)", border: "none", padding: "9px 20px", fontFamily: font, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: ok ? "pointer" : "not-allowed", flex: "1 1 auto" }}>
          {saving ? "Saving…" : saveLabel}
        </button>
        <button type="button" onClick={onCancel} style={{ background: "none", border: "1px solid var(--ca-line)", color: "var(--ca-muted)", padding: "9px 16px", fontFamily: font, fontSize: "0.75rem", cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  )
}
