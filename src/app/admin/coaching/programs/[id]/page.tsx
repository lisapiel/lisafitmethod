"use client"

import ProgramLengthField from "@/components/coaching/admin/ProgramLengthField"
import { useState, useEffect, useCallback } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import WorkoutBuilder from "@/components/coaching/WorkoutBuilder"
import WarmupCooldownSection from "@/components/coaching/WarmupCooldownSection"
import WorkoutLibraryModal from "@/components/coaching/WorkoutLibraryModal"
import type { ProgramExercise } from "@/components/coaching/ExerciseRow"
import WarmupSettingsPanel from "@/components/coaching/warmups/WarmupSettingsPanel"
import SequenceStatus from "@/components/coaching/warmups/SequenceStatus"
import AutoFillNotice from "@/components/coaching/warmups/AutoFillNotice"
import { useAutoSequences, markManual } from "@/components/coaching/warmups/useAutoSequences"
import { DEFAULT_OPTIONS, type Sequence, type WarmupOptions } from "@/lib/warmups/engine"

const gold = "#c9a96e"
const border = "#2a2a2a"

type WarmupCooldown = { notes: string; exercises: ProgramExercise[]; source?: Sequence["source"]; rule?: string }
type ProgramDay = {
  dayLabel: string
  notes: string
  warmup?: WarmupCooldown
  exercises: ProgramExercise[]
  cooldown?: WarmupCooldown
  // Optional day-type flag. Absent = strength (every existing day). When
  // "sport", the admin builder swaps the main workout + warm-up/cool-down
  // editors for a short Sport-day pane, and the client runner renders
  // the short sport form instead of exercise blocks.
  dayType?: "sport"
}
type ProgramWeek = { weekNumber: number; label: string; days: ProgramDay[] }
type ProgramStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED"

function emptyDay(label: string): ProgramDay { return { dayLabel: label, notes: "", warmup: { notes: "", exercises: [] }, exercises: [], cooldown: { notes: "", exercises: [] } } }
function emptyWeek(n: number): ProgramWeek { return { weekNumber: n, label: `Week ${n}`, days: [emptyDay("Day 1"), emptyDay("Day 2"), emptyDay("Day 3")] } }

