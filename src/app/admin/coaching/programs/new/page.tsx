"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import WorkoutBuilder from "@/components/coaching/WorkoutBuilder"
import WorkoutLibraryModal from "@/components/coaching/WorkoutLibraryModal"
import WarmupCooldownSection from "@/components/coaching/WarmupCooldownSection"
import type { ProgramExercise } from "@/components/coaching/ExerciseRow"

type ProgramListItem = {
  id: string
  name: string
  clientEmail: string | null
  isTemplate: boolean
  status: string
  weeks: string
  notes: string | null
}

const gold = "#c9a96e"
const border = "#2a2a2a"

type WarmupCooldown = { notes: string; exercises: ProgramExercise[] }
type ProgramDay = {
  dayLabel: string
  notes: string
  warmup?: WarmupCooldown
  exercises: ProgramExercise[]
  cooldown?: WarmupCooldown
}
type ProgramWeek = { weekNumber: number; label: string; days: ProgramDay[] }

function emptyDay(label: string): ProgramDay { return { dayLabel: label, notes: "", warmup: { notes: "", exercises: [] }, exercises: [], cooldown: { notes: "", exercises: [] } } }
function emptyWeek(n: number): ProgramWeek {
  return { weekNumber: n, label: `Week ${n}`, days: [emptyDay("Day 1"), emptyDay("Day 2"), emptyDay("Day 3")] }
}

