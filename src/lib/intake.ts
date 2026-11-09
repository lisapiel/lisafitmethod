import type { CoachingApplication, CoachingClientRecord } from "./authTokens"
import { GOAL_META } from "./nutrition"

// The application answers Lisa uses when she designs a client's program,
// shown back to her on the client's page. Coach only: never send this to the
// client's app.

export type StrengthConfidence = "learning" | "regular" | "confident"

// Labels are the exact options on the application form.
export const STRENGTH_CONFIDENCE_OPTIONS: ReadonlyArray<{ value: StrengthConfidence; label: string }> = [
  { value: "learning", label: "I'm still learning them." },
  { value: "regular", label: "I know them and train them regularly." },
  { value: "confident", label: "I'm confident with them and follow a progressive training plan." },
]

export const STRENGTH_CONFIDENCE_QUESTION = "How comfortable are you with the main strength exercises, like squats, deadlifts, presses and rows?"

export function isStrengthConfidence(v: unknown): v is StrengthConfidence {
  return typeof v === "string" && STRENGTH_CONFIDENCE_OPTIONS.some((o) => o.value === v)
}

export function strengthConfidenceLabel(v: unknown): string | null {
  return STRENGTH_CONFIDENCE_OPTIONS.find((o) => o.value === v)?.label ?? null
}

const STAGE: Record<string, number> = { PAID: 4, APPROVED: 3, PENDING: 2, DECLINED: 1 }

// The application that belongs to this client: owned by their account, or
// sent from their address when it was never linked elsewhere. When there is
// more than one, the one furthest along wins, then the newest.
export function pickApplicationFor<T extends Pick<CoachingApplication, "email" | "ownerEmail" | "status" | "applicationDate">>(apps: T[], email: string): T | null {
  const me = email.trim().toLowerCase()
  const mine = apps.filter((a) => {
    const owner = a.ownerEmail?.trim().toLowerCase()
    return owner ? owner === me : a.email?.trim().toLowerCase() === me
  })
  mine.sort((a, b) => (STAGE[b.status] ?? 0) - (STAGE[a.status] ?? 0) || (b.applicationDate ?? "").localeCompare(a.applicationDate ?? ""))
  return mine[0] ?? null
}

export type IntakeSummary = {
  applicationId: string
  applicationDate: string | null
  trainingHistory: string | null
  strengthConfidence: string
  daysPerWeek: string | null
  sessionLength: string | null
  equipment: string | null
  injuries: string | null
  applicationGoal: string | null
  nutritionGoal: string | null
}

const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null)

export function buildIntakeSummary(
  app: Partial<CoachingApplication> & { id: string; strengthConfidence?: unknown },
  client: Pick<CoachingClientRecord, "nutritionGoal"> | null,
): IntakeSummary {
  const equipment = text(app.equipment)
  const details = text(app.equipmentDetails)
  const goal = text(app.primaryGoal) ?? text(app.goals)
  const other = text(app.primaryGoalOther)
  return {
    applicationId: app.id,
    applicationDate: text(app.applicationDate),
    trainingHistory: text(app.trainingExperience) ?? text(app.currentFitnessLevel),
    strengthConfidence: strengthConfidenceLabel(app.strengthConfidence) ?? "Not asked",
    daysPerWeek: text(app.daysPerWeek),
    sessionLength: text(app.sessionDuration),
    equipment: equipment && details ? `${equipment}. ${details}` : equipment ?? details,
    injuries: text(app.injuries),
    applicationGoal: goal === "Other" && other ? `Other: ${other}` : goal,
    nutritionGoal: client?.nutritionGoal ? GOAL_META[client.nutritionGoal]?.label ?? null : null,
  }
}
