"use client"

import { useState, useEffect } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"

const gold = "#c9a96e"
const border = "#2a2a2a"

// ── Types ────────────────────────────────────────────────────────────────────

type ProgramExercise = {
  exerciseId: string
  name: string
  videoS3Key: string
  sets: string
  reps: string
  weight: string
  rpe: string
  rest: string
  tempo: string
  coachNotes: string
}

type ProgramDay = {
  dayLabel: string
  notes: string
  exercises: ProgramExercise[]
}

type ProgramWeek = {
  weekNumber: number
  label: string
  days: ProgramDay[]
}

type SearchExercise = {
  id: string
  name: string
  videoS3Key: string | null
  thumbnailS3Key: string | null
  primaryMuscle: string | null
  category: string | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptyDay(label: string): ProgramDay {
  return { dayLabel: label, notes: "", exercises: [] }
}

function emptyWeek(n: number): ProgramWeek {
  return { weekNumber: n, label: `Week ${n}`, days: [emptyDay("Day 1"), emptyDay("Day 2"), emptyDay("Day 3")] }
}

function emptyExercise(ex: SearchExercise): ProgramExercise {
  return { exerciseId: ex.id, name: ex.name, videoS3Key: ex.videoS3Key ?? "", sets: "3", reps: "10-12", weight: "", rpe: "", rest: "60s", tempo: "", coachNotes: "" }
}

const CDN = process.env.NEXT_PUBLIC_AMBRISA_CDN_URL ?? ""
function cdnThumb(key: string | null | undefined) {
  if (!key) return ""
  const jpg = key.replace(/\.mp4$/i, ".jpg")
  return `${CDN}/${encodeURIComponent(jpg)}`
}

// ── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ width: 16, height: 16, border: "2px solid #333", borderTop: `2px solid ${gold}`, borderRadius: "50%", flexShrink: 0, animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function SmallInput({ value, onChange, placeholder, width }: { value: string; onChange: (v: string) => void; placeholder?: string; width?: number | string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", padding: "5px 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none", width: width ?? 64, boxSizing: "border-box" }}
    />
  )
}

