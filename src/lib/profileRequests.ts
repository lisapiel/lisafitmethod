import { ACTIVITY_LEVELS, canonicalActivityLevel, type NutritionGoal } from "./nutrition"
import type { CoachingClientRecord } from "./authTokens"
import { automaticEstimate, isOnAutomaticEstimate, type MacroSet } from "./startingWeight"

// A client picks their nutrition goal and activity level once, in setup.
// After that only Lisa changes them: the client sends a request and Lisa
// approves or declines it. Approving changes those two profile fields and
// nothing else. A target Lisa set (customMacros) is never touched here.

export const NUTRITION_GOALS: readonly NutritionGoal[] = ["fat-loss", "recomp", "maintain", "muscle-gain"]
export const PROFILE_REQUEST_REASON_MAX = 300
export const DECLINE_NOTE_MAX = 500

export type ProfileValues = { nutritionGoal?: NutritionGoal; activityLevel?: number }

export type ProfileRequestStatus = "pending" | "approved" | "declined"

export interface ProfileChangeRequest {
  id: string
  clientEmail: string
  requested: ProfileValues
  current: ProfileValues
  reason: string
  status: ProfileRequestStatus
  createdAt: string
  decidedAt?: string
  decidedBy?: string
  coachNote?: string
  // Recorded at decision time so the history shows what Lisa saw.
  targetSetByCoach?: boolean
  automaticEstimate?: { previous: MacroSet | null; next: MacroSet | null }
}

// What the client's own app may receive about a request: no coach identity,
// no estimate numbers, and Lisa's note only when she declined.
export type ClientProfileRequest = Pick<ProfileChangeRequest, "id" | "requested" | "current" | "reason" | "status" | "createdAt" | "decidedAt" | "coachNote">

export function isCurrentActivityLevel(v: unknown): v is number {
  return typeof v === "number" && ACTIVITY_LEVELS.some((a) => a.value === v)
}

export function isNutritionGoal(v: unknown): v is NutritionGoal {
  return typeof v === "string" && (NUTRITION_GOALS as readonly string[]).includes(v)
}

// The goal picked on the application, when it says the same thing as one of
// the nutrition goals. Anything else (strength, mobility, "Other") leaves the
// choice to the client.
const APPLICATION_GOAL_MAP: Record<string, NutritionGoal> = {
  "lose fat": "fat-loss",
  "build muscle": "muscle-gain",
  "body recomposition": "recomp",
}

export function goalFromApplication(primaryGoal: string | null | undefined): NutritionGoal | null {
  if (!primaryGoal) return null
  return APPLICATION_GOAL_MAP[primaryGoal.trim().toLowerCase()] ?? null
}

export function hasCompletedProfile(client: Pick<CoachingClientRecord, "nutritionGoal" | "activityLevel"> | null | undefined): boolean {
  return !!client && client.nutritionGoal != null && client.activityLevel != null
}

// ── Setup save ──────────────────────────────────────────────────────────────

export type SetupProfileDecision =
  | { ok: true; updates: ProfileValues }
  | { ok: false; status: number; error: string }

// What a setup save may write for goal and activity. New clients must send one
// of the five current activity values and one of the four goals. Once both are
// saved, setup can't change them: a stale page that sends the same values is
// fine, anything different has to go through a request.
export function planSetupProfile(
  existing: Pick<CoachingClientRecord, "nutritionGoal" | "activityLevel"> | null,
  body: { activityLevel?: unknown; nutritionGoal?: unknown },
): SetupProfileDecision {
  if (hasCompletedProfile(existing)) {
    const sentGoal = body.nutritionGoal
    const sentActivity = body.activityLevel
    const goalChanged = sentGoal != null && sentGoal !== existing!.nutritionGoal
    // Older pages showed a legacy stored value as its current-scale equal, so
    // the same label sent back is not a change.
    const activityChanged = sentActivity != null &&
      canonicalActivityLevel(Number(sentActivity)) !== canonicalActivityLevel(existing!.activityLevel)
    if (goalChanged || activityChanged) {
      return { ok: false, status: 409, error: "Your goal and activity level are already set. To change them, send me a request from this page and I'll review it." }
    }
    return { ok: true, updates: {} }
  }
  if (!isCurrentActivityLevel(body.activityLevel)) {
    return { ok: false, status: 400, error: "Choose the option that matches a normal week." }
  }
  if (!isNutritionGoal(body.nutritionGoal)) {
    return { ok: false, status: 400, error: "Choose your nutrition goal." }
  }
  return { ok: true, updates: { activityLevel: body.activityLevel, nutritionGoal: body.nutritionGoal } }
}

// ── Client request ──────────────────────────────────────────────────────────

export type RequestInput =
  | { ok: true; requested: ProfileValues; reason: string }
  | { ok: false; status: number; error: string }

