"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchUserAttributes } from "aws-amplify/auth"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"
const CDN = process.env.NEXT_PUBLIC_AMBRISA_CDN_URL ?? ""

// ── Types ────────────────────────────────────────────────────────────────────

type ProgramExercise = {
  exerciseId: string
  name: string
  videoS3Key: string
  sets: string
  reps: string
  weight: string
  rpe: string
  rest: string
  tempo: string
  coachNotes: string
  metric?: "reps" | "time"
}

type WarmupCooldown = { notes: string; exercises: ProgramExercise[] }
type ProgramDay = { dayLabel: string; notes: string; warmup?: WarmupCooldown; exercises: ProgramExercise[]; cooldown?: WarmupCooldown }
type ProgramWeek = { weekNumber: number; label: string; days: ProgramDay[] }

type SetEntry = { weight: string; reps: string; rpe: string; completed: boolean }
type ExerciseSetMap = Record<number, SetEntry[]> // keyed by exercise index

type PrevSetData = Array<{ exerciseId: string; setNumber: number; weight: string; reps: string; rpe: string; completed: boolean }>

type ExerciseInfo = {
  name: string
  primaryMuscle: string | null
  secondaryMuscles: string[]
  equipment: string[]
  difficulty: string | null
  execution: string | null
  coachingCues: string[]
  commonMistakes: string[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseSetsCount(s: string): number {
  const n = parseInt(s)
  return isNaN(n) || n < 1 ? 3 : Math.min(n, 10)
}

function cdnThumb(key: string) {
  return `${CDN}/${encodeURIComponent(key.replace(/\.mp4$/i, ".jpg"))}`
}

function initSets(ex: ProgramExercise, prevData?: PrevSetData): SetEntry[] {
  const count = parseSetsCount(ex.sets)
  return Array.from({ length: count }, (_, i) => {
    const prev = prevData?.find((p) => p.exerciseId === ex.exerciseId && p.setNumber === i + 1)
    return { weight: "", reps: "", rpe: "", completed: false, _prevWeight: prev?.weight ?? "", _prevReps: prev?.reps ?? "" } as SetEntry & { _prevWeight: string; _prevReps: string }
  })
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
      <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

function RpeInfoModal({ onClose }: { onClose: () => void }) {
  const rows: Array<{ n: string; label: string; desc: string }> = [
    { n: "10", label: "Maximum effort", desc: "Could not do another rep. Failure." },
    { n: "9", label: "Very hard", desc: "Could maybe squeeze out 1 more rep." },
    { n: "8", label: "Hard", desc: "Could do 2 more reps with good form." },
    { n: "7", label: "Challenging", desc: "Could do 3 more reps. Solid working weight." },
    { n: "5–6", label: "Moderate", desc: "Working, but with 4–5 reps in the tank." },
    { n: "1–4", label: "Easy", desc: "Warmup / activation range." },
  ]
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: white, borderRadius: 8, padding: "1.5rem 1.5rem 1.25rem", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}
      >
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: accent, margin: "0 0 6px" }}>
          What is RPE?
        </p>
        <h3 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.35rem", fontWeight: 700, color: black, margin: "0 0 10px" }}>
          Rate of Perceived Exertion
        </h3>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.82rem", color: muted, lineHeight: 1.5, margin: "0 0 14px" }}>
          A 1–10 rating of how hard a set felt. Answer honestly — this helps Lisa know if the weight is right and if you can push harder next week.
        </p>
        <div style={{ border: `1px solid ${border}`, borderRadius: 6, overflow: "hidden" }}>
          {rows.map((r, i) => (
            <div key={r.n} style={{ display: "grid", gridTemplateColumns: "56px 1fr", borderTop: i === 0 ? "none" : `1px solid ${border}`, padding: "8px 12px", background: i % 2 === 0 ? "#faf8f5" : "#fff" }}>
              <div style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 700, color: accent }}>{r.n}</div>
              <div>
                <div style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", fontWeight: 600, color: black }}>{r.label}</div>
                <div style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", color: muted, lineHeight: 1.4 }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{ marginTop: 16, width: "100%", background: black, color: white, border: "none", padding: "12px 20px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.06em", cursor: "pointer", borderRadius: 4 }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}

function WarmupCooldownDisplay({
  label,
  data,
  onVideoClick,
}: {
  label: "Warmup" | "Cooldown"
  data: WarmupCooldown
  onVideoClick: (key: string, name: string) => void
}) {
  const hasContent = data.notes || data.exercises.length > 0
  const [open, setOpen] = useState(true)
  if (!hasContent) return null

  return (
    <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, marginBottom: "1rem", overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "transparent", border: "none", padding: "12px 16px", cursor: "pointer",
        }}
      >
        <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, color: accent, letterSpacing: "0.14em", textTransform: "uppercase" }}>
          {label === "Warmup" ? "🔥 " : "🧘 "}{label}
          <span style={{ marginLeft: 8, color: muted, fontWeight: 400 }}>
            {data.exercises.length > 0 ? `· ${data.exercises.length} drill${data.exercises.length !== 1 ? "s" : ""}` : "· notes"}
          </span>
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <path d="M2 4l4 4 4-4" stroke={muted} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${border}` }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.68rem", color: muted, margin: "10px 0 12px", fontStyle: "italic" }}>
            No tracking — just a guide. Do this to prep{label === "Cooldown" ? " recovery" : ""}.
          </p>

          {data.notes && (
            <div style={{ background: "#faf8f5", border: `1px solid ${border}`, borderRadius: 6, padding: "10px 12px", marginBottom: data.exercises.length > 0 ? 12 : 0 }}>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: black, margin: 0, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                {data.notes}
              </p>
            </div>
          )}

          {data.exercises.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {data.exercises.map((ex, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", background: "#faf8f5", border: `1px solid ${border}`, borderRadius: 6 }}
                >
                  <div
                    onClick={() => ex.videoS3Key && onVideoClick(ex.videoS3Key, ex.name)}
                    style={{ width: 42, height: 42, borderRadius: 4, overflow: "hidden", background: "#f0ede8", flexShrink: 0, cursor: ex.videoS3Key ? "pointer" : "default", position: "relative" }}
                  >
                    {ex.videoS3Key ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cdnThumb(ex.videoS3Key)} alt={ex.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.18)" }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="6" height="6" viewBox="0 0 8 8" fill="none"><path d="M1.5 1l5.5 3-5.5 3V1Z" fill="white" /></svg>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.82rem", fontWeight: 600, color: black, margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {ex.name}
                    </p>
                    <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", color: muted, margin: 0 }}>
                      {ex.reps
                        ? ex.metric === "time" ? ex.reps : `${ex.reps} reps`
                        : "As needed"}
                    </p>
                    {ex.coachNotes && (
                      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", color: accent, margin: "2px 0 0", fontStyle: "italic" }}>
                        {ex.coachNotes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function VideoModal({ videoKey, name, onClose }: { videoKey: string; name: string; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ maxWidth: 600, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.1rem", color: "#f0e6d3", marginBottom: "0.75rem" }}>{name}</p>
        <video
          src={`${CDN}/${encodeURIComponent(videoKey)}`}
          controls autoPlay playsInline
          style={{ width: "100%", borderRadius: 4, background: "#000" }}
        />
        <button onClick={onClose} style={{ marginTop: 12, background: "none", border: "1px solid #444", color: "#888", padding: "8px 20px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", cursor: "pointer", borderRadius: 3 }}>
          Close
        </button>
      </div>
    </div>
  )
}

type ExtendedSetEntry = SetEntry & { _prevWeight?: string; _prevReps?: string }

function SetRow({
  setNum,
  entry,
  prescribed,
  onChange,
  onRpeInfoClick,
}: {
  setNum: number
  entry: ExtendedSetEntry
  prescribed: { reps: string; weight: string; rpe: string }
  onChange: (updated: SetEntry) => void
  onRpeInfoClick?: () => void
}) {
  const hint = (val: string) => (
    <div style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", color: val ? accent : "transparent", fontWeight: 600, marginBottom: 2, height: 12 }}>
      {val ? `Last: ${val}` : "—"}
    </div>
  )
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "32px 1fr 1fr 1fr 44px",
      gap: 8,
      alignItems: "end",
      padding: "8px 0",
      borderBottom: `1px solid ${entry.completed ? "#e8f4e8" : border}`,
      background: entry.completed ? "#f8fdf8" : "transparent",
      borderRadius: entry.completed ? 4 : 0,
      paddingLeft: entry.completed ? 8 : 0,
      paddingRight: entry.completed ? 8 : 0,
    }}>
      {/* Set number */}
      <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", fontWeight: 600, color: entry.completed ? "#5c9e6a" : muted, textAlign: "center", paddingBottom: 8 }}>
        {setNum}
      </span>

      {/* Weight */}
      <div>
        {hint(entry._prevWeight ?? "")}
        <div style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>Weight</div>
        <input
          type="text"
          inputMode="decimal"
          value={entry.weight}
          onChange={(e) => onChange({ ...entry, weight: e.target.value })}
          placeholder={entry._prevWeight || prescribed.weight || "—"}
          style={{
            width: "100%", background: entry.completed ? "#f0faf0" : "#faf8f5", border: `1px solid ${entry.completed ? "#c8e6c8" : border}`,
            color: black, padding: "8px 10px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem",
            fontWeight: 600, outline: "none", borderRadius: 4, boxSizing: "border-box",
          }}
        />
      </div>

      {/* Reps */}
      <div>
        {hint(entry._prevReps ?? "")}
        <div style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>Reps</div>
        <input
          type="text"
          inputMode="numeric"
          value={entry.reps}
          onChange={(e) => onChange({ ...entry, reps: e.target.value })}
          placeholder={entry._prevReps || prescribed.reps || "—"}
          style={{
            width: "100%", background: entry.completed ? "#f0faf0" : "#faf8f5", border: `1px solid ${entry.completed ? "#c8e6c8" : border}`,
            color: black, padding: "8px 10px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem",
            fontWeight: 600, outline: "none", borderRadius: 4, boxSizing: "border-box",
          }}
        />
      </div>

      {/* RPE (dropdown with info icon) */}
      <div>
        {hint("")}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
          <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase" }}>RPE</span>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onRpeInfoClick?.() }}
            aria-label="What is RPE?"
            style={{
              width: 14, height: 14, borderRadius: "50%", background: "transparent",
              border: `1px solid ${muted}`, color: muted, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontStyle: "italic",
              padding: 0, lineHeight: 1,
            }}
          >
            i
          </button>
        </div>
        <select
          value={entry.rpe}
          onChange={(e) => onChange({ ...entry, rpe: e.target.value })}
          style={{
            width: "100%", background: entry.completed ? "#f0faf0" : "#faf8f5", border: `1px solid ${entry.completed ? "#c8e6c8" : border}`,
            color: entry.rpe ? black : "#aaa", padding: "8px 8px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem",
            fontWeight: 600, outline: "none", borderRadius: 4, boxSizing: "border-box",
            appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
            backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.3' fill='none' stroke-linecap='round'/></svg>\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 8px center",
            paddingRight: 22,
          }}
        >
          <option value="">—</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={String(n)}>{n}</option>
          ))}
        </select>
      </div>

      {/* Complete toggle */}
      <button
        onClick={() => onChange({ ...entry, completed: !entry.completed })}
        style={{
          width: 36, height: 36, borderRadius: "50%",
          background: entry.completed ? "#5c9e6a" : "transparent",
          border: `2px solid ${entry.completed ? "#5c9e6a" : border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0, marginBottom: 4,
        }}
      >
        {entry.completed && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7l3 3.5 6-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </div>
  )
}

