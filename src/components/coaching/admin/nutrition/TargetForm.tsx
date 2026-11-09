"use client"

import { useState } from "react"
import { validateMacroCalorieConsistency } from "@/lib/nutrition"
import { adminJson, clientPath, errorText } from "./api"
import { CompareTable } from "./CompareTable"
import type { Macros } from "./types"

const FIELDS = [
  { key: "calories", label: "Calories (kcal)" },
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fat", label: "Fat (g)" },
] as const

type Draft = Record<keyof Macros, string>

export function TargetForm({ email, current, onSaved, onCancel }: { email: string; current: Macros | null; onSaved: () => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Draft>({
    calories: current ? String(current.calories) : "",
    protein: current ? String(current.protein) : "",
    carbs: current ? String(current.carbs) : "",
    fat: current ? String(current.fat) : "",
  })
  const [reason, setReason] = useState("")
  const [step, setStep] = useState<"edit" | "confirm">("edit")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const values: Macros = {
    calories: Number(draft.calories), protein: Number(draft.protein), carbs: Number(draft.carbs), fat: Number(draft.fat),
  }

  function review() {
    if (Object.values(draft).some((v) => v.trim() === "" || !Number.isFinite(Number(v)) || Number(v) <= 0)) {
      setError("Enter all four numbers. Each one needs to be above zero.")
      return
    }
    if (reason.trim().length < 3) {
      setError("Add a short reason. It's kept in the target history.")
      return
    }
    const mismatch = validateMacroCalorieConsistency(values)
    if (mismatch) { setError(mismatch); return }
    setError("")
    setStep("confirm")
  }

  async function save() {
    setSaving(true)
    setError("")
    try {
      const res = await adminJson<{ ok?: boolean; error?: string }>(clientPath(email, "/nutrition"), {
        method: "PATCH",
        body: { customMacros: values, reason: reason.trim() },
      })
      if (res.ok) { onSaved(); return }
      setError(errorText(res.data, `The target wasn't saved (error ${res.status}).`))
      setStep("edit")
    } catch {
      setError("Couldn't reach the server. Nothing was changed.")
      setStep("edit")
    }
    setSaving(false)
  }

  if (step === "confirm") {
    return (
      <div className="can-form" role="group" aria-label="Confirm new target">
        <p className="can-text">Check the change before saving. The client sees the new target straight away.</p>
        <CompareTable before={current} after={values} beforeLabel="Now" afterLabel="New" />
        <p className="can-note">Reason: {reason.trim()}</p>
        <div className="can-actions">
          <button type="button" className="ca-btn" data-variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save new target"}</button>
          <button type="button" className="ca-btn" onClick={() => setStep("edit")} disabled={saving}>Go back</button>
        </div>
      </div>
    )
  }

  return (
    <form className="can-form" onSubmit={(e) => { e.preventDefault(); review() }} noValidate>
      <div className="can-grid4">
        {FIELDS.map((f) => (
          <div className="can-field" key={f.key}>
            <label htmlFor={`can-t-${f.key}`}>{f.label}</label>
            <input
              id={`can-t-${f.key}`} type="text" inputMode="numeric" autoComplete="off"
              value={draft[f.key]}
              onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="can-field">
        <label htmlFor="can-t-reason">Reason for the change (required)</label>
        <textarea id="can-t-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
      </div>
      <p className="can-note">Protein × 4 + carbs × 4 + fat × 9 needs to roughly match the calories.</p>
      {error && <p className="can-err" role="alert">{error}</p>}
      <div className="can-actions">
        <button type="submit" className="ca-btn" data-variant="primary">Review change</button>
        <button type="button" className="ca-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
