"use client"

import { useEffect, useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { DEFAULT_OPTIONS, type WarmupOptions } from "@/lib/warmups/engine"
import type { ProfileSuggestion, WarmupProfile } from "@/lib/warmups/profile"
import type { AutoMode } from "./useAutoSequences"
import { Flags, WarmupStyles, wu } from "./WarmupUi"

const FIELDS: Array<{ key: keyof WarmupOptions; label: string; hint: string }> = [
  { key: "beginner", label: "Beginner substitutions", hint: "Lateral Lunge instead of Cossack Squat on leg days." },
  { key: "bands", label: "Bands available", hint: "Adds the band drills to upper-body warm-ups." },
  { key: "backSafe", label: "Pigeon Pose is fine for their back", hint: "Off uses Figure 4 Stretch instead on leg and full-body days." },
  { key: "foamRoller", label: "Foam roller available", hint: "Adds Foam Roller Glutes Stretch to leg-day cool-downs." },
]

type Loaded = { profile: WarmupProfile | null; suggestion: ProfileSuggestion; options: WarmupOptions }

async function authed(path: string, init?: RequestInit) {
  const token = (await fetchAuthSession()).tokens?.accessToken?.toString()
  if (!token) throw new Error("Not signed in")
  const res = await fetch(path, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}`, "Content-Type": "application/json" } })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}

export default function WarmupSettingsPanel({ mode, clientEmail, clientName, templateOptions, onOptions, totals, onAddAllEmpty, onUpdateAllOutdated, paused, onResume }: {
  mode: AutoMode
  clientEmail?: string | null
  clientName?: string
  templateOptions?: WarmupOptions
  onOptions: (o: WarmupOptions) => void
  totals: { empty: number; outdated: number }
  onAddAllEmpty: () => void
  onUpdateAllOutdated: () => void
  paused?: boolean
  onResume?: () => void
}) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [draft, setDraft] = useState<WarmupOptions>(templateOptions ?? DEFAULT_OPTIONS)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (mode !== "client" || !clientEmail) return
    authed(`/api/admin/coaching/clients/${encodeURIComponent(clientEmail)}/warmup-profile`)
      .then((d: Loaded) => { setLoaded(d); setDraft(d.options); onOptions(d.options) })
      .catch(() => setMessage("Couldn't load this client's warm-up settings. Suggestions use safe defaults."))
    // onOptions is a stable setter from the page; loading once per client is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, clientEmail])

  useEffect(() => { if (mode === "template" && templateOptions) setDraft(templateOptions) }, [mode, templateOptions])

  function toggle(key: keyof WarmupOptions, value: boolean) {
    const next = { ...draft, [key]: value }
    setDraft(next)
    setMessage("")
    if (mode === "template") onOptions(next)
  }

  async function saveProfile() {
    if (!clientEmail) return
    setSaving(true); setMessage("")
    try {
      const d = (await authed(`/api/admin/coaching/clients/${encodeURIComponent(clientEmail)}/warmup-profile`, {
        method: "PUT", body: JSON.stringify(draft),
      })) as Loaded
      setLoaded(d); setDraft(d.options); onOptions(d.options)
      setMessage("Saved. These settings apply to every program for this client.")
    } catch { setMessage("Not saved. Check your connection and try again.") }
    setSaving(false)
  }

  const dirty = mode === "client" && loaded && FIELDS.some((f) => draft[f.key] !== loaded.options[f.key])
  const needsEye = mode === "client" && !!loaded && !loaded.profile && loaded.suggestion.flags.length > 0
  const summary = [
    draft.beginner ? "beginner substitutions" : "standard progressions",
    draft.bands ? "bands" : "no bands",
    draft.backSafe ? "Pigeon Pose" : "Figure 4 instead of Pigeon",
    draft.foamRoller ? "foam roller" : "no foam roller",
  ].join(" · ")
  const source = mode === "client" ? (loaded?.profile ? "set by you" : loaded ? "from their intake" : "loading…") : "for this template"

  return (
    <section aria-labelledby="wu-settings-title" style={{ background: wu.card, border: `1px solid ${wu.line}`, borderRadius: 8, padding: "14px 18px", marginBottom: "1.5rem" }}>
      <WarmupStyles />
      <details open={needsEye || undefined}>
        <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 12px", minHeight: 32 }}>
          <h2 id="wu-settings-title" style={{ fontFamily: wu.font, fontSize: "0.9375rem", fontWeight: 600, color: wu.cream, margin: 0 }}>
            Warm-ups and cool-downs: automatic
          </h2>
          <span style={{ fontFamily: wu.font, fontSize: "0.8125rem", color: wu.muted }}>{summary} ({source})</span>
          <span style={{ fontFamily: wu.font, fontSize: "0.8125rem", fontWeight: 600, color: wu.gold, textDecoration: "underline", textUnderlineOffset: 3 }}>Adjust</span>
        </summary>
        <p style={{ fontFamily: wu.font, fontSize: "0.8125rem", lineHeight: 1.55, color: wu.muted, margin: "10px 0", maxWidth: "70ch" }}>
          {mode === "client"
            ? `Chosen from your sequences using ${clientName ? `${clientName}'s` : "this client's"} settings. Days you add are filled automatically; days already in the program change only when you apply a suggestion and save.`
            : "Chosen from your sequences for every day with exercises. Anything you edit by hand stays as you set it."}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", columnGap: 24 }}>
          {FIELDS.map((f) => {
            const reason = mode === "client" ? loaded?.suggestion.reasons[f.key] : undefined
            const saved = mode === "client" && typeof loaded?.profile?.[f.key] === "boolean"
            return (
              <label key={f.key} className="wu-toggle">
                <input type="checkbox" checked={draft[f.key]} onChange={(e) => toggle(f.key, e.target.checked)} />
                <span className="wu-switch" aria-hidden />
                <span>
                  <span style={{ display: "block", fontFamily: wu.font, fontSize: "0.875rem", color: wu.cream }}>{f.label}</span>
                  <span style={{ display: "block", fontFamily: wu.font, fontSize: "0.75rem", lineHeight: 1.5, color: wu.muted }}>
                    {saved ? "Set by you. " : reason ? `Suggested: ${reason}. ` : ""}{f.hint}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
        {mode === "client" && (dirty || needsEye) && (
          <div style={{ marginTop: 10 }}>
            <button type="button" className="wu-btn wu-btn-primary" onClick={saveProfile} disabled={saving}>
              {saving ? "Saving…" : dirty ? "Save settings" : "Confirm settings"}
            </button>
          </div>
        )}
      </details>

      {needsEye && <Flags flags={loaded!.suggestion.flags} />}

      {(totals.empty > 0 && mode === "client") || totals.outdated > 0 || (paused && onResume) || message ? (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginTop: 10 }}>
          {totals.empty > 0 && mode === "client" && (
            <button type="button" className="wu-btn wu-btn-quiet" onClick={onAddAllEmpty}>
              Add suggestions to {totals.empty} empty {totals.empty === 1 ? "sequence" : "sequences"}
            </button>
          )}
          {totals.outdated > 0 && (
            <button type="button" className="wu-btn wu-btn-quiet" onClick={onUpdateAllOutdated}>
              Update {totals.outdated} automatic {totals.outdated === 1 ? "sequence" : "sequences"}
            </button>
          )}
          {paused && onResume && (
            <button type="button" className="wu-btn wu-btn-quiet" onClick={onResume}>Resume automatic filling</button>
          )}
          {message && <p role="status" style={{ margin: 0, fontFamily: wu.font, fontSize: "0.8125rem", color: message.startsWith("Saved") ? wu.ok : wu.warn }}>{message}</p>}
        </div>
      ) : null}
    </section>
  )
}
