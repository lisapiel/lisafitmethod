"use client"
import { useState } from "react"
import { useTracker } from "./TrackerContext"
import { WeekSelectorBar } from "./WeekSelectorBar"
import { DayCard } from "./DayCard"

interface DaysListViewProps {
  onLog: (dayId: string) => void
  onManage: (dayId: string) => void
}

export function DaysListView({ onLog, onManage }: DaysListViewProps) {
  const { data, addDay } = useTracker()
  const [addingDay, setAddingDay] = useState(false)
  const [newDayName, setNewDayName] = useState("")

  const currentWeek = data.weeks[data.currentWeekIndex]
  const sortedDays = [...data.days].sort((a, b) => a.order - b.order)

  const handleAddDay = (e: React.FormEvent) => {
    e.preventDefault()
    const name = newDayName.trim()
    if (!name) return
    addDay(name)
    setNewDayName("")
    setAddingDay(false)
  }

  return (
    <>
      <WeekSelectorBar />

      <div style={{ padding: "16px 16px 100px" }}>
        {sortedDays.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 24, fontWeight: 400, color: "#f0e6d3", marginBottom: 8 }}>
              Build your first workout day.
            </p>
            <p style={{ fontSize: 12, color: "#555", lineHeight: 1.7, marginBottom: 28, maxWidth: 280, margin: "0 auto 28px" }}>
              Name it whatever makes sense — Push Day, Leg Day, Full Body. Add as many as you want.
            </p>
            <button
              onClick={() => { setAddingDay(true); setTimeout(() => document.getElementById("new-day-input")?.focus(), 50) }}
              style={{ background: "#c9a96e", color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", border: "none", padding: "14px 28px", cursor: "pointer" }}
            >
              Add Your First Day
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sortedDays.map((day) => (
              <DayCard
                key={day.id}
                day={day}
                isCompleted={!!currentWeek?.logs[day.id]?.completedAt}
                onLog={() => onLog(day.id)}
                onManage={() => onManage(day.id)}
              />
            ))}
          </div>
        )}

        {/* Add day form */}
        {addingDay ? (
          <form onSubmit={handleAddDay} style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <input
              id="new-day-input"
              type="text"
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              placeholder="e.g. Push Day, Leg Day, Full Body…"
              autoFocus
              style={{
                flex: 1,
                background: "#111",
                border: "1px solid #c9a96e",
                color: "#f0e6d3",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: 14,
                padding: "12px 14px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!newDayName.trim()}
              style={{ background: "#c9a96e", border: "none", color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.15em", padding: "0 16px", cursor: "pointer" }}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setAddingDay(false); setNewDayName("") }}
              style={{ background: "none", border: "1px solid #2a2a2a", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 11, padding: "0 12px", cursor: "pointer" }}
            >
              Cancel
            </button>
          </form>
        ) : sortedDays.length > 0 ? (
          <button
            onClick={() => { setAddingDay(true); setTimeout(() => document.getElementById("new-day-input")?.focus(), 50) }}
            style={{ marginTop: 14, width: "100%", background: "none", border: "1px dashed #2a2a2a", color: "#444", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", padding: "14px 20px", cursor: "pointer" }}
          >
            + Add Day
          </button>
        ) : null}
      </div>
    </>
  )
}