function ExerciseSearchModal({ onSelect, onClose }: { onSelect: (ex: SearchExercise) => void; onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [exercises, setExercises] = useState<SearchExercise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()
        if (!token) return
        const res = await fetch("/api/admin/coaching/exercises", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setExercises(
            (data.exercises ?? [])
              .filter((e: Record<string, unknown>) => e.status !== "INACTIVE")
              .map((e: Record<string, unknown>) => ({
                id: e.id as string,
                name: e.name as string,
                videoS3Key: (e.videoS3Key as string | null) ?? null,
                thumbnailS3Key: (e.thumbnailS3Key as string | null) ?? null,
                primaryMuscle: (e.primaryMuscle as string | null) ?? null,
                category: (e.category as string | null) ?? null,
              }))
          )
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = query.length < 2
    ? exercises.slice(0, 80)
    : exercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 2, width: "100%", maxWidth: 520, maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}` }}>
          <input
            autoFocus
            type="search"
            placeholder="Search exercises…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 20, color: "#555" }}>
              <Spinner />
              <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem" }}>Loading exercises…</span>
            </div>
          ) : filtered.length === 0 ? (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555", padding: "16px 20px" }}>No exercises found.</p>
          ) : (
            filtered.map((ex) => (
              <button
                key={ex.id}
                onClick={() => { onSelect(ex); onClose() }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", background: "none", border: "none", borderBottom: `1px solid #1a1a1a`, cursor: "pointer", textAlign: "left" }}
              >
                {ex.thumbnailS3Key && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cdnThumb(ex.thumbnailS3Key)} alt="" style={{ width: 40, height: 40, objectFit: "cover", flexShrink: 0, background: "#0a0a0a" }} />
                )}
                <div>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#f0e6d3", margin: 0 }}>{ex.name}</p>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#555", margin: 0 }}>{ex.primaryMuscle ?? ex.category ?? ""}</p>
                </div>
              </button>
            ))
          )}
        </div>
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${border}` }}>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${border}`, color: "#666", padding: "7px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function ExerciseRow({ ex, onUpdate, onRemove }: { ex: ProgramExercise; onUpdate: (updated: ProgramExercise) => void; onRemove: () => void }) {
  const set = (key: keyof ProgramExercise) => (val: string) => onUpdate({ ...ex, [key]: val })

  return (
    <div style={{ background: "#0f0f0f", border: `1px solid ${border}`, padding: "12px 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, flexShrink: 0 }}>
          {ex.videoS3Key && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cdnThumb(ex.videoS3Key)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#f0e6d3", flex: 1 }}>{ex.name}</span>
        <button onClick={onRemove} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: "4px 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>Sets</div>
          <SmallInput value={ex.sets} onChange={set("sets")} placeholder="3" width={52} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>Reps</div>
          <SmallInput value={ex.reps} onChange={set("reps")} placeholder="10-12" width={72} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>Weight</div>
          <SmallInput value={ex.weight} onChange={set("weight")} placeholder="e.g. 20kg" width={80} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>RPE</div>
          <SmallInput value={ex.rpe} onChange={set("rpe")} placeholder="7-8" width={52} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>Rest</div>
          <SmallInput value={ex.rest} onChange={set("rest")} placeholder="60s" width={60} />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>Tempo</div>
          <SmallInput value={ex.tempo} onChange={set("tempo")} placeholder="3-1-1" width={64} />
        </div>
        <div style={{ flex: "1 1 200px", minWidth: 140 }}>
          <div style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", marginBottom: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>Coach Notes</div>
          <input
            type="text"
            value={ex.coachNotes}
            onChange={(e) => set("coachNotes")(e.target.value)}
            placeholder="Any notes…"
            style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: "#f0e6d3", padding: "5px 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NewProgramPage() {
  const router = useRouter()
  const [programName, setProgramName] = useState("")
  const [programNotes, setProgramNotes] = useState("")
  const [weeks, setWeeks] = useState<ProgramWeek[]>([emptyWeek(1)])
  const [activeWeek, setActiveWeek] = useState(0)
  const [activeDay, setActiveDay] = useState(0)
  const [showSearch, setShowSearch] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const week = weeks[activeWeek]
  const day = week?.days[activeDay]

  function updateDay(updater: (d: ProgramDay) => ProgramDay) {
    setWeeks((ws) => ws.map((w, wi) => wi !== activeWeek ? w : {
      ...w,
      days: w.days.map((d, di) => di !== activeDay ? d : updater(d)),
    }))
  }

  function addWeek() {
    const n = weeks.length + 1
    setWeeks((ws) => [...ws, emptyWeek(n)])
    setActiveWeek(weeks.length)
    setActiveDay(0)
  }

  function removeWeek(idx: number) {
    if (weeks.length === 1) return
    const newWeeks = weeks.filter((_, i) => i !== idx).map((w, i) => ({ ...w, weekNumber: i + 1, label: `Week ${i + 1}` }))
    setWeeks(newWeeks)
    setActiveWeek(Math.min(idx, newWeeks.length - 1))
    setActiveDay(0)
  }

  function addDay() {
    const n = (week?.days.length ?? 0) + 1
    setWeeks((ws) => ws.map((w, wi) => wi !== activeWeek ? w : { ...w, days: [...w.days, emptyDay(`Day ${n}`)] }))
    setActiveDay((week?.days.length ?? 0))
  }

  function removeDay(idx: number) {
    if ((week?.days.length ?? 0) <= 1) return
    setWeeks((ws) => ws.map((w, wi) => wi !== activeWeek ? w : {
      ...w,
      days: w.days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, dayLabel: `Day ${i + 1}` })),
    }))
    setActiveDay(Math.min(idx, (week?.days.length ?? 2) - 2))
  }

  function updateWeekLabel(idx: number, label: string) {
    setWeeks((ws) => ws.map((w, i) => i !== idx ? w : { ...w, label }))
  }

  function addExercise(ex: SearchExercise) {
    updateDay((d) => ({ ...d, exercises: [...d.exercises, emptyExercise(ex)] }))
  }

  function updateExercise(exIdx: number, updated: ProgramExercise) {
    updateDay((d) => ({ ...d, exercises: d.exercises.map((e, i) => i !== exIdx ? e : updated) }))
  }

  function removeExercise(exIdx: number) {
    updateDay((d) => ({ ...d, exercises: d.exercises.filter((_, i) => i !== exIdx) }))
  }

  async function handleSave() {
    if (!programName.trim()) { setError("Program name is required"); return }
    setSaving(true); setError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) {
        setError("Not authenticated")
        setSaving(false)
        return
      }
      const res = await fetch("/api/admin/coaching/programs", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: programName.trim(),
          isTemplate: true,
          status: "DRAFT",
          weeks: JSON.stringify(weeks),
          notes: programNotes || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.program?.id) router.push(`/admin/coaching/programs/${data.program.id}`)
      } else {
        setError("Failed to save program. Please try again.")
        setSaving(false)
      }
    } catch {
      setError("Failed to save program. Please try again.")
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <Link href="/admin/coaching/programs" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", textDecoration: "none", letterSpacing: "0.08em" }}>← Programs</Link>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, color: "#f0e6d3", margin: 0 }}>New Program</h1>
      </div>

      {/* Program header */}
      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "20px 24px", marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>Program Name *</label>
          <input
            type="text"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
            placeholder="e.g. 12-Week Fat Loss Phase 1"
            style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>Notes</label>
          <input
            type="text"
            value={programNotes}
            onChange={(e) => setProgramNotes(e.target.value)}
            placeholder="Optional program description…"
            style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Week tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
        {weeks.map((w, wi) => (
          <div key={wi} style={{ display: "flex", alignItems: "center" }}>
            <button
              onClick={() => { setActiveWeek(wi); setActiveDay(0) }}
              style={{ background: wi === activeWeek ? gold : "#161616", border: `1px solid ${wi === activeWeek ? gold : border}`, color: wi === activeWeek ? "#0a0a0a" : "#888", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: wi === activeWeek ? 700 : 400, cursor: "pointer", letterSpacing: "0.08em" }}
            >
              W{w.weekNumber}
            </button>
            {weeks.length > 1 && (
              <button onClick={() => removeWeek(wi)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: "0 4px", fontSize: "0.75rem", lineHeight: 1 }}>×</button>
            )}
          </div>
        ))}
        <button onClick={addWeek} style={{ background: "none", border: `1px dashed ${border}`, color: "#555", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>
          + Week
        </button>
      </div>

      {/* Week label editor */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          value={week?.label ?? ""}
          onChange={(e) => updateWeekLabel(activeWeek, e.target.value)}
          placeholder="Week label…"
          style={{ background: "#111", border: `1px solid ${border}`, color: "#888", padding: "6px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none", width: 200 }}
        />
      </div>

      {/* Day tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
        {week?.days.map((d, di) => (
          <div key={di} style={{ display: "flex", alignItems: "center" }}>
            <button
              onClick={() => setActiveDay(di)}
              style={{ background: di === activeDay ? "#2a2a2a" : "transparent", border: `1px solid ${di === activeDay ? "#3a3a3a" : border}`, color: di === activeDay ? "#f0e6d3" : "#666", padding: "6px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}
            >
              {d.dayLabel}
            </button>
            {(week?.days.length ?? 0) > 1 && (
              <button onClick={() => removeDay(di)} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", padding: "0 4px", fontSize: "0.75rem" }}>×</button>
            )}
          </div>
        ))}
        <button onClick={addDay} style={{ background: "none", border: `1px dashed ${border}`, color: "#444", padding: "6px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>
          + Day
        </button>
      </div>

      {/* Day editor */}
      {day && (
        <div>
          <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="text"
              value={day.dayLabel}
              onChange={(e) => updateDay((d) => ({ ...d, dayLabel: e.target.value }))}
              style={{ background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "7px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", width: 120 }}
            />
            <input
              type="text"
              value={day.notes}
              onChange={(e) => updateDay((d) => ({ ...d, notes: e.target.value }))}
              placeholder="Day notes (e.g. Lower body focus)…"
              style={{ background: "#111", border: `1px solid ${border}`, color: "#888", padding: "7px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", flex: 1 }}
            />
          </div>

          {day.exercises.length === 0 ? (
            <div style={{ background: "#0f0f0f", border: `1px dashed ${border}`, padding: "2.5rem", textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#444", marginBottom: 16 }}>No exercises added to this day yet.</p>
              <button onClick={() => setShowSearch(true)} style={{ background: gold, color: "#0a0a0a", border: "none", padding: "10px 22px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>
                + Add Exercise
              </button>
            </div>
          ) : (
            <div>
              {day.exercises.map((ex, i) => (
                <ExerciseRow key={i} ex={ex} onUpdate={(u) => updateExercise(i, u)} onRemove={() => removeExercise(i)} />
              ))}
              <button onClick={() => setShowSearch(true)} style={{ background: "none", border: `1px dashed ${border}`, color: "#555", padding: "10px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", width: "100%", marginTop: 4 }}>
                + Add Exercise
              </button>
            </div>
          )}
        </div>
      )}

      {/* Save bar */}
      <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: `1px solid ${border}`, display: "flex", gap: 12, alignItems: "center" }}>
        {error && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#e07070", margin: 0 }}>{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ background: saving ? "#555" : gold, color: "#0a0a0a", border: "none", padding: "12px 28px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
        >
          {saving && <Spinner />}
          {saving ? "Saving…" : "Save Program"}
        </button>
        <button onClick={() => router.push("/admin/coaching/programs")} style={{ background: "none", border: "none", color: "#555", padding: "12px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>
          Cancel
        </button>
      </div>

      {showSearch && (
        <ExerciseSearchModal onSelect={addExercise} onClose={() => setShowSearch(false)} />
      )}
    </div>
  )
}
