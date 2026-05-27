export interface SetLog {
  exerciseId: string
  setNumber: number
  weight?: number
  unit?: "lbs" | "kg"
  reps?: number
  minutes?: number
  seconds?: number
  notes?: string
}

export interface DayWorkoutLog {
  sets: SetLog[]
  completedAt?: string
}

export interface TrackerExercise {
  id: string
  name: string
  type: "weight_reps" | "reps_only" | "time"
  notes: string
  order: number
}

export interface WorkoutDay {
  id: string
  name: string
  exercises: TrackerExercise[]
  order: number
}

export interface TrackerWeek {
  id: string
  number: number
  createdAt: string
  logs: Record<string, DayWorkoutLog>
}

export interface TrackerData {
  version: 1
  weightUnit: "lbs" | "kg"
  days: WorkoutDay[]
  weeks: TrackerWeek[]
  currentWeekIndex: number
}

export function makeId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function emptyData(): TrackerData {
  const days: WorkoutDay[] = [1, 2, 3, 4].map((n, i) => ({
    id: makeId(), name: `Day ${n}`, exercises: [], order: i,
  }))
  return {
    version: 1,
    weightUnit: "lbs",
    days,
    weeks: [{ id: makeId(), number: 1, createdAt: new Date().toISOString(), logs: {} }],
    currentWeekIndex: 0,
  }
}

export function loadTrackerData(userId: string): TrackerData {
  try {
    const raw = localStorage.getItem(`lfm_tracker_${userId}`)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as TrackerData
    if (parsed.version !== 1) return emptyData()
    return parsed
  } catch {
    return emptyData()
  }
}

export function saveTrackerData(userId: string, data: TrackerData): void {
  try {
    localStorage.setItem(`lfm_tracker_${userId}`, JSON.stringify(data))
  } catch {
    // Storage quota exceeded or private browsing — silently ignore
  }
}
