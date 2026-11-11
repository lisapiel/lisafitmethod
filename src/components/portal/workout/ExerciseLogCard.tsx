"use client"

import { useId, useState, type ReactNode } from "react"
import { bestSet, lastTimeSummary, withUnit, type LoggedSet } from "@/lib/exercisePerformance"
import "./exercise-card.css"

export type CardExercise = {
  name: string
  reps: string
  weight: string
  rpe: string
  rest: string
  coachNotes: string
}

export type CardSet = { weight: string; reps: string; rpe: string; completed: boolean; _prevWeight?: string; _prevReps?: string }

type Props = {
  ex: CardExercise
  sets: CardSet[]
  thumbUrl: string
  canPlay: boolean
  onThumbError: (e: { currentTarget: HTMLImageElement }) => void
  history: LoggedSet[]
  lastSets: LoggedSet[] | null
  sessionRpe?: number
  unit: "lb" | "kg"
  showRest: boolean
  onSetChange: (setIdx: number, updated: CardSet) => void
  onVideoClick: () => void
  onWeightInfo: () => void
  onRpeInfo: () => void
  howTo: ReactNode
}

function LastTimeValue({ sets, unit }: { sets: LoggedSet[]; unit: "lb" | "kg" }) {
  const s = lastTimeSummary(sets)
  if (!s) return null
  if (s.kind === "reps") return <span className="xc-val"><span className="xc-nw">{s.reps.join(" / ")}</span> reps</span>
  if (s.kind === "same") return <span className="xc-val"><span className="xc-nw">{withUnit(s.weight, unit)} ×</span> <span className="xc-nw">{s.reps.join(" / ")}</span></span>
  return <span className="xc-val">{s.lines.map((l, i) => <span key={i}>{withUnit(l.weight, unit)} × {l.reps}</span>)}</span>
}

