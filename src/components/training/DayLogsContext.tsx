"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useCourseProgress } from "./CourseProgressContext"
import { WORKOUT_DAYS, ExerciseDef } from "@/lib/workoutData"
import { SetLog, ExerciseLog, WorkoutSession } from "@/lib/courseProgress"

type DayKey = "a" | "b" | "c"

export function defaultSets(ex: ExerciseDef, unit: "lbs" | "kg"): SetLog[] {
  return Array.from({ length: ex.defaultSets }, () => ({
    reps: ex.defaultReps ?? 0,
    weight: 0,
    unit,
    distanceTime: ex.trackDistanceOrTime ? "" : undefined,
  }))
}

export function buildInitialLogs(
  exercises: ExerciseDef[],
  unit: "lbs" | "kg"
): Record<string, SetLog[]> {
  const logs: Record<string, SetLog[]> = {}
  for (const ex of exercises) {
    logs[ex.id] = defaultSets(ex, unit)
  }
  return logs
}

export interface WeekOption {
  round: number
  week: number
  label: string
  done: boolean
  active: boolean
}

interface DayLogsContextValue {
  day: DayKey
  selectedRound: number
  selectedWeek: number
  setSelectedRound: (r: number) => void
  setSelectedWeek: (w: number) => void
  logs: Record<string, SetLog[]>
  updateExerciseSets: (exerciseId: string, sets: SetLog[]) => void
  handleComplete: () => void
  existingSession: WorkoutSession | undefined
  isCompleted: boolean
  editing: boolean
  setEditing: (e: boolean) => void
  weekOptions: WeekOption[]
  weeksPerRound: number
  addWeek: () => void
  weightUnit: "lbs" | "kg"
  isControlled: boolean
}

const DayLogsContext = createContext<DayLogsContextValue | null>(null)

interface DayLogsProviderProps {
  day: DayKey
  children: React.ReactNode
  controlledRound?: number
  controlledWeek?: number
}

export function DayLogsProvider({ day, children, controlledRound, controlledWeek }: DayLogsProviderProps) {
  const { ready, progress, currentPosition, logSession, getSessionFor, addWeek } = useCourseProgress()
  const exercises = WORKOUT_DAYS[day].exercises

  const isControlled = controlledRound !== undefined && controlledWeek !== undefined

  const [selectedRound, setSelectedRound] = useState(1)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [editing, setEditing] = useState(false)
  const [logs, setLogs] = useState<Record<string, SetLog[]>>(() =>
    buildInitialLogs(exercises, "lbs")
  )

  // Effective values — controlled by parent or internal state
  const effectiveRound = isControlled ? controlledRound! : selectedRound
  const effectiveWeek = isControlled ? controlledWeek! : selectedWeek

  // Auto-select the next incomplete week for this day (skipped when controlled)
  useEffect(() => {
    if (isControlled) return
    if (!ready) return
    const weeksPerRound = progress.weeksPerRound ?? 6
    const pos = currentPosition
    for (let round = pos.round; round <= pos.round + 1; round++) {
      for (let week = 1; week <= weeksPerRound; week++) {
        if (!getSessionFor(round, week, day)) {
          setSelectedRound(round)
          setSelectedWeek(week)
          return
        }
      }
    }
    setSelectedRound(pos.round)
    setSelectedWeek(pos.week)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  // Pre-fill from existing log whenever the effective week/round changes
  useEffect(() => {
    const existing = getSessionFor(effectiveRound, effectiveWeek, day)
    if (existing) {
      const filled: Record<string, SetLog[]> = {}
      for (const ex of exercises) {
        const found = existing.exercises.find((e) => e.exerciseId === ex.id)
        filled[ex.id] = found ? found.sets : defaultSets(ex, progress.weightUnit)
      }
      setLogs(filled)
    } else {
      setLogs(buildInitialLogs(exercises, progress.weightUnit))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveRound, effectiveWeek, day])

  const existingSession = getSessionFor(effectiveRound, effectiveWeek, day)
  const isCompleted = !!existingSession && !editing

  const updateExerciseSets = useCallback((exerciseId: string, sets: SetLog[]) => {
    setLogs((prev) => ({ ...prev, [exerciseId]: sets }))
  }, [])

  const handleComplete = useCallback(() => {
    const exerciseLogs: ExerciseLog[] = exercises.map((ex) => ({
      exerciseId: ex.id,
      sets: logs[ex.id] ?? defaultSets(ex, progress.weightUnit),
    }))
    logSession(effectiveRound, effectiveWeek, day, exerciseLogs)
    setEditing(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, logs, progress.weightUnit, logSession, effectiveRound, effectiveWeek, day])

  const weeksPerRound = progress.weeksPerRound ?? 6
  const maxRound = Math.max(currentPosition.round, effectiveRound)
  const weekOptions: WeekOption[] = []
  for (let r = 1; r <= maxRound + 1; r++) {
    for (let w = 1; w <= weeksPerRound; w++) {
      weekOptions.push({
        round: r,
        week: w,
        label: r === 1 ? `Wk ${w}` : `R${r}·W${w}`,
        done: !!getSessionFor(r, w, day),
        active: r === effectiveRound && w === effectiveWeek,
      })
    }
  }

  return (
    <DayLogsContext.Provider
      value={{
        day,
        selectedRound: effectiveRound,
        selectedWeek: effectiveWeek,
        setSelectedRound: isControlled ? () => {} : setSelectedRound,
        setSelectedWeek: isControlled ? () => {} : setSelectedWeek,
        logs,
        updateExerciseSets,
        handleComplete,
        existingSession,
        isCompleted,
        editing,
        setEditing,
        weekOptions,
        weeksPerRound,
        addWeek,
        weightUnit: progress.weightUnit,
        isControlled,
      }}
    >
      {children}
    </DayLogsContext.Provider>
  )
}

export function useDayLogs() {
  const ctx = useContext(DayLogsContext)
  if (!ctx) throw new Error("useDayLogs must be used inside DayLogsProvider")
  return ctx
}
