"use client"

import { useState, useEffect, useCallback } from "react"
import { generateClient } from "aws-amplify/data"
import { useRouter } from "next/navigation"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

export type ExerciseInDay = {
  slug: string
  name: string
  sets: string
  reps: string
  rest: string
  note: string
}

export type DayData = {
  dayLabel: string
  exercises: ExerciseInDay[]
}

type VideoOption = {
  id: string
  slug: string
  name: string
  muscleGroups: string | null
  equipment: string | null
}

function ExerciseSearchModal({
  onSelect,
  onClose,
}: {
  onSelect: (v: VideoOption) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const [all, setAll] = useState<VideoOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    client.models.ExerciseVideo.list({
      filter: { isPublished: { eq: true } },
      authMode: "userPool",
    }).then(({ data }) => {
      setAll(
        data
          .map((v) => ({ id: v.id, slug: v.slug, name: v.name, muscleGroups: v.muscleGroups ?? null, equipment: v.equipment ?? null }))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = all.filter(
    (v) =>
      !query ||
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      v.slug.includes(query.toLowerCase()) ||
      (v.muscleGroups && v.muscleGroups.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#161616",
          border: `1px solid ${border}`,
          borderRadius: 2,
          width: "100%",
          maxWidth: 560,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}` }}>
          <input
            autoFocus
            type="search"
            placeholder="Search exercise name or muscle group…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              background: "#111",
              border: `1px solid ${border}`,
              color: "#f0e6d3",
              padding: "10px 14px",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.75rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <p style={{ padding: "1.5rem 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555" }}>Loading…</p>
          ) : filtered.length === 0 ? (
            <p style={{ padding: "1.5rem 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555" }}>No exercises found.</p>
          ) : (
            filtered.map((v) => {
              let muscles = ""
              try { muscles = (JSON.parse(v.muscleGroups ?? "[]") as string[]).join(", ") } catch { muscles = v.muscleGroups ?? "" }
              return (
                <button
                  key={v.id}
                  onClick={() => onSelect(v)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "12px 20px",
                    background: "none",
                    border: "none",
                    borderBottom: `1px solid ${border}`,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a1a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                >
                  <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#f0e6d3" }}>
                    {v.name}
                  </p>
                  {muscles && (
                    <p style={{ margin: "2px 0 0", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#666" }}>
                      {muscles}
                    </p>
                  )}
                </button>
              )
            })
          )}
        </div>
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${border}` }}>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: `1px solid ${border}`,
              color: "#888",
              padding: "8px 16px",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function ExerciseRow({
  ex,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  ex: ExerciseInDay
  index: number
  total: number
  onChange: (updated: ExerciseInDay) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const fieldStyle = {
    background: "#111",
    border: `1px solid ${border}`,
    color: "#f0e6d3",
    padding: "7px 10px",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: "0.7rem",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  }

  return (
    <div style={{
      background: "#0e0e0e",
      border: `1px solid ${border}`,
      borderRadius: 2,
      padding: "14px 16px",
      marginBottom: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#f0e6d3" }}>
          {ex.name}
        </p>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            style={{ background: "none", border: `1px solid ${border}`, color: index === 0 ? "#333" : "#888", width: 26, height: 26, cursor: index === 0 ? "default" : "pointer", fontSize: "0.7rem" }}
          >↑</button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            style={{ background: "none", border: `1px solid ${border}`, color: index === total - 1 ? "#333" : "#888", width: 26, height: 26, cursor: index === total - 1 ? "default" : "pointer", fontSize: "0.7rem" }}
          >↓</button>
          <button
            onClick={onRemove}
            style={{ background: "none", border: "1px solid #3a2020", color: "#e07070", width: 26, height: 26, cursor: "pointer", fontSize: "0.75rem" }}
          >×</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div>
          <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>Sets</label>
          <input value={ex.sets} onChange={(e) => onChange({ ...ex, sets: e.target.value })} placeholder="3" style={fieldStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>Reps</label>
          <input value={ex.reps} onChange={(e) => onChange({ ...ex, reps: e.target.value })} placeholder="10–12" style={fieldStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>Rest</label>
          <input value={ex.rest} onChange={(e) => onChange({ ...ex, rest: e.target.value })} placeholder="60s" style={fieldStyle} />
        </div>
      </div>
      <div>
        <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>Note (optional)</label>
        <input value={ex.note} onChange={(e) => onChange({ ...ex, note: e.target.value })} placeholder="Focus on slow eccentric" style={fieldStyle} />
      </div>
    </div>
  )
}

function DayPanel({
  day,
  onChange,
}: {
  day: DayData
  onChange: (updated: DayData) => void
}) {
  const [showModal, setShowModal] = useState(false)

  function addExercise(v: VideoOption) {
    const ex: ExerciseInDay = { slug: v.slug, name: v.name, sets: "3", reps: "10–12", rest: "60s", note: "" }
    onChange({ ...day, exercises: [...day.exercises, ex] })
    setShowModal(false)
  }

  function updateExercise(i: number, updated: ExerciseInDay) {
    const exercises = [...day.exercises]
    exercises[i] = updated
    onChange({ ...day, exercises })
  }

  function removeExercise(i: number) {
    onChange({ ...day, exercises: day.exercises.filter((_, idx) => idx !== i) })
  }

  function moveExercise(i: number, dir: -1 | 1) {
    const exercises = [...day.exercises]
    const j = i + dir
    if (j < 0 || j >= exercises.length) return
    ;[exercises[i], exercises[j]] = [exercises[j], exercises[i]]
    onChange({ ...day, exercises })
  }

  return (
    <div>
      {day.exercises.length === 0 ? (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555", marginBottom: 12 }}>
          No exercises yet.
        </p>
      ) : (
        day.exercises.map((ex, i) => (
          <ExerciseRow
            key={`${ex.slug}-${i}`}
            ex={ex}
            index={i}
            total={day.exercises.length}
            onChange={(updated) => updateExercise(i, updated)}
            onRemove={() => removeExercise(i)}
            onMove={(dir) => moveExercise(i, dir)}
          />
        ))
      )}
      <button
        onClick={() => setShowModal(true)}
        style={{
          background: "none",
          border: `1px dashed ${border}`,
          color: gold,
          width: "100%",
          padding: "10px",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.65rem",
          fontWeight: 600,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        + Add Exercise
      </button>
      {showModal && <ExerciseSearchModal onSelect={addExercise} onClose={() => setShowModal(false)} />}
    </div>
  )
}

export default function NewBlockClient() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [blockNumber, setBlockNumber] = useState(1)
  const [startDate, setStartDate] = useState("")
  const [activeDay, setActiveDay] = useState(0)
  const [days, setDays] = useState<DayData[]>([
    { dayLabel: "Day A", exercises: [] },
    { dayLabel: "Day B", exercises: [] },
    { dayLabel: "Day C", exercises: [] },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    client.models.WorkoutBlock.list({ authMode: "userPool" })
      .then(({ data }) => {
        const max = data.reduce((m, b) => Math.max(m, b.blockNumber), 0)
        setBlockNumber(max + 1)
      })
      .catch(() => {})
  }, [])

  const updateDay = useCallback((i: number, updated: DayData) => {
    setDays((prev) => {
      const next = [...prev]
      next[i] = updated
      return next
    })
  }, [])

  async function handleSave(publish: boolean) {
    if (!title.trim()) { setError("Block title is required."); return }
    if (!startDate) { setError("Start date is required."); return }

    setSaving(true)
    setError(null)

    try {
      const client = generateClient<Schema>({ authMode: "userPool" })
      await client.models.WorkoutBlock.create({
        title: title.trim(),
        blockNumber,
        startDate,
        days: JSON.stringify(days),
        isPublished: publish,
      })
      router.push("/admin/masterclass/blocks")
    } catch {
      setError("Failed to save block. Please try again.")
      setSaving(false)
    }
  }

  const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0)

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em", cursor: "pointer", padding: 0 }}
        >
          ← Blocks
        </button>
      </div>

      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "2rem" }}>
        New Workout Block
      </h1>

      {/* Meta fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 180px", gap: 16, marginBottom: "2rem" }}>
        <div>
          <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>
            Block Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Block 1 — Foundation"
            style={{
              width: "100%",
              background: "#161616",
              border: `1px solid ${border}`,
              color: "#f0e6d3",
              padding: "10px 14px",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.8rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>
            Block #
          </label>
          <input
            type="number"
            value={blockNumber}
            onChange={(e) => setBlockNumber(Number(e.target.value))}
            min={1}
            style={{
              width: "100%",
              background: "#161616",
              border: `1px solid ${border}`,
              color: "#f0e6d3",
              padding: "10px 14px",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.8rem",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              width: "100%",
              background: "#161616",
              border: `1px solid ${border}`,
              color: "#f0e6d3",
              padding: "10px 14px",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.75rem",
              outline: "none",
              boxSizing: "border-box",
              colorScheme: "dark",
            }}
          />
        </div>
      </div>

      {/* Day tabs */}
      <div style={{ borderBottom: `1px solid ${border}`, marginBottom: "1.5rem", display: "flex", gap: 0 }}>
        {days.map((day, i) => (
          <button
            key={day.dayLabel}
            onClick={() => setActiveDay(i)}
            style={{
              background: "none",
              border: "none",
              borderBottom: i === activeDay ? `2px solid ${gold}` : "2px solid transparent",
              color: i === activeDay ? gold : "#888",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.65rem",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "10px 20px",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {day.dayLabel}
            <span style={{ color: "#555", fontWeight: 400, marginLeft: 6 }}>({day.exercises.length})</span>
          </button>
        ))}
      </div>

      {/* Active day panel */}
      <DayPanel
        day={days[activeDay]}
        onChange={(updated) => updateDay(activeDay, updated)}
      />

      {/* Summary */}
      <div style={{ marginTop: "1.5rem", padding: "12px 16px", background: "#111", border: `1px solid ${border}`, borderRadius: 2 }}>
        <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#555" }}>
          {days.map((d) => `${d.dayLabel}: ${d.exercises.length} exercises`).join(" · ")} · {totalExercises} total
        </p>
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: "#e07070", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", marginTop: 12 }}>
          {error}
        </p>
      )}

      {/* Actions */}
      <div style={{ marginTop: "2rem", display: "flex", gap: 12 }}>
        <button
          onClick={() => handleSave(true)}
          disabled={saving}
          style={{
            background: saving ? "#333" : gold,
            color: saving ? "#888" : "#0a0a0a",
            border: "none",
            padding: "13px 28px",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Publish Block"}
        </button>
        <button
          onClick={() => handleSave(false)}
          disabled={saving}
          style={{
            background: "none",
            border: `1px solid ${border}`,
            color: "#888",
            padding: "13px 24px",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          Save as Draft
        </button>
      </div>
    </div>
  )
}
