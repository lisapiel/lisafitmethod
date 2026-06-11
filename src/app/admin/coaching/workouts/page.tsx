"use client"

import { useState, useEffect } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import Link from "next/link"

const gold = "#c9a96e"
const border = "#2a2a2a"

type Workout = {
  id: string
  name: string
  description: string | null
  category: string | null
  exerciseCount: number
  updatedAt: string
}

function Spinner() {
  return (
    <div style={{ width: 18, height: 18, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()
        if (!token) return
        const res = await fetch("/api/admin/coaching/workouts", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setWorkouts(
            (data.workouts ?? []).map((w: Record<string, unknown>) => {
              let exerciseCount = 0
              try { exerciseCount = (JSON.parse(w.exercises as string) as unknown[]).length } catch { /* empty */ }
              return {
                id: w.id as string,
                name: w.name as string,
                description: (w.description as string | null) ?? null,
                category: (w.category as string | null) ?? null,
                exerciseCount,
                updatedAt: (w.updatedAt as string) ?? "",
              }
            })
          )
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = query
    ? workouts.filter((w) =>
        w.name.toLowerCase().includes(query.toLowerCase()) ||
        (w.category?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )
    : workouts

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.25rem" }}>Workout Library</h1>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#888" }}>
            {loading ? "Loading…" : `${workouts.length} saved workout${workouts.length !== 1 ? "s" : ""} · build programs from these reusable templates`}
          </p>
        </div>
        <Link href="/admin/coaching/workouts/new" style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "9px 18px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>
          + New Workout
        </Link>
      </div>

      <div style={{ marginBottom: "1.25rem" }}>
        <input
          type="search"
          placeholder="Search workouts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "100%", maxWidth: 320, background: "#161616", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none" }}
        />
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "3rem 0", color: "#555" }}>
          <Spinner />
          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem" }}>Loading workouts…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "#111", border: `1px solid ${border}`, padding: "3rem 2rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", color: "#444", marginBottom: 12 }}>
            {workouts.length === 0 ? "No saved workouts yet" : "No matches"}
          </p>
          {workouts.length === 0 && (
            <>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#666", marginBottom: 20, maxWidth: 420, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
                A workout is a saved single-workout template (e.g. &quot;Lower Body Power&quot;). Use the same workout across multiple programs to save time.
              </p>
              <Link href="/admin/coaching/workouts/new" style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "11px 24px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none" }}>
                Create First Workout →
              </Link>
            </>
          )}
        </div>
      ) : (
        <div>
          {filtered.map((w) => (
            <Link key={w.id} href={`/admin/coaching/workouts/${w.id}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "#111", border: `1px solid ${border}`, marginBottom: 6, textDecoration: "none" }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "#f0e6d3", margin: "0 0 4px" }}>{w.name}</p>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {w.category && <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: gold, letterSpacing: "0.06em" }}>{w.category.toUpperCase()}</span>}
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#666" }}>{w.exerciseCount} exercise{w.exerciseCount !== 1 ? "s" : ""}</span>
                  {w.description && <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{w.description}</span>}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="#444" strokeWidth="1.2" strokeLinecap="round" /></svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
