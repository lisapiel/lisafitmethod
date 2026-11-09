"use client"

import { useCallback, useEffect, useState } from "react"
import { adminJson, clientPath } from "./api"
import { BackToStartForm } from "./BackToStartForm"
import { dateTime, kcal } from "./format"
import { TargetForm } from "./TargetForm"
import { TargetHistory } from "./TargetHistory"
import type { Macros, TargetChange } from "./types"

type Mode = "view" | "change" | "back"

export function TargetCard({ email, current, isCustom, starting, onChanged }: {
  email: string
  current: Macros | null
  isCustom: boolean
  starting: Macros | null
  onChanged: () => Promise<void> | void
}) {
  const [mode, setMode] = useState<Mode>("view")
  const [changes, setChanges] = useState<TargetChange[] | null>(null)
  const [historyError, setHistoryError] = useState("")
  const [saved, setSaved] = useState(false)

  const loadHistory = useCallback(async () => {
    try {
      const res = await adminJson<{ changes?: TargetChange[] }>(clientPath(email, "/nutrition"))
      if (res.ok && Array.isArray(res.data?.changes)) { setChanges(res.data.changes); setHistoryError("") }
      else setHistoryError("The change history couldn't be loaded.")
    } catch {
      setHistoryError("The change history couldn't be loaded.")
    }
  }, [email])

  useEffect(() => { loadHistory() }, [loadHistory])

  async function done() {
    setMode("view")
    setSaved(true)
    await Promise.all([onChanged(), loadHistory()])
  }

  const last = changes?.[0]

  return (
    <section className="can-card" aria-labelledby="can-target-h">
      <div className="can-card-head">
        <h2 id="can-target-h" className="can-h">Target</h2>
        {current && <span className="can-tag" data-tone={isCustom ? undefined : "muted"}>{isCustom ? "Set by you" : "Starting estimate"}</span>}
      </div>
      {current ? (
        <div className="can-macros">
          <div><b>{kcal(current.calories)}</b><span>kcal</span></div>
          <div><b>{current.protein} g</b><span>protein</span></div>
          <div><b>{current.carbs} g</b><span>carbs</span></div>
          <div><b>{current.fat} g</b><span>fat</span></div>
        </div>
      ) : (
        <p className="can-note" style={{ marginBottom: 12 }}>No target yet. The client hasn&apos;t finished setup, or you can set one here.</p>
      )}
      {last && (
        <p className="can-note" style={{ marginBottom: 12 }}>Last changed {dateTime(last.changedAt)}. Reason: {last.reason}</p>
      )}
      {saved && mode === "view" && <p className="can-ok" role="status" style={{ marginBottom: 12 }}>Saved. The new target is live.</p>}

      {mode === "view" && (
        <div className="can-actions">
          <button type="button" className="ca-btn" data-variant="primary" onClick={() => { setSaved(false); setMode("change") }}>
            {current ? "Change target" : "Set a target"}
          </button>
          {isCustom && (
            <button type="button" className="ca-btn" onClick={() => { setSaved(false); setMode("back") }}>Back to the starting estimate</button>
          )}
        </div>
      )}
      {mode === "change" && <TargetForm email={email} current={current} onSaved={done} onCancel={() => setMode("view")} />}
      {mode === "back" && <BackToStartForm email={email} current={current} starting={starting} onSaved={done} onCancel={() => setMode("view")} />}

      <hr className="can-sep" />
      <h3 className="can-h3">Change history</h3>
      <TargetHistory changes={changes} error={historyError} />
    </section>
  )
}
