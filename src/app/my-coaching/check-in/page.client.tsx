"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { uploadData } from "aws-amplify/storage"
import { relativeChange } from "@/lib/weight"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"

// ── Types ────────────────────────────────────────────────────────────────────

type Measurement = { label: string; value: string; unit: string }
type NutritionStatus = "on-track" | "mostly-on-track" | "mixed" | "struggled" | "not-focusing"
type AdjustmentArea = "exercises" | "volume-intensity" | "schedule" | "nutrition" | "recovery" | "other" | "none"
type ProgramExerciseLite = { id: string; name: string }
type ProgramDay = { dayLabel: string; notes?: string; exercises?: Array<{ exerciseId?: string; name?: string }> }
type ProgramWeek = { weekNumber?: number; label?: string; days: ProgramDay[] }
type WorkoutLogLite = { completedAt: string; programId?: string; weekNumber?: number; dayLabel?: string }

type FormReview = {
  key: string  // local id for React
  exercise: string
  note: string
  videos: Array<{ file: File; previewUrl: string; s3Key: string | null; progress: number; error: string | null; uploading: boolean }>
}

type FormState = {
  weight: string
  weightUnit: "LBS" | "KG"
  measurements: Measurement[]
  trainingRating: number
  trainingWins: string
  trainingChallenges: string
  painReported: "unset" | "no" | "yes"
  painNotes: string
  formReviewRequested: "unset" | "no" | "yes"
  formReviews: FormReview[]
  sleepRating: number
  energyRating: number
  stressRating: number
  recoveryRating: number
  nutritionStatus: NutritionStatus | ""
  nutritionHelp: string
  weeklyWin: string
  weeklyChallenge: string
  adjustmentAreas: AdjustmentArea[]
  adjustmentNotes: string
  questionForLisa: string
}

const INITIAL: FormState = {
  weight: "", weightUnit: "LBS",
  measurements: [],
  trainingRating: 0, trainingWins: "", trainingChallenges: "",
  painReported: "unset", painNotes: "",
  formReviewRequested: "unset", formReviews: [],
  sleepRating: 0, energyRating: 0, stressRating: 0, recoveryRating: 0,
  nutritionStatus: "", nutritionHelp: "",
  weeklyWin: "", weeklyChallenge: "",
  adjustmentAreas: [], adjustmentNotes: "",
  questionForLisa: "",
}

const STEPS = ["Progress", "Training", "Recovery", "Nutrition", "Reflect"]
const MAX_FORM_REVIEW_VIDEOS = 3
const MAX_VIDEO_BYTES = 200 * 1024 * 1024 // 200 MB — enough for a phone-shot exercise clip
const PLAUSIBILITY_THRESHOLD = 0.2 // 20% weight-change confirmation

const NUTRITION_STATUS_OPTIONS: Array<{ value: NutritionStatus; label: string }> = [
  { value: "on-track", label: "On track" },
  { value: "mostly-on-track", label: "Mostly on track" },
  { value: "mixed", label: "Mixed" },
  { value: "struggled", label: "Struggled" },
  { value: "not-focusing", label: "Not focusing on nutrition right now" },
]
const ADJUSTMENT_OPTIONS: Array<{ value: AdjustmentArea; label: string }> = [
  { value: "exercises", label: "Exercise selection" },
  { value: "volume-intensity", label: "Training volume / intensity" },
  { value: "schedule", label: "Schedule" },
  { value: "nutrition", label: "Nutrition" },
  { value: "recovery", label: "Recovery" },
  { value: "other", label: "Something else" },
  { value: "none", label: "Nothing right now" },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

const RATING_LABELS: Record<number, string> = { 1: "Poor", 2: "Below avg", 3: "Okay", 4: "Good", 5: "Excellent" }
// Stress + recovery use direction-neutral wording so higher = better.
const STRESS_LABELS: Record<number, string> = { 1: "Overwhelmed", 2: "Rough", 3: "Manageable", 4: "Handled well", 5: "Very manageable" }

function extForFile(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop()! : ""
  if (fromName && fromName.length <= 5) return fromName.toLowerCase()
  if (file.type === "video/mp4") return "mp4"
  if (file.type === "video/quicktime") return "mov"
  if (file.type === "video/webm") return "webm"
  return "mp4"
}
function randomId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
function emailSlug(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

// Sum of every day.exercises.length across the current program week — that's
// what we consider the "planned per week" denominator. Returns undefined when
// the program has no weeks or all week rosters are empty (we don't fabricate).
function plannedWorkoutsForCurrentWeek(weeks: ProgramWeek[]): number | undefined {
  const first = weeks[0]
  if (!first || !first.days || first.days.length === 0) return undefined
  const count = first.days.filter((d) => (d.exercises?.length ?? 0) > 0).length
  return count > 0 ? count : undefined
}

// Exercises available in the current program, deduplicated by exerciseId+name.
function programExercises(weeks: ProgramWeek[]): ProgramExerciseLite[] {
  const seen = new Map<string, ProgramExerciseLite>()
  for (const week of weeks) {
    for (const day of week.days ?? []) {
      for (const ex of day.exercises ?? []) {
        if (!ex.name) continue
        const id = ex.exerciseId ?? ex.name
        if (!seen.has(id)) seen.set(id, { id, name: ex.name })
      }
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name))
}

function RatingRow({
  label,
  value,
  onChange,
  labels = RATING_LABELS,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  labels?: Record<number, string>
}) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: black }}>{label}</label>
        {value > 0 && <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", color: accent }}>{labels[value]}</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            style={{
              flex: 1, height: 44, borderRadius: 6,
              border: `2px solid ${value === n ? accent : border}`,
              background: value === n ? accent : white,
              color: value === n ? black : muted,
              fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16, fontWeight: 700,
              cursor: "pointer", WebkitTapHighlightColor: "transparent",
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", color: "#bbb" }}>{labels[1]}</span>
        <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", color: "#bbb" }}>{labels[5]}</span>
      </div>
    </div>
  )
}

