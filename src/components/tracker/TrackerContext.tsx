"use client"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import {
  TrackerData,
  TrackerExercise,
  SetLog,
  WorkoutDay,
  TrackerWeek,
  loadTrackerData,
  saveTrackerData,
  makeId,
} from "@/lib/trackerStorage"

async function getAccessToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.accessToken?.toString() ?? null
  } catch {
    return null
  }
}

async function fetchServerTracker(token: string): Promise<TrackerData | null> {
  try {
    const res = await fetch("/api/training/tracker", {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    const data = await res.json() as { trackerData: TrackerData | null }
    return data.trackerData
  } catch {
    return null
  }
}

async function pushServerTracker(token: string, data: TrackerData): Promise<void> {
  try {
    await fetch("/api/training/tracker", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ trackerData: data }),
    })
  } catch {
    // fire-and-forget — localStorage already has the save
  }
}

interface TrackerContextValue {
  ready: boolean
  data: TrackerData
  addDay: (name: string) => void
  renameDay: (id: string, name: string) => void
  deleteDay: (id: string) => void
  addExercise: (dayId: string, name: string, type: TrackerExercise["type"], notes?: string) => void
  updateExercise: (dayId: string, exerciseId: string, patch: Partial<Pick<TrackerExercise, "name" | "type" | "notes">>) => void
  deleteExercise: (dayId: string, exerciseId: string) => void
  addWeek: () => void
  setCurrentWeekIndex: (i: number) => void
  addSet: (weekId: string, dayId: string, set: Omit<SetLog, "setNumber">) => void
  removeSet: (weekId: string, dayId: string, exerciseId: string, setIndex: number) => void
  markDayComplete: (weekId: string, dayId: string) => void
  setWeightUnit: (unit: "lbs" | "kg") => void
}

const TrackerContext = createContext<TrackerContextValue | null>(null)

export function useTracker(): TrackerContextValue {
  const ctx = useContext(TrackerContext)
  if (!ctx) throw new Error("useTracker must be used inside TrackerProvider")
  return ctx
}

