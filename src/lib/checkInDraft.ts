import {
  ADJUSTMENT_AREAS, HUNGER_OPTIONS, NUTRITION_NOTE_MAX, NUTRITION_STATUSES, WEIGHT_STATUSES,
  type AdjustmentArea, type Hunger, type NutritionStatus, type WeightStatus,
} from "./checkInAnswers"

// The in-progress check-in is kept in the browser so a reload, a tap on another
// tab or a closed app never loses what the client typed. One draft per client
// per check-in period. The period starts at their last submitted check-in, so a
// new submission makes every older draft stale.
export const CHECK_IN_DRAFT_PREFIX = "lfm:check-in-draft:v1:"
export const CHECK_IN_DRAFT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000
export const CHECK_IN_STEPS = 5
const FORM_REVIEW_PREFIX = "media/coaching-form-reviews/"
const MAX_TEXT = 4000

// Only uploaded videos go into a draft (by their storage key), so the client
// doesn't have to upload them again. A video still uploading is not kept.
export type DraftVideo = { s3Key: string; name: string }
export type DraftFormReview = { exercise: string; note: string; videos: DraftVideo[] }
export type YesNo = "unset" | "no" | "yes"

export type CheckInDraftAnswers = {
  weightChoice: WeightStatus | ""
  weight: string
  weightUnit: "LBS" | "KG"
  measurements: Array<{ label: string; value: string; unit: string }>
  trainingRating: number
  painReported: YesNo
  painNotes: string
  formReviewRequested: YesNo
  formReviews: DraftFormReview[]
  sleepRating: number
  energyRating: number
  stressRating: number
  recoveryRating: number
  nutritionStatus: NutritionStatus | ""
  nutritionHelp: string
  nutritionNote: string
  hunger: Hunger | ""
  weeklyWin: string
  weeklyChallenge: string
  adjustmentAreas: AdjustmentArea[]
  adjustmentNotes: string
  questionForLisa: string
}

export type CheckInDraft = { answers: CheckInDraftAnswers; step: number; savedAt: string }

export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">

function emailPart(email: string): string {
  return encodeURIComponent(email.trim().toLowerCase())
}

export function checkInDraftKey(email: string, lastCheckInAt: string | null | undefined): string | null {
  if (!email || !email.trim()) return null
  return `${CHECK_IN_DRAFT_PREFIX}${emailPart(email)}:${lastCheckInAt || "first"}`
}

const str = (v: unknown, max = MAX_TEXT): string => (typeof v === "string" ? v.slice(0, max) : "")
const rating = (v: unknown): number => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 5 ? v : 0)
const yesNo = (v: unknown): YesNo => (v === "no" || v === "yes" ? v : "unset")
const oneOf = <T extends string>(list: readonly T[], v: unknown): T | "" => (list as readonly unknown[]).includes(v) ? v as T : ""

export function sanitizeDraftAnswers(raw: unknown): CheckInDraftAnswers | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>
  const measurements = Array.isArray(r.measurements)
    ? r.measurements.slice(0, 20).flatMap((m) => {
      if (!m || typeof m !== "object") return []
      const x = m as Record<string, unknown>
      return [{ label: str(x.label, 60), value: str(x.value, 20), unit: str(x.unit, 10) }]
    })
    : []
  const formReviews = Array.isArray(r.formReviews)
    ? r.formReviews.slice(0, 10).flatMap((fr) => {
      if (!fr || typeof fr !== "object") return []
      const x = fr as Record<string, unknown>
      const videos = Array.isArray(x.videos)
        ? x.videos.flatMap((v) => {
          if (!v || typeof v !== "object") return []
          const y = v as Record<string, unknown>
          const s3Key = str(y.s3Key, 512)
          if (!s3Key.startsWith(FORM_REVIEW_PREFIX)) return []
          return [{ s3Key, name: str(y.name, 200) || "Video" }]
        }).slice(0, 3)
        : []
      return [{ exercise: str(x.exercise, 200), note: str(x.note), videos }]
    })
    : []
  const adjustmentAreas = Array.isArray(r.adjustmentAreas)
    ? [...new Set(r.adjustmentAreas.filter((a): a is AdjustmentArea => (ADJUSTMENT_AREAS as readonly unknown[]).includes(a)))]
    : []
  return {
    weightChoice: oneOf(WEIGHT_STATUSES, r.weightChoice),
    weight: str(r.weight, 20),
    weightUnit: r.weightUnit === "KG" ? "KG" : "LBS",
    measurements,
    trainingRating: rating(r.trainingRating),
    painReported: yesNo(r.painReported),
    painNotes: str(r.painNotes),
    formReviewRequested: yesNo(r.formReviewRequested),
    formReviews,
    sleepRating: rating(r.sleepRating),
    energyRating: rating(r.energyRating),
    stressRating: rating(r.stressRating),
    recoveryRating: rating(r.recoveryRating),
    nutritionStatus: oneOf(NUTRITION_STATUSES, r.nutritionStatus),
    nutritionHelp: str(r.nutritionHelp),
    nutritionNote: str(r.nutritionNote, NUTRITION_NOTE_MAX),
    hunger: oneOf(HUNGER_OPTIONS.map((o) => o.value), r.hunger),
    weeklyWin: str(r.weeklyWin),
    weeklyChallenge: str(r.weeklyChallenge),
    adjustmentAreas,
    adjustmentNotes: str(r.adjustmentNotes),
    questionForLisa: str(r.questionForLisa),
  }
}

