"use client"
import { useState, useRef, useEffect } from "react"
import { useTracker } from "./TrackerContext"

const gold = "#c9a96e"
const muted = "#555"

interface DayTabsProps {
  selectedDayId: string
  onSelectDay: (id: string) => void
}

export function DayTabs({ selectedDayId, onSelectDay }: DayTabsProps) {
  const { data, renameDay, deleteDay, addDay } = useTracker()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && inputRef.current) inputRef.current.focus()
  }, [editingId])

  const startEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditValue(name)
  }

  const commitEdit = () => {
    if (editingId && editValue.trim()) renameDay(editingId, editValue.trim())
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
    if (data.days.length <= 1) return
    if (!confirm("Delete this day and all its logged sets?")) return
    const remaining = [...data.days].sort((a, b) => a.order - b.order).filter((d) => d.id !== id)
    deleteDay(id)
    if (selectedDayId === id && remaining.length > 0) onSelectDay(remaining[0].id)
    setEditingId(null)
  }

  const sorted = [...data.days].sort((a, b) => a.order - b.order)

  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        overflowX: "auto",
        padding: "0 16px",
        background: "#0a0a0a",
        borderBottom: "1px solid #1a1a1a",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      } as React.CSSProperties}
    >
      {sorted.map((day) => {
        const isActive = day.id === selectedDayId
        const isEditing = editingId === day.id
        return (
          <div
            key={day.id}
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              borderBottom: isActive ? `2px solid ${gold}` : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {isEditing ? (
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 10px" }}>
                <input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit()
                    if (e.key === "Escape") setEditingId(null)
                  }}
                  style={{
                    background: "#1a1a1a",
                    border: "1px solid #3a3a3a",
                    color: "#f0e6d3",
                    fontFamily: "var(--font-montserrat), sans-serif",
                    fontSize: "0.6rem",
                    padding: "4px 6px",
                    width: 72,
                    outline: "none",
                    borderRadius: 2,
                  }}
                />
                {data.days.length > 1 && (
                  <button
                    onMouseDown={(e) => { e.preventDefault(); handleDelete(day.id) }}
                    style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: "1rem", padding: 0, lineHeight: 1 }}
                    title="Delete day"
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  if (isActive) {
                    startEdit(day.id, day.name)
                  } else {
                    onSelectDay(day.id)
                  }
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: isActive ? gold : muted,
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.58rem",
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "12px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  whiteSpace: "nowrap",
                }}
              >
                {day.name}
                {isActive && <span style={{ fontSize: "0.65rem", color: "#444" }}>✎</span>}
              </button>
            )}
          </div>
        )
      })}

      {/* Add day */}
      <button
        onClick={() => addDay(`Day ${data.days.length + 1}`)}
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          color: "#2a2a2a",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.9rem",
          padding: "12px 10px",
          cursor: "pointer",
          letterSpacing: "0",
          lineHeight: 1,
        }}
        title="Add day"
      >
        +
      </button>
    </div>
  )
}
