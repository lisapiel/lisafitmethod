"use client"

import Link from "next/link"
import RunnerNotes from "./RunnerNotes"
import type { SportIntensity } from "@/lib/sportDay"

const INTENSITIES: Array<{ value: SportIntensity; label: string }> = [
  { value: "easy", label: "Easy" },
  { value: "moderate", label: "Moderate" },
  { value: "hard", label: "Hard" },
]

type Props = {
  meta: string
  dayLabel: string
  notes: string
  name: string
  duration: string
  intensity: SportIntensity | ""
  clientNotes: string
  error: string
  saving: boolean
  ready: boolean
  onName: (v: string) => void
  onDuration: (v: string) => void
  onIntensity: (v: SportIntensity) => void
  onClientNotes: (v: string) => void
  onSubmit: () => void
}

export default function SportDayForm(p: Props) {
  const disabled = p.saving || !p.ready
  return (
    <div className="pt pt-sport">
      <Link href="/my-coaching/workouts" className="pt-back">← Workouts</Link>
      <header className="pt-sport-head">
        <p className="pt-date">{p.meta} · Sport day</p>
        <h1>{p.dayLabel}</h1>
        {p.notes && <RunnerNotes text={p.notes} sport />}
      </header>
      <form
        className="pt-form"
        onSubmit={(e) => {
          e.preventDefault()
          p.onSubmit()
        }}
      >
        <div className="pt-field">
          <label htmlFor="sport-name">What did you play?</label>
          <input
            id="sport-name"
            className="pt-input"
            type="text"
            maxLength={80}
            value={p.name}
            onChange={(e) => p.onName(e.target.value)}
            placeholder="Soccer, tennis, hockey…"
            autoComplete="off"
            enterKeyHint="next"
          />
        </div>
        <div className="pt-field">
          <label htmlFor="sport-duration">How long, in minutes?</label>
          <input
            id="sport-duration"
            className="pt-input pt-input-short"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={p.duration}
            onChange={(e) => p.onDuration(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Minutes"
            enterKeyHint="next"
          />
        </div>
        <fieldset className="pt-field">
          <legend>How hard was it?</legend>
          <div className="pt-seg" role="radiogroup" aria-label="How hard was it?">
            {INTENSITIES.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={p.intensity === o.value}
                className="pt-seg-opt"
                onClick={() => p.onIntensity(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="pt-field">
          <label htmlFor="sport-notes">Anything to tell me? <span className="pt-optional">Optional</span></label>
          <textarea
            id="sport-notes"
            className="pt-input"
            rows={3}
            value={p.clientNotes}
            onChange={(e) => p.onClientNotes(e.target.value)}
            placeholder="How it felt, anything that hurt"
          />
        </div>
        {p.error && <p className="pt-error" role="alert">{p.error}</p>}
        <button type="submit" className="pt-btn" data-wide="" disabled={disabled}>
          {p.saving ? "Saving…" : "Save sport day"}
        </button>
      </form>
    </div>
  )
}
