"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { getCurrentUser } from "aws-amplify/auth"
import {
  CourseProgress,
  WorkoutSession,
  ExerciseLog,
  ProgressPosition,
  loadProgress,
  saveProgress,
  makeSessionId,
  getCurrentPosition,
  getPRs,
  getSession,
  SetLog,
} from "@/lib/courseProgress"

interface CourseProgressContextValue {
  ready: boolean
  progress: CourseProgress
  currentPosition: ProgressPosition
  prs: Record<string, SetLog>
  logSession: (
    round: number,
    week: number,
    day: "a" | "b" | "c",
    exercises: ExerciseLog[]
  ) => void
  getSessionFor: (
    round: number,
    week: number,
    day: "a" | "b" | "c"
  ) => WorkoutSession | undefined
  setWeightUnit: (unit: "lbs" | "kg") => void
  addWeek: () => void
}

const CourseProgressContext = createContext<CourseProgressContextValue | null>(null)

export function CourseProgressProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [progress, setProgress] = useState<CourseProgress>({
    version: 1,
    weightUnit: "lbs",
    sessions: [],
  })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        const sub = user.userId
        setUserId(sub)
        setProgress(loadProgress(sub))
        setReady(true)
      })
      .catch(() => {
        // Not authenticated — still mark ready so UI doesn't hang
        setReady(true)
      })
  }, [])

  const persist = useCallback(
    (next: CourseProgress) => {
      setProgress(next)
      if (userId) saveProgress(userId, next)
    },
    [userId]
  )

  const logSession = useCallback(
    (round: number, week: number, day: "a" | "b" | "c", exercises: ExerciseLog[]) => {
      const id = makeSessionId(round, week, day)
      const session: WorkoutSession = {
        id,
        round,
        week,
        day,
        completedAt: new Date().toISOString(),
        exercises,
      }
      const existing = progress.sessions.filter((s) => s.id !== id)
      persist({ ...progress, sessions: [...existing, session] })
    },
    [progress, persist]
  )

  const getSessionFor = useCallback(
    (round: number, week: number, day: "a" | "b" | "c") =>
      getSession(progress.sessions, round, week, day),
    [progress.sessions]
  )

  const setWeightUnit = useCallback(
    (unit: "lbs" | "kg") => persist({ ...progress, weightUnit: unit }),
    [progress, persist]
  )

  const addWeek = useCallback(
    () => persist({ ...progress, weeksPerRound: (progress.weeksPerRound ?? 6) + 1 }),
    [progress, persist]
  )

  const value: CourseProgressContextValue = {
    ready,
    progress,
    currentPosition: getCurrentPosition(progress.sessions, progress.weeksPerRound ?? 6),
    prs: getPRs(progress.sessions),
    logSession,
    getSessionFor,
    setWeightUnit,
    addWeek,
  }

  return (
    <CourseProgressContext.Provider value={value}>
      {children}
    </CourseProgressContext.Provider>
  )
}

export function useCourseProgress() {
  const ctx = useContext(CourseProgressContext)
  if (!ctx) throw new Error("useCourseProgress must be used inside CourseProgressProvider")
  return ctx
}
