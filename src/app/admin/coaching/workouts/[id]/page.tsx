"use client"

import { useState, useEffect } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import WorkoutBuilder from "@/components/coaching/WorkoutBuilder"
import type { ProgramExercise } from "@/components/coaching/ExerciseRow"

const gold = "#c9a96e"
const border = "#2a2a2a"

const CATEGORIES = ["", "Lower Body", "Upper Body", "Push", "Pull", "Legs", "Full Body", "Cardio", "Core", "Mobility"]

function Spinner() {
  return (
    <div style={{ width: 14, height: 14, border: "2px solid #333", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function EditWorkoutPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [exercises, setExercises] = useState<ProgramExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()
        if (!token) { setLoading(false); return }
        const res = await fetch(`/api/admin/coaching/workouts/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          const w = data.workout
          if (w) {
            setName(w.name ?? "")
            setDescription(w.description ?? "")
            setCategory(w.category ?? "")
            try { setExercises(JSON.parse(w.exercises) as ProgramExercise[]) } catch { /* empty */ }
          }
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSave() {
    if (!name.trim()) { setError("Name required"); return }
    setSaving(true); setError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) { setError("Not authenticated"); setSaving(false); return }
      const res = await fetch(`/api/admin/coaching/workouts/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          category: category || undefined,
          exercises: JSON.stringify(exercises),
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError("Failed to save.")
      }
    } catch {
      setError("Failed to save.")
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm("Delete this workout? Programs using it won't be affected.")) return
    const session = await fetchAuthSession()
    const token = session.tokens?.accessToken?.toString()
    if (!token) return
    await fetch(`/api/admin/coaching/workouts/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    router.push("/admin/coaching/workouts")
  }

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "3rem", color: "#555" }}><Spinner /><span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem" }}>Loading…</span></div>
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Link href="/admin/coaching/workouts" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", textDecoration: "none", letterSpacing: "0.08em" }}>← Workouts</Link>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, color: "#f0e6d3", margin: 0, flex: 1 }}>{name || "Edit Workout"}</h1>
        <button onClick={handleDelete} style={{ background: "none", border: `1px solid ${border}`, color: "#666", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
          Delete
        </button>
      </div>

      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "20px 24px", marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "2fr 1fr 2fr", gap: "1rem" }}>
        <div>
          <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c || "—"}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>Description</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      <WorkoutBuilder exercises={exercises} onChange={setExercises} />

      <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: `1px solid ${border}`, display: "flex", gap: 12, alignItems: "center" }}>
        {error && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#e07070", margin: 0 }}>{error}</p>}
        <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#555" : gold, color: "#0a0a0a", border: "none", padding: "12px 28px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          {saving && <Spinner />}{saving ? "Saving…" : saved ? "Saved ✓" : "Save Workout"}
        </button>
        <button onClick={() => router.push("/admin/coaching/workouts")} style={{ background: "none", border: "none", color: "#555", padding: "12px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>Back</button>
      </div>
    </div>
  )
}