export function TrackerProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [data, setData] = useState<TrackerData>({
    version: 1,
    weightUnit: "lbs",
    days: [],
    weeks: [],
    currentWeekIndex: 0,
  })
  const tokenRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      const local = loadTrackerData(userId)
      setData(local)
      setReady(true)

      const token = await getAccessToken()
      if (cancelled) return
      tokenRef.current = token

      if (token) {
        const server = await fetchServerTracker(token)
        if (cancelled) return
        if (server) {
          const serverWeeks = server.weeks?.length ?? 0
          const localWeeks = local.weeks?.length ?? 0
          if (serverWeeks >= localWeeks) {
            setData(server)
            saveTrackerData(userId, server)
          } else {
            pushServerTracker(token, local)
          }
        } else if (local.weeks.length > 0) {
          pushServerTracker(token, local)
        }
      }
    }
    init()
    return () => { cancelled = true }
  }, [userId])

  const persist = useCallback(
    (next: TrackerData) => {
      setData(next)
      saveTrackerData(userId, next)
      if (tokenRef.current) pushServerTracker(tokenRef.current, next)
    },
    [userId]
  )

  const addDay = useCallback(
    (name: string) => {
      const day: WorkoutDay = { id: makeId(), name, exercises: [], order: data.days.length }
      persist({ ...data, days: [...data.days, day] })
    },
    [data, persist]
  )

  const renameDay = useCallback(
    (id: string, name: string) => {
      persist({ ...data, days: data.days.map((d) => (d.id === id ? { ...d, name } : d)) })
    },
    [data, persist]
  )

  const deleteDay = useCallback(
    (id: string) => {
      const days = data.days.filter((d) => d.id !== id).map((d, i) => ({ ...d, order: i }))
      // Clean up logs for this day across all weeks
      const weeks = data.weeks.map((w) => {
        const logs = { ...w.logs }
        delete logs[id]
        return { ...w, logs }
      })
      persist({ ...data, days, weeks })
    },
    [data, persist]
  )

  const addExercise = useCallback(
    (dayId: string, name: string, type: TrackerExercise["type"], notes = "") => {
      const days = data.days.map((d) => {
        if (d.id !== dayId) return d
        const ex: TrackerExercise = { id: makeId(), name, type, notes, order: d.exercises.length }
        return { ...d, exercises: [...d.exercises, ex] }
      })
      persist({ ...data, days })
    },
    [data, persist]
  )

  const updateExercise = useCallback(
    (dayId: string, exerciseId: string, patch: Partial<Pick<TrackerExercise, "name" | "type" | "notes">>) => {
      const days = data.days.map((d) => {
        if (d.id !== dayId) return d
        return { ...d, exercises: d.exercises.map((e) => (e.id === exerciseId ? { ...e, ...patch } : e)) }
      })
      persist({ ...data, days })
    },
    [data, persist]
  )

  const deleteExercise = useCallback(
    (dayId: string, exerciseId: string) => {
      const days = data.days.map((d) => {
        if (d.id !== dayId) return d
        const exercises = d.exercises.filter((e) => e.id !== exerciseId).map((e, i) => ({ ...e, order: i }))
        return { ...d, exercises }
      })
      // Clean up sets for this exercise across all weeks
      const weeks = data.weeks.map((w) => {
        const logs: typeof w.logs = {}
        for (const [did, log] of Object.entries(w.logs)) {
          logs[did] = { ...log, sets: log.sets.filter((s) => s.exerciseId !== exerciseId) }
        }
        return { ...w, logs }
      })
      persist({ ...data, days, weeks })
    },
    [data, persist]
  )

  const addWeek = useCallback(() => {
    const number = data.weeks.length + 1
    const week: TrackerWeek = { id: makeId(), number, createdAt: new Date().toISOString(), logs: {} }
    const weeks = [...data.weeks, week]
    persist({ ...data, weeks, currentWeekIndex: weeks.length - 1 })
  }, [data, persist])

  const setCurrentWeekIndex = useCallback(
    (i: number) => {
      persist({ ...data, currentWeekIndex: Math.max(0, Math.min(i, data.weeks.length - 1)) })
    },
    [data, persist]
  )

  const addSet = useCallback(
    (weekId: string, dayId: string, set: Omit<SetLog, "setNumber">) => {
      const weeks = data.weeks.map((w) => {
        if (w.id !== weekId) return w
        const existing = w.logs[dayId] ?? { sets: [] }
        const setsForExercise = existing.sets.filter((s) => s.exerciseId === set.exerciseId)
        const newSet: SetLog = { ...set, setNumber: setsForExercise.length + 1 }
        return { ...w, logs: { ...w.logs, [dayId]: { ...existing, sets: [...existing.sets, newSet] } } }
      })
      persist({ ...data, weeks })
    },
    [data, persist]
  )

  const removeSet = useCallback(
    (weekId: string, dayId: string, exerciseId: string, setIndex: number) => {
      const weeks = data.weeks.map((w) => {
        if (w.id !== weekId) return w
        const existing = w.logs[dayId]
        if (!existing) return w
        // Find the nth set for this exercise and remove it
        let count = -1
        const sets = existing.sets.filter((s) => {
          if (s.exerciseId !== exerciseId) return true
          count++
          return count !== setIndex
        })
        // Renumber remaining sets for this exercise
        let n = 0
        const renumbered = sets.map((s) => {
          if (s.exerciseId !== exerciseId) return s
          n++
          return { ...s, setNumber: n }
        })
        return { ...w, logs: { ...w.logs, [dayId]: { ...existing, sets: renumbered } } }
      })
      persist({ ...data, weeks })
    },
    [data, persist]
  )

  const markDayComplete = useCallback(
    (weekId: string, dayId: string) => {
      const weeks = data.weeks.map((w) => {
        if (w.id !== weekId) return w
        const existing = w.logs[dayId] ?? { sets: [] }
        return { ...w, logs: { ...w.logs, [dayId]: { ...existing, completedAt: new Date().toISOString() } } }
      })
      persist({ ...data, weeks })
    },
    [data, persist]
  )

  const setWeightUnit = useCallback(
    (unit: "lbs" | "kg") => {
      persist({ ...data, weightUnit: unit })
    },
    [data, persist]
  )

  return (
    <TrackerContext.Provider
      value={{
        ready,
        data,
        addDay,
        renameDay,
        deleteDay,
        addExercise,
        updateExercise,
        deleteExercise,
        addWeek,
        setCurrentWeekIndex,
        addSet,
        removeSet,
        markDayComplete,
        setWeightUnit,
      }}
    >
      {children}
    </TrackerContext.Provider>
  )
}
