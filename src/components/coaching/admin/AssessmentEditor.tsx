"use client"

import { useEffect, useState } from "react"
import type { AssessmentRecord } from "@/lib/coachingRecords"
import { FORM_FEEDBACK_MAX } from "@/lib/checkInAnswers"

type Form = { wentWell: string; toImprove: string; changes: string; formFeedback: string; priorities: [string, string, string]; privateNote: string; emailRequested: boolean }
const EMPTY: Form = { wentWell: "", toImprove: "", changes: "", formFeedback: "", priorities: ["", "", ""], privateNote: "", emailRequested: false }

function fromRecord(a: AssessmentRecord): Form {
  const p = [...(a.priorities ?? []), "", "", ""].slice(0, 3) as [string, string, string]
  return { wentWell: a.wentWell ?? "", toImprove: a.toImprove ?? "", changes: a.changes ?? "", formFeedback: a.formFeedback ?? "", priorities: p, privateNote: a.privateNote ?? "", emailRequested: !!a.emailRequested }
}

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "")

export default function AssessmentEditor({ token, checkInId, clientFirstName, legacyFeedback, formReviewRequested = false, onSent }: {
  token: string
  checkInId: string
  clientFirstName: string
  legacyFeedback: string | null
  // True when the check-in has form-review videos; only then is there a Form feedback part.
  formReviewRequested?: boolean
  onSent: () => void
}) {
  const [rec, setRec] = useState<AssessmentRecord | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState<"" | "save" | "send" | "email">("")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [confirmSend, setConfirmSend] = useState(false)
  const url = `/api/admin/coaching/check-ins/${encodeURIComponent(checkInId)}/assessment`
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

  useEffect(() => {
    if (!token) return
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: { assessment: AssessmentRecord | null }) => { if (d.assessment) { setRec(d.assessment); setForm(fromRecord(d.assessment)) } })
      .catch(() => setError("Couldn't load the assessment. Refresh to try again."))
      .finally(() => setLoaded(true))
  }, [token, url])

  const sent = rec?.status === "sent"
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setForm((f) => ({ ...f, [k]: v })); setStatus("") }
  const payload = () => ({ ...form, formFeedback: formReviewRequested ? form.formFeedback : "", priorities: form.priorities.map((p) => p.trim()).filter(Boolean) })
  const empty = !form.wentWell.trim() && !form.toImprove.trim() && !form.changes.trim() && !(formReviewRequested && form.formFeedback.trim()) && form.priorities.every((p) => !p.trim())

  async function save(): Promise<AssessmentRecord | null> {
    setBusy("save"); setError("")
    try {
      const r = await fetch(url, { method: "PUT", headers, body: JSON.stringify(payload()) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setRec(d.assessment); setStatus(sent ? `Changes saved. ${clientFirstName || "Your client"} sees the updated version.` : "Draft saved. Only you can see it.")
      return d.assessment
    } catch (e) { setError(e instanceof Error && e.message ? e.message : "That didn't save. Try again."); return null } finally { setBusy("") }
  }

  async function send() {
    const saved = await save()
    if (!saved) return
    setBusy("send"); setError("")
    try {
      const r = await fetch(url, { method: "POST", headers, body: JSON.stringify({ send: true, emailRequested: form.emailRequested }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setRec(d.assessment); setConfirmSend(false)
      setStatus(`Sent to ${clientFirstName || "your client"}.${d.email === "sent" ? " Email sent." : d.email === "skipped" ? " Email isn't set up here, so none was sent." : d.email === "failed" ? " The email didn't go through." : ""}`)
      onSent()
    } catch (e) { setError(e instanceof Error && e.message ? e.message : "That didn't send. Try again.") } finally { setBusy("") }
  }

  async function emailUpdate() {
    setBusy("email"); setError("")
    try {
      const r = await fetch(url, { method: "POST", headers, body: JSON.stringify({ emailUpdate: true }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setRec(d.assessment)
      setStatus(d.email === "sent" ? "Email sent." : d.email === "skipped" ? "Email isn't set up here, so none was sent." : d.email === "failed" ? "The email didn't go through." : "This version was already emailed.")
    } catch (e) { setError(e instanceof Error && e.message ? e.message : "That didn't send. Try again.") } finally { setBusy("") }
  }

  if (!loaded) return <section className="ca-assess"><p className="ca-assess-muted">Loading assessment…</p></section>

  const field = (k: "wentWell" | "toImprove" | "changes" | "formFeedback", label: string, hint: string, maxLength?: number) => (
    <div className="ca-assess-field">
      <label htmlFor={`as-${k}`}>{label}</label>
      <textarea id={`as-${k}`} rows={3} value={form[k]} maxLength={maxLength} onChange={(e) => set(k, e.target.value)} placeholder={hint} />
    </div>
  )

  return (
    <section className="ca-assess" aria-label="Your assessment">
      <div className="ca-assess-head">
        <h2>Your assessment</h2>
        <span className="ca-assess-state" data-sent={sent ? "" : undefined}>{sent ? `Sent ${when(rec?.sentAt)}${rec && rec.version > 1 ? ` · version ${rec.version}` : ""}` : rec ? `Draft · saved ${when(rec.updatedAt)}` : "Not started"}</span>
      </div>
      {legacyFeedback && !rec && (
        <div className="ca-assess-legacy"><b>Earlier feedback on this check-in</b><p>{legacyFeedback}</p></div>
      )}
      <p className="ca-assess-shared">The {formReviewRequested ? "five" : "four"} parts below are shared with {clientFirstName || "your client"} when you send.</p>
      {field("wentWell", "What's going well", "Wins worth naming")}
      {field("toImprove", "What to improve", "One or two things, kindly")}
      {field("changes", "What we're changing", "Or \"nothing yet\"")}
      {formReviewRequested && field("formFeedback", "Form feedback", "Technique notes on the videos they sent", FORM_FEEDBACK_MAX)}
      <fieldset className="ca-assess-field">
        <legend>Priorities for next week <span>They can tick these off</span></legend>
        {form.priorities.map((p, i) => (
          <input key={i} aria-label={`Priority ${i + 1}`} value={p} maxLength={200} placeholder={i === 0 ? "e.g. Protein at every meal" : "Optional"} onChange={(e) => { const next = [...form.priorities] as Form["priorities"]; next[i] = e.target.value; set("priorities", next) }} />
        ))}
      </fieldset>
      <div className="ca-assess-field ca-assess-private">
        <label htmlFor="as-private">Private note · only you see this</label>
        <textarea id="as-private" rows={3} value={form.privateNote} onChange={(e) => set("privateNote", e.target.value)} placeholder="Never shared, emailed or messaged" />
      </div>
      {!sent && (
        <label className="ca-assess-check"><input type="checkbox" checked={form.emailRequested} onChange={(e) => set("emailRequested", e.target.checked)} />Also email {clientFirstName || "them"} a summary (your private note is never included)</label>
      )}
      {error && <p className="ca-assess-error" role="alert">{error}</p>}
      {status && <p className="ca-assess-status" role="status">{status}</p>}
      {confirmSend ? (
        <div className="ca-assess-confirm" role="alertdialog" aria-label="Confirm send">
          <p>Send this to {clientFirstName || "your client"}? They&apos;ll see it on Home and under Check-in{form.emailRequested ? ", and get one email" : ""}. Nothing about their targets or program changes.</p>
          <div className="ca-assess-actions">
            <button type="button" className="ca-btn-primary" disabled={!!busy} onClick={send}>{busy === "send" || busy === "save" ? "Sending…" : "Send now"}</button>
            <button type="button" className="ca-btn-quiet" onClick={() => setConfirmSend(false)}>Not yet</button>
          </div>
        </div>
      ) : (
        <div className="ca-assess-actions">
          {sent ? (
            <>
              <button type="button" className="ca-btn-primary" disabled={!!busy} onClick={save}>{busy === "save" ? "Saving…" : "Save changes"}</button>
              {rec && rec.emailedVersion !== rec.version && <button type="button" className="ca-btn-quiet" disabled={!!busy} onClick={emailUpdate}>{busy === "email" ? "Sending…" : rec.emailedVersion ? "Email this update" : "Email a summary"}</button>}
            </>
          ) : (
            <>
              <button type="button" className="ca-btn-primary" disabled={!!busy || empty} onClick={() => setConfirmSend(true)}>Send to {clientFirstName || "client"}</button>
              <button type="button" className="ca-btn-quiet" disabled={!!busy} onClick={save}>{busy === "save" ? "Saving…" : "Save draft"}</button>
            </>
          )}
        </div>
      )}
      <p className="ca-assess-muted">Changing their targets or program is a separate step on their Nutrition or Program tab.</p>
      {rec?.versions && rec.versions.length > 0 && (
        <details className="ca-assess-history">
          <summary>Earlier versions ({rec.versions.length})</summary>
          {[...rec.versions].reverse().map((v) => (
            <div key={v.version}><b>Version {v.version} · {when(v.sentAt)}</b><p>{[v.wentWell, v.toImprove, v.changes, v.formFeedback].filter(Boolean).join(" / ")}</p></div>
          ))}
        </details>
      )}
    </section>
  )
}