export function validateProfileRequest(
  client: Pick<CoachingClientRecord, "nutritionGoal" | "activityLevel"> | null,
  existing: Pick<ProfileChangeRequest, "status">[],
  body: { nutritionGoal?: unknown; activityLevel?: unknown; reason?: unknown },
): RequestInput {
  if (!client || !hasCompletedProfile(client)) {
    return { ok: false, status: 409, error: "Finish setup first. You can choose your goal and activity level there." }
  }
  if (existing.some((r) => r.status === "pending")) {
    return { ok: false, status: 409, error: "You already have a request waiting for me. I'll review that one first, and you can send another after." }
  }
  const requested: ProfileValues = {}
  if (body.nutritionGoal != null && body.nutritionGoal !== "") {
    if (!isNutritionGoal(body.nutritionGoal)) return { ok: false, status: 400, error: "Choose one of the goals listed." }
    if (body.nutritionGoal !== client.nutritionGoal) requested.nutritionGoal = body.nutritionGoal
  }
  if (body.activityLevel != null && body.activityLevel !== "") {
    if (!isCurrentActivityLevel(body.activityLevel)) return { ok: false, status: 400, error: "Choose one of the activity levels listed." }
    if (body.activityLevel !== client.activityLevel) requested.activityLevel = body.activityLevel
  }
  if (requested.nutritionGoal == null && requested.activityLevel == null) {
    return { ok: false, status: 400, error: "Choose a new goal or a new activity level." }
  }
  const reason = typeof body.reason === "string" ? body.reason.trim() : ""
  if (!reason) return { ok: false, status: 400, error: "Tell me briefly why you'd like to change it." }
  if (reason.length > PROFILE_REQUEST_REASON_MAX) {
    return { ok: false, status: 400, error: `Please keep it under ${PROFILE_REQUEST_REASON_MAX} characters.` }
  }
  return { ok: true, requested, reason }
}

export function buildProfileRequest(
  client: Pick<CoachingClientRecord, "email" | "nutritionGoal" | "activityLevel">,
  input: { requested: ProfileValues; reason: string },
  id: string,
  now: Date,
): ProfileChangeRequest {
  const current: ProfileValues = {}
  if (input.requested.nutritionGoal != null && client.nutritionGoal != null) current.nutritionGoal = client.nutritionGoal
  if (input.requested.activityLevel != null && client.activityLevel != null) current.activityLevel = client.activityLevel
  return {
    id,
    clientEmail: client.email.toLowerCase(),
    requested: input.requested,
    current,
    reason: input.reason,
    status: "pending",
    createdAt: now.toISOString(),
  }
}

// ── Coach decision ──────────────────────────────────────────────────────────

type EstimateClient = Parameters<typeof automaticEstimate>[0]

export function applyRequested<T extends EstimateClient>(client: T, requested: ProfileValues): T {
  return {
    ...client,
    ...(requested.nutritionGoal != null ? { nutritionGoal: requested.nutritionGoal } : {}),
    ...(requested.activityLevel != null ? { activityLevel: requested.activityLevel } : {}),
  }
}

export type RequestPreview = {
  targetSetByCoach: boolean
  // The automatic estimate before and after, worked out from the starting
  // weight. Shown to Lisa only; it is never applied as a target here.
  previous: MacroSet | null
  next: MacroSet | null
}

export function previewRequest(client: EstimateClient, requested: ProfileValues): RequestPreview {
  return {
    targetSetByCoach: !isOnAutomaticEstimate(client),
    previous: automaticEstimate(client),
    next: automaticEstimate(applyRequested(client, requested)),
  }
}

export type Decision =
  | { ok: true; request: Partial<ProfileChangeRequest>; clientUpdates: ProfileValues }
  | { ok: false; status: number; error: string }

export function decideProfileRequest(
  request: ProfileChangeRequest | null,
  client: EstimateClient | null,
  input: { action?: unknown; note?: unknown },
  coach: string,
  now: Date,
): Decision {
  if (!request) return { ok: false, status: 404, error: "Request not found." }
  if (!client) return { ok: false, status: 404, error: "Client not found." }
  if (request.status !== "pending") return { ok: false, status: 409, error: "This request has already been decided." }
  const note = typeof input.note === "string" ? input.note.trim() : ""
  if (note.length > DECLINE_NOTE_MAX) return { ok: false, status: 400, error: `Keep the note under ${DECLINE_NOTE_MAX} characters.` }
  const decided = { decidedAt: now.toISOString(), decidedBy: coach.toLowerCase() }
  if (input.action === "decline") {
    return { ok: true, clientUpdates: {}, request: { ...decided, status: "declined", ...(note ? { coachNote: note } : {}) } }
  }
  if (input.action !== "approve") return { ok: false, status: 400, error: "Action must be approve or decline." }
  const preview = previewRequest(client, request.requested)
  const clientUpdates: ProfileValues = {}
  if (request.requested.nutritionGoal != null) clientUpdates.nutritionGoal = request.requested.nutritionGoal
  if (request.requested.activityLevel != null) clientUpdates.activityLevel = request.requested.activityLevel
  return {
    ok: true,
    clientUpdates,
    request: {
      ...decided,
      status: "approved",
      targetSetByCoach: preview.targetSetByCoach,
      ...(preview.targetSetByCoach ? {} : { automaticEstimate: { previous: preview.previous, next: preview.next } }),
    },
  }
}

// ── Views ───────────────────────────────────────────────────────────────────

export function sortRequestsNewestFirst<T extends { createdAt: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function ownRequests<T extends { clientEmail: string }>(all: T[], email: string): T[] {
  const me = email.trim().toLowerCase()
  return all.filter((r) => r.clientEmail.toLowerCase() === me)
}

export function toClientProfileRequest(r: ProfileChangeRequest): ClientProfileRequest {
  const out: ClientProfileRequest = {
    id: r.id,
    requested: r.requested,
    current: r.current,
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt,
  }
  if (r.decidedAt) out.decidedAt = r.decidedAt
  if (r.status === "declined" && r.coachNote) out.coachNote = r.coachNote
  return out
}