function TextBlock({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number
}) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: black, display: "block", marginBottom: 8 }}>{label} <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 400, color: muted }}>(optional)</span></label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: "100%", boxSizing: "border-box",
          background: "#faf8f5", border: `1px solid ${border}`, color: black,
          padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16,
          outline: "none", resize: "vertical", borderRadius: 6, lineHeight: 1.5,
          minHeight: 72, maxHeight: 200,
        }}
      />
    </div>
  )
}

function YesNoRow({ label, value, onChange }: { label: string; value: "unset" | "no" | "yes"; onChange: (v: "no" | "yes") => void }) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: black, display: "block", marginBottom: 8 }}>{label}</label>
      <div style={{ display: "flex", gap: 8 }}>
        {(["no", "yes"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            style={{
              flex: 1, background: value === v ? black : "transparent",
              border: `1px solid ${value === v ? black : border}`,
              color: value === v ? white : black,
              padding: "12px 14px",
              fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem",
              fontWeight: value === v ? 700 : 600, letterSpacing: "0.06em",
              cursor: "pointer", borderRadius: 6, WebkitTapHighlightColor: "transparent",
              textTransform: "capitalize",
            }}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CheckInClient() {
  const [loading, setLoading] = useState(true)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormState>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Session + program context — populated on mount
  const [email, setEmail] = useState<string>("")
  const [programExerciseList, setProgramExerciseList] = useState<ProgramExerciseLite[]>([])
  const [autoWorkouts, setAutoWorkouts] = useState<{ completed: number; planned?: number; sinceIso: string | null }>({ completed: 0, sinceIso: null })
  const [lastWeight, setLastWeight] = useState<{ value: number; unit: "LBS" | "KG" } | null>(null)
  const [showTypoConfirm, setShowTypoConfirm] = useState(false)

  const submitLockRef = useRef(false)

  useEffect(() => {
    async function init() {
      try {
        // Session email
        const accessRes = await fetch("/api/member/access").catch(() => null)
        if (accessRes?.ok) {
          const d = await accessRes.json()
          if (d.email) setEmail(String(d.email))
        }

        // Load check-in history to detect: already-submitted-this-week + last weight
        const ciRes = await fetch("/api/coaching/check-in")
        let lastCheckInIso: string | null = null
        if (ciRes.ok) {
          const data = await ciRes.json()
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          const recent = (data.checkIns ?? []).find(
            (ci: { submittedAt: string }) => new Date(ci.submittedAt) > weekAgo
          )
          if (recent) setAlreadySubmitted(true)
          type CIRaw = { submittedAt: string; weight?: number | string | null; weightUnit?: string | null }
          const withWeight = (data.checkIns ?? [])
            .filter((ci: CIRaw) => ci.weight != null && Number(ci.weight) > 0)
            .sort((a: CIRaw, b: CIRaw) => b.submittedAt.localeCompare(a.submittedAt))
          if (withWeight[0]) {
            setLastWeight({
              value: Number(withWeight[0].weight),
              unit: withWeight[0].weightUnit === "KG" ? "KG" : "LBS",
            })
          }
          const sortedAll = (data.checkIns ?? []).sort((a: { submittedAt: string }, b: { submittedAt: string }) => b.submittedAt.localeCompare(a.submittedAt))
          if (sortedAll[0]) lastCheckInIso = sortedAll[0].submittedAt
        }

        // Load program + workout log for the auto training summary
        const [progRes, logRes] = await Promise.all([
          fetch("/api/coaching/program").catch(() => null),
          fetch("/api/coaching/workout-log").catch(() => null),
        ])
        let weeks: ProgramWeek[] = []
        let currentProgramId: string | undefined
        if (progRes?.ok) {
          const pd = await progRes.json()
          currentProgramId = pd.program?.id
          try {
            if (pd.program?.weeks) weeks = JSON.parse(pd.program.weeks) as ProgramWeek[]
          } catch { /* ignore */ }
          setProgramExerciseList(programExercises(weeks))
        }
        if (logRes?.ok) {
          const ld = await logRes.json()
          const logs: WorkoutLogLite[] = (ld.logs ?? []).map((l: Record<string, unknown>) => ({
            completedAt: l.completedAt as string,
            programId: l.programId as string | undefined,
            weekNumber: Number(l.weekNumber),
            dayLabel: l.dayLabel as string,
          }))
          // Count workouts logged AGAINST the current program since the client's
          // last check-in (or since program start if this is the first check-in).
          const sinceMs = lastCheckInIso
            ? new Date(lastCheckInIso).getTime()
            : Date.now() - 7 * 24 * 60 * 60 * 1000
          const relevant = logs.filter((l) => {
            const okProgram = currentProgramId ? l.programId === currentProgramId : true
            return okProgram && new Date(l.completedAt).getTime() >= sinceMs
          })
          setAutoWorkouts({
            completed: relevant.length,
            planned: plannedWorkoutsForCurrentWeek(weeks),
            sinceIso: lastCheckInIso,
          })
        }
      } catch { /* layout handles auth */ }
      setLoading(false)
    }
    init()
  }, [])

  const set = <K extends keyof FormState>(key: K) => (val: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }))

  // ── Measurement helpers ─────────────────────────────────────────────────
  function updateMeasurement(idx: number, patch: Partial<Measurement>) {
    setForm((f) => ({ ...f, measurements: f.measurements.map((m, i) => i === idx ? { ...m, ...patch } : m) }))
  }
  function addMeasurement() {
    setForm((f) => ({ ...f, measurements: [...f.measurements, { label: "", value: "", unit: "in" }] }))
  }
  function removeMeasurement(idx: number) {
    setForm((f) => ({ ...f, measurements: f.measurements.filter((_, i) => i !== idx) }))
  }

  // ── Form-review helpers ─────────────────────────────────────────────────
  function addFormReview() {
    setForm((f) => ({ ...f, formReviews: [...f.formReviews, { key: randomId(), exercise: "", note: "", videos: [] }] }))
  }
  function updateFormReview(key: string, patch: Partial<Omit<FormReview, "videos">>) {
    setForm((f) => ({ ...f, formReviews: f.formReviews.map((r) => r.key === key ? { ...r, ...patch } : r) }))
  }
  function removeFormReview(key: string) {
    setForm((f) => {
      const target = f.formReviews.find((r) => r.key === key)
      if (target) target.videos.forEach((v) => URL.revokeObjectURL(v.previewUrl))
      return { ...f, formReviews: f.formReviews.filter((r) => r.key !== key) }
    })
  }
  async function handleReviewVideoPick(reviewKey: string, files: FileList | null) {
    if (!files || files.length === 0 || !email) return
    setErrorMsg(null)
    const totalExistingVideos = form.formReviews.reduce((acc, r) => acc + r.videos.length, 0)
    const remaining = MAX_FORM_REVIEW_VIDEOS - totalExistingVideos
    if (remaining <= 0) { setErrorMsg(`Max ${MAX_FORM_REVIEW_VIDEOS} videos per check-in.`); return }

    const accepted: File[] = []
    for (const f of Array.from(files).slice(0, remaining)) {
      if (!f.type.startsWith("video/")) { setErrorMsg("Only video files are supported."); continue }
      if (f.size > MAX_VIDEO_BYTES) { setErrorMsg(`${f.name} is over 200 MB.`); continue }
      accepted.push(f)
    }
    if (accepted.length === 0) return

    const slug = emailSlug(email)
    // Optimistically add to state
    const started = accepted.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      s3Key: null as string | null,
      progress: 0, error: null as string | null, uploading: true,
      _plannedKey: `media/coaching-form-reviews/${slug}/${Date.now()}-${randomId()}.${extForFile(file)}`,
    }))
    setForm((f) => ({
      ...f,
      formReviews: f.formReviews.map((r) => r.key === reviewKey ? { ...r, videos: [...r.videos, ...started] } : r),
    }))

    // Sequential upload — parallel large-video uploads can exhaust iOS memory.
    for (const v of started) {
      try {
        await uploadData({
          path: v._plannedKey,
          data: v.file,
          options: {
            contentType: v.file.type || "video/mp4",
            onProgress: ({ transferredBytes, totalBytes }) => {
              if (!totalBytes) return
              const pct = Math.round((transferredBytes / totalBytes) * 100)
              setForm((f) => ({
                ...f,
                formReviews: f.formReviews.map((r) => r.key === reviewKey ? {
                  ...r,
                  videos: r.videos.map((x) => x.previewUrl === v.previewUrl ? { ...x, progress: pct } : x),
                } : r),
              }))
            },
          },
        }).result
        setForm((f) => ({
          ...f,
          formReviews: f.formReviews.map((r) => r.key === reviewKey ? {
            ...r,
            videos: r.videos.map((x) => x.previewUrl === v.previewUrl ? { ...x, s3Key: v._plannedKey, uploading: false, progress: 100 } : x),
          } : r),
        }))
      } catch {
        setForm((f) => ({
          ...f,
          formReviews: f.formReviews.map((r) => r.key === reviewKey ? {
            ...r,
            videos: r.videos.map((x) => x.previewUrl === v.previewUrl ? { ...x, uploading: false, error: "Upload failed" } : x),
          } : r),
        }))
      }
    }
  }
  function removeReviewVideo(reviewKey: string, previewUrl: string) {
    setForm((f) => ({
      ...f,
      formReviews: f.formReviews.map((r) => r.key === reviewKey ? {
        ...r,
        videos: r.videos.filter((v) => {
          if (v.previewUrl === previewUrl) URL.revokeObjectURL(v.previewUrl)
          return v.previewUrl !== previewUrl
        }),
      } : r),
    }))
  }
  useEffect(() => () => {
    // Revoke any dangling object URLs on unmount so the browser doesn't leak
    // blob references for videos the user never sent.
    form.formReviews.forEach((r) => r.videos.forEach((v) => URL.revokeObjectURL(v.previewUrl)))
  }, [form.formReviews])

  // ── Adjustment-area toggle ──────────────────────────────────────────────
  function toggleAdjustment(area: AdjustmentArea) {
    setForm((f) => {
      const isNone = area === "none"
      if (isNone) {
        // Selecting "Nothing right now" clears everything else.
        return { ...f, adjustmentAreas: f.adjustmentAreas.includes("none") ? [] : ["none"] }
      }
      // Selecting anything else clears "none".
      const without = f.adjustmentAreas.filter((a) => a !== "none")
      return { ...f, adjustmentAreas: without.includes(area) ? without.filter((a) => a !== area) : [...without, area] }
    })
  }

  const anyVideoUploading = form.formReviews.some((r) => r.videos.some((v) => v.uploading))

  function canProceed(): boolean {
    if (step === 1) return true  // weight/measurements optional
    if (step === 2) {
      if (form.painReported === "unset") return false
      if (form.formReviewRequested === "unset") return false
      // If they marked "yes" on pain, encourage them to write something — but
      // not a hard block, so accept as long as painReported is set.
      return true
    }
    if (step === 3) return form.sleepRating > 0 && form.energyRating > 0 && form.stressRating > 0 && form.recoveryRating > 0
    if (step === 4) return form.nutritionStatus !== ""
    return true
  }

  function submit() {
    if (!canProceed() || submitLockRef.current) return
    if (anyVideoUploading) { setErrorMsg("Wait for videos to finish uploading."); return }
    if (lastWeight && form.weight.trim()) {
      const change = relativeChange(
        { value: lastWeight.value, unit: lastWeight.unit },
        { value: form.weight, unit: form.weightUnit },
      )
      if (change != null && change >= PLAUSIBILITY_THRESHOLD) {
        setShowTypoConfirm(true)
        return
      }
    }
    performSubmit()
  }

  async function performSubmit() {
    if (submitLockRef.current) return
    submitLockRef.current = true
    setShowTypoConfirm(false)
    setErrorMsg(null)
    setSaving(true)
    try {
      // Package form reviews for the API: only keep those with at least one
      // uploaded video OR a note (or both), and only reference finalized s3 keys.
      const payloadFormReviews = form.formReviews
        .map((r) => ({
          exercise: r.exercise.trim(),
          note: r.note.trim(),
          videoKeys: r.videos.map((v) => v.s3Key).filter((k): k is string => k != null),
        }))
        .filter((r) => r.exercise || r.note || r.videoKeys.length > 0)

      const res = await fetch("/api/coaching/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemaVersion: 2,
          // Progress
          weight: form.weight || undefined,
          weightUnit: form.weightUnit,
          measurements: form.measurements.filter((m) => m.label.trim() && m.value.trim()),
          // Training
          workoutsCompleted: autoWorkouts.completed,
          workoutsPlanned: autoWorkouts.planned,
          trainingRating: form.trainingRating || undefined,
          trainingWins: form.trainingWins || undefined,
          trainingChallenges: form.trainingChallenges || undefined,
          // Attention
          painReported: form.painReported === "yes" ? true : form.painReported === "no" ? false : undefined,
          painNotes: form.painReported === "yes" ? (form.painNotes || undefined) : undefined,
          // Form review
          formReviewRequested: form.formReviewRequested === "yes" ? true : form.formReviewRequested === "no" ? false : undefined,
          formReviews: form.formReviewRequested === "yes" ? payloadFormReviews : undefined,
          // Recovery
          sleepQuality: form.sleepRating || undefined,
          energyLevel: form.energyRating || undefined,
          stressLevel: form.stressRating || undefined,
          recoveryRating: form.recoveryRating || undefined,
          // Nutrition
          nutritionStatus: form.nutritionStatus || undefined,
          nutritionHelp: form.nutritionHelp || undefined,
          // Weekly reflection
          weeklyWin: form.weeklyWin || undefined,
          weeklyChallenge: form.weeklyChallenge || undefined,
          adjustmentAreas: form.adjustmentAreas.length > 0 ? form.adjustmentAreas : undefined,
          adjustmentNotes: form.adjustmentNotes || undefined,
          questionForLisa: form.questionForLisa || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }))
        throw new Error(data.error || "Something went wrong.")
      }
      setSubmitted(true)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.")
      submitLockRef.current = false
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div>
        <div style={{ background: white, border: `1px solid #c8e6c8`, borderRadius: 8, padding: "3rem 2rem", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0faf0", border: "2px solid #5c9e6a", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M4.5 13l6 7L21.5 6" stroke="#5c9e6a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: black, margin: "0 0 8px" }}>Check-in sent ✓</h2>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: "0 0 28px", lineHeight: 1.6 }}>
            I&apos;ll review your week and send you feedback.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/my-coaching" style={{ display: "inline-block", background: accent, color: black, padding: "12px 24px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>
              Back to Home
            </Link>
            <Link href="/my-coaching/check-in/history" style={{ display: "inline-block", background: "transparent", color: muted, padding: "12px 20px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", textDecoration: "none", border: `1px solid ${border}`, borderRadius: 4 }}>
              View history
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (alreadySubmitted) {
    return (
      <div>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: black, marginBottom: "0.5rem" }}>Weekly Check-In</h1>
        <div style={{ background: "#fdf9f5", border: `1px solid ${border}`, borderRadius: 8, padding: "2rem", textAlign: "center", maxWidth: 480 }}>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.2rem", color: black, margin: "0 0 8px" }}>Already submitted this week</p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: "0 0 20px" }}>
            Your check-in is with Lisa. She&apos;ll send feedback soon.
          </p>
          <Link href="/my-coaching/check-in/history" style={{ display: "inline-block", background: accent, color: black, padding: "11px 24px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>
            View history & feedback
          </Link>
        </div>
      </div>
    )
  }

  // ── Auto training summary line ─────────────────────────────────────────
  const autoSummary = (() => {
    if (autoWorkouts.planned != null) {
      return `${autoWorkouts.completed} of ${autoWorkouts.planned} planned workouts completed`
    }
    const suffix = autoWorkouts.sinceIso
      ? "since your last check-in"
      : "this week"
    const noun = autoWorkouts.completed === 1 ? "workout" : "workouts"
    return `${autoWorkouts.completed} ${noun} completed ${suffix}`
  })()

  return (
    <div style={{ maxWidth: 560 }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, margin: "0 0 4px" }}>Weekly</p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(1.6rem, 5.5vw, 2rem)", fontWeight: 700, color: black, margin: 0 }}>Check-In</h1>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {STEPS.map((label, i) => {
          const n = i + 1
          const done = n < step
          const active = n === step
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: active ? 28 : 20, height: active ? 28 : 20, borderRadius: "50%",
                  background: done ? accent : active ? black : border,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {done ? (
                    <svg width="10" height="10" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  ) : (
                    <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: active ? "0.72rem" : "0.58rem", fontWeight: 700, color: active ? white : muted }}>{n}</span>
                  )}
                </div>
                {active && <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 600, color: black, letterSpacing: "0.06em" }}>{label}</span>}
              </div>
              {i < STEPS.length - 1 && <div style={{ height: 2, background: n < step ? accent : border, width: 12, borderRadius: 1 }} />}
            </div>
          )
        })}
      </div>

      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem 1.25rem" }}>

        {/* ── Step 1: Progress ─────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.35rem", fontWeight: 700, color: black, margin: "0 0 4px" }}>Progress</h2>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: "0 0 1.25rem" }}>Weight and measurements are optional — enter what you actually track.</p>

            <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: black, display: "block", marginBottom: 8 }}>Current weight <span style={{ fontWeight: 400, color: muted, fontSize: "0.72rem" }}>(optional)</span></label>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="text"
                inputMode="decimal"
                value={form.weight}
                onChange={(e) => set("weight")(e.target.value)}
                placeholder="e.g. 145"
                style={{ flex: "1 1 140px", minWidth: 0, background: "#faf8f5", border: `1px solid ${border}`, color: black, padding: "12px 14px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16, fontWeight: 600, outline: "none", borderRadius: 6, boxSizing: "border-box" }}
              />
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {(["LBS", "KG"] as const).map((u) => (
                  <button key={u} type="button" onClick={() => set("weightUnit")(u)}
                    style={{ background: form.weightUnit === u ? accent : white, border: `2px solid ${form.weightUnit === u ? accent : border}`, color: form.weightUnit === u ? black : muted, padding: "10px 14px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", borderRadius: 6 }}>
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: `1px solid ${border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: black }}>Measurements <span style={{ fontWeight: 400, color: muted, fontSize: "0.72rem" }}>(optional)</span></label>
                {form.measurements.length > 0 && (
                  <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: muted }}>{form.measurements.length} added</span>
                )}
              </div>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", color: muted, margin: "0 0 12px", lineHeight: 1.5 }}>
                Waist, hips, arms, thigh, chest — whatever you track. Skip if you don&apos;t.
              </p>

              {form.measurements.map((m, idx) => (
                <div key={idx} style={{ background: "#faf8f5", border: `1px solid ${border}`, borderRadius: 6, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "start", marginBottom: 8 }}>
                    <input type="text" value={m.label} onChange={(e) => updateMeasurement(idx, { label: e.target.value })} placeholder="e.g. Waist"
                      style={{ minWidth: 0, background: white, border: `1px solid ${border}`, color: black, padding: "9px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16, fontWeight: 600, outline: "none", borderRadius: 4, boxSizing: "border-box" }} />
                    <button type="button" onClick={() => removeMeasurement(idx)} aria-label="Remove measurement"
                      style={{ background: "none", border: "none", color: "#c14646", padding: "6px 10px", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}>×</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8 }}>
                    <input type="text" inputMode="decimal" value={m.value} onChange={(e) => updateMeasurement(idx, { value: e.target.value })} placeholder="e.g. 28.5"
                      style={{ minWidth: 0, background: white, border: `1px solid ${border}`, color: black, padding: "9px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16, fontWeight: 600, outline: "none", borderRadius: 4, boxSizing: "border-box" }} />
                    <select value={m.unit} onChange={(e) => updateMeasurement(idx, { unit: e.target.value })}
                      style={{ minWidth: 0, background: white, border: `1px solid ${border}`, color: black, padding: "9px 8px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16, outline: "none", borderRadius: 4, boxSizing: "border-box" }}>
                      <option value="in">in</option><option value="cm">cm</option><option value="lbs">lbs</option><option value="kg">kg</option><option value="%">%</option><option value="">no unit</option>
                    </select>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addMeasurement}
                style={{ background: "none", border: `1px dashed ${border}`, color: muted, padding: "10px 14px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", borderRadius: 4, width: "100%" }}>
                + Add measurement
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Training ─────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.35rem", fontWeight: 700, color: black, margin: "0 0 4px" }}>Training</h2>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: "0 0 1rem" }}>How did the past week go?</p>

            <div style={{ background: "#faf8f5", border: `1px solid ${border}`, borderRadius: 6, padding: "12px 14px", marginBottom: "1.25rem" }}>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, margin: "0 0 4px" }}>Training this week</p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", color: black, margin: 0, fontWeight: 600 }}>{autoSummary}</p>
            </div>

            <RatingRow label="How did training feel overall?" value={form.trainingRating} onChange={set("trainingRating")} />

            <TextBlock label="What felt good this week?" value={form.trainingWins} onChange={set("trainingWins")}
              placeholder="Exercises you enjoyed, strength improvements, movements that felt better…" />
            <TextBlock label="Anything you didn't enjoy, struggled with, or want changed?" value={form.trainingChallenges} onChange={set("trainingChallenges")}
              placeholder="An awkward movement, an exercise you'd like swapped, equipment issues, timing…" />

            <div style={{ paddingTop: "1rem", borderTop: `1px solid ${border}` }}>
              <YesNoRow label="Any pain or unusual discomfort during training this week?" value={form.painReported} onChange={(v) => setForm((f) => ({ ...f, painReported: v }))} />
              {form.painReported === "yes" && (
                <TextBlock label="Tell me where you felt it, which exercise, and what it felt like." value={form.painNotes} onChange={set("painNotes")}
                  placeholder="e.g. Lower back on my second set of deadlifts — sharp, went away after." />
              )}
            </div>

            <div style={{ paddingTop: "1rem", borderTop: `1px solid ${border}` }}>
              <YesNoRow label="Want me to review your form on anything?" value={form.formReviewRequested} onChange={(v) => setForm((f) => ({ ...f, formReviewRequested: v }))} />
              {form.formReviewRequested === "yes" && (
                <div>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", color: muted, margin: "0 0 12px", lineHeight: 1.5 }}>
                    Add up to {MAX_FORM_REVIEW_VIDEOS} short clips total. Videos are private — only you and Lisa can view them.
                  </p>
                  {form.formReviews.map((r) => (
                    <FormReviewCard
                      key={r.key}
                      review={r}
                      programExercises={programExerciseList}
                      onUpdate={(patch) => updateFormReview(r.key, patch)}
                      onRemove={() => removeFormReview(r.key)}
                      onPickVideos={(files) => handleReviewVideoPick(r.key, files)}
                      onRemoveVideo={(previewUrl) => removeReviewVideo(r.key, previewUrl)}
                      remainingVideoBudget={MAX_FORM_REVIEW_VIDEOS - form.formReviews.reduce((acc, x) => acc + x.videos.length, 0)}
                    />
                  ))}
                  <button type="button" onClick={addFormReview}
                    style={{ background: "none", border: `1px dashed ${border}`, color: muted, padding: "10px 14px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", borderRadius: 4, width: "100%" }}>
                    + Add form-review request
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Recovery ─────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.35rem", fontWeight: 700, color: black, margin: "0 0 4px" }}>Recovery</h2>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: "0 0 1.25rem" }}>1 = poor · 5 = excellent</p>
            <RatingRow label="Sleep" value={form.sleepRating} onChange={set("sleepRating")} />
            <RatingRow label="Energy" value={form.energyRating} onChange={set("energyRating")} />
            <RatingRow label="Stress management" value={form.stressRating} onChange={set("stressRating")} labels={STRESS_LABELS} />
            <RatingRow label="Recovery / soreness" value={form.recoveryRating} onChange={set("recoveryRating")} />
          </div>
        )}

        {/* ── Step 4: Nutrition ────────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.35rem", fontWeight: 700, color: black, margin: "0 0 4px" }}>Nutrition</h2>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: "0 0 1rem" }}>How did nutrition feel this week?</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1.25rem" }}>
              {NUTRITION_STATUS_OPTIONS.map((opt) => {
                const active = form.nutritionStatus === opt.value
                return (
                  <button key={opt.value} type="button" onClick={() => set("nutritionStatus")(opt.value)}
                    style={{
                      textAlign: "left",
                      background: active ? `${accent}18` : "transparent",
                      border: `1px solid ${active ? accent : border}`,
                      color: black, padding: "12px 14px",
                      fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.88rem",
                      fontWeight: active ? 700 : 600,
                      cursor: "pointer", borderRadius: 4, WebkitTapHighlightColor: "transparent",
                    }}>
                    {opt.label}
                  </button>
                )
              })}
            </div>

            <TextBlock label="Anything you'd like help with?" value={form.nutritionHelp} onChange={set("nutritionHelp")}
              placeholder="Hunger, protein, meal timing, food choices, hitting macros, travel, digestion, anything else…" />

            <Link
              href="/my-coaching/nutrition"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "#faf8f5", border: `1px solid ${border}`, borderRadius: 6,
                padding: "10px 14px", textDecoration: "none",
                fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 600, color: black,
              }}
            >
              <span style={{ color: accent }}>→</span>
              Want feedback on a meal or day of eating? Send it to Lisa
            </Link>
          </div>
        )}

        {/* ── Step 5: Weekly Reflection ───────────────────────────────── */}
        {step === 5 && (
          <div>
            <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.35rem", fontWeight: 700, color: black, margin: "0 0 4px" }}>Week Review</h2>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: "0 0 1rem" }}>Anything I should know before I write your feedback?</p>

            <TextBlock label="Biggest win this week?" value={form.weeklyWin} onChange={set("weeklyWin")}
              placeholder="A PR, a habit that stuck, a moment of progress…" />
            <TextBlock label="Biggest challenge this week?" value={form.weeklyChallenge} onChange={set("weeklyChallenge")}
              placeholder="What felt hard? Missed workouts, cravings, low energy days…" />

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: black, display: "block", marginBottom: 8 }}>Is there anything you&apos;d like me to adjust for next week? <span style={{ fontWeight: 400, color: muted, fontSize: "0.72rem" }}>(optional)</span></label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ADJUSTMENT_OPTIONS.map((opt) => {
                  const active = form.adjustmentAreas.includes(opt.value)
                  return (
                    <button key={opt.value} type="button" onClick={() => toggleAdjustment(opt.value)}
                      style={{
                        background: active ? black : "transparent",
                        border: `1px solid ${active ? black : border}`,
                        color: active ? white : black, padding: "8px 14px",
                        fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem",
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer", borderRadius: 999, WebkitTapHighlightColor: "transparent",
                      }}>
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {form.adjustmentAreas.length > 0 && form.adjustmentAreas[0] !== "none" && (
              <TextBlock label="Tell me a bit more (optional)" value={form.adjustmentNotes} onChange={set("adjustmentNotes")}
                placeholder="Context on what you'd like adjusted." rows={2} />
            )}

            <TextBlock label="Any questions for me?" value={form.questionForLisa} onChange={set("questionForLisa")}
              placeholder="Anything you want to ask or clarify about your program, technique, nutrition, schedule…" />
          </div>
        )}

        {errorMsg && (
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", color: "#c14646", margin: "1rem 0 0" }}>{errorMsg}</p>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.25rem", gap: 12, flexWrap: "wrap" }}>
          {step > 1 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)}
              style={{ background: "none", border: `1px solid ${border}`, color: muted, padding: "11px 24px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", borderRadius: 4 }}>
              ← Back
            </button>
          ) : (
            <Link href="/my-coaching" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, textDecoration: "none" }}>Cancel</Link>
          )}

          {step < 5 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}
              style={{ background: canProceed() ? black : "#ddd", color: canProceed() ? white : "#aaa", border: "none", padding: "11px 28px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, cursor: canProceed() ? "pointer" : "not-allowed", borderRadius: 4 }}>
              Next →
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={saving || anyVideoUploading}
              style={{ background: saving || anyVideoUploading ? "#ccc" : accent, color: black, border: "none", padding: "11px 28px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, cursor: saving || anyVideoUploading ? "wait" : "pointer", borderRadius: 4 }}>
              {saving ? "Submitting…" : anyVideoUploading ? "Uploading videos…" : "Submit Check-In"}
            </button>
          )}
        </div>
      </div>

      {/* Plausibility confirmation — soft guard against weight typos */}
      {showTypoConfirm && lastWeight && (
        <div role="dialog" aria-modal="true" aria-labelledby="typo-confirm-title"
          style={{
            position: "fixed", inset: 0, background: "rgba(10,10,10,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "16px", zIndex: 1000,
          }}
          onClick={() => setShowTypoConfirm(false)}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ background: white, borderRadius: 10, maxWidth: 420, width: "100%", padding: "1.5rem 1.5rem 1.25rem", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: accent, margin: "0 0 6px" }}>Double-check your weight</p>
            <h2 id="typo-confirm-title" style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.35rem", fontWeight: 700, color: black, margin: "0 0 10px", lineHeight: 1.25 }}>Is that right?</h2>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", color: black, margin: "0 0 6px", lineHeight: 1.55 }}>
              Your last check-in was <strong>{lastWeight.value} {lastWeight.unit === "KG" ? "kg" : "lb"}</strong> and you entered <strong>{form.weight} {form.weightUnit === "KG" ? "kg" : "lb"}</strong>.
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, margin: "0 0 16px", lineHeight: 1.55 }}>
              If that&apos;s correct, go ahead. If it was a typo, edit it before submitting.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => { setShowTypoConfirm(false); setStep(1) }}
                style={{ flex: "1 1 160px", background: "transparent", border: `1px solid ${border}`, color: black, padding: "11px 18px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", borderRadius: 4 }}>
                Go back and edit
              </button>
              <button type="button" onClick={performSubmit}
                style={{ flex: "1 1 160px", background: black, color: white, border: "none", padding: "11px 18px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", borderRadius: 4 }}>
                Yes, that&apos;s correct
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Form-review sub-component ──────────────────────────────────────────────

