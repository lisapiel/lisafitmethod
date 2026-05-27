"use client"
import { useState } from "react"
import { useTracker } from "./TrackerContext"
import { SetLog, TrackerWeek } from "@/lib/trackerStorage"

type SortMode = "recent" | "name" | "weight"

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
  if (type === "weight_time") {
    const best = sets.reduce((b, s) =>
      (s.weight ?? 0) * ((s.minutes ?? 0) * 60 + (s.seconds ?? 0)) >
      (b.weight ?? 0) * ((b.minutes ?? 0) * 60 + (b.seconds ?? 0)) ? s : b
    )
    return `${best.weight ?? 0} ${best.unit ?? "lbs"} · ${best.minutes ?? 0}:${String(best.seconds ?? 0).padStart(2, "0")}`
  }
  return "—"
}

function getScore(sets: SetLog[], type: string): number {
  if (sets.length === 0) return 0
  if (type === "weight_reps") return Math.max(...sets.map((s) => (s.weight ?? 0) * (s.reps ?? 0)))
  if (type === "reps_only") return Math.max(...sets.map((s) => s.reps ?? 0))
  if (type === "time") return Math.max(...sets.map((s) => (s.minutes ?? 0) * 60 + (s.seconds ?? 0)))
  if (type === "weight_time") return Math.max(...sets.map((s) => (s.weight ?? 0) * ((s.minutes ?? 0) * 60 + (s.seconds ?? 0))))
  return 0
}

function weekIsActive(week: TrackerWeek): boolean {
  return Object.values(week.logs).some((log) => log.sets.length > 0)
}

