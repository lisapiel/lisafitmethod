"use client"

import { useCallback, useEffect, useState } from "react"
import { activityLabel, canonicalActivityLevel, GOAL_META, type NutritionGoal } from "@/lib/nutrition"
import { PROFILE_REQUEST_REASON_MAX, type ClientProfileRequest } from "@/lib/profileRequests"
import { ACTIVITY_OPTIONS, GOAL_OPTIONS, SetupOptionList } from "./SetupOptionList"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const font = "var(--font-dm-sans), sans-serif"

const labelStyle: React.CSSProperties = { fontFamily: font, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, display: "block", margin: "0 0 6px" }
const textStyle: React.CSSProperties = { fontFamily: font, fontSize: "0.82rem", color: black, margin: 0, lineHeight: 1.55 }

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function requestedLine(r: ClientProfileRequest): string {
  const parts: string[] = []
  if (r.requested.nutritionGoal) parts.push(`Goal: ${GOAL_META[r.requested.nutritionGoal]?.label ?? r.requested.nutritionGoal}.`)
  if (r.requested.activityLevel != null) parts.push(`Activity level: ${activityLabel(r.requested.activityLevel) ?? r.requested.activityLevel}.`)
  return parts.join(" ")
}

export function requestStatusText(r: Pick<ClientProfileRequest, "status" | "decidedAt" | "coachNote">): string {
  if (r.status === "pending") return "Waiting for me to review"
  if (r.status === "approved") return r.decidedAt ? `Approved on ${longDate(r.decidedAt)}` : "Approved"
  return r.coachNote ? `Not changed: ${r.coachNote}` : "Not changed."
}

// Shown in setup once a client has chosen their goal and activity level. They
// can't change these here any more; they ask Lisa, and she reviews the request.
export function ProfileChangeRequest({ goal, activity }: { goal: NutritionGoal; activity: number }) {
  const [requests, setRequests] = useState<ClientProfileRequest[] | null>(null)
  const [open, setOpen] = useState(false)
  const [newGoal, setNewGoal] = useState<NutritionGoal | null>(null)
  const [newActivity, setNewActivity] = useState<number | null>(null)
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/coaching/profile-requests", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json() as { requests?: ClientProfileRequest[] }
      if (Array.isArray(data.requests)) setRequests(data.requests)
    } catch { /* the status line just stays hidden */ }
  }, [])

  useEffect(() => { load() }, [load])

  const latest = requests?.[0] ?? null
  const pending = latest?.status === "pending"
  const currentActivity = canonicalActivityLevel(activity) ?? activity

  function reset() {
    setNewGoal(null)
    setNewActivity(null)
    setReason("")
    setError("")
  }

  async function send() {
    if (newGoal == null && newActivity == null) { setError("Choose a new goal or a new activity level."); return }
    if (!reason.trim()) { setError("Tell me briefly why you'd like to change it."); return }
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/coaching/profile-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(newGoal != null ? { nutritionGoal: newGoal } : {}),
          ...(newActivity != null ? { activityLevel: newActivity } : {}),
          reason: reason.trim(),
        }),
      })
      const data = await res.json().catch(() => ({})) as { error?: string; requests?: ClientProfileRequest[] }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        setSending(false)
        return
      }
      if (Array.isArray(data.requests)) setRequests(data.requests)
      setOpen(false)
      setSent(true)
      reset()
    } catch {
      setError("Something went wrong. Please try again.")
    }
    setSending(false)
  }

  return (
    <div data-testid="profile-locked" style={{ marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div>
          <p style={labelStyle}>Nutrition goal</p>
          <p style={{ ...textStyle, fontSize: "1rem" }} data-testid="locked-goal">{GOAL_META[goal]?.label ?? goal}</p>
        </div>
        <div>
          <p style={labelStyle}>Activity level</p>
          <p style={{ ...textStyle, fontSize: "1rem" }} data-testid="locked-activity">{activityLabel(activity) ?? "Not set"}</p>
        </div>
      </div>

      {latest && (
        <div data-testid="request-status" role="status" style={{ background: `${accent}18`, border: `1px solid ${accent}`, borderRadius: 4, padding: "10px 12px", marginBottom: 12 }}>
          <p style={{ ...labelStyle, marginBottom: 4 }}>Your latest request</p>
          <p style={{ ...textStyle, margin: "0 0 4px" }}>{requestedLine(latest)}</p>
          <p style={{ ...textStyle, fontWeight: 700 }}>{requestStatusText(latest)}</p>
          {sent && pending && <p style={{ ...textStyle, color: muted, marginTop: 4 }}>Thanks, your request is with me. You&apos;ll see my answer here.</p>}
        </div>
      )}

      {!pending && !open && (
        <>
          <p style={{ ...textStyle, color: muted, marginBottom: 8 }}>
            Want to change your goal or activity level? Send me a request and I&apos;ll review it.
          </p>
          <button
            type="button"
            onClick={() => { reset(); setSent(false); setOpen(true) }}
            style={{ background: "none", border: `1px solid ${border}`, color: black, fontFamily: font, fontSize: "0.8rem", fontWeight: 600, padding: "8px 14px", cursor: "pointer", borderRadius: 4 }}
          >
            Request a change
          </button>
        </>
      )}

      {open && (
        <form
          aria-label="Request a change"
          onSubmit={(e) => { e.preventDefault(); send() }}
          noValidate
          style={{ border: `1px solid ${border}`, borderRadius: 6, padding: "12px", display: "flex", flexDirection: "column", gap: 12 }}
        >
          <p style={{ ...textStyle, color: muted }}>Choose what you&apos;d like to change. You can change one or both.</p>
          <div>
            <p style={labelStyle}>New nutrition goal</p>
            <SetupOptionList
              options={GOAL_OPTIONS} selected={newGoal} current={goal} label="New nutrition goal" testId="request-goal"
              onSelect={(v) => setNewGoal((g) => (g === v ? null : v))}
            />
          </div>
          <div>
            <p style={labelStyle}>New activity level</p>
            <SetupOptionList
              options={ACTIVITY_OPTIONS} selected={newActivity} current={currentActivity} label="New activity level" testId="request-activity"
              onSelect={(v) => setNewActivity((a) => (a === v ? null : v))}
            />
          </div>
          <div>
            <label htmlFor="profile-request-reason" style={labelStyle}>Why?</label>
            <textarea
              id="profile-request-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={PROFILE_REQUEST_REASON_MAX}
              rows={3}
              style={{ width: "100%", background: "#faf8f5", border: `1px solid ${border}`, color: black, padding: "10px 12px", fontFamily: font, fontSize: "1rem", outline: "none", boxSizing: "border-box", borderRadius: 4, resize: "vertical" }}
            />
            <p style={{ ...textStyle, fontSize: "0.7rem", color: muted, marginTop: 4 }}>{reason.length} of {PROFILE_REQUEST_REASON_MAX} characters</p>
          </div>
          {error && <p role="alert" style={{ fontFamily: font, fontSize: "0.78rem", color: "#c14646", margin: 0 }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={sending}
              style={{ background: sending ? "#ccc" : black, color: "#fff", border: "none", padding: "10px 16px", fontFamily: font, fontSize: "0.8rem", fontWeight: 700, cursor: sending ? "wait" : "pointer", borderRadius: 4 }}
            >
              {sending ? "Sending…" : "Send request"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); reset() }}
              disabled={sending}
              style={{ background: "none", border: `1px solid ${border}`, color: black, padding: "10px 16px", fontFamily: font, fontSize: "0.8rem", cursor: "pointer", borderRadius: 4 }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