function Spinner() {
  return (
    <div style={{ width: 14, height: 14, border: "2px solid #333", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function EditProgramPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [programName, setProgramName] = useState("")
  const [programNotes, setProgramNotes] = useState("")
  const [programStatus, setProgramStatus] = useState<ProgramStatus>("DRAFT")
  const [clientEmail, setClientEmail] = useState<string | null>(null)
  // Optional "repeat for N weeks" count. Empty = use the stored week count
  // as-is (traditional multi-week program). Any number > the stored week
  // count turns this into a rotation: the stored weeks are cycled on the
  // client. Each cycled week still gets its own weekNumber + its own
  // completion state via (programId, weekNumber, dayLabel).
  const [durationWeeksInput, setDurationWeeksInput] = useState<string>("")
  const [introNote, setIntroNote] = useState("")
  const [weeks, setWeeks] = useState<ProgramWeek[]>([emptyWeek(1)])
  const [activeWeek, setActiveWeek] = useState(0)
  const [activeDay, setActiveDay] = useState(0)
  const [showWorkoutLibrary, setShowWorkoutLibrary] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [templateOptions, setTemplateOptions] = useState<WarmupOptions>(DEFAULT_OPTIONS)
  const [clientOptions, setClientOptions] = useState<WarmupOptions | null>(null)

  const autoMode = clientEmail ? "client" : "template"
  const auto = useAutoSequences({
    weeks, setWeeks, mode: autoMode,
    options: loading ? null : clientEmail ? clientOptions : templateOptions,
  })

  const week = weeks[activeWeek]
  const day = week?.days[activeDay]

  const load = useCallback(() => {
    async function doLoad() {
      try {
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()
        if (!token) { setLoading(false); return }
        const res = await fetch(`/api/admin/coaching/programs/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) {
          const data = await res.json()
          const p = data.program
          if (p) {
            setProgramName(p.name)
            setProgramNotes(p.notes ?? "")
            setProgramStatus((p.status ?? "DRAFT") as ProgramStatus)
            setClientEmail(p.clientEmail ?? null)
            setDurationWeeksInput(typeof p.durationWeeks === "number" ? String(p.durationWeeks) : "")
            setIntroNote(p.introNote ?? "")
            setTemplateOptions({ ...DEFAULT_OPTIONS, ...(p.warmupOptions ?? {}) })
            try { setWeeks(JSON.parse(p.weeks) as ProgramWeek[]) } catch { /* keep default */ }
          }
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    doLoad()
  }, [id])

  useEffect(() => { load() }, [load])

  function updateDay(updater: (d: ProgramDay) => ProgramDay) {
    setWeeks((ws) => ws.map((w, wi) => wi !== activeWeek ? w : { ...w, days: w.days.map((d, di) => di !== activeDay ? d : updater(d)) }))
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
    setWeeks((ws) => ws.map((w, wi) => wi !== activeWeek ? w : { ...w, days: w.days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, dayLabel: d.dayLabel.startsWith("Day ") ? `Day ${i + 1}` : d.dayLabel })) }))
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
      // Parse durationWeeks: empty string → explicit null so the server
      // REMOVE's the attribute (clearing an existing rotation back to
      // "use authored week count"). Positive integer 1..52 → number.
      // Values outside the range are refused rather than silently clamped.
      let durationWeeks: number | null
      const raw = durationWeeksInput.trim()
      if (raw === "") {
        durationWeeks = null
      } else {
        const n = Number(raw)
        if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1 || n > 52) {
          setError("Program length must be a whole number of weeks between 1 and 52, or blank.")
          setSaving(false); return
        }
        durationWeeks = n
      }
      const res = await fetch(`/api/admin/coaching/programs/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: programName.trim(),
          status: programStatus,
          weeks: JSON.stringify(weeks),
          notes: programNotes || undefined,
          durationWeeks,
          introNote: introNote.trim(),
          ...(clientEmail ? {} : { warmupOptions: templateOptions }),
        }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) } else { setError("Failed to save.") }
    } catch { setError("Failed to save.") }
    setSaving(false)
  }

  async function handleDuplicate() {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) return
      const res = await fetch(`/api/admin/coaching/programs/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ newName: `${programName} (copy)`, asTemplate: true }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.program?.id) router.push(`/admin/coaching/programs/${data.program.id}`)
      }
    } catch { /* ignore */ }
  }

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "3rem", color: "#555" }}><Spinner /><span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem" }}>Loading…</span></div>
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Link href="/admin/coaching/programs" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", textDecoration: "none", letterSpacing: "0.08em" }}>← Programs</Link>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, color: "#f0e6d3", margin: 0, flex: "1 1 260px", minWidth: 0, overflowWrap: "anywhere" }}>{programName || "Edit Program"}</h1>
        <button onClick={handleDuplicate} style={{ background: "none", border: `1px solid ${border}`, color: "#888", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Duplicate</button>
        {clientEmail && (
          <Link href={`/admin/coaching/clients/${encodeURIComponent(clientEmail)}`} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: gold, textDecoration: "none", letterSpacing: "0.08em" }}>
            Client: {clientEmail}
          </Link>
        )}
      </div>

      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "20px 24px", marginBottom: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", alignItems: "end" }}>
        <div>
          <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>Name *</label>
          <input type="text" value={programName} onChange={(e) => setProgramName(e.target.value)} style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>Notes</label>
          <input type="text" value={programNotes} onChange={(e) => setProgramNotes(e.target.value)} placeholder="Optional…" style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>Status</label>
          <select value={programStatus} onChange={(e) => setProgramStatus(e.target.value as ProgramStatus)} style={{ background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none" }}>
            <option value="DRAFT">Draft</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      <ProgramLengthField value={durationWeeksInput} onChange={setDurationWeeksInput} storedWeeks={weeks.length} intro={introNote} onIntro={setIntroNote} />

      <WarmupSettingsPanel
        mode={autoMode}
        clientEmail={clientEmail}
        templateOptions={templateOptions}
        onOptions={clientEmail ? setClientOptions : setTemplateOptions}
        totals={auto.totals}
        onAddAllEmpty={auto.addAllEmpty}
        onUpdateAllOutdated={auto.updateAllOutdated}
        paused={auto.paused}
        onResume={auto.resume}
      />
      <AutoFillNotice notice={auto.notice} onUndo={auto.undoNotice} onDismiss={auto.dismissNotice} newDaysOnly={!!clientEmail} />

      {/* Week tabs */}
      <div className="h-scroll" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
        {weeks.map((w, wi) => (
          <div key={wi} style={{ display: "flex", alignItems: "center" }}>
            <button onClick={() => { setActiveWeek(wi); setActiveDay(0) }} style={{ background: wi === activeWeek ? gold : "#161616", border: `1px solid ${wi === activeWeek ? gold : border}`, color: wi === activeWeek ? "#0a0a0a" : "#888", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: wi === activeWeek ? 700 : 400, cursor: "pointer" }}>W{w.weekNumber}</button>
            {weeks.length > 1 && <button onClick={() => removeWeek(wi)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", padding: "0 4px", fontSize: "0.75rem" }}>×</button>}
          </div>
        ))}
        <button onClick={addWeek} style={{ background: "none", border: `1px dashed ${border}`, color: "#555", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>+ Week</button>
        <button onClick={() => duplicateWeek(activeWeek)} style={{ background: "none", border: `1px dashed ${border}`, color: "#555", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>⎘ Duplicate Week</button>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <input type="text" value={week?.label ?? ""} onChange={(e) => setWeeks((ws) => ws.map((w, i) => i !== activeWeek ? w : { ...w, label: e.target.value }))} style={{ background: "#111", border: `1px solid ${border}`, color: "#888", padding: "6px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none", width: 200 }} />
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
          <div style={{ marginBottom: "1rem", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <input type="text" value={day.dayLabel} onChange={(e) => updateDay((d) => ({ ...d, dayLabel: e.target.value }))} style={{ background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "7px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", width: 160 }} />
            <input type="text" value={day.notes} onChange={(e) => updateDay((d) => ({ ...d, notes: e.target.value }))} placeholder="Day notes…" style={{ background: "#111", border: `1px solid ${border}`, color: "#888", padding: "7px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", flex: "1 1 240px" }} />
            {/* Day-type toggle. Sport swaps the whole editor for a short
                pane; everything else keeps the usual builder. */}
            <div role="radiogroup" aria-label="Day type" style={{ display: "flex", gap: 0, border: `1px solid ${border}`, borderRadius: 4, overflow: "hidden" }}>
              {(["strength", "sport"] as const).map((v) => {
                const active = (day.dayType ?? "strength") === v
                return (
                  <button
                    key={v}
                    role="radio"
                    aria-checked={active}
                    type="button"
                    onClick={() => updateDay((d) => (v === "sport"
                      ? { ...d, dayType: "sport" }
                      : { dayLabel: d.dayLabel, notes: d.notes, warmup: d.warmup ?? { notes: "", exercises: [] }, exercises: d.exercises ?? [], cooldown: d.cooldown ?? { notes: "", exercises: [] } }
                    ))}
                    style={{
                      background: active ? gold : "transparent",
                      color: active ? "#0a0a0a" : "#888",
                      border: "none",
                      padding: "7px 14px",
                      fontFamily: "var(--font-montserrat), sans-serif",
                      fontSize: "0.65rem",
                      fontWeight: active ? 700 : 500,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                    }}
                  >
                    {v}
                  </button>
                )
              })}
            </div>
            {day.dayType !== "sport" && (
              <button onClick={() => setShowWorkoutLibrary(true)} style={{ background: "none", border: `1px solid ${gold}`, color: gold, padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                + Insert from Library
              </button>
            )}
          </div>

          {day.dayType === "sport" ? (
            <div style={{ background: "#161616", border: `1px solid ${gold}`, borderLeft: `3px solid ${gold}`, padding: "14px 18px", borderRadius: 4, color: "#888", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", lineHeight: 1.6 }}>
              <p style={{ color: gold, margin: "0 0 6px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Sport day
              </p>
              <p style={{ margin: 0 }}>
                The client logs the sport, how long they played and how hard it felt. Your day notes show above their form. No warm-up, exercises or cool-down on this day.
              </p>
            </div>
          ) : (
            <>
              {/* Warmup */}
              <SequenceStatus
                kind="warmup" {...auto.stateFor(day, "warmup")} mode={autoMode}
                hasExercises={day.exercises.length > 0} showFlags
                onApply={(seq) => updateDay((d) => ({ ...d, warmup: seq }))}
                onKeep={() => updateDay((d) => ({ ...d, warmup: markManual(d.warmup ?? { notes: "", exercises: [] }) }))}
              />
              <WarmupCooldownSection
                key={`w-${activeWeek}-${activeDay}-${day.warmup?.exercises.length ?? 0}`}
                label="Warmup"
                data={day.warmup ?? { notes: "", exercises: [] }}
                onChange={(w) => updateDay((d) => ({ ...d, warmup: markManual({ ...d.warmup, ...w }) }))}
              />

              {/* Main workout */}
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: "22px 0 10px" }}>
                Main Workout
              </p>
              <WorkoutBuilder
                exercises={day.exercises}
                onChange={(exs) => updateDay((d) => ({ ...d, exercises: exs }))}
              />

              {/* Cooldown */}
              <div style={{ marginTop: 22 }}>
                <SequenceStatus
                  kind="cooldown" {...auto.stateFor(day, "cooldown")} mode={autoMode}
                  hasExercises={day.exercises.length > 0} showFlags={false}
                  onApply={(seq) => updateDay((d) => ({ ...d, cooldown: seq }))}
                  onKeep={() => updateDay((d) => ({ ...d, cooldown: markManual(d.cooldown ?? { notes: "", exercises: [] }) }))}
                />
              </div>
              <WarmupCooldownSection
                key={`c-${activeWeek}-${activeDay}-${day.cooldown?.exercises.length ?? 0}`}
                label="Cooldown"
                flush
                data={day.cooldown ?? { notes: "", exercises: [] }}
                onChange={(c) => updateDay((d) => ({ ...d, cooldown: markManual({ ...d.cooldown, ...c }) }))}
              />
            </>
          )}
        </div>
      )}

      <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: `1px solid ${border}`, display: "flex", gap: 12, alignItems: "center" }}>
        {error && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#e07070", margin: 0 }}>{error}</p>}
        <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#555" : gold, color: "#0a0a0a", border: "none", padding: "12px 28px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          {saving && <Spinner />}{saving ? "Saving…" : saved ? "Saved ✓" : "Save Program"}
        </button>
        <button onClick={() => router.push("/admin/coaching/programs")} style={{ background: "none", border: "none", color: "#555", padding: "12px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>Back</button>
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
