"use client"
import { useState, useEffect } from "react"
import { useTracker } from "./TrackerContext"
import { WeekNav } from "./WeekNav"
import { DayTabs } from "./DayTabs"
import { ExerciseTable } from "./ExerciseTable"

export function WorkoutTabView() {
  const { data } = useTracker()
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)

  // Select first day on initial load or when no selection exists
  useEffect(() => {
    if (!selectedDayId && data.days.length > 0) {
      const sorted = [...data.days].sort((a, b) => a.order - b.order)
      setSelectedDayId(sorted[0].id)
    }
  }, [data.days, selectedDayId])

  // Reset selection if selected day was deleted
  useEffect(() => {
    if (selectedDayId && !data.days.find((d) => d.id === selectedDayId)) {
      const sorted = [...data.days].sort((a, b) => a.order - b.order)
      setSelectedDayId(sorted[0]?.id ?? null)
    }
  }, [data.days, selectedDayId])

  const activeDayId = selectedDayId ?? data.days[0]?.id ?? null

  return (
    <div>
      <WeekNav />
      {data.days.length > 0 && activeDayId && (
        <DayTabs selectedDayId={activeDayId} onSelectDay={setSelectedDayId} />
      )}
      {activeDayId ? (
        <ExerciseTable dayId={activeDayId} />
      ) : (
        <div style={{ padding: "48px 16px", textAlign: "center", color: "#333", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem" }}>
          No days yet — tap + to add one
        </div>
      )}
    </div>
  )
}
