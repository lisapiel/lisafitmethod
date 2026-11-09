"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { CoachingClientRecord } from "@/lib/authTokens"
import { isPlausibleWeightLbs } from "@/lib/nutrition"
import {
  automaticEstimate, isOnAutomaticEstimate, STARTING_WEIGHT_REASON_MAX, validateStartingWeightChange,
  type StartingWeightChangeRecord,
} from "@/lib/startingWeight"
import { adminJson, clientPath, errorText } from "./api"
import { StartingWeightHistory } from "./StartingWeightHistory"
import { dateTime, targetLine } from "./format"

type Unit = "LBS" | "KG"

export function StartingWeightPanel({ email, client, onChanged }: { email: string; client: CoachingClientRecord; onChanged: () => Promise<void> | void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState("")
  const [unit, setUnit] = useState<Unit>("LBS")
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<number | null>(null)
  const [changes, setChanges] = useState<StartingWeightChangeRecord[] | null>(null)
  const [historyError, setHistoryError] = useState("")

  const loadHistory = useCallback(async () => {
    try {
      const res = await adminJson<{ changes?: StartingWeightChangeRecord[] }>(clientPath(email, "/starting-weight"))
      if (res.ok && Array.isArray(res.data?.changes)) { setChanges(res.data.changes); setHistoryError("") }
      else setHistoryError("The starting weight history couldn't be loaded.")
    } catch {
      setHistoryError("The starting weight history couldn't be loaded.")
    }
  }, [email])

  useEffect(() => { loadHistory() }, [loadHistory])

  const automatic = isOnAutomaticEstimate(client)
  const preview = useMemo(() => {
    const check = validateStartingWeightChange({ value, unit, reason: "preview" })
    if (!check.ok) return null
    return { lbs: check.lbs, before: automaticEstimate(client), after: automaticEstimate({ ...client, startingWeight: check.lbs }) }
  }, [value, unit, client])

  function open() {
    setSaved(null)
    setError("")
    setValue(client.startingWeight != null ? String(client.startingWeight) : "")
    setUnit("LBS")
    setReason("")
    setEditing(true)
  }

  async function save() {
    const check = validateStartingWeightChange({ value, unit, reason })
    if (!check.ok) { setError(check.error); return }
    setSaving(true)
    setError("")
    try {
      const res = await adminJson<{ ok?: boolean; startingWeight?: number; changes?: StartingWeightChangeRecord[]; error?: string }>(
        clientPath(email, "/starting-weight"),
        { method: "POST", body: { value: check.entered, unit: check.unit, reason: check.reason } },
      )
      if (res.ok) {
        if (Array.isArray(res.data?.changes)) setChanges(res.data.changes)
        setSaved(res.data?.startingWeight ?? check.lbs)
        setEditing(false)
        setSaving(false)
        await onChanged()
        return
      }
      setError(errorText(res.data, `The starting weight wasn't saved (error ${res.status}).`))
    } catch {
      setError("Couldn't reach the server. Nothing was changed.")
    }
    setSaving(false)
  }

  const last = changes?.[0]

  return (
    <div className="can-sw">
      {last && !editing && saved == null && (
        <p className="can-note">Starting weight corrected {dateTime(last.changedAt)}. Reason: {last.reason}</p>
      )}
      {saved != null && !editing && <p className="can-ok" role="status">Saved. The starting weight is now {saved} lb.</p>}
      {!editing && (
        <div className="can-actions">
          <button type="button" className="can-textbtn" onClick={open}>Correct starting weight</button>
        </div>
      )}
      {editing && (
        <form className="can-form" aria-label="Correct starting weight" onSubmit={(e) => { e.preventDefault(); save() }} noValidate>
          <div className="can-sw-row">
            <div className="can-field">
              <label htmlFor="can-sw-value">Corrected starting weight</label>
              <input id="can-sw-value" type="text" inputMode="decimal" autoComplete="off" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div className="can-seg" role="group" aria-label="Unit">
              <button type="button" aria-pressed={unit === "LBS"} onClick={() => setUnit("LBS")}>lb</button>
              <button type="button" aria-pressed={unit === "KG"} onClick={() => setUnit("KG")}>kg</button>
            </div>
          </div>
          <div className="can-field">
            <label htmlFor="can-sw-reason">Reason for the correction (required)</label>
            <textarea id="can-sw-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={STARTING_WEIGHT_REASON_MAX} />
          </div>
          <p className="can-note">
            This only changes the starting weight{client.startingWeight != null ? ` (now ${client.startingWeight} lb)` : ""}. Past weigh-ins, check-ins and measurements stay as they are.
          </p>
          {!automatic && <p className="can-note">Their target stays as you set it.</p>}
          {automatic && preview && preview.after && preview.before && targetLine(preview.before) !== targetLine(preview.after) && (
            <p className="can-note">
              They&apos;re on the starting estimate, which is worked out from this weight, so it would change from {targetLine(preview.before)} to {targetLine(preview.after)}.
            </p>
          )}
          {automatic && preview && !isPlausibleWeightLbs(preview.lbs) && (
            <p className="can-note">The starting estimate only works between 60 and 500 lb, so this client would have no starting estimate until you set a target.</p>
          )}
          {error && <p className="can-err" role="alert">{error}</p>}
          <div className="can-actions">
            <button type="submit" className="ca-btn" data-variant="primary" disabled={saving}>{saving ? "Saving…" : "Save correction"}</button>
            <button type="button" className="ca-btn" onClick={() => { setEditing(false); setError("") }} disabled={saving}>Cancel</button>
          </div>
        </form>
      )}
      {(historyError || (changes && changes.length > 0)) && (
        <>
          <h3 className="can-h3" style={{ marginTop: 12 }}>Starting weight history</h3>
          <StartingWeightHistory changes={changes} error={historyError} />
        </>
      )}
    </div>
  )
}
