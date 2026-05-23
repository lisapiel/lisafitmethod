"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { getCurrentUser, fetchAuthSession } from "aws-amplify/auth"
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

async function getAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.accessToken?.toString() ?? null
  } catch {
    return null
  }
}

async function fetchServerProgress(token: string): Promise<CourseProgress | null> {
  try {
    const res = await fetch("/api/training/progress", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json() as { progress: CourseProgress | null }
    return data.progress
  } catch {
    return null
  }
}

async function pushServerProgress(token: string, progress: CourseProgress): Promise<void> {
  try {
    await fetch("/api/training/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ progress }),
    })
  } catch {
    // fire-and-forget — localStorage already has the save
  }
}

export function CourseProgressProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [progress, setProgress] = useState<CourseProgress>({
    version: 1,
    weightUnit: "lbs",
    sessions: [],
  })
  const [ready, setReady] = useState(false)
  const tokenRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getCurrentUser()
      .then(async (user) => {
        if (cancelled) return
        const sub = user.userId
        setUserId(sub)

        // Load localStorage immediately so UI is responsive
        const local = loadProgress(sub)
        setProgress(local)
        setReady(true)

        // Then fetch server data in background and merge (server wins)
        const token = await getAccessToken()
        if (cancelled) return
        tokenRef.current = token

        if (token) {
          const server = await fetchServerProgress(token)
          if (cancelled) return
          if (server && server.sessions.length >= local.sessions.length) {
            // Server has equal or more data — trust it and update localStorage cache
            setProgress(server)
            saveProgress(sub, server)
          } else if (local.sessions.length > 0 && token) {
            // localStorage has data the server doesn't — push it up
            pushServerProgress(token, local)
          }
        }
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })
    return () => { cancelled = true }
  }, [])

  const persist = useCallback(
    (next: CourseProgress) => {
      setProgress(next)
      if (userId) saveProgress(userId, next)
      if (tokenRef.current) pushServerProgress(tokenRef.current, next)
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
