"use client"

import { useState } from "react"
import { adminJson, clientPath, errorText } from "./api"
import { CompareTable } from "./CompareTable"
import type { Macros } from "./types"

export function BackToStartForm({ email, current, starting, onSaved, onCancel }: {
  email: string
  current: Macros | null
  starting: Macros | null
  onSaved: () => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState("")
  const [step, setStep] = useState<"reason" | "confirm">("reason")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    setError("")
    try {
      const res = await adminJson<{ ok?: boolean; error?: string }>(clientPath(email, "/nutrition"), {
        method: "PATCH",
        body: { customMacros: null, reason: reason.trim() },
      })
      if (res.ok) { onSaved(); return }
      const fallback = res.status === 0
        ? "Something stopped the save before the server was reached. Try again."
        : `Nothing was changed (error ${res.status}).`
      setError(errorText(res.data, fallback))
    } catch {
      setError("Something unexpected went wrong. Nothing was changed.")
    }
    setSaving(false)
  }

  if (step === "confirm") {
    return (
      <div className="can-form" role="group" aria-label="Confirm going back to the starting estimate">
        <CompareTable before={current} after={starting} beforeLabel="Set by you" afterLabel="Starting estimate" />
        {!starting && <p className="can-note">There&apos;s no starting estimate yet because setup isn&apos;t complete, so the client won&apos;t have a target until one is set.</p>}
        <p className="can-note">Reason: {reason.trim()}</p>
        {error && <p className="can-err" role="alert">{error}</p>}
        <div className="can-actions">
          <button type="button" className="ca-btn" data-variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Go back to the starting estimate"}</button>
          <button type="button" className="ca-btn" onClick={() => setStep("reason")} disabled={saving}>Go back</button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="can-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (reason.trim().length < 3) { setError("Add a short reason. It's kept in the target history."); return }
        setError("")
        setStep("confirm")
      }}
    >
      <div className="can-field">
        <label htmlFor="can-b-reason">Reason for going back (required)</label>
        <textarea id="can-b-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
      </div>
      {error && <p className="can-err" role="alert">{error}</p>}
      <div className="can-actions">
        <button type="submit" className="ca-btn" data-variant="primary">Review change</button>
        <button type="button" className="ca-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
