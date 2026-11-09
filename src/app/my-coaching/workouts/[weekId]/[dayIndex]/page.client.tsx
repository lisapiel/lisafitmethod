"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { fetchUserAttributes } from "aws-amplify/auth"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { expandedWeeks, notesWithIntro } from "@/lib/programExpansion"
import { newSubmissionId, submitFailureMessage, submitWorkoutLog } from "@/lib/workoutSubmit"
import { workoutDraftKey, legacyWorkoutDraftKey } from "@/lib/workoutDraftKey"
import { cdnUrl, thumbFallback } from "@/lib/cdnUrl"
import RunnerNotes from "@/components/portal/RunnerNotes"
import SportDayForm from "@/components/portal/SportDayForm"
import { sportSummary } from "@/lib/sportDay"

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
  // Optional grouping token — adjacent exercises sharing the same id
  // render inside one SupersetBlock. Absent for legacy programs.
  supersetGroupId?: string
}

// Contiguous run of program exercises that share a supersetGroupId.
// Runs of length 1 are still returned (solo exercises), so callers can
// walk the returned array without a second branching path.
type SupersetGroup = {
  id: string | null
  exercises: Array<{ index: number; ex: ProgramExercise }>
}

function groupSupersets(exercises: ProgramExercise[]): SupersetGroup[] {
  const groups: SupersetGroup[] = []
  exercises.forEach((ex, index) => {
    const gid = ex.supersetGroupId ?? null
    const last = groups[groups.length - 1]
    if (gid && last && last.id === gid) {
      last.exercises.push({ index, ex })
    } else {
      groups.push({ id: gid, exercises: [{ index, ex }] })
    }
  })
  return groups
}

type WarmupCooldown = { notes: string; exercises: ProgramExercise[] }
type ProgramDay = {
  dayLabel: string
  notes: string
  warmup?: WarmupCooldown
  exercises: ProgramExercise[]
  cooldown?: WarmupCooldown
  // When present, this day is NOT a strength workout — the runner renders
  // the SportDayForm instead of the exercise blocks. Absent = strength
  // day (every existing program). Backward-compatible: readers that
  // don't know this field simply ignore it.
  dayType?: "sport"
}
type ProgramWeek = { weekNumber: number; label: string; days: ProgramDay[] }

type SetEntry = { weight: string; reps: string; rpe: string; completed: boolean }
type ExerciseSetMap = Record<number, SetEntry[]> // keyed by exercise index

type PrevSetData = Array<{ exerciseId: string; setNumber: number; weight: string; reps: string; rpe: string; completed: boolean }>

// Per-exercise summary of the client's PREVIOUS logged performance for this
// exercise. Derived from the most recent workout log that contains any set
// for the exerciseId, scanned across all programs so progressive overload
// stays visible when a coach reuses an exercise in a new program.
// `sessionRpe` is the overall RPE recorded on THAT log — the log the sets
// came from — not the overall RPE of the newest workout. The runner labels
// this unambiguously as "Previous session RPE" because overallRpe is a
// workout-wide number, not per-exercise.
type PrevExerciseSummary = {
  sets: PrevSetData
  sessionRpe?: number
  completedAt?: string
}
type PrevByExercise = Record<string, PrevExerciseSummary>

type ExerciseInfo = {
  name: string
  // videoS3Key resolved from the canonical exercise library. Takes
  // precedence over the videoS3Key that was copied into the program's
  // weeks JSON at save time — older or bulk-created programs may have
  // missing/stale embedded keys, and the library is the source of truth.
  videoS3Key: string
  primaryMuscle: string | null
  secondaryMuscles: string[]
  equipment: string[]
  difficulty: string | null
  execution: string | null
  coachingCues: string[]
  commonMistakes: string[]
}