export function ProgressTab() {
  const { data } = useTracker()
  const [filter, setFilter] = useState("")
  const [sort, setSort] = useState<SortMode>("recent")

  // Sets logged (all time)
  const totalSets = data.weeks.reduce(
    (count, week) => count + Object.values(week.logs).reduce((c, log) => c + log.sets.length, 0),
    0
  )

  // Active weeks (weeks with at least 1 set)
  const activeWeeksCount = data.weeks.filter(weekIsActive).length

  // Streak: consecutive active weeks counting back; skip current week if it's empty
  let streak = 0
  let si = data.weeks.length - 1
  if (si >= 0 && !weekIsActive(data.weeks[si])) si--
  while (si >= 0 && weekIsActive(data.weeks[si])) { streak++; si-- }

  const currentWeek = data.weeks[data.currentWeekIndex]

  // Day activity for this week
  const dayActivity = data.days.map((day) => ({
    name: day.name,
    active: (currentWeek?.logs[day.id]?.sets.length ?? 0) > 0,
  }))

  // Build sets-per-exercise indexed by week position
  const setsPerExercisePerWeek: Record<string, SetLog[]>[] = data.weeks.map((week) => {
    const byEx: Record<string, SetLog[]> = {}
    for (const log of Object.values(week.logs)) {
      for (const s of log.sets) {
        if (!byEx[s.exerciseId]) byEx[s.exerciseId] = []
        byEx[s.exerciseId].push(s)
      }
    }
    return byEx
  })

  const allSetsById: Record<string, SetLog[]> = {}
  for (const weekSets of setsPerExercisePerWeek) {
    for (const [exId, sets] of Object.entries(weekSets)) {
      if (!allSetsById[exId]) allSetsById[exId] = []
      allSetsById[exId].push(...sets)
    }
  }

  const currentSetsById = setsPerExercisePerWeek[data.currentWeekIndex] ?? {}

  const allExercises = data.days.flatMap((d) => d.exercises)
  const uniqueExercises = [...new Map(allExercises.map((e) => [e.id, e])).values()]

  const exercisesWithData = uniqueExercises
    .filter((e) => (allSetsById[e.id] ?? []).length > 0)
    .filter((e) => !filter.trim() || e.name.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name)
      if (sort === "weight") {
        return getScore(allSetsById[b.id] ?? [], b.type) - getScore(allSetsById[a.id] ?? [], a.type)
      }
      // "recent": sort by the highest week index that has data for this exercise
      const lastWeekA = setsPerExercisePerWeek.reduce((last, byEx, wi) => byEx[a.id]?.length ? wi : last, -1)
      const lastWeekB = setsPerExercisePerWeek.reduce((last, byEx, wi) => byEx[b.id]?.length ? wi : last, -1)
      return lastWeekB - lastWeekA
    })

  return (
    <div style={{ padding: "24px 16px 48px" }}>
      {/* Stat row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {([
          { label: "Sets Logged", value: totalSets, color: gold },
          { label: "Weeks Active", value: activeWeeksCount, color: "#444" },
          { label: "Week Streak", value: streak, color: streak > 0 ? gold : "#333" },
        ] as { label: string; value: number; color: string }[]).map(({ label, value, color }) => (
          <div key={label} style={{ flex: 1, border: `1px solid ${border}`, padding: "14px 10px", background: "#0d0d0d" }}>
            <p style={{ fontSize: "0.42rem", letterSpacing: "0.16em", textTransform: "uppercase", color: muted, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: 6, lineHeight: 1.3 }}>
              {label}
            </p>
            <p style={{ fontSize: "1.7rem", fontWeight: 700, color, fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* This week day activity */}
      {dayActivity.length > 0 && (
        <div style={{ marginBottom: 20, padding: "14px 16px", background: "#0d0d0d", border: `1px solid ${border}` }}>
          <p style={{ fontSize: "0.42rem", letterSpacing: "0.18em", textTransform: "uppercase", color: muted, fontFamily: "var(--font-montserrat), sans-serif", marginBottom: 12 }}>
            This Week
          </p>
          <div style={{ display: "flex", gap: 18 }}>
            {dayActivity.map((day, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.9rem", color: day.active ? gold : "#252525", lineHeight: 1 }}>
                  {day.active ? "●" : "○"}
                </div>
                <div style={{
                  fontSize: 7,
                  color: day.active ? "#555" : "#2a2a2a",
                  fontFamily: "var(--font-montserrat), sans-serif",
                  marginTop: 5,
                  maxWidth: 38,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}>
                  {day.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {exercisesWithData.length === 0 ? (
        <p style={{ fontSize: "0.65rem", color: "#333", fontFamily: "var(--font-montserrat), sans-serif", textAlign: "center", padding: "32px 0" }}>
          Log your first workout to see progress here.
        </p>
      ) : (
        <>
          {/* Filter + sort controls */}
          <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search exercises..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                flex: "1 1 140px",
                background: "#0d0d0d",
                border: `1px solid ${border}`,
                color: cream,
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: 12,
                padding: "8px 10px",
                outline: "none",
                minWidth: 0,
              }}
            />
            <div style={{ display: "flex", gap: 0, flexShrink: 0 }}>
              {(["recent", "name", "weight"] as SortMode[]).map((mode) => {
                const labels: Record<SortMode, string> = { recent: "Recent", name: "A–Z", weight: "Heaviest" }
                const active = sort === mode
                return (
                  <button
                    key={mode}
                    onClick={() => setSort(mode)}
                    style={{
                      background: active ? "#1e1e1e" : "none",
                      border: `1px solid ${active ? "#2a2a2a" : border}`,
                      borderLeft: mode === "recent" ? undefined : "none",
                      color: active ? cream : "#3a3a3a",
                      fontFamily: "var(--font-montserrat), sans-serif",
                      fontSize: 9,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "8px 10px",
                      cursor: "pointer",
                    }}
                  >
                    {labels[mode]}
                  </button>
                )
              })}
            </div>
          </div>
          <div style={{ border: `1px solid ${border}`, background: "#0d0d0d" }}>
            {exercisesWithData.map((exercise, i) => {
              const allSets = allSetsById[exercise.id] ?? []
              const currentSets = currentSetsById[exercise.id] ?? []

              const allTimeScore = getScore(allSets, exercise.type)
              const currentScore = getScore(currentSets, exercise.type)
              const isPR = currentSets.length > 0 && currentScore > 0 && currentScore >= allTimeScore

              // Last 4 weeks with data for this exercise, newest first
              const history = data.weeks
                .map((_, weekIndex) => ({
                  weekNumber: data.weeks[weekIndex].number,
                  sets: setsPerExercisePerWeek[weekIndex]?.[exercise.id] ?? [],
                  isCurrent: weekIndex === data.currentWeekIndex,
                }))
                .filter((w) => w.sets.length > 0)
                .slice(-4)
                .reverse()

              // Trend vs most recent previous week with data
              let trend: "up" | "down" | "same" | null = null
              const prevEntry = history.find((w) => !w.isCurrent)
              if (
                (exercise.type === "weight_reps" || exercise.type === "reps_only") &&
                currentSets.length > 0 && prevEntry
              ) {
                const prevScore = getScore(prevEntry.sets, exercise.type)
                trend = currentScore > prevScore ? "up" : currentScore < prevScore ? "down" : "same"
              }

              return (
                <div
                  key={exercise.id}
                  style={{ padding: "14px 16px", borderTop: i > 0 ? `1px solid ${border}` : "none" }}
                >
                  {/* Name + all-time best + PR + trend */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: "0.68rem", color: cream, fontFamily: "var(--font-montserrat), sans-serif", fontWeight: 500 }}>
                      {exercise.name}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: gold, fontFamily: "var(--font-montserrat), sans-serif" }}>
                        {bestSetLabel(allSets, exercise.type)}
                      </span>
                      {isPR && (
                        <span style={{
                          fontSize: 7,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          color: gold,
                          border: `1px solid ${gold}`,
                          padding: "1px 4px",
                          fontFamily: "var(--font-montserrat), sans-serif",
                          flexShrink: 0,
                        }}>
                          PR
                        </span>
                      )}
                      {trend && (
                        <span style={{ fontSize: "0.7rem", color: trend === "up" ? "#6abf6a" : trend === "down" ? "#ff6b6b" : muted }}>
                          {trend === "up" ? "↑" : trend === "down" ? "↓" : "="}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4-week history */}
                  {history.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 14px", marginTop: 6 }}>
                      {history.map((w) => (
                        <span
                          key={w.weekNumber}
                          style={{
                            fontSize: "0.52rem",
                            color: w.isCurrent ? muted : "#2e2e2e",
                            fontFamily: "var(--font-montserrat), sans-serif",
                          }}
                        >
                          Wk {w.weekNumber}: {bestSetLabel(w.sets, exercise.type)}
                        </span>
                      ))}
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