function FormReviewCard({
  review,
  programExercises,
  onUpdate,
  onRemove,
  onPickVideos,
  onRemoveVideo,
  remainingVideoBudget,
}: {
  review: FormReview
  programExercises: ProgramExerciseLite[]
  onUpdate: (patch: Partial<Omit<FormReview, "videos">>) => void
  onRemove: () => void
  onPickVideos: (files: FileList | null) => void
  onRemoveVideo: (previewUrl: string) => void
  remainingVideoBudget: number
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [otherExercise, setOtherExercise] = useState(false)
  return (
    <div style={{ background: "#faf8f5", border: `1px solid ${border}`, borderRadius: 6, padding: 12, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: accent, margin: 0 }}>Form review</p>
        <button type="button" onClick={onRemove} aria-label="Remove form-review request"
          style={{ background: "none", border: "none", color: "#c14646", padding: "0 4px", cursor: "pointer", fontSize: "1.05rem", lineHeight: 1 }}>×</button>
      </div>

      <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", fontWeight: 600, color: black, display: "block", marginBottom: 6 }}>Exercise</label>
      {!otherExercise && programExercises.length > 0 ? (
        <select
          value={review.exercise}
          onChange={(e) => {
            if (e.target.value === "__other__") { setOtherExercise(true); onUpdate({ exercise: "" }) }
            else onUpdate({ exercise: e.target.value })
          }}
          style={{ width: "100%", background: white, border: `1px solid ${border}`, color: black, padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16, outline: "none", borderRadius: 4, boxSizing: "border-box", marginBottom: 10 }}
        >
          <option value="">Choose from your program…</option>
          {programExercises.map((e) => <option key={e.id} value={e.name}>{e.name}</option>)}
          <option value="__other__">Other exercise…</option>
        </select>
      ) : (
        <input type="text" value={review.exercise} onChange={(e) => onUpdate({ exercise: e.target.value })} placeholder="e.g. Bulgarian Split Squat"
          style={{ width: "100%", background: white, border: `1px solid ${border}`, color: black, padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16, outline: "none", borderRadius: 4, boxSizing: "border-box", marginBottom: 10 }} />
      )}

      <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", fontWeight: 600, color: black, display: "block", marginBottom: 6 }}>What would you like me to look at?</label>
      <textarea value={review.note} onChange={(e) => onUpdate({ note: e.target.value })} rows={2}
        placeholder="Setup, range of motion, whether the weight looks appropriate, something that feels awkward…"
        style={{ width: "100%", boxSizing: "border-box", background: white, border: `1px solid ${border}`, color: black, padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16, outline: "none", resize: "vertical", borderRadius: 4, lineHeight: 1.5, minHeight: 60, marginBottom: 10 }} />

      {/* Video attachments */}
      {review.videos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          {review.videos.map((v) => (
            <div key={v.previewUrl} style={{ display: "flex", alignItems: "center", gap: 10, background: white, border: `1px solid ${border}`, borderRadius: 6, padding: 8, position: "relative" }}>
              <video src={v.previewUrl} muted playsInline preload="metadata"
                style={{ width: 88, height: 60, objectFit: "cover", background: "#000", borderRadius: 4, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: black, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v.file.name}
                </p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", color: v.error ? "#c14646" : muted, margin: "3px 0 0" }}>
                  {v.error ? v.error : v.uploading ? `Uploading… ${v.progress}%` : "Ready"}
                </p>
              </div>
              <button type="button" onClick={() => onRemoveVideo(v.previewUrl)} aria-label="Remove video"
                style={{ background: "none", border: "none", color: "#c14646", padding: "0 6px", cursor: "pointer", fontSize: "1.05rem", lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      {remainingVideoBudget > 0 && (
        <>
          <input ref={fileRef} type="file" accept="video/*" multiple onChange={(e) => { onPickVideos(e.target.files); if (fileRef.current) fileRef.current.value = "" }} style={{ display: "none" }} />
          <button type="button" onClick={() => fileRef.current?.click()}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1px dashed ${border}`, padding: "9px 14px", cursor: "pointer", borderRadius: 6, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", fontWeight: 600, color: black, WebkitTapHighlightColor: "transparent" }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.5" y="4.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M14.5 8.5L18 6v8l-3.5-2.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
            {review.videos.length === 0 ? "Add video" : `Add another (${remainingVideoBudget} left)`}
          </button>
        </>
      )}
    </div>
  )
}
