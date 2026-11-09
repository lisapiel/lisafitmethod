import type { CoachingClientRecord, CoachingProgramRecord } from "@/lib/authTokens"

// What a client's own app may receive. Coach-only fields (program design
// notes, private client notes) are never sent, even if nothing renders them.

export type ClientProgram = Pick<CoachingProgramRecord, "id" | "name" | "status" | "weeks" | "durationWeeks" | "introNote">

export function toClientProgram<T extends Partial<CoachingProgramRecord>>(p: T): Partial<ClientProgram> {
  const { id, name, status, weeks, durationWeeks, introNote } = p
  return { id, name, status, weeks, durationWeeks, introNote }
}

const COACH_ONLY_CLIENT_FIELDS = ["privateNotes"] as const

export function toClientRecord<T extends Partial<CoachingClientRecord>>(c: T): Omit<T, (typeof COACH_ONLY_CLIENT_FIELDS)[number]> {
  const copy: Record<string, unknown> = { ...c }
  for (const k of COACH_ONLY_CLIENT_FIELDS) delete copy[k]
  return copy as Omit<T, (typeof COACH_ONLY_CLIENT_FIELDS)[number]>
}
