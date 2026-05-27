"use client"
import { useTracker } from "./TrackerContext"
import { SetLog } from "@/lib/trackerStorage"

const gold = "#c9a96e"
const cream = "#f0e6d3"
const muted = "#555"
const border = "#1e1e1e"

function bestSetLabel(sets: SetLog[], type: string): string {
  if (sets.length === 0) return "—"
  if (type === "weight_reps") {
    const best = sets.reduce((b, s) =>
      (s.weight ?? 0) * (s.reps ?? 0) > (b.weight ?? 0) * (b.reps ?? 0) ? s : b
    )
    return `${best.weight ?? 0} ${best.unit ?? "lbs"} × ${best.reps ?? 0}`
  }
  if (type === "reps_only") {
    return `${Math.max(...sets.map((s) => s.reps ?? 0))} reps`
  }
  if (type === "time") {
    const best = sets.reduce((b, s) =>
      (s.minutes ?? 0) * 60 + (s.seconds ?? 0) > (b.minutes ?? 0) * 60 + (b.seconds ?? 0) ? s : b
    )
    return `${best.minutes ?? 0}:${String(best.seconds ?? 0).padStart(2, "0")}`
  }
  return "—"
}

function weightScore(sets: SetLog[]): number {
  if (sets.length === 0) return 0
  return Math.max(...sets.map((s) => (s.weight ?? 0) * (s.reps ?? 0)))
}

export function ProgressTab() {
  const { data } = useTracker()

  const totalWorkouts = data.weeks.reduce((count, week) =>
    count + Object.values(week.logs).filter((log) => log.sets.length > 0).length
  , 0)

  const allExercises = data.days.flatMap((d) => d.exercises)
  const uniqueExercises = [...new Map(allExercises.map((e) => [e.id, e])).values()]

  const currentWeek = data.weeks[data.currentWeekIndex]
  const lastWeek = data.currentWeekIndex > 0 ? data.weeks[data.currentWeekIndex - 1] : null

  // Collect all sets per exercise across all weeks
  const allSetsById: Record<string, SetLog[]> = {}
  const currentSetsById: Record<string, SetLog[]> = {}
  const lastSetsById: Record<string, SetLog[]> = {}

  for (const week of data.weeks) {
    for (const log of Object.values(week.logs)) {
      for (const s of log.sets) {
        if (!allSetsById[s.exerciseId]) allSetsById[s.exerciseId] = []
        allSetsById[s.exerciseId].push(s)
      }
    }
  }
  if (currentWeek) {
    for (const log of Object.values(currentWeek.logs)) {
      for (const s of log.sets) {
        if (!currentSetsById[s.exerciseId]) currentSetsById[s.exerciseId] = []
        currentSetsById[s.exerciseId].push(s)
      }
    }
  }
  if (lastWeek) {
    for (const log of Object.values(lastWeek.logs)) {
      for (const s of log.sets) {
        if (!lastSetsById[s.exerciseId]) lastSetsById[s.exerciseId] = []
        lastSetsById[s.exerciseId].push(s)
      }
    }
  }

  const exercisesWithData = uniqueExercises.filter((e) => (allSetsById[e.id] ?? []).length > 0)

  return (
    <div style={{ padding: "24px 16px 48px" }}>
      {/* Stat row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, border: `1px solid ${border}`, padding: "18px 16px", background: "#0d0d0d" }}>
          <p style={{ fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: muted, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: 6 }}>
            Workouts Logged
          </p>
          <p style={{ fontSize: "2rem", fontWeight: 700, color: gold, fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1 }}>
            {totalWorkouts}
          </p>
        </div>
        <div style={{ flex: 1, border: `1px solid ${border}`, padding: "18px 16px", background: "#0d0d0d" }}>
          <p style={{ fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: muted, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: 6 }}>
            Weeks Tracked
          </p>
          <p style={{ fontSize: "2rem", fontWeight: 700, color: "#444", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1 }}>
            {data.weeks.length}
          </p>
        </div>
      </div>

      {exercisesWithData.length === 0 ? (
        <p style={{ fontSize: "0.65rem", color: "#333", fontFamily: "var(--font-montserrat), sans-serif", textAlign: "center", padding: "32px 0" }}>
          Log your first workout to see progress here.
        </p>
      ) : (
        <>
          <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: muted, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: 12 }}>
            By Exercise
          </p>
          <div style={{ border: `1px solid ${border}`, background: "#0d0d0d" }}>
            {exercisesWithData.map((exercise, i) => {
              const allSets = allSetsById[exercise.id] ?? []
              const currentSets = currentSetsById[exercise.id] ?? []
              const lastSets = lastSetsById[exercise.id] ?? []

              const best = bestSetLabel(allSets, exercise.type)
              const thisWeekBest = currentSets.length > 0 ? bestSetLabel(currentSets, exercise.type) : null
              const lastWeekBest = lastSets.length > 0 ? bestSetLabel(lastSets, exercise.type) : null

              let trend: "up" | "down" | "same" | null = null
              if (exercise.type === "weight_reps" && currentSets.length > 0 && lastSets.length > 0) {
                const thisScore = weightScore(currentSets)
                const lastScore = weightScore(lastSets)
                trend = thisScore > lastScore ? "up" : thisScore < lastScore ? "down" : "same"
              }

              return (
                <div
                  key={exercise.id}
                  style={{ padding: "14px 16px", borderTop: i > 0 ? `1px solid ${border}` : "none" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: "0.68rem", color: cream, fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 500 }}>
                      {exercise.name}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: gold, fontFamily: "var(--font-montserrat), sans-serif" }}>
                        {best}
                      </span>
                      {trend && (
                        <span style={{ fontSize: "0.7rem", color: trend === "up" ? "#6abf6a" : trend === "down" ? "#ff6b6b" : muted }}>
                          {trend === "up" ? "↑" : trend === "down" ? "↓" : "="}
                        </span>
                      )}
                    </div>
                  </div>
                  {(thisWeekBest || lastWeekBest) && (
                    <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                      {thisWeekBest && (
                        <span style={{ fontSize: "0.55rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif" }}>
                          This week: {thisWeekBest}
                        </span>
                      )}
                      {lastWeekBest && (
                        <span style={{ fontSize: "0.55rem", color: "#333", fontFamily: "var(--font-montserrat), sans-serif" }}>
                          Last week: {lastWeekBest}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