// A stable fingerprint of the answers, so "has the client changed anything?"
// doesn't depend on key order or on values the draft would drop anyway.
export function draftSignature(a: CheckInDraftAnswers): string {
  return JSON.stringify(sanitizeDraftAnswers(a))
}

type StepFields = Pick<CheckInDraftAnswers,
  "weightChoice" | "weight" | "painReported" | "formReviewRequested" | "sleepRating" | "energyRating" | "stressRating" | "recoveryRating" | "nutritionStatus">

// Whether the client has answered everything a step requires to move on.
export function checkInStepComplete(step: number, a: StepFields): boolean {
  if (step === 1) {
    if (a.weightChoice === "") return false
    if (a.weightChoice === "new") {
      const n = parseFloat(a.weight)
      return Number.isFinite(n) && n > 0
    }
    return true
  }
  if (step === 2) return a.painReported !== "unset" && a.formReviewRequested !== "unset"
  if (step === 3) return a.sleepRating > 0 && a.energyRating > 0 && a.stressRating > 0 && a.recoveryRating > 0
  if (step === 4) return a.nutritionStatus !== ""
  return true
}

// The step to reopen a draft on: where the client was, but never past a step
// that still needs an answer.
export function resumeStep(savedStep: number, a: StepFields): number {
  const target = Number.isInteger(savedStep) ? Math.min(Math.max(savedStep, 1), CHECK_IN_STEPS) : 1
  let s = 1
  while (s < target && checkInStepComplete(s, a)) s++
  return s
}

export function encodeCheckInDraft(answers: CheckInDraftAnswers, step: number, now: Date): string {
  return JSON.stringify({ v: 1, savedAt: now.toISOString(), step, answers })
}

export function decodeCheckInDraft(raw: string | null, nowMs: number): CheckInDraft | null {
  if (!raw) return null
  let parsed: unknown
  try { parsed = JSON.parse(raw) } catch { return null }
  if (!parsed || typeof parsed !== "object") return null
  const p = parsed as Record<string, unknown>
  if (p.v !== 1 || typeof p.savedAt !== "string") return null
  const at = Date.parse(p.savedAt)
  if (!Number.isFinite(at) || nowMs - at > CHECK_IN_DRAFT_MAX_AGE_MS || at - nowMs > 24 * 60 * 60 * 1000) return null
  const answers = sanitizeDraftAnswers(p.answers)
  if (!answers) return null
  return { answers, step: typeof p.step === "number" ? p.step : 1, savedAt: p.savedAt }
}

// Storage can be missing, full or blocked (private mode). Every call below
// swallows that, so the check-in still works without a draft.
export function saveCheckInDraft(storage: DraftStorage | null, key: string, answers: CheckInDraftAnswers, step: number, now = new Date()): boolean {
  if (!storage) return false
  try { storage.setItem(key, encodeCheckInDraft(answers, step, now)); return true } catch { return false }
}

export function loadCheckInDraft(storage: DraftStorage | null, key: string, nowMs = Date.now()): CheckInDraft | null {
  if (!storage) return null
  let raw: string | null = null
  try { raw = storage.getItem(key) } catch { return null }
  const draft = decodeCheckInDraft(raw, nowMs)
  if (!draft && raw != null) clearCheckInDraft(storage, key)
  return draft
}

export function clearCheckInDraft(storage: DraftStorage | null, key: string): void {
  if (!storage) return
  try { storage.removeItem(key) } catch { /* storage unavailable */ }
}

// Removes this client's drafts from earlier check-in periods.
export function clearStaleCheckInDrafts(storage: DraftStorage | null, email: string, keepKey: string | null): number {
  if (!storage || !email.trim()) return 0
  const mine = `${CHECK_IN_DRAFT_PREFIX}${emailPart(email)}:`
  try {
    const stale: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i)
      if (k && k.startsWith(mine) && k !== keepKey) stale.push(k)
    }
    stale.forEach((k) => storage.removeItem(k))
    return stale.length
  } catch { return 0 }
}

export function browserDraftStorage(): DraftStorage | null {
  try { return typeof window !== "undefined" ? window.localStorage : null } catch { return null }
}
