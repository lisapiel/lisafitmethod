import { isOwnClientKey } from "./mediaKeys"
import { expandedWeeks } from "./programExpansion"
import { completedFor, nextWorkout, type PortalLog, type PortalWeek } from "./portalProgram"

// Optional progress photos sent with a check-in. Private coaching media:
// stored in the client's own folder and only ever shown through short-lived
// signed links to that client and to admins. Uploading one is not permission
// to use it anywhere else.

export const PROGRESS_PHOTO_PREFIX = "media/coaching-progress-photos/"
export const PHOTO_POSES = ["front", "side", "back"] as const
export type PhotoPose = (typeof PHOTO_POSES)[number]
export const POSE_LABEL: Record<PhotoPose, string> = { front: "Front", side: "Side", back: "Back" }
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024

export type StoredPhoto = { pose: PhotoPose; key: string }

const isPose = (v: unknown): v is PhotoPose => (PHOTO_POSES as readonly unknown[]).includes(v)

// Request body → photos to store. Every key must be a progress photo in the
// caller's own folder, one per pose, at most three. Anything else is refused
// so a client can't attach another client's file or an arbitrary path.
export function parseProgressPhotosInput(raw: unknown, ownerSub: string): { ok: true; value: StoredPhoto[] } | { ok: false; error: string } {
  if (raw == null) return { ok: true, value: [] }
  if (!Array.isArray(raw) || raw.length > PHOTO_POSES.length) return { ok: false, error: "Invalid progress photos" }
  const out: StoredPhoto[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") return { ok: false, error: "Invalid progress photos" }
    const { pose, key } = item as { pose?: unknown; key?: unknown }
    if (!isPose(pose) || out.some((p) => p.pose === pose)) return { ok: false, error: "Invalid progress photos" }
    if (typeof key !== "string" || key.length > 512 || !key.startsWith(PROGRESS_PHOTO_PREFIX) || !isOwnClientKey(key, ownerSub, "progress-photo")) {
      return { ok: false, error: "Invalid progress photo" }
    }
    out.push({ pose, key })
  }
  return { ok: true, value: PHOTO_POSES.flatMap((p) => out.filter((x) => x.pose === p)) }
}

// Stored JSON → photos, in front/side/back order. Bad data reads as none.
export function decodeProgressPhotos(json: unknown): StoredPhoto[] {
  if (typeof json !== "string" || !json) return []
  try {
    const arr = JSON.parse(json) as unknown
    if (!Array.isArray(arr)) return []
    const seen = new Set<string>()
    const out: StoredPhoto[] = []
    for (const x of arr) {
      if (!x || typeof x !== "object") continue
      const { pose, key } = x as { pose?: unknown; key?: unknown }
      if (!isPose(pose) || seen.has(pose) || typeof key !== "string" || !key.startsWith(PROGRESS_PHOTO_PREFIX)) continue
      seen.add(pose)
      out.push({ pose, key })
    }
    return PHOTO_POSES.flatMap((p) => out.filter((x) => x.pose === p))
  } catch { return [] }
}

// ── Phase milestones ────────────────────────────────────────────────────────

// Where the client is in their current phase, from workout logs rather than
// the calendar: the week of their next unfinished workout, out of the phase's
// own length (6, 8 or whatever the coach set).
export type PhaseProgress = { programId: string; programCreatedAt: string; week: number; weeks: number; allDone: boolean }

export function phaseProgress(
  program: { id?: unknown; createdAt?: unknown; weeks?: unknown; durationWeeks?: unknown } | null | undefined,
  logs: PortalLog[],
): PhaseProgress | null {
  if (!program || typeof program.id !== "string" || !program.id) return null
  const weeks = expandedWeeks({
    weeks: typeof program.weeks === "string" ? program.weeks : "[]",
    durationWeeks: typeof program.durationWeeks === "number" ? program.durationWeeks : undefined,
  }) as PortalWeek[]
  if (weeks.length === 0) return null
  const next = nextWorkout(weeks, completedFor(program.id, logs))
  return {
    programId: program.id,
    programCreatedAt: typeof program.createdAt === "string" ? program.createdAt : "",
    week: next ? next.weekIndex + 1 : weeks.length,
    weeks: weeks.length,
    allDone: !next,
  }
}

// What the check-in record keeps, stamped by the server at submission.
export type PhaseStamp = { phaseProgramId?: string; phaseWeek?: number; phaseWeeks?: number }

export type PhotoMilestone = "start" | "final" | null

// Which friendly prompt (if any) to show above the optional photo upload.
//
// Start: only for the first check-in of a phase, and only while the client is
// still in week 1 or 2. Any earlier check-in in this phase (or any check-in
// since the phase was assigned, for check-ins sent before phases were
// recorded) means they've already had their chance, whether they added
// photos or not. Someone already partway through a phase never sees it.
//
// Final: once the client reaches the last week of the phase or has finished
// it, and only until they've sent one check-in from that point.
export function photoMilestone(
  progress: PhaseProgress | null,
  checkIns: Array<PhaseStamp & { submittedAt: string }>,
): PhotoMilestone {
  if (!progress) return null
  const inPhase = checkIns.filter((c) => c.phaseProgramId === progress.programId)
  const sinceAssigned = progress.programCreatedAt
    ? checkIns.filter((c) => c.submittedAt > progress.programCreatedAt)
    : checkIns
  if (inPhase.length === 0 && sinceAssigned.length === 0 && progress.week <= 2 && !progress.allDone) return "start"
  const atEnd = progress.allDone || progress.week >= progress.weeks
  if (atEnd) {
    // Compared with the phase's current length, so a phase the coach extends
    // gets its prompt at the new final week.
    const finalSent = inPhase.some((c) => typeof c.phaseWeek === "number" && c.phaseWeek >= progress.weeks)
    if (!finalSent) return "final"
  }
  return null
}
