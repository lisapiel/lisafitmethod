"use client"

import { useMemo, useState } from "react"
import type { CoachingClientRecord } from "@/lib/authTokens"
import { DECLINE_NOTE_MAX, previewRequest, type ProfileChangeRequest } from "@/lib/profileRequests"
import { adminJson, clientPath, errorText } from "./api"
import { CompareTable } from "./CompareTable"
import { dateTime, targetLine } from "./format"
import { activityText, goalText } from "./profileRequestText"
import type { Macros } from "./types"

type Step = "view" | "approve" | "decline"

export function PendingProfileRequest({ email, client, request, onDecided, onStartTargetChange }: {
  email: string
  client: CoachingClientRecord
  request: ProfileChangeRequest
  onDecided: (action: "approve" | "decline", requests: ProfileChangeRequest[] | null) => Promise<void> | void
  onStartTargetChange: (m: Macros) => void
}) {
  const [step, setStep] = useState<Step>("view")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const preview = useMemo(() => previewRequest(client, request.requested), [client, request.requested])
  const numbersChange = !!preview.previous && !!preview.next && targetLine(preview.previous) !== targetLine(preview.next)

  async function decide(action: "approve" | "decline") {
    setSaving(true)
    setError("")
    try {
      const res = await adminJson<{ ok?: boolean; requests?: ProfileChangeRequest[]; error?: string }>(clientPath(email, "/profile-requests"), {
        method: "POST",
        body: { id: request.id, action, ...(action === "decline" && note.trim() ? { note: note.trim() } : {}) },
      })
      if (res.ok) { setSaving(false); await onDecided(action, res.data?.requests ?? null); return }
      setError(errorText(res.data, `Nothing was changed (error ${res.status}).`))
    } catch {
      setError("Couldn't reach the server. Nothing was changed.")
    }
    setSaving(false)
  }

  const rows: Array<[string, string, string]> = []
  if (request.requested.nutritionGoal) rows.push(["Goal", goalText(client.nutritionGoal), goalText(request.requested.nutritionGoal)])
  if (request.requested.activityLevel != null) rows.push(["Activity", activityText(client.activityLevel), activityText(request.requested.activityLevel)])

  return (
    <div className="can-review" data-testid="pending-profile-request">
      <p className="can-note" style={{ marginBottom: 8 }}>Requested {dateTime(request.createdAt)}</p>
      <table className="can-compare" style={{ marginBottom: 8 }}>
        <thead><tr><th scope="col"><span className="ca-sr">Field</span></th><th scope="col">Now</th><th scope="col">Requested</th></tr></thead>
        <tbody>
          {rows.map(([k, now, next]) => (
            <tr key={k}>
              <th scope="row" style={{ textTransform: "none", letterSpacing: 0, fontSize: "0.875rem", color: "var(--ca-text)" }}>{k}</th>
              <td>{now}</td>
              <td style={{ fontWeight: 700 }}>{next}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="can-text" style={{ marginBottom: 8 }}>Their reason: {request.reason}</p>

      {preview.targetSetByCoach ? (
        <div style={{ marginBottom: 8 }}>
          <p className="can-note">Their target stays as you set it.</p>
          {preview.next && <p className="can-note">For reference, the starting estimate with the requested values would be {targetLine(preview.next)}.</p>}
        </div>
      ) : preview.previous && preview.next ? (
        <div style={{ marginBottom: 8 }} data-testid="request-estimate">
          <p className="can-note" style={{ marginBottom: 6 }}>They&apos;re on the starting estimate. Approving would change it like this:</p>
          <CompareTable before={preview.previous} after={preview.next} beforeLabel="Now" afterLabel="After approval" />
        </div>
      ) : (
        <p className="can-note" style={{ marginBottom: 8 }}>There&apos;s no starting estimate yet, so no numbers change.</p>
      )}

      {step === "view" && (
        <div className="can-actions">
          <button type="button" className="ca-btn" data-variant="primary" onClick={() => { setError(""); setStep("approve") }}>Approve change</button>
          <button type="button" className="ca-btn" onClick={() => { setError(""); setStep("decline") }}>Decline</button>
        </div>
      )}

      {step === "approve" && (
        <div className="can-form" role="group" aria-label="Confirm approval">
          <p className="can-text" data-testid="approve-confirm-text">
            {preview.targetSetByCoach
              ? "Approving changes only their goal and activity level. Their target stays as you set it."
              : numbersChange
                ? `Approving changes their profile, and their starting estimate with it, from ${targetLine(preview.previous!)} to ${targetLine(preview.next!)}. They see the new numbers straight away.`
                : "Approving changes only their goal and activity level. Their starting estimate stays the same."}
          </p>
          <div className="can-actions">
            <button type="button" className="ca-btn" data-variant="primary" onClick={() => decide("approve")} disabled={saving}>{saving ? "Saving…" : "Confirm approval"}</button>
            <button type="button" className="ca-btn" onClick={() => setStep("view")} disabled={saving}>Go back</button>
          </div>
        </div>
      )}

      {step === "decline" && (
        <form className="can-form" aria-label="Decline request" onSubmit={(e) => { e.preventDefault(); decide("decline") }} noValidate>
          <div className="can-field">
            <label htmlFor={`can-pr-note-${request.id}`}>Note for the client (optional, they&apos;ll see it)</label>
            <textarea id={`can-pr-note-${request.id}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={DECLINE_NOTE_MAX} />
          </div>
          <p className="can-note">Their goal and activity level stay as they are.</p>
          <div className="can-actions">
            <button type="submit" className="ca-btn" data-variant="primary" disabled={saving}>{saving ? "Saving…" : "Confirm decline"}</button>
            <button type="button" className="ca-btn" onClick={() => setStep("view")} disabled={saving}>Go back</button>
          </div>
        </form>
      )}

      {error && <p className="can-err" role="alert">{error}</p>}

      {preview.next && step === "view" && (
        <button type="button" className="can-textbtn" onClick={() => onStartTargetChange(preview.next!)} style={{ marginTop: 8 }}>
          Start a target change with these numbers
        </button>
      )}
    </div>
  )
}
