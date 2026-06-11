"use client"

import { useState, useEffect } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import type { ProgramExercise } from "./ExerciseRow"

const gold = "#c9a96e"
const border = "#2a2a2a"

type WorkoutSummary = {
  id: string
  name: string
  description: string | null
  category: string | null
  exercises: ProgramExercise[]
}

function Spinner() {
  return (
    <div style={{ width: 16, height: 16, border: "2px solid #333", borderTop: `2px solid ${gold}`, borderRadius: "50%", flexShrink: 0, animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function WorkoutLibraryModal({ onSelect, onClose }: {
  onSelect: (workout: WorkoutSummary) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()
        if (!token) return
        const res = await fetch("/api/admin/coaching/workouts", { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          setWorkouts(
            (data.workouts ?? []).map((w: Record<string, unknown>) => {
              let exercises: ProgramExercise[] = []
              try { exercises = JSON.parse(w.exercises as string) as ProgramExercise[] } catch { /* empty */ }
              return {
                id: w.id as string,
                name: w.name as string,
                description: (w.description as string | null) ?? null,
                category: (w.category as string | null) ?? null,
                exercises,
              }
            })
          )
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = query.length < 2 ? workouts : workouts.filter((w) =>
    w.name.toLowerCase().includes(query.toLowerCase()) ||
    (w.category?.toLowerCase().includes(query.toLowerCase()) ?? false)
  )

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 2, width: "100%", maxWidth: 560, maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}` }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: gold, marginBottom: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>Insert from Workout Library</p>
          <input autoFocus type="search" placeholder="Search workouts…" value={query} onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 20, color: "#555" }}><Spinner /><span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem" }}>Loading workouts…</span></div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555", marginBottom: 12 }}>
                {workouts.length === 0 ? "No saved workouts yet. Build some in the Workout Library." : "No workouts match your search."}
              </p>
            </div>
          ) : filtered.map((w) => (
            <button key={w.id} onClick={() => { onSelect(w); onClose() }}
              style={{ width: "100%", display: "block", padding: "12px 20px", background: "none", border: "none", borderBottom: `1px solid #1a1a1a`, cursor: "pointer", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: "#f0e6d3", margin: 0, fontWeight: 600 }}>{w.name}</p>
                {w.category && <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: gold, letterSpacing: "0.08em" }}>{w.category}</span>}
              </div>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", margin: 0 }}>
                {w.exercises.length} exercise{w.exercises.length !== 1 ? "s" : ""}
                {w.description ? ` · ${w.description}` : ""}
              </p>
            </button>
          ))}
        </div>
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${border}` }}>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${border}`, color: "#666", padding: "7px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
