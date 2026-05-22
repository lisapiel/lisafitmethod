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
}

const DayLogsContext = createContext<DayLogsContextValue | null>(null)

export function DayLogsProvider({ day, children }: { day: DayKey; children: React.ReactNode }) {
  const { ready, progress, currentPosition, logSession, getSessionFor, addWeek } = useCourseProgress()
  const exercises = WORKOUT_DAYS[day].exercises

  const [selectedRound, setSelectedRound] = useState(1)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [editing, setEditing] = useState(false)
  const [logs, setLogs] = useState<Record<string, SetLog[]>>(() =>
    buildInitialLogs(exercises, "lbs")
  )

  // Auto-select the next incomplete week for this day once context is ready
  useEffect(() => {
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

  // Pre-fill from existing log when selected week/round changes
  useEffect(() => {
    const existing = getSessionFor(selectedRound, selectedWeek, day)
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
  }, [selectedRound, selectedWeek, day])

  const existingSession = getSessionFor(selectedRound, selectedWeek, day)
  const isCompleted = !!existingSession && !editing

  const updateExerciseSets = useCallback((exerciseId: string, sets: SetLog[]) => {
    setLogs((prev) => ({ ...prev, [exerciseId]: sets }))
  }, [])

  const handleComplete = useCallback(() => {
    const exerciseLogs: ExerciseLog[] = exercises.map((ex) => ({
      exerciseId: ex.id,
      sets: logs[ex.id] ?? defaultSets(ex, progress.weightUnit),
    }))
    logSession(selectedRound, selectedWeek, day, exerciseLogs)
    setEditing(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, logs, progress.weightUnit, logSession, selectedRound, selectedWeek, day])

  const weeksPerRound = progress.weeksPerRound ?? 6
  const maxRound = Math.max(currentPosition.round, selectedRound)
  const weekOptions: WeekOption[] = []
  for (let r = 1; r <= maxRound + 1; r++) {
    for (let w = 1; w <= weeksPerRound; w++) {
      weekOptions.push({
        round: r,
        week: w,
        label: r === 1 ? `Wk ${w}` : `R${r}·W${w}`,
        done: !!getSessionFor(r, w, day),
        active: r === selectedRound && w === selectedWeek,
      })
    }
  }

  return (
    <DayLogsContext.Provider
      value={{
        day, selectedRound, selectedWeek, setSelectedRound, setSelectedWeek,
        logs, updateExerciseSets, handleComplete, existingSession, isCompleted,
        editing, setEditing, weekOptions, weeksPerRound, addWeek,
        weightUnit: progress.weightUnit,
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
