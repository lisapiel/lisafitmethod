"use client"

import { useCallback, useEffect, useState } from "react"
import type { CoachingClientRecord } from "@/lib/authTokens"
import type { ProfileChangeRequest } from "@/lib/profileRequests"
import { adminJson, clientPath } from "./api"
import { dateTime, plural, targetLine } from "./format"
import { PendingProfileRequest } from "./PendingProfileRequest"
import { requestedSummary } from "./profileRequestText"
import type { Macros } from "./types"

const STATUS: Record<ProfileChangeRequest["status"], string> = { pending: "Waiting for you", approved: "Approved", declined: "Declined" }

// Goal and activity change requests from the client. Nothing here changes a
// target: approving changes the two profile fields, and starting a target
// change opens the normal target form, which still needs a reason.
export function ProfileRequestsCard({ email, client, onChanged, onStartTargetChange, onPendingCount }: {
  email: string
  client: CoachingClientRecord
  onChanged: () => Promise<void> | void
  onStartTargetChange: (m: Macros) => void
  onPendingCount?: (n: number) => void
}) {
  const [requests, setRequests] = useState<ProfileChangeRequest[] | null>(null)
  const [error, setError] = useState("")
  const [done, setDone] = useState("")

  const load = useCallback(async () => {
    try {
      const res = await adminJson<{ requests?: ProfileChangeRequest[] }>(clientPath(email, "/profile-requests"))
      if (res.ok && Array.isArray(res.data?.requests)) { setRequests(res.data.requests); setError("") }
      else setError("Goal and activity requests couldn't be loaded.")
    } catch {
      setError("Goal and activity requests couldn't be loaded.")
    }
  }, [email])

  useEffect(() => { load() }, [load])

  const pending = (requests ?? []).filter((r) => r.status === "pending")
  useEffect(() => { onPendingCount?.(pending.length) }, [pending.length, onPendingCount])

  async function decided(action: "approve" | "decline", next: ProfileChangeRequest[] | null) {
    if (next) setRequests(next)
    else await load()
    setDone(action === "approve" ? "Approved. Their goal and activity level are updated." : "Declined. Nothing on their profile changed.")
    await onChanged()
  }

  if (error) {
    return <section className="can-card can-o5" aria-labelledby="can-pr-h"><h2 id="can-pr-h" className="can-h">Goal and activity requests</h2><p className="can-note">{error}</p></section>
  }
  if (!requests || requests.length === 0) return null

  return (
    <section className="can-card can-o5" aria-labelledby="can-pr-h" data-testid="profile-requests-card">
      <div className="can-card-head">
        <h2 id="can-pr-h" className="can-h">Goal and activity requests</h2>
        {pending.length > 0 && <span className="can-tag">{plural(pending.length, "request")} to review</span>}
      </div>
      {done && <p className="can-ok" role="status" style={{ marginBottom: 12 }}>{done}</p>}
      {pending.map((r) => (
        <PendingProfileRequest key={r.id} email={email} client={client} request={r} onDecided={decided} onStartTargetChange={onStartTargetChange} />
      ))}
      {pending.length === 0 && !done && <p className="can-note">Nothing waiting for you.</p>}

      <hr className="can-sep" />
      <h3 className="can-h3">Request history</h3>
      <ol className="can-history" aria-label="Goal and activity request history">
        {requests.map((r) => (
          <li key={r.id}>
            <small>{dateTime(r.createdAt)} · {STATUS[r.status]}{r.decidedAt ? ` ${dateTime(r.decidedAt)}` : ""}{r.decidedBy ? ` · ${r.decidedBy}` : ""}</small>
            <span>Asked to change {requestedSummary(r.requested)}</span>
            <small>Reason: {r.reason}</small>
            {r.coachNote && <small>Your note: {r.coachNote}</small>}
            {r.status === "approved" && r.targetSetByCoach && <small>Their target stayed as you set it.</small>}
            {r.automaticEstimate?.previous && r.automaticEstimate.next && (
              <small>Starting estimate: {targetLine(r.automaticEstimate.previous)} → {targetLine(r.automaticEstimate.next)}</small>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