function ExerciseInfoCard({ info }: { info: ExerciseInfo | undefined }) {
  const [open, setOpen] = useState(false)
  if (!info) return null
  const hasContent = info.execution || info.coachingCues.length || info.commonMistakes.length || info.primaryMuscle || info.equipment.length
  if (!hasContent) return null

  return (
    <div style={{ borderTop: `1px solid ${border}`, background: "#fdfbf7" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "transparent", border: "none", padding: "10px 18px",
          fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 600,
          color: muted, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
        }}
      >
        <span>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ marginRight: 6, verticalAlign: "middle" }}>
            <circle cx="5.5" cy="5.5" r="4.5" stroke={accent} strokeWidth="1.2" />
            <path d="M5.5 3v3M5.5 7.5v0.5" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          How to do it
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <path d="M2 4l3 3 3-3" stroke={muted} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div style={{ padding: "0 18px 14px" }}>
          {/* Quick facts */}
          {(info.primaryMuscle || info.equipment.length > 0 || info.difficulty) && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {info.primaryMuscle && (
                <span style={{ display: "inline-block", background: "#fff", border: `1px solid ${border}`, color: black, padding: "3px 9px", borderRadius: 999, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 600 }}>
                  {info.primaryMuscle}
                </span>
              )}
              {info.equipment.slice(0, 3).map((eq) => (
                <span key={eq} style={{ display: "inline-block", background: "#fff", border: `1px solid ${border}`, color: muted, padding: "3px 9px", borderRadius: 999, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem" }}>
                  {eq}
                </span>
              ))}
              {info.difficulty && (
                <span style={{ display: "inline-block", background: `${accent}18`, border: `1px solid ${accent}55`, color: accent, padding: "3px 9px", borderRadius: 999, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.04em" }}>
                  {info.difficulty}
                </span>
              )}
            </div>
          )}

          {/* Instructions */}
          {info.execution && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, color: black, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>How To</p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", color: "#4a4540", margin: 0, lineHeight: 1.55 }}>
                {info.execution}
              </p>
            </div>
          )}

          {/* Coaching cues */}
          {info.coachingCues.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, color: accent, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>Coaching Cues</p>
              <ul style={{ margin: 0, padding: "0 0 0 16px", color: "#4a4540" }}>
                {info.coachingCues.map((c, i) => (
                  <li key={i} style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", marginBottom: 3, lineHeight: 1.5 }}>{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Common mistakes */}
          {info.commonMistakes.length > 0 && (
            <div>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, color: "#d97460", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>Avoid</p>
              <ul style={{ margin: 0, padding: "0 0 0 16px", color: "#4a4540" }}>
                {info.commonMistakes.map((m, i) => (
                  <li key={i} style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", marginBottom: 3, lineHeight: 1.5 }}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ExerciseBlock({
  ex,
  sets,
  info,
  onSetChange,
  onVideoClick,
  onRpeInfoClick,
}: {
  ex: ProgramExercise
  exIdx?: number
  sets: ExtendedSetEntry[]
  info?: ExerciseInfo
  onSetChange: (setIdx: number, updated: SetEntry) => void
  onVideoClick: () => void
  onRpeInfoClick?: () => void
}) {
  const completedCount = sets.filter((s) => s.completed).length
  const allDone = completedCount === sets.length

  return (
    <div style={{ background: white, border: `1px solid ${allDone ? "#c8e6c8" : border}`, borderRadius: 8, marginBottom: "1rem", overflow: "hidden" }}>
      {/* Exercise header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: allDone ? "#f8fdf8" : "transparent", borderBottom: `1px solid ${allDone ? "#d4ead4" : border}` }}>
        {/* Thumbnail */}
        <div
          onClick={ex.videoS3Key ? onVideoClick : undefined}
          style={{ width: 52, height: 52, borderRadius: 6, overflow: "hidden", background: "#f5f2ee", flexShrink: 0, cursor: ex.videoS3Key ? "pointer" : "default", position: "relative" }}
        >
          {ex.videoS3Key ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cdnThumb(ex.videoS3Key)} alt={ex.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.15)" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 1l5.5 3-5.5 3V1Z" fill="white" /></svg>
                </div>
              </div>
            </>
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" stroke="#ddd" strokeWidth="1.2" /><path d="M6.5 5.5l6 3.5-6 3.5V5.5Z" fill="#ddd" /></svg>
            </div>
          )}
        </div>

        {/* Name + prescription */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1rem", fontWeight: 700, color: black, margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {ex.name}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted }}>{ex.sets} sets × {ex.reps} reps</span>
            {ex.weight && <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted }}>@ {ex.weight}</span>}
            {ex.rpe && <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted }}>RPE {ex.rpe}</span>}
            {ex.rest && <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted }}>Rest {ex.rest}</span>}
          </div>
          {ex.coachNotes && (
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", color: accent, margin: "4px 0 0", fontStyle: "italic" }}>
              {ex.coachNotes}
            </p>
          )}
        </div>

        {/* Progress badge */}
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", fontWeight: 700, color: allDone ? "#5c9e6a" : muted }}>
            {completedCount}/{sets.length}
          </span>
        </div>
      </div>

      {/* Set rows */}
      <div style={{ padding: "4px 18px 12px" }}>
        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 1fr 44px", gap: 8, paddingTop: 10, marginBottom: 2 }}>
          <span></span>
          {["Weight", "Reps", "RPE", "Done"].map((h) => (
            <span key={h} style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 600, color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>
        {sets.map((s, si) => (
          <SetRow
            key={si}
            setNum={si + 1}
            entry={s}
            prescribed={{ reps: ex.reps, weight: ex.weight, rpe: ex.rpe }}
            onChange={(updated) => onSetChange(si, updated)}
            onRpeInfoClick={onRpeInfoClick}
          />
        ))}
      </div>

      {/* Collapsible exercise info */}
      <ExerciseInfoCard info={info} />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WorkoutLoggerClient() {
  const params = useParams()
  const router = useRouter()
  const weekId = parseInt(params.weekId as string)
  const dayIndex = parseInt(params.dayIndex as string)

  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [programId, setProgramId] = useState("")
  const [week, setWeek] = useState<ProgramWeek | null>(null)
  const [day, setDay] = useState<ProgramDay | null>(null)
  const [setMap, setSetMap] = useState<ExerciseSetMap>({})
  const [exerciseInfo, setExerciseInfo] = useState<Record<string, ExerciseInfo>>({})
  const [videoModal, setVideoModal] = useState<{ key: string; name: string } | null>(null)
  const [overallRpe, setOverallRpe] = useState("")
  const [clientNotes, setClientNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [alreadyLogged, setAlreadyLogged] = useState(false)
  const [existingFeedback, setExistingFeedback] = useState<{ text: string; at: string } | null>(null)
  const [showRpeInfo, setShowRpeInfo] = useState(false)

  const load = useCallback(async () => {
    try {
      const attrs = await fetchUserAttributes()
      const userEmail = attrs.email ?? ""
      setEmail(userEmail)

      const [programRes, logsRes] = await Promise.allSettled([
        fetch("/api/coaching/program").then((r) => r.json()),
        fetch("/api/coaching/workout-log").then((r) => r.json()),
      ])

      let prog: Record<string, unknown> | null = null
      if (programRes.status === "fulfilled") {
        prog = programRes.value.program
        if (prog?.id) setProgramId(prog.id as string)
      }

      if (!prog) { setLoading(false); return }

      let weeks: ProgramWeek[] = []
      try { weeks = JSON.parse(prog.weeks as string) as ProgramWeek[] } catch { /* empty */ }

      const targetWeek = weeks.find((w) => w.weekNumber === weekId) ?? null
      const targetDay = targetWeek?.days[dayIndex] ?? null
      setWeek(targetWeek)
      setDay(targetDay)

      if (!targetDay) { setLoading(false); return }

      // Check if already logged
      let prevSetData: PrevSetData = []
      if (logsRes.status === "fulfilled") {
        const myLogs = (logsRes.value.logs ?? []) as Array<Record<string, unknown>>
        const existingLog = myLogs.find((l) => Number(l.weekNumber) === weekId && l.dayLabel === targetDay.dayLabel)
        if (existingLog) {
          setAlreadyLogged(true)
          if (existingLog.coachFeedback) {
            setExistingFeedback({
              text: existingLog.coachFeedback as string,
              at: (existingLog.coachFeedbackAt as string) ?? "",
            })
            // mark seen so home page badge clears
            try {
              const seenIso = new Date().toISOString()
              localStorage.setItem("lfm-coach-feedback-seen-at", seenIso)
            } catch { /* ignore */ }
          }
          setLoading(false)
          return
        }

        // Find previous week's log for same dayLabel
        const prevLog = myLogs
          .filter((l) => l.dayLabel === targetDay.dayLabel && Number(l.weekNumber) < weekId)
          .sort((a, b) => Number(b.weekNumber) - Number(a.weekNumber))[0]
        if (prevLog) {
          try { prevSetData = JSON.parse(prevLog.setData as string) as PrevSetData } catch { /* ignore */ }
        }
      }

      // Init set map
      const initialMap: ExerciseSetMap = {}
      targetDay.exercises.forEach((ex, i) => {
        initialMap[i] = initSets(ex, prevSetData) as ExtendedSetEntry[]
      })
      setSetMap(initialMap)

      // Fetch exercise info (instructions, cues, mistakes) for each exercise in this day
      const ids = Array.from(new Set(targetDay.exercises.map((e) => e.exerciseId).filter(Boolean)))
      if (ids.length > 0) {
        try {
          const infoRes = await fetch("/api/coaching/exercise-info", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
          })
          if (infoRes.ok) {
            const data = await infoRes.json()
            setExerciseInfo(data.exercises ?? {})
          }
        } catch { /* not critical */ }
      }
    } catch { /* layout handles auth */ }
    setLoading(false)
  }, [weekId, dayIndex])

  useEffect(() => { load() }, [load])

  function updateSet(exIdx: number, setIdx: number, updated: SetEntry) {
    setSetMap((prev) => ({
      ...prev,
      [exIdx]: prev[exIdx].map((s, i) => i === setIdx ? { ...s, ...updated } : s),
    }))
  }

  async function finishWorkout() {
    if (!day || !email || !programId) return
    setSaving(true)

    const setData = day.exercises.flatMap((ex, exIdx) =>
      (setMap[exIdx] ?? []).map((s, setIdx) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.name,
        setNumber: setIdx + 1,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
        notes: "",
        completed: s.completed,
      }))
    )

    await fetch("/api/coaching/workout-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programId,
        weekNumber: weekId,
        dayLabel: day.dayLabel,
        setData: JSON.stringify(setData),
        overallRpe: overallRpe ? parseInt(overallRpe) : undefined,
        clientNotes: clientNotes || undefined,
      }),
    })

    setSaving(false)
    setSaved(true)
  }

  const completedSets = Object.values(setMap).flat().filter((s) => s.completed).length
  const totalSets = Object.values(setMap).flat().length

  if (loading) return <Spinner />

  if (!week || !day) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.4rem", color: muted }}>Workout not found</p>
        <Link href="/my-coaching/workouts" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: accent, textDecoration: "none" }}>← Back to workouts</Link>
      </div>
    )
  }

  if (alreadyLogged) {
    return (
      <div>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href="/my-coaching/workouts" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, textDecoration: "none" }}>← Workouts</Link>
        </div>
        <div style={{ background: white, border: `1px solid #c8e6c8`, borderRadius: 8, padding: "2.5rem", textAlign: "center", marginBottom: existingFeedback ? "1rem" : 0 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f0faf0", border: "2px solid #5c9e6a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12l5.5 6L20 6" stroke="#5c9e6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.5rem", fontWeight: 700, color: black, margin: "0 0 8px" }}>Already completed!</h2>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: "0 0 24px" }}>You&apos;ve already logged {week.label} — {day.dayLabel}.</p>
          <Link href="/my-coaching/workouts" style={{ display: "inline-block", background: accent, color: black, padding: "12px 28px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>View all workouts</Link>
        </div>

        {existingFeedback && (
          <div style={{ background: "#fdfbf7", border: `1px solid ${accent}`, borderLeft: `4px solid ${accent}`, borderRadius: 8, padding: "1.25rem 1.5rem" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, margin: "0 0 8px" }}>
              From Lisa{existingFeedback.at ? ` · ${(() => {
                const days = Math.floor((Date.now() - new Date(existingFeedback.at).getTime()) / 86_400_000)
                return days === 0 ? "today" : days === 1 ? "yesterday" : `${days}d ago`
              })()}` : ""}
            </p>
            <p style={{ fontFamily: "var(--font-playfair), serif", fontStyle: "italic", fontSize: "1rem", color: black, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              &ldquo;{existingFeedback.text}&rdquo;
            </p>
          </div>
        )}
      </div>
    )
  }

  if (saved) {
    return (
      <div>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href="/my-coaching/workouts" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, textDecoration: "none" }}>← Workouts</Link>
        </div>
        <div style={{ background: white, border: `1px solid #c8e6c8`, borderRadius: 8, padding: "2.5rem", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0faf0", border: "2px solid #5c9e6a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M4.5 13l6 7L21.5 6" stroke="#5c9e6a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: black, margin: "0 0 8px" }}>Workout complete! 💪</h2>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: "0 0 8px" }}>{week.label} — {day.dayLabel}</p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: "0 0 28px" }}>{completedSets} of {totalSets} sets logged.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => router.push("/my-coaching/workouts")} style={{ display: "inline-block", background: black, color: white, padding: "12px 28px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", border: "none", borderRadius: 4, cursor: "pointer" }}>
              Back to Workouts →
            </button>
            <button onClick={() => router.push("/my-coaching")} style={{ display: "inline-block", background: "transparent", color: muted, padding: "12px 20px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 400, textDecoration: "none", border: `1px solid ${border}`, borderRadius: 4, cursor: "pointer" }}>
              Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="workout-logger-page">
      <style>{`
        /* Page bottom padding scaled so finish bar + mobile bottom nav fit
           without covering the workout notes / last exercise. */
        .workout-logger-page { padding-bottom: 100px; }
        @media (max-width: 768px) {
          .workout-logger-page { padding-bottom: calc(170px + env(safe-area-inset-bottom)); }
          .workout-finish-bar { bottom: calc(64px + env(safe-area-inset-bottom)) !important; }
        }
        @media (min-width: 769px) {
          .workout-finish-bar { bottom: 0 !important; }
        }
      `}</style>

      {/* Back nav */}
      <div style={{ marginBottom: "1.25rem" }}>
        <Link href="/my-coaching/workouts" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, textDecoration: "none" }}>← Workouts</Link>
      </div>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, margin: "0 0 4px" }}>
          {week.label}
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: black, margin: "0 0 6px" }}>
          {day.dayLabel}
        </h1>
        {day.notes && <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: 0 }}>{day.notes}</p>}
      </div>

      {/* Progress bar */}
      {totalSets > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", color: muted }}>{completedSets} / {totalSets} sets complete</span>
            <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 600, color: completedSets === totalSets ? "#5c9e6a" : muted }}>
              {Math.round((completedSets / totalSets) * 100)}%
            </span>
          </div>
          <div style={{ height: 6, background: border, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", background: completedSets === totalSets ? "#5c9e6a" : accent, width: `${(completedSets / totalSets) * 100}%`, borderRadius: 3, transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}

      {/* Warmup (read-only, collapsible) */}
      {day.warmup && (
        <WarmupCooldownDisplay
          label="Warmup"
          data={day.warmup}
          onVideoClick={(key, name) => setVideoModal({ key, name })}
        />
      )}

      {/* Main workout section header (only shown when warmup or cooldown exists) */}
      {(day.warmup || day.cooldown) && (day.warmup?.notes || (day.warmup?.exercises.length ?? 0) > 0 || day.cooldown?.notes || (day.cooldown?.exercises.length ?? 0) > 0) && day.exercises.length > 0 && (
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: accent, margin: "0.5rem 0 0.75rem" }}>
          💪 Main Workout
        </p>
      )}

      {/* Exercise blocks */}
      {day.exercises.length === 0 ? (
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted }}>No exercises for this day.</p>
      ) : (
        day.exercises.map((ex, i) => (
          <ExerciseBlock
            key={i}
            ex={ex}
            exIdx={i}
            sets={(setMap[i] ?? []) as ExtendedSetEntry[]}
            info={exerciseInfo[ex.exerciseId]}
            onSetChange={(si, updated) => updateSet(i, si, updated)}
            onVideoClick={() => ex.videoS3Key && setVideoModal({ key: ex.videoS3Key, name: ex.name })}
            onRpeInfoClick={() => setShowRpeInfo(true)}
          />
        ))
      )}

      {/* Cooldown (read-only, collapsible) */}
      {day.cooldown && (
        <WarmupCooldownDisplay
          label="Cooldown"
          data={day.cooldown}
          onVideoClick={(key, name) => setVideoModal({ key, name })}
        />
      )}

      {/* Post-workout notes */}
      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.25rem", marginTop: "0.5rem", marginBottom: "1.5rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, margin: "0 0 12px" }}>Workout notes</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: muted }}>Overall RPE (1–10)</label>
              <button
                type="button"
                onClick={() => setShowRpeInfo(true)}
                aria-label="What is RPE?"
                style={{
                  width: 14, height: 14, borderRadius: "50%", background: "transparent",
                  border: `1px solid ${muted}`, color: muted, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontStyle: "italic",
                  padding: 0, lineHeight: 1,
                }}
              >
                i
              </button>
            </div>
            <select
              value={overallRpe}
              onChange={(e) => setOverallRpe(e.target.value)}
              style={{
                width: "100%", background: "#faf8f5", border: `1px solid ${border}`,
                color: overallRpe ? black : "#aaa", padding: "9px 12px",
                fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem",
                fontWeight: 600, outline: "none", borderRadius: 4, boxSizing: "border-box",
                appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
                backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.3' fill='none' stroke-linecap='round'/></svg>\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                paddingRight: 26,
              }}
            >
              <option value="">—</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={String(n)}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: muted, display: "block", marginBottom: 4 }}>Any notes for Lisa?</label>
          <textarea
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            placeholder="How did the workout feel? Any injuries or issues?"
            rows={3}
            style={{ width: "100%", background: "#faf8f5", border: `1px solid ${border}`, color: black, padding: "9px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", outline: "none", resize: "none", borderRadius: 4, boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Sticky finish bar — positioned above the mobile bottom nav on phones
          so the "Finish Workout" button isn't hidden behind it. */}
      <div className="workout-finish-bar" style={{ position: "fixed", left: 0, right: 0, background: white, borderTop: `1px solid ${border}`, padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 50 }}>
        <div>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, color: black, margin: 0 }}>
            {completedSets === totalSets && totalSets > 0 ? "All sets done! 🎉" : `${completedSets}/${totalSets} sets`}
          </p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: muted, margin: 0 }}>
            {day.exercises.length} exercises
          </p>
        </div>
        <button
          onClick={finishWorkout}
          disabled={saving}
          style={{
            background: saving ? "#ccc" : black,
            color: white,
            border: "none",
            padding: "14px 32px",
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            cursor: saving ? "wait" : "pointer",
            borderRadius: 4,
            flexShrink: 0,
          }}
        >
          {saving ? "Saving…" : "Finish Workout"}
        </button>
      </div>

      {/* Video modal */}
      {videoModal && (
        <VideoModal videoKey={videoModal.key} name={videoModal.name} onClose={() => setVideoModal(null)} />
      )}

      {/* RPE info modal */}
      {showRpeInfo && (
        <RpeInfoModal onClose={() => setShowRpeInfo(false)} />
      )}
    </div>
  )
}
