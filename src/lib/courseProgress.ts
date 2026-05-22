export interface SetLog {
  reps: number
  weight: number // 0 = bodyweight
  unit: "lbs" | "kg"
  distanceTime?: string // for distance/time-based exercises (e.g. "30m", "45s")
}

export interface ExerciseLog {
  exerciseId: string
  sets: SetLog[]
}

export interface WorkoutSession {
  id: string // "r1-w1-a"
  round: number
  week: number
  day: "a" | "b" | "c"
  completedAt: string
  exercises: ExerciseLog[]
}

export interface CourseProgress {
  version: 1
  weightUnit: "lbs" | "kg"
  sessions: WorkoutSession[]
  weeksPerRound?: number // default 6
}

const EMPTY: CourseProgress = { version: 1, weightUnit: "lbs", sessions: [] }

function storageKey(userId: string) {
  return `lfm_progress_${userId}`
}

export function loadProgress(userId: string): CourseProgress {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return { ...EMPTY }
    const parsed = JSON.parse(raw) as CourseProgress
    return parsed
  } catch {
    return { ...EMPTY }
  }
}

export function saveProgress(userId: string, progress: CourseProgress): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(progress))
  } catch {
    // storage unavailable — silent fail
  }
}

export function makeSessionId(round: number, week: number, day: "a" | "b" | "c") {
  return `r${round}-w${week}-${day}`
}

export function getSession(
  sessions: WorkoutSession[],
  round: number,
  week: number,
  day: "a" | "b" | "c"
): WorkoutSession | undefined {
  return sessions.find((s) => s.round === round && s.week === week && s.day === day)
}

export interface ProgressPosition {
  round: number
  week: number
  nextDay: "a" | "b" | "c"
  totalSessions: number
  startedAt: string | null
}

export function getCurrentPosition(sessions: WorkoutSession[], weeksPerRound = 6): ProgressPosition {
  if (sessions.length === 0) {
    return { round: 1, week: 1, nextDay: "a", totalSessions: 0, startedAt: null }
  }

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  )
  const startedAt = sorted[0].completedAt

  // Find next incomplete session in order
  const days: ("a" | "b" | "c")[] = ["a", "b", "c"]
  for (let round = 1; round <= 99; round++) {
    for (let week = 1; week <= weeksPerRound; week++) {
      for (const day of days) {
        if (!getSession(sessions, round, week, day)) {
          return { round, week, nextDay: day, totalSessions: sessions.length, startedAt }
        }
      }
    }
  }

  return { round: 1, week: 1, nextDay: "a", totalSessions: sessions.length, startedAt }
}

export function getPRs(sessions: WorkoutSession[]): Record<string, SetLog> {
  const prs: Record<string, SetLog> = {}
  for (const session of sessions) {
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        if (set.weight > 0) {
          const current = prs[ex.exerciseId]
          if (!current || set.weight > current.weight) {
            prs[ex.exerciseId] = set
          }
        }
      }
    }
  }
  return prs
}

export function getSessionsForRound(
  sessions: WorkoutSession[],
  round: number
): WorkoutSession[] {
  return sessions.filter((s) => s.round === round)
}

export function isSessionComplete(
  sessions: WorkoutSession[],
  round: number,
  week: number,
  day: "a" | "b" | "c"
): boolean {
  return !!getSession(sessions, round, week, day)
}