export function ExerciseLogCard({ ex, sets, thumbUrl, canPlay, onThumbError, history, lastSets, sessionRpe, unit, showRest, onSetChange, onVideoClick, onWeightInfo, onRpeInfo, howTo }: Props) {
  const [cuesOpen, setCuesOpen] = useState(false)
  const cuesId = useId()
  const done = sets.filter((s) => s.completed).length
  const allDone = sets.length > 0 && done === sets.length
  const best = bestSet(history)
  const last = lastSets && lastTimeSummary(lastSets) ? lastSets : null
  const notes = ex.coachNotes.trim()

  return (
    <article className="xc" data-done={allDone || undefined}>
      <div className="xc-in">
        <div className="xc-head">
          <h3 className="xc-name">{ex.name}</h3>
          <span className="xc-count" aria-label={`${done} of ${sets.length} sets done`}>{allDone ? "✓ " : ""}{done}/{sets.length}</span>
        </div>
        <span className="xc-rule" aria-hidden="true" />

        <div className="xc-media">
          <button type="button" className="xc-vid" disabled={!canPlay} onClick={canPlay ? onVideoClick : undefined} aria-label={canPlay ? `Play the ${ex.name} video` : `${ex.name} (no video)`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {canPlay && thumbUrl ? <img src={thumbUrl} onError={onThumbError} alt="" /> : null}
            <span className="xc-play" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 8 8"><path d="M1.5 1l5.5 3-5.5 3V1Z" fill={canPlay ? "#fff" : "#ccc"} /></svg>
            </span>
          </button>

          <div className="xc-perf">
            {best && (
              <div className="xc-stat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6M10 17h4" /></svg>
                <div><span className="xc-lbl">Best</span><span className="xc-val">{withUnit(best.weight, unit)} × {best.reps}</span></div>
              </div>
            )}
            {notes && (
              <button type="button" className="xc-cuebtn" aria-expanded={cuesOpen} aria-controls={cuesId} onClick={() => setCuesOpen((v) => !v)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
                Cues
                <svg className="xc-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
            )}
            {(best || notes) && <div className="xc-sep" />}
            {last ? (
              <div>
                <span className="xc-lbl">Last time</span>
                <LastTimeValue sets={last} unit={unit} />
                {sessionRpe != null && <span className="xc-sub">Session RPE {sessionRpe}</span>}
              </div>
            ) : (
              <p className="xc-quiet">First time logging this one. Today sets your starting point.</p>
            )}
          </div>
        </div>

        {notes && (
          <div className="xc-cues" id={cuesId} hidden={!cuesOpen}>
            <b>From Lisa</b>
            <p>{notes}</p>
          </div>
        )}

        <div className="xc-sets">
          <div className="xc-grid xc-th">
            <span />
            <span>
              Weight
              <button type="button" className="xc-info" onClick={onWeightInfo} aria-label="How to log weight for this exercise">
                <InfoIcon />
              </button>
            </span>
            <span>Reps</span>
            <span>
              RPE
              <button type="button" className="xc-info" onClick={onRpeInfo} aria-label="What is RPE?">
                <InfoIcon />
              </button>
            </span>
            <span>Done</span>
          </div>
          {sets.map((s, i) => (
            <SetLogRow key={i} n={i + 1} entry={s} ex={ex} onChange={(u) => onSetChange(i, u)} />
          ))}
        </div>

        {showRest && ex.rest.trim() && (
          <p className="xc-rest">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
            Rest {ex.rest.trim()} between sets
          </p>
        )}
      </div>
      <div className="xc-howto">{howTo}</div>
    </article>
  )
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" /><path d="M12 11v6M12 7.5v.5" strokeLinecap="round" />
    </svg>
  )
}

// Placeholders are the targets (or last time's weight) and are never saved:
// only what the client types goes into the set. A finished set with an empty
// box shows a dash, so a grey target can't be mistaken for a logged value.
function SetLogRow({ n, entry, ex, onChange }: { n: number; entry: CardSet; ex: CardExercise; onChange: (u: CardSet) => void }) {
  const done = entry.completed
  const weightTarget = done ? "—" : ex.weight.trim() || entry._prevWeight || "—"
  const repsTarget = done ? "—" : ex.reps.trim() || entry._prevReps || "—"
  const rpeTarget = done ? "—" : ex.rpe.trim() || "—"
  const [repsMain, ...repsRest] = repsTarget.split("/")
  const twoLine = !done && repsRest.length > 0 && repsMain.trim() !== ""
  const repsLabel = `Set ${n} reps${ex.reps.trim() ? `, target ${ex.reps.trim()}` : ""}`

  return (
    <div className="xc-grid xc-row" data-done={done || undefined}>
      <span className="xc-num">{n}</span>
      <input
        className="xc-field" type="text" inputMode="decimal" aria-label={`Set ${n} weight`}
        value={entry.weight} placeholder={weightTarget}
        onChange={(e) => onChange({ ...entry, weight: e.target.value })}
      />
      {twoLine ? (
        <span className="xc-rw">
          <input
            className="xc-field" type="text" inputMode="numeric" aria-label={repsLabel}
            value={entry.reps} placeholder=" "
            onChange={(e) => onChange({ ...entry, reps: e.target.value })}
          />
          <span className="xc-ov" aria-hidden="true">{repsMain}<small>/{repsRest.join("/")}</small></span>
        </span>
      ) : (
        <input
          className="xc-field" type="text" inputMode="numeric" aria-label={repsLabel}
          value={entry.reps} placeholder={repsTarget}
          onChange={(e) => onChange({ ...entry, reps: e.target.value })}
        />
      )}
      <span className="xc-sel">
        <select
          className="xc-field" aria-label={`Set ${n} RPE${ex.rpe.trim() ? `, target ${ex.rpe.trim()}` : ""}`}
          value={entry.rpe} data-empty={entry.rpe ? undefined : ""}
          onChange={(e) => onChange({ ...entry, rpe: e.target.value })}
        >
          <option value="">{rpeTarget}</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => <option key={v} value={String(v)}>{v}</option>)}
        </select>
        <svg width="10" height="8" viewBox="0 0 10 8" aria-hidden="true"><path d="M1 2l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
      </span>
      <button type="button" className="xc-done" aria-pressed={done} aria-label={`Set ${n} done`} onClick={() => onChange({ ...entry, completed: !done })}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
      </button>
    </div>
  )
}