function Spinner() {
  return (
    <div style={{ width: 14, height: 14, border: "2px solid #333", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function NewProgramPage() {
  const router = useRouter()
  const [programName, setProgramName] = useState("")
  const [programNotes, setProgramNotes] = useState("")
  const [weeks, setWeeks] = useState<ProgramWeek[]>([emptyWeek(1)])
  const [activeWeek, setActiveWeek] = useState(0)
  const [activeDay, setActiveDay] = useState(0)
  const [showWorkoutLibrary, setShowWorkoutLibrary] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [existingPrograms, setExistingPrograms] = useState<ProgramListItem[]>([])
  const [templateChoice, setTemplateChoice] = useState<"blank" | string>("blank")
  const [templateLoaded, setTemplateLoaded] = useState<string | null>(null)

  const loadExisting = useCallback(async () => {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) return
      const res = await fetch("/api/admin/coaching/programs", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json() as { programs: ProgramListItem[] }
        setExistingPrograms(data.programs ?? [])
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadExisting() }, [loadExisting])

  function applyTemplate(id: string) {
    setTemplateChoice(id)
    if (id === "blank") {
      setWeeks([emptyWeek(1)])
      setActiveWeek(0)
      setActiveDay(0)
      setTemplateLoaded(null)
      return
    }
    const source = existingPrograms.find((p) => p.id === id)
    if (!source) return
    try {
      const sourceWeeks = JSON.parse(source.weeks) as ProgramWeek[]
      // deep-copy so edits don't mutate cached data
      const cloned = sourceWeeks.map((w) => ({
        ...w,
        days: w.days.map((d) => ({
          ...d,
          warmup: d.warmup ? { notes: d.warmup.notes, exercises: [...d.warmup.exercises] } : { notes: "", exercises: [] },
          cooldown: d.cooldown ? { notes: d.cooldown.notes, exercises: [...d.cooldown.exercises] } : { notes: "", exercises: [] },
          exercises: [...d.exercises],
        })),
      }))
      setWeeks(cloned)
      setActiveWeek(0)
      setActiveDay(0)
      if (!programName.trim()) setProgramName(`Copy of ${source.name}`)
      if (!programNotes.trim() && source.notes) setProgramNotes(source.notes)
      setTemplateLoaded(source.name)
    } catch {
      setError("Couldn't load that program — its data looks corrupted.")
    }
  }

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
    const nw = weeks.filter((_, i) => i !== idx).map((w, i) => ({ ...w, weekNumber: i + 1, label: w.label.startsWith("Week ") ? `Week ${i + 1}` : w.label }))
    setWeeks(nw)
    setActiveWeek(Math.min(idx, nw.length - 1))
    setActiveDay(0)
  }

  function duplicateWeek(idx: number) {
    const src = weeks[idx]
    const n = weeks.length + 1
    const copy: ProgramWeek = { ...src, weekNumber: n, label: `Week ${n}`, days: src.days.map((d) => ({ ...d, exercises: [...d.exercises] })) }
    setWeeks((ws) => [...ws.slice(0, idx + 1), copy, ...ws.slice(idx + 1)].map((w, i) => ({ ...w, weekNumber: i + 1 })))
    setActiveWeek(idx + 1)
    setActiveDay(0)
  }

  function addDay() {
    const n = (week?.days.length ?? 0) + 1
    setWeeks((ws) => ws.map((w, wi) => wi !== activeWeek ? w : { ...w, days: [...w.days, emptyDay(`Day ${n}`)] }))
    setActiveDay(week?.days.length ?? 0)
  }

  function removeDay(idx: number) {
    if ((week?.days.length ?? 0) <= 1) return
    setWeeks((ws) => ws.map((w, wi) => wi !== activeWeek ? w : {
      ...w,
      days: w.days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, dayLabel: d.dayLabel.startsWith("Day ") ? `Day ${i + 1}` : d.dayLabel })),
    }))
    setActiveDay(Math.min(idx, (week?.days.length ?? 2) - 2))
  }

  function moveDayUp(idx: number) {
    if (idx === 0 || !week) return
    setWeeks((ws) => ws.map((w, wi) => {
      if (wi !== activeWeek) return w
      const next = [...w.days]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return { ...w, days: next }
    }))
    setActiveDay(idx - 1)
  }

  function moveDayDown(idx: number) {
    if (!week || idx === week.days.length - 1) return
    setWeeks((ws) => ws.map((w, wi) => {
      if (wi !== activeWeek) return w
      const next = [...w.days]
      ;[next[idx + 1], next[idx]] = [next[idx], next[idx + 1]]
      return { ...w, days: next }
    }))
    setActiveDay(idx + 1)
  }

  function insertWorkout(workout: { name: string; exercises: ProgramExercise[] }) {
    // Insert at current day — append exercises and optionally set day label
    updateDay((d) => ({
      ...d,
      dayLabel: d.exercises.length === 0 && d.dayLabel.startsWith("Day ") ? workout.name : d.dayLabel,
      exercises: [...d.exercises, ...workout.exercises],
    }))
  }

  async function handleSave() {
    if (!programName.trim()) { setError("Program name is required"); return }
    setSaving(true); setError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) { setError("Not authenticated"); setSaving(false); return }
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
        setError("Failed to save.")
        setSaving(false)
      }
    } catch {
      setError("Failed to save.")
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <Link href="/admin/coaching/programs" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", textDecoration: "none", letterSpacing: "0.08em" }}>← Programs</Link>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, color: "#f0e6d3", margin: 0 }}>New Program</h1>
      </div>

      {/* Start from existing program */}
      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "16px 24px", marginBottom: "1rem" }}>
        <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 8 }}>Start from</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <select
            value={templateChoice}
            onChange={(e) => applyTemplate(e.target.value)}
            style={{
              background: "#111", border: `1px solid ${border}`, color: "#f0e6d3",
              padding: "9px 32px 9px 12px", fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.75rem", outline: "none", boxSizing: "border-box",
              appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
              backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%23888' stroke-width='1.3' fill='none' stroke-linecap='round'/></svg>\")",
              backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center",
              minWidth: 260,
            }}
          >
            <option value="blank">Blank program (start from scratch)</option>
            {existingPrograms.length > 0 && (
              <>
                <optgroup label="Templates">
                  {existingPrograms.filter((p) => p.isTemplate).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Client programs">
                  {existingPrograms.filter((p) => !p.isTemplate).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </optgroup>
              </>
            )}
          </select>
          {templateLoaded && (
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: gold, letterSpacing: "0.06em" }}>
              ✓ Loaded from &ldquo;{templateLoaded}&rdquo; — edit freely, saves as a new program
            </span>
          )}
        </div>
      </div>

      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "20px 24px", marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>Program Name *</label>
          <input type="text" value={programName} onChange={(e) => setProgramName(e.target.value)} placeholder="e.g. 12-Week Fat Loss Phase 1"
            style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>Notes</label>
          <input type="text" value={programNotes} onChange={(e) => setProgramNotes(e.target.value)} placeholder="Optional program description…"
            style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }} />
        </div>
      </div>

      {/* Week tabs */}
      <div className="h-scroll" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
        {weeks.map((w, wi) => (
          <div key={wi} style={{ display: "flex", alignItems: "center" }}>
            <button onClick={() => { setActiveWeek(wi); setActiveDay(0) }}
              style={{ background: wi === activeWeek ? gold : "#161616", border: `1px solid ${wi === activeWeek ? gold : border}`, color: wi === activeWeek ? "#0a0a0a" : "#888", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: wi === activeWeek ? 700 : 400, cursor: "pointer", letterSpacing: "0.08em" }}>
              W{w.weekNumber}
            </button>
            {weeks.length > 1 && <button onClick={() => removeWeek(wi)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: "0 4px", fontSize: "0.75rem" }}>×</button>}
          </div>
        ))}
        <button onClick={addWeek} style={{ background: "none", border: `1px dashed ${border}`, color: "#555", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>+ Week</button>
        <button onClick={() => duplicateWeek(activeWeek)} style={{ background: "none", border: `1px dashed ${border}`, color: "#555", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>⎘ Duplicate Week</button>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <input type="text" value={week?.label ?? ""} onChange={(e) => setWeeks((ws) => ws.map((w, i) => i !== activeWeek ? w : { ...w, label: e.target.value }))} placeholder="Week label…"
          style={{ background: "#111", border: `1px solid ${border}`, color: "#888", padding: "6px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none", width: 200 }} />
      </div>

      {/* Day tabs with reorder */}
      <div className="h-scroll" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
        {week?.days.map((d, di) => (
          <div key={di} style={{ display: "flex", alignItems: "center", border: di === activeDay ? `1px solid #3a3a3a` : `1px solid ${border}`, background: di === activeDay ? "#2a2a2a" : "transparent" }}>
            <button onClick={() => moveDayUp(di)} disabled={di === 0} style={{ background: "none", border: "none", color: di === 0 ? "#333" : "#888", cursor: di === 0 ? "not-allowed" : "pointer", padding: "0 4px", fontSize: "0.65rem", lineHeight: 1 }}>◀</button>
            <button onClick={() => setActiveDay(di)} style={{ background: "none", border: "none", color: di === activeDay ? "#f0e6d3" : "#666", padding: "6px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>{d.dayLabel}</button>
            <button onClick={() => moveDayDown(di)} disabled={di === (week?.days.length ?? 1) - 1} style={{ background: "none", border: "none", color: di === (week?.days.length ?? 1) - 1 ? "#333" : "#888", cursor: di === (week?.days.length ?? 1) - 1 ? "not-allowed" : "pointer", padding: "0 4px", fontSize: "0.65rem", lineHeight: 1 }}>▶</button>
            {(week?.days.length ?? 0) > 1 && <button onClick={() => removeDay(di)} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", padding: "0 4px", fontSize: "0.75rem" }}>×</button>}
          </div>
        ))}
        <button onClick={addDay} style={{ background: "none", border: `1px dashed ${border}`, color: "#444", padding: "6px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>+ Day</button>
      </div>

      {day && (
        <div>
          <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <input type="text" value={day.dayLabel} onChange={(e) => updateDay((d) => ({ ...d, dayLabel: e.target.value }))}
              style={{ background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "7px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", width: 160 }} />
            <input type="text" value={day.notes} onChange={(e) => updateDay((d) => ({ ...d, notes: e.target.value }))} placeholder="Day notes (e.g. Lower body focus)…"
              style={{ background: "#111", border: `1px solid ${border}`, color: "#888", padding: "7px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", flex: "1 1 240px" }} />
            <button onClick={() => setShowWorkoutLibrary(true)} style={{ background: "none", border: `1px solid ${gold}`, color: gold, padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
              + Insert from Library
            </button>
          </div>

          {/* Warmup section */}
          <WarmupCooldownSection
            label="Warmup"
            data={day.warmup ?? { notes: "", exercises: [] }}
            onChange={(w) => updateDay((d) => ({ ...d, warmup: w }))}
          />

          {/* Main exercises */}
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: "22px 0 10px" }}>
            Main Workout
          </p>
          <WorkoutBuilder
            exercises={day.exercises}
            onChange={(exs) => updateDay((d) => ({ ...d, exercises: exs }))}
          />

          {/* Cooldown section */}
          <WarmupCooldownSection
            label="Cooldown"
            data={day.cooldown ?? { notes: "", exercises: [] }}
            onChange={(c) => updateDay((d) => ({ ...d, cooldown: c }))}
          />
        </div>
      )}

      <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: `1px solid ${border}`, display: "flex", gap: 12, alignItems: "center" }}>
        {error && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#e07070", margin: 0 }}>{error}</p>}
        <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#555" : gold, color: "#0a0a0a", border: "none", padding: "12px 28px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          {saving && <Spinner />}{saving ? "Saving…" : "Save Program"}
        </button>
        <button onClick={() => router.push("/admin/coaching/programs")} style={{ background: "none", border: "none", color: "#555", padding: "12px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>Cancel</button>
      </div>

      {showWorkoutLibrary && (
        <WorkoutLibraryModal
          onSelect={insertWorkout}
          onClose={() => setShowWorkoutLibrary(false)}
        />
      )}
    </div>
  )
}