// Canonical library first; fall back to the embedded program value so a
// coach who intentionally overrode the video (or a program built before
// the library backfill) still renders. Returns an empty string when
// neither source has a key — callers gate their thumbnail/play button
// on the returned value being truthy.
function videoKeyFor(ex: { exerciseId: string; videoS3Key: string }, info?: ExerciseInfo): string {
  return info?.videoS3Key || ex.videoS3Key || ""
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseSetsCount(s: string): number {
  const n = parseInt(s)
  return isNaN(n) || n < 1 ? 3 : Math.min(n, 10)
}

function cdnThumb(key: string) {
  return cdnUrl(CDN, key.replace(/\.mp4$/i, ".jpg"))
}

// Draft persistence for in-progress workouts. Keeps the client's typed
// weight/reps/RPE/completed alive across app backgrounding, screen locks, and
// PWA tab kills so they don't lose their work.
type WorkoutDraft = {
  setMap: ExerciseSetMap
  overallRpe: string
  clientNotes: string
  // "|"-joined exerciseIds, used to invalidate the draft if the coach edits
  // the day's exercise lineup after the client started logging.
  exerciseSignature: string
  savedAt: string
  // Reused on every retry of this workout so the server stores it only once.
  submissionId?: string
}

function readWorkoutDraft(key: string): WorkoutDraft | null {
  try {
    if (typeof window === "undefined") return null
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as WorkoutDraft
    if (!parsed || typeof parsed !== "object" || !parsed.setMap) return null
    return parsed
  } catch { return null }
}

function clearWorkoutDraft(key: string) {
  try { if (typeof window !== "undefined") localStorage.removeItem(key) } catch { /* ignore */ }
}

function initSets(ex: ProgramExercise, prevData?: PrevSetData): SetEntry[] {
  const count = parseSetsCount(ex.sets)
  return Array.from({ length: count }, (_, i) => {
    const prev = prevData?.find((p) => p.exerciseId === ex.exerciseId && p.setNumber === i + 1)
    // Hints are stored on the entry so the SetRow can read them from the
    // same shape it edits. They're stripped before persistence (see the
    // draft-save effect) so the hint fields never leak into the log.
    return {
      weight: "", reps: "", rpe: "", completed: false,
      _prevWeight: prev?.weight ?? "",
      _prevReps: prev?.reps ?? "",
      _prevRpe: prev?.rpe ?? "",
    } as SetEntry & { _prevWeight: string; _prevReps: string; _prevRpe: string }
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
    { n: "10", label: "Maximum effort", desc: "You couldn't do another rep. This is failure." },
    { n: "9", label: "Very hard", desc: "You could maybe squeeze out 1 more rep." },
    { n: "8", label: "Hard", desc: "You could do 2 more reps with good form." },
    { n: "7", label: "Challenging", desc: "You could do 3 more reps. A solid working weight." },
    { n: "5–6", label: "Moderate", desc: "You're working, with 4 to 5 reps left in the tank." },
    { n: "1–4", label: "Easy", desc: "Warm-up or activation effort." },
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
          How hard the set felt, from 1 to 10. Be honest. It tells me if the weight is right and when you&apos;re ready for more.
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
  resolveVideoKey,
}: {
  label: "Warmup" | "Cooldown"
  data: WarmupCooldown
  onVideoClick: (key: string, name: string) => void
  // Resolver so warm-up/cool-down thumbnails pick up the canonical
  // library video even when the program's embedded videoS3Key is empty.
  resolveVideoKey: (ex: { exerciseId: string; videoS3Key: string }) => string
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
          {label === "Warmup" ? "Warm-up" : "Cool-down"}
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
            {label === "Cooldown" ? "Nothing to log. Ease into recovery with these." : "Nothing to log. Move through these before you start."}
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
              {data.exercises.map((ex, i) => {
                const videoKey = resolveVideoKey(ex)
                return (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", background: "#faf8f5", border: `1px solid ${border}`, borderRadius: 6 }}
                >
                  <button
                    type="button"
                    disabled={!videoKey}
                    aria-label={videoKey ? `Play ${ex.name} demonstration` : `${ex.name} (no video)`}
                    onClick={() => videoKey && onVideoClick(videoKey, ex.name)}
                    style={{ width: 44, height: 44, padding: 0, border: 0, borderRadius: 4, overflow: "hidden", background: "#f0ede8", flexShrink: 0, cursor: videoKey ? "pointer" : "default", position: "relative" }}
                  >
                    {videoKey ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={cdnThumb(videoKey)} onError={thumbFallback} alt={ex.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.18)" }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="6" height="6" viewBox="0 0 8 8" fill="none"><path d="M1.5 1l5.5 3-5.5 3V1Z" fill="white" /></svg>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </button>
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
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function VideoModal({ videoKey, name, onClose }: { videoKey: string; name: string; onClose: () => void }) {
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  // Escape closes the modal — matches expected modal-dialog behavior.
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name} demonstration`}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "calc(env(safe-area-inset-top) + 16px) 16px calc(env(safe-area-inset-bottom) + 16px)",
      }}
      onClick={onClose}
    >
      {/* Corner-X close button — always reachable, even when the video fills
          the viewport in landscape. */}
      <button
        onClick={onClose}
        aria-label="Close video"
        style={{
          position: "absolute",
          top: "calc(env(safe-area-inset-top) + 12px)",
          right: 12,
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.2)",
          color: "#f0e6d3", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 0, zIndex: 1,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M1.5 1.5l15 15M16.5 1.5l-15 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <div
        style={{ maxWidth: 720, width: "100%", maxHeight: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(1rem, 3.5vw, 1.15rem)", color: "#f0e6d3", margin: "0 44px 0.6rem 0" }}>
          {name}
        </p>
        {failed ? (
          <div role="alert" style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 4, padding: "28px 20px", textAlign: "center", color: "#f0e6d3", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1rem", lineHeight: 1.5 }}>
            <p style={{ margin: "0 0 14px" }}>This video didn&apos;t load. Check your connection, or message me if it keeps happening.</p>
            <button type="button" onClick={() => { setFailed(false); setAttempt((n) => n + 1) }} style={{ minHeight: 44, padding: "0 20px", background: "#c8a97e", color: "#1a1a1a", border: 0, borderRadius: 4, fontWeight: 700, cursor: "pointer" }}>Try again</button>
          </div>
        ) : (
          <video
            key={attempt}
            src={cdnUrl(CDN, videoKey)}
            controls autoPlay playsInline preload="auto"
            onError={() => setFailed(true)}
            style={{ width: "100%", maxHeight: "80vh", borderRadius: 4, background: "#000", objectFit: "contain" }}
          />
        )}
      </div>
    </div>
  )
}

type ExtendedSetEntry = SetEntry & { _prevWeight?: string; _prevReps?: string; _prevRpe?: string }

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
        <div className="pt-sr">Set {setNum} weight</div>
        <input
          type="text"
          inputMode="decimal"
          value={entry.weight}
          onChange={(e) => onChange({ ...entry, weight: e.target.value })}
          aria-label={`Set ${setNum} weight`}
          placeholder={entry._prevWeight || prescribed.weight || "—"}
          style={{
            width: "100%", background: entry.completed ? "#f0faf0" : "#faf8f5", border: `1px solid ${entry.completed ? "#c8e6c8" : border}`,
            color: black, padding: "8px 10px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16,
            fontWeight: 600, outline: "none", borderRadius: 4, boxSizing: "border-box",
          }}
        />
      </div>

      {/* Reps */}
      <div>
        {hint(entry._prevReps ?? "")}
        <div className="pt-sr">Set {setNum} reps</div>
        <input
          type="text"
          inputMode="numeric"
          value={entry.reps}
          onChange={(e) => onChange({ ...entry, reps: e.target.value })}
          aria-label={`Set ${setNum} reps`}
          placeholder={entry._prevReps || prescribed.reps || "—"}
          style={{
            width: "100%", background: entry.completed ? "#f0faf0" : "#faf8f5", border: `1px solid ${entry.completed ? "#c8e6c8" : border}`,
            color: black, padding: "8px 10px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16,
            fontWeight: 600, outline: "none", borderRadius: 4, boxSizing: "border-box",
          }}
        />
      </div>

      {/* RPE (dropdown with info icon) */}
      <div>
        {hint(entry._prevRpe ?? "")}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
          <span className="pt-sr">Set {setNum} RPE</span>
          {setNum === 1 && <button
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
          </button>}
        </div>
        <select
          value={entry.rpe}
          onChange={(e) => onChange({ ...entry, rpe: e.target.value })}
          aria-label={`Set ${setNum} RPE`}
          style={{
            width: "100%", background: entry.completed ? "#f0faf0" : "#faf8f5", border: `1px solid ${entry.completed ? "#c8e6c8" : border}`,
            color: entry.rpe ? black : "#aaa", padding: "8px 8px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16,
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

// Superset wrapper card. Renders 2+ exercises that share a supersetGroupId
// as one visual unit, but each nested ExerciseBlock keeps its own set
// logging — nothing is coalesced. Round progress dots derive from the
// per-exercise completed flags in `setMaps`; a round counts as complete
// when every exercise in the group either has its set marked done OR the
// exercise has fewer prescribed sets than that round number (so unequal
// set counts round-out correctly). The "rest" hint below the round dots
// is a text cue, not a countdown timer — this codebase has no existing
// rest timer to interoperate with, so the SupersetBlock deliberately
// avoids introducing one.
function SupersetBlock({
  group,
  setMaps,
  info,
  prevByExercise,
  weightUnit,
  onSetChange,
  onVideoClick,
  onRpeInfoClick,
}: {
  group: SupersetGroup
  setMaps: ExerciseSetMap
  info: Record<string, ExerciseInfo>
  prevByExercise: PrevByExercise
  weightUnit: "LBS" | "KG"
  onSetChange: (exIdx: number, setIdx: number, updated: SetEntry) => void
  onVideoClick: (key: string, name: string) => void
  onRpeInfoClick: () => void
}) {
  const letters = ["A", "B", "C", "D", "E", "F"]
  const rounds = Math.max(
    ...group.exercises.map(({ ex }) => parseSetsCount(ex.sets))
  )
  // Rest hint comes from the LAST exercise in the group by convention —
  // that's the between-round rest, since A → B (→ C) are performed
  // back-to-back with no rest between them.
  const restLabel = group.exercises[group.exercises.length - 1].ex.rest || ""

  function isRoundComplete(roundIdx: number): boolean {
    return group.exercises.every(({ index, ex }) => {
      // If this exercise has fewer sets than the current round, treat it
      // as satisfied — the other exercise(s) simply continue solo.
      if (roundIdx >= parseSetsCount(ex.sets)) return true
      const s = setMaps[index]?.[roundIdx]
      return !!s?.completed
    })
  }

  return (
    <div
      style={{
        background: white,
        border: `2px solid ${accent}`,
        borderRadius: 8,
        padding: "16px 18px 18px",
        marginBottom: "1rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <p style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          fontSize: "0.65rem", fontWeight: 700,
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: accent, margin: 0,
        }}>
          Superset · {rounds} round{rounds !== 1 ? "s" : ""}
        </p>
        <p style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          fontSize: "0.7rem", color: muted, margin: 0,
        }}>
          {letters.slice(0, group.exercises.length).join(" → ")} back-to-back, then rest
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {Array.from({ length: rounds }).map((_, ri) => {
          const done = isRoundComplete(ri)
          return (
            <span
              key={ri}
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "0.7rem", fontWeight: 600,
                color: done ? "#5c9e6a" : muted,
                letterSpacing: "0.06em",
                padding: "3px 12px",
                border: `1px solid ${done ? "#5c9e6a" : border}`,
                borderRadius: 999,
                background: done ? "#f0faf0" : "transparent",
              }}
            >
              Round {ri + 1}{done ? " ✓" : ""}
            </span>
          )
        })}
      </div>
      {group.exercises.map(({ index, ex }, gi) => {
        const exInfo = info[ex.exerciseId]
        const videoKey = videoKeyFor(ex, exInfo)
        return (
        <div key={index} style={{ marginBottom: gi === group.exercises.length - 1 ? 0 : 8 }}>
          <p style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: "0.7rem", fontWeight: 700,
            color: accent, margin: "0 0 4px", letterSpacing: "0.14em",
          }}>
            {letters[gi]}
          </p>
          <ExerciseBlock
            ex={ex}
            exIdx={index}
            sets={(setMaps[index] ?? []) as ExtendedSetEntry[]}
            info={exInfo}
            videoKey={videoKey}
            prev={prevByExercise[ex.exerciseId]}
            weightUnit={weightUnit}
            onSetChange={(si, updated) => onSetChange(index, si, updated)}
            onVideoClick={() => videoKey && onVideoClick(videoKey, ex.name)}
            onRpeInfoClick={onRpeInfoClick}
          />
        </div>
        )
      })}
      {restLabel && (
        <p style={{
          fontFamily: "var(--font-dm-sans), sans-serif",
          fontSize: "0.72rem", color: muted, textAlign: "center",
          margin: "6px 0 0",
        }}>
          Rest {restLabel} between rounds
        </p>
      )}
    </div>
  )
}

function ExerciseBlock({
  ex,
  sets,
  info,
  videoKey,
  prev,
  weightUnit,
  onSetChange,
  onVideoClick,
  onRpeInfoClick,
}: {
  ex: ProgramExercise
  exIdx?: number
  sets: ExtendedSetEntry[]
  info?: ExerciseInfo
  // Library-resolved video key. Caller runs videoKeyFor(ex, info) so
  // this component doesn't have to know about the resolution rule.
  videoKey: string
  // Previous-performance summary for THIS exercise — comes from the most
  // recent prior log that captured any set for this exerciseId, across
  // all programs. May be undefined (no prior performance → no comparison
  // rendered).
  prev?: PrevExerciseSummary
  // Client's preferred display unit — appended to the summary so "185"
  // reads as "185 lb" / "185 kg". Values are kept as-is; nothing is
  // converted.
  weightUnit: "LBS" | "KG"
  onSetChange: (setIdx: number, updated: SetEntry) => void
  onVideoClick: () => void
  onRpeInfoClick?: () => void
}) {
  const completedCount = sets.filter((s) => s.completed).length
  const allDone = completedCount === sets.length

  // Build the "Last session" summary line. Only rendered when at least
  // one previous set has a non-empty weight OR non-empty reps — otherwise
  // the line is noise (e.g. the client logged completion without numbers).
  const prevSummary = (() => {
    if (!prev || prev.sets.length === 0) return null
    const sorted = [...prev.sets].sort((a, b) => a.setNumber - b.setNumber)
    const anyWeight = sorted.some((s) => s.weight)
    const anyReps = sorted.some((s) => s.reps)
    if (!anyWeight && !anyReps) return null
    const weightsLine = sorted.map((s) => s.weight || "—").join(" / ")
    const repsLine = sorted.map((s) => s.reps || "—").join(" / ")
    const unitShort = weightUnit === "KG" ? "kg" : "lb"
    return { weightsLine, repsLine, unitShort, sessionRpe: prev.sessionRpe, anyWeight }
  })()

  return (
    <div style={{ background: white, border: `1px solid ${allDone ? "#c8e6c8" : border}`, borderRadius: 8, marginBottom: "1rem", overflow: "hidden" }}>
      {/* Exercise header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: allDone ? "#f8fdf8" : "transparent", borderBottom: `1px solid ${allDone ? "#d4ead4" : border}` }}>
        {/* Thumbnail */}
        <button
          type="button"
          disabled={!videoKey}
          aria-label={videoKey ? `Play ${ex.name} demonstration` : `${ex.name} (no video)`}
          onClick={videoKey ? onVideoClick : undefined}
          style={{ width: 52, height: 52, padding: 0, border: 0, borderRadius: 6, overflow: "hidden", background: "#f5f2ee", flexShrink: 0, cursor: videoKey ? "pointer" : "default", position: "relative" }}
        >
          {videoKey ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cdnThumb(videoKey)} onError={thumbFallback} alt={ex.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
        </button>

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

      {/* Last-session summary — compact "Last time: 185 / 185 / 180 lb × 10 / 10 / 8 · Previous session RPE 7".
          Pulled live from CoachingWorkoutLogRecord.setData for this exerciseId; the per-set hint strip
          below each weight/reps/RPE input stays as the micro, set-by-set reference. */}
      {prevSummary && (
        <div style={{
          padding: "10px 18px",
          background: "#fdfbf7",
          borderBottom: `1px solid ${border}`,
          fontFamily: "var(--font-dm-sans), sans-serif",
          fontSize: "0.72rem",
          color: muted,
          lineHeight: 1.5,
        }}>
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, marginRight: 8 }}>
            Last time
          </span>
          <strong style={{ color: black, fontWeight: 600 }}>{prevSummary.weightsLine}{prevSummary.anyWeight ? ` ${prevSummary.unitShort}` : ""}</strong>
          <span style={{ margin: "0 6px" }}>×</span>
          <strong style={{ color: black, fontWeight: 600 }}>{prevSummary.repsLine}</strong>
          {prevSummary.sessionRpe != null && (
            <span style={{ marginLeft: 10 }}>· Previous session RPE <strong style={{ color: black, fontWeight: 600 }}>{prevSummary.sessionRpe}</strong></span>
          )}
        </div>
      )}

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
  const [introNote, setIntroNote] = useState("")
  const [day, setDay] = useState<ProgramDay | null>(null)
  const [setMap, setSetMap] = useState<ExerciseSetMap>({})
  const [exerciseInfo, setExerciseInfo] = useState<Record<string, ExerciseInfo>>({})
  const [videoModal, setVideoModal] = useState<{ key: string; name: string } | null>(null)
  const [overallRpe, setOverallRpe] = useState("")
  const [clientNotes, setClientNotes] = useState("")
  // Sport-day inputs. Only used when `day.dayType === "sport"`. The
  // strength-workout flow ignores them entirely.
  const [sportNameInput, setSportNameInput] = useState("")
  const [sportDurationInput, setSportDurationInput] = useState("")
  const [sportIntensityInput, setSportIntensityInput] = useState<"easy" | "moderate" | "hard" | "">("")
  // When this day is a sport day AND it's already logged, we keep the
  // original submission summary so the "Already completed" card can show
  // what the client did (sport name / duration / intensity).
  const [existingSport, setExistingSport] = useState<{ name?: string; durationMinutes?: number; intensity?: "easy" | "moderate" | "hard" } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState("")
  const submittingRef = useRef(false)
  const [submissionId, setSubmissionId] = useState("")
  const [alreadyLogged, setAlreadyLogged] = useState(false)
  const [existingFeedback, setExistingFeedback] = useState<{ text: string; at: string } | null>(null)
  const [showRpeInfo, setShowRpeInfo] = useState(false)
  // Per-exercise summary of the client's last logged performance for the
  // exercises on this day. Keyed by exerciseId. Rendered by each
  // ExerciseBlock as a one-line "Last time …" strip at the top of the card.
  const [prevByExercise, setPrevByExercise] = useState<PrevByExercise>({})
  // Client's preferred display unit for weights, pulled from the coaching
  // client record. Only used for display labelling — stored log values are
  // never converted.
  const [clientWeightUnit, setClientWeightUnit] = useState<"LBS" | "KG">("LBS")
  // Set once initial load finishes and the workout is ready to accept edits.
  // Used to gate the draft-save effect so we don't overwrite a saved draft
  // with an empty setMap during the initial render.
  const [ready, setReady] = useState(false)

  // Draft key — one per program+week+day for this browser. Persists in-progress
  // weight/reps/RPE/completed across app backgrounding, screen locks, and
  // PWA tab kills, so the client doesn't lose their entries mid-workout.
  // The program id is only known after load, so the key lives in state.
  const [draftKey, setDraftKey] = useState("")

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
        // Pull the client's preferred weight unit from the SAME /api/coaching/program
        // response (it already returns both). "LBS" is the historical default.
        const clientRec = programRes.value.client as Record<string, unknown> | undefined
        const unit = clientRec?.weightUnit as string | undefined
        setClientWeightUnit(unit === "KG" ? "KG" : "LBS")
      }

      if (!prog) { setLoading(false); return }

      // Use the shared expander so a rotation-style program (durationWeeks
      // > stored weeks) can resolve the URL /workouts/<N>/<i> for any N in
      // [1, durationWeeks] by cycling the stored week definitions. For
      // traditional multi-week programs the expander is a pass-through.
      // Resolve the target week strictly from the authoritative stored
      // program state. `durationWeeks` (when present) + the stored week
      // count define exactly which URLs are valid; anything beyond that
      // must fail safely rather than get synthesised. This prevents a
      // malformed or hand-edited URL from fabricating access to an
      // unassigned week, which would also let a client POST a workout
      // log outside the configured program duration.
      const storedDurationWeeks = typeof prog.durationWeeks === "number" ? prog.durationWeeks : undefined
      const weeks: ProgramWeek[] = expandedWeeks({
        weeks: prog.weeks as string,
        durationWeeks: storedDurationWeeks,
      }) as ProgramWeek[]
      const targetWeek = weeks.find((w) => w.weekNumber === weekId) ?? null
      const targetDay = targetWeek?.days[dayIndex] ?? null
      setWeek(targetWeek)
      setIntroNote(typeof prog.introNote === "string" ? prog.introNote : "")
      setDay(targetDay)

      if (!targetDay) { setLoading(false); return }

      const key = workoutDraftKey(prog.id as string, weekId, dayIndex)
      const legacyKey = legacyWorkoutDraftKey(weekId, dayIndex)
      setDraftKey(key)

      // Check if already logged.
      //
      // Scope "already logged" to logs from THIS program. When the coach
      // assigns a new program, its Week 1/Day 1 must not be treated as
      // completed just because the client did a "Week 1/Day 1" in the
      // previous program. Old logs stay in the DB and still power the
      // long-term progress views.
      let prevSetData: PrevSetData = []
      const currentProgramId = prog.id as string
      if (logsRes.status === "fulfilled") {
        const allLogs = (logsRes.value.logs ?? []) as Array<Record<string, unknown>>
        const currentProgramLogs = allLogs.filter((l) => (l.programId as string) === currentProgramId)
        const existingLog = currentProgramLogs.find((l) => Number(l.weekNumber) === weekId && l.dayLabel === targetDay.dayLabel)
        if (existingLog) {
          setAlreadyLogged(true)
          // Workout is server-side; any local draft is stale.
          clearWorkoutDraft(key)
          clearWorkoutDraft(legacyKey)
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
          // If this was a sport-day submission, surface the sport summary
          // so the "Already completed" card can say what the client did.
          if (existingLog.dayType === "sport") {
            const intensity = existingLog.sportIntensity
            setExistingSport({
              name: typeof existingLog.sportName === "string" ? (existingLog.sportName as string) : undefined,
              durationMinutes: typeof existingLog.sportDurationMinutes === "number" ? (existingLog.sportDurationMinutes as number) : undefined,
              intensity: intensity === "easy" || intensity === "moderate" || intensity === "hard" ? intensity : undefined,
            })
          }
          setLoading(false)
          return
        }

        // Build "last time" hints per exercise, looking ACROSS ALL PROGRAMS.
        // If the coach reuses an exercise (e.g. Barbell Squat) in a new
        // program, we want the client to still see what they lifted last
        // time on it as a hint. Only brand-new exercises get no hint.
        //
        // Algorithm: for each exercise scheduled today, scan every log
        // newest-first and take the first one that contains an entry for
        // that exerciseId. Cache parsed setData per log so we don't parse
        // the same log multiple times.
        const logsNewestFirst = [...allLogs].sort((a, b) =>
          String(b.completedAt ?? "").localeCompare(String(a.completedAt ?? ""))
        )
        const parsedCache = new Map<string, PrevSetData>()
        function parseLogSets(log: Record<string, unknown>): PrevSetData {
          const id = String(log.id ?? "")
          const cached = parsedCache.get(id)
          if (cached) return cached
          let arr: PrevSetData = []
          try { arr = JSON.parse(String(log.setData ?? "[]")) as PrevSetData } catch { /* ignore */ }
          parsedCache.set(id, arr)
          return arr
        }

        const hintsByExercise: PrevSetData = []
        // Also build the per-exercise summary consumed by each ExerciseBlock's
        // "Last time …" header. The session RPE + completedAt attach to the
        // SAME log the sets came from — critical because overallRpe belongs
        // to the workout a set was logged in, not the most recent workout.
        const summaryByExercise: PrevByExercise = {}
        for (const ex of targetDay.exercises) {
          if (!ex.exerciseId) continue
          for (const log of logsNewestFirst) {
            const sets = parseLogSets(log)
            const forThisExercise = sets.filter((s) => s.exerciseId === ex.exerciseId)
            if (forThisExercise.length > 0) {
              const sorted = [...forThisExercise].sort((a, b) => a.setNumber - b.setNumber)
              hintsByExercise.push(...sorted)
              if (!summaryByExercise[ex.exerciseId]) {
                const rawRpe = log.overallRpe
                summaryByExercise[ex.exerciseId] = {
                  sets: sorted,
                  sessionRpe: typeof rawRpe === "number" ? rawRpe : undefined,
                  completedAt: typeof log.completedAt === "string" ? (log.completedAt as string) : undefined,
                }
              }
              break
            }
          }
        }
        prevSetData = hintsByExercise
        setPrevByExercise(summaryByExercise)
      }

      // Init set map — start from prescribed sets with last-week hints...
      const initialMap: ExerciseSetMap = {}
      targetDay.exercises.forEach((ex, i) => {
        initialMap[i] = initSets(ex, prevSetData) as ExtendedSetEntry[]
      })

      // ...then, if there's a valid draft for this week+day, layer the
      // client's in-progress inputs (weight/reps/RPE/completed) on top.
      // We keep the _prevWeight/_prevReps hints from the fresh init and only
      // pull the user's typed values from the draft.
      // Signature captures the exerciseId AND the supersetGroupId so a coach
      // regrouping exercises into (or out of) a superset invalidates any
      // in-progress draft rather than restoring it under a mismatched layout.
      const currentSignature = targetDay.exercises.map((e) => `${e.exerciseId}:${e.supersetGroupId ?? ""}`).join("|")
      // Drafts written before the key included the program id are read once
      // from the old key and then moved, guarded by the exercise signature.
      const draft = readWorkoutDraft(key) ?? readWorkoutDraft(legacyKey)
      clearWorkoutDraft(legacyKey)
      setSubmissionId(draft?.submissionId || newSubmissionId())
      if (draft && draft.exerciseSignature === currentSignature) {
        for (const [idxStr, draftSets] of Object.entries(draft.setMap)) {
          const idx = Number(idxStr)
          const base = initialMap[idx]
          if (!base || !Array.isArray(draftSets)) continue
          initialMap[idx] = base.map((baseSet, si) => {
            const d = draftSets[si] as ExtendedSetEntry | undefined
            if (!d) return baseSet
            return {
              ...baseSet,
              weight: d.weight ?? baseSet.weight,
              reps: d.reps ?? baseSet.reps,
              rpe: d.rpe ?? baseSet.rpe,
              completed: !!d.completed,
            }
          })
        }
        if (draft.overallRpe) setOverallRpe(draft.overallRpe)
        if (draft.clientNotes) setClientNotes(draft.clientNotes)
      } else if (draft) {
        // Draft is for a different exercise layout (coach edited the program).
        // Drop it so we don't try to restore mismatched data.
        clearWorkoutDraft(key)
      }

      setSetMap(initialMap)
      setReady(true)

      // Fetch exercise info (instructions, cues, mistakes, canonical videoS3Key)
      // for EVERY exercise on the day — warm-up, main, and cool-down. The
      // library-provided videoS3Key is used at render time so a program
      // saved without an embedded key still plays.
      const ids = Array.from(new Set([
        ...(targetDay.warmup?.exercises ?? []).map((e) => e.exerciseId),
        ...targetDay.exercises.map((e) => e.exerciseId),
        ...(targetDay.cooldown?.exercises ?? []).map((e) => e.exerciseId),
      ].filter(Boolean)))
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

  // Persist in-progress edits to localStorage on every change. Gated on
  // `ready` so we don't overwrite the saved draft during initial mount with
  // an empty setMap. Also skipped once the workout is fully saved or the
  // "already completed" branch fires.
  useEffect(() => {
    if (!ready || saved || alreadyLogged || !day || !draftKey) return
    const signature = day.exercises.map((e) => `${e.exerciseId}:${e.supersetGroupId ?? ""}`).join("|")
    try {
      // Strip the hint fields (_prevWeight / _prevReps) — they're derived
      // from the server, no need to persist them locally.
      const stripped: ExerciseSetMap = {}
      for (const [k, sets] of Object.entries(setMap)) {
        stripped[Number(k)] = sets.map((s) => ({
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          completed: s.completed,
        }))
      }
      const draft: WorkoutDraft = {
        setMap: stripped,
        overallRpe,
        clientNotes,
        exerciseSignature: signature,
        savedAt: new Date().toISOString(),
        submissionId,
      }
      localStorage.setItem(draftKey, JSON.stringify(draft))
    } catch { /* ignore quota / private mode errors */ }
  }, [ready, saved, alreadyLogged, day, setMap, overallRpe, clientNotes, draftKey, submissionId])

  function updateSet(exIdx: number, setIdx: number, updated: SetEntry) {
    setSetMap((prev) => ({
      ...prev,
      [exIdx]: prev[exIdx].map((s, i) => i === setIdx ? { ...s, ...updated } : s),
    }))
  }

  // Sport-day submit path. Mirrors finishWorkout's safety rails (ref-guard,
  // submissionId, same submitWorkoutLog helper) but sends only the sport
  // payload — setData is "[]" so downstream readers that JSON.parse it
  // never trip. Completion is still keyed by (programId, weekNumber,
  // dayLabel), identical to a strength workout, so Day 5's log never
  // satisfies Day 6's already-logged check.
  async function finishSportDay() {
    if (!day || !email || !programId || !submissionId) return
    if (submittingRef.current) return
    const trimmedName = sportNameInput.trim()
    if (trimmedName.length === 0) { setSaveError("Tell me what you played."); return }
    const durNum = Number(sportDurationInput)
    if (!Number.isFinite(durNum) || durNum <= 0 || durNum > 1440) { setSaveError("Add how many minutes you played."); return }
    if (!sportIntensityInput) { setSaveError("Pick how hard it was."); return }
    submittingRef.current = true
    setSaving(true)
    setSaveError("")
    const result = await submitWorkoutLog({
      submissionId,
      programId,
      weekNumber: weekId,
      dayLabel: day.dayLabel,
      setData: "[]",
      clientNotes: clientNotes || undefined,
      dayType: "sport",
      sportName: trimmedName.slice(0, 80),
      sportDurationMinutes: Math.round(durNum),
      sportIntensity: sportIntensityInput,
    })
    submittingRef.current = false
    setSaving(false)
    if (result.ok) {
      clearWorkoutDraft(draftKey)
      setSaved(true)
    } else {
      setSaveError(submitFailureMessage(result.reason))
    }
  }

  async function finishWorkout() {
    if (!day || !email || !programId || !submissionId) return
    // A ref, not state: two taps in the same frame both see saving === false.
    if (submittingRef.current) return
    submittingRef.current = true
    setSaving(true)
    setSaveError("")

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

    const result = await submitWorkoutLog({
      submissionId,
      programId,
      weekNumber: weekId,
      dayLabel: day.dayLabel,
      setData: JSON.stringify(setData),
      overallRpe: overallRpe ? parseInt(overallRpe) : undefined,
      clientNotes: clientNotes || undefined,
    })

    submittingRef.current = false
    setSaving(false)
    if (result.ok) {
      clearWorkoutDraft(draftKey)
      setSaved(true)
    } else {
      setSaveError(submitFailureMessage(result.reason))
    }
  }

  const completedSets = Object.values(setMap).flat().filter((s) => s.completed).length
  const totalSets = Object.values(setMap).flat().length

  if (loading) return <Spinner />

  if (!week || !day) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.4rem", color: muted }}>I can&apos;t find this workout</p>
        <Link href="/my-coaching/workouts" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: accent, textDecoration: "none" }}>← Back to workouts</Link>
      </div>
    )
  }

  if (alreadyLogged) {
    const sportLine = existingSport ? sportSummary(existingSport) : null
    return (
      <div>
        <div style={{ marginBottom: "1.5rem" }}>
          <Link href="/my-coaching/workouts" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, textDecoration: "none" }}>← Workouts</Link>
        </div>
        <div style={{ background: white, border: `1px solid #c8e6c8`, borderRadius: 8, padding: "2.5rem", textAlign: "center", marginBottom: existingFeedback ? "1rem" : 0 }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#f0faf0", border: "2px solid #5c9e6a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12l5.5 6L20 6" stroke="#5c9e6a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.5rem", fontWeight: 700, color: black, margin: "0 0 8px" }}>Already done</h2>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: "0 0 8px" }}>You&apos;ve already logged {week.label} · {day.dayLabel}.</p>
          {sportLine && (
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: black, margin: "0 0 24px", fontWeight: 600 }}>{sportLine}</p>
          )}
          {!sportLine && <div style={{ height: 16 }} />}
          <Link href="/my-coaching/workouts" style={{ display: "inline-block", background: accent, color: black, padding: "12px 28px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>View all workouts</Link>
        </div>

        {existingFeedback && (
          <div style={{ background: "#fdfbf7", border: `1px solid ${accent}`, borderLeft: `4px solid ${accent}`, borderRadius: 8, padding: "1.25rem 1.5rem" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, margin: "0 0 8px" }}>
              A note from me{existingFeedback.at ? ` · ${(() => {
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

  const isSportDay = day.dayType === "sport"

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
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: black, margin: "0 0 8px" }}>{isSportDay ? "Sport day logged. Nice work." : "Workout done. Nice work."}</h2>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: "0 0 8px" }}>{week.label} · {day.dayLabel}</p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: "0 0 28px" }}>{isSportDay ? sportSummary({ name: sportNameInput.trim(), durationMinutes: Number(sportDurationInput) || undefined, intensity: sportIntensityInput || undefined }) : `${completedSets} of ${totalSets} sets logged.`}</p>
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

  // Sport-day render — the whole page is a short form (sport + duration +
  // intensity + confirm). No warm-up, no exercise blocks, no cooldown,
  // no overall-RPE chooser. Completion is still keyed by (programId,
  // weekNumber, dayLabel), so two Sport days in the same program log
  // independently just like two strength days do.
  if (day.dayType === "sport") {
    return (
      <SportDayForm
        meta={`${week.label} · Day ${dayIndex + 1}`}
        dayLabel={day.dayLabel}
        notes={notesWithIntro(day.notes, weekId, dayIndex, introNote)}
        name={sportNameInput}
        duration={sportDurationInput}
        intensity={sportIntensityInput}
        clientNotes={clientNotes}
        error={saveError}
        saving={saving}
        ready={!!submissionId}
        onName={setSportNameInput}
        onDuration={setSportDurationInput}
        onIntensity={setSportIntensityInput}
        onClientNotes={setClientNotes}
        onSubmit={finishSportDay}
      />
    )
  }

  return (
    <div className="workout-logger-page">
      <style>{`
        /* Page bottom padding scaled so finish bar + mobile bottom nav fit
           without covering the workout notes / last exercise. */
        .workout-logger-page { padding-bottom: 100px; }
        @media (max-width: 768px) {
          /* The layout already reserves the bottom nav; this clears the finish bar. */
          .workout-logger-page { padding-bottom: 130px; }
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
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: "0 0 4px" }}>
          {week.label} · Day {dayIndex + 1}
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: black, margin: "0 0 6px" }}>
          {day.dayLabel}
        </h1>
        {notesWithIntro(day.notes, weekId, dayIndex, introNote) && <RunnerNotes text={notesWithIntro(day.notes, weekId, dayIndex, introNote)} />}
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
          resolveVideoKey={(ex) => videoKeyFor(ex, exerciseInfo[ex.exerciseId])}
        />
      )}

      {/* Main workout section header (only shown when warmup or cooldown exists) */}
      {(day.warmup || day.cooldown) && (day.warmup?.notes || (day.warmup?.exercises.length ?? 0) > 0 || day.cooldown?.notes || (day.cooldown?.exercises.length ?? 0) > 0) && day.exercises.length > 0 && (
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: accent, margin: "0.5rem 0 0.75rem" }}>
          Main workout
        </p>
      )}

      {/* Exercise blocks — grouped by supersetGroupId so any adjacent run
          of same-group exercises renders as one SupersetBlock. Solo
          exercises fall through to the existing ExerciseBlock unchanged. */}
      {day.exercises.length === 0 ? (
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted }}>No exercises for this day.</p>
      ) : (
        groupSupersets(day.exercises).map((g, gi) => {
          if (g.id && g.exercises.length >= 2) {
            return (
              <SupersetBlock
                key={`ss-${g.id}-${gi}`}
                group={g}
                setMaps={setMap}
                info={exerciseInfo}
                prevByExercise={prevByExercise}
                weightUnit={clientWeightUnit}
                onSetChange={updateSet}
                onVideoClick={(key, name) => setVideoModal({ key, name })}
                onRpeInfoClick={() => setShowRpeInfo(true)}
              />
            )
          }
          // Solo exercise (or a "group" of one — treat as solo).
          const { index: i, ex } = g.exercises[0]
          const exInfo = exerciseInfo[ex.exerciseId]
          const videoKey = videoKeyFor(ex, exInfo)
          return (
            <ExerciseBlock
              key={`solo-${i}`}
              ex={ex}
              exIdx={i}
              sets={(setMap[i] ?? []) as ExtendedSetEntry[]}
              info={exInfo}
              videoKey={videoKey}
              prev={prevByExercise[ex.exerciseId]}
              weightUnit={clientWeightUnit}
              onSetChange={(si, updated) => updateSet(i, si, updated)}
              onVideoClick={() => videoKey && setVideoModal({ key: videoKey, name: ex.name })}
              onRpeInfoClick={() => setShowRpeInfo(true)}
            />
          )
        })
      )}

      {/* Cooldown (read-only, collapsible) */}
      {day.cooldown && (
        <WarmupCooldownDisplay
          label="Cooldown"
          data={day.cooldown}
          onVideoClick={(key, name) => setVideoModal({ key, name })}
          resolveVideoKey={(ex) => videoKeyFor(ex, exerciseInfo[ex.exerciseId])}
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
                fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1rem",
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
          <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: muted, display: "block", marginBottom: 4 }}>Anything to tell me?</label>
          <textarea
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            placeholder="How did it feel? Tell me about any pain, injuries or problems."
            rows={3}
            style={{ width: "100%", background: "#faf8f5", border: `1px solid ${border}`, color: black, padding: "9px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1rem", outline: "none", resize: "none", borderRadius: 4, boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Sticky finish bar — positioned above the mobile bottom nav on phones
          so the "Finish Workout" button isn't hidden behind it. */}
      <div className="workout-finish-bar" style={{ position: "fixed", left: 0, right: 0, background: white, borderTop: `1px solid ${border}`, padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, zIndex: 50 }}>
        {saveError && (
          <p role="alert" style={{ flexBasis: "100%", order: -1, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", lineHeight: 1.45, color: "#c14646", margin: 0 }}>
            {saveError}
          </p>
        )}
        <div>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, color: black, margin: 0 }}>
            {completedSets === totalSets && totalSets > 0 ? "All sets done." : `${completedSets}/${totalSets} sets`}
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
          {saving ? "Saving…" : saveError ? "Retry" : "Finish Workout"}
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
