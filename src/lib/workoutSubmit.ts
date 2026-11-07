export type WorkoutSubmitFailure = "offline" | "timeout" | "signed-out" | "server"

export type WorkoutSubmitResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; reason: WorkoutSubmitFailure }

export interface WorkoutSubmitBody {
  submissionId: string
  programId: string
  weekNumber: number
  dayLabel: string
  setData: string
  overallRpe?: number
  clientNotes?: string
}

type FetchLike = (input: string, init: RequestInit) => Promise<Pick<Response, "ok" | "status" | "json">>

export const WORKOUT_SUBMIT_TIMEOUT_MS = 20_000

export function newSubmissionId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === "function") return c.randomUUID()
  const bytes = new Uint8Array(16)
  c.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
}

// Success is reported only when the server confirms the log was stored.
export async function submitWorkoutLog(
  body: WorkoutSubmitBody,
  fetchImpl: FetchLike = fetch,
  timeoutMs: number = WORKOUT_SUBMIT_TIMEOUT_MS,
): Promise<WorkoutSubmitResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetchImpl("/api/coaching/workout-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (res.status === 401) return { ok: false, reason: "signed-out" }
    if (!res.ok) return { ok: false, reason: "server" }
    const json = (await res.json().catch(() => null)) as { log?: { id?: unknown }; duplicate?: unknown } | null
    if (!json?.log || typeof json.log.id !== "string") return { ok: false, reason: "server" }
    return { ok: true, duplicate: json.duplicate === true }
  } catch {
    return { ok: false, reason: controller.signal.aborted ? "timeout" : "offline" }
  } finally {
    clearTimeout(timer)
  }
}

export function submitFailureMessage(reason: WorkoutSubmitFailure): string {
  switch (reason) {
    case "signed-out":
      return "Not saved yet. You've been signed out. Sign in again in another tab, then tap Retry. Your entries are kept on this device."
    case "timeout":
      return "Not saved yet. The connection timed out. Your entries are kept on this device. Tap Retry."
    case "offline":
      return "Not saved yet. Check your connection. Your entries are kept on this device. Tap Retry."
    default:
      return "Not saved yet. Something went wrong on our side. Your entries are kept on this device. Tap Retry."
  }
}
