"use client"

import { useState, useEffect, useCallback, use } from "react"
import { generateClient } from "aws-amplify/data"
import { useRouter } from "next/navigation"
import type { Schema } from "@/lib/amplifyConfig"
import type { ExerciseInDay, DayData } from "../new/page.client"

const gold = "#c9a96e"
const border = "#2a2a2a"

// Re-use the same sub-components from the builder by importing them
// Since they're not exported individually, we inline a minimal edit version here

function ExerciseRow({
  ex, index, total, onChange, onRemove, onMove,
}: {
  ex: ExerciseInDay; index: number; total: number
  onChange: (u: ExerciseInDay) => void; onRemove: () => void; onMove: (d: -1 | 1) => void
}) {
  const f = { background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "7px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none", width: "100%", boxSizing: "border-box" as const }
  return (
    <div style={{ background: "#0e0e0e", border: `1px solid ${border}`, borderRadius: 2, padding: "14px 16px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#f0e6d3" }}>{ex.name}</p>
        <div style={{ display: "flex", gap: 6 }}>
          {[-1, 1].map((d) => {
            const disabled = d === -1 ? index === 0 : index === total - 1
            return <button key={d} onClick={() => onMove(d as -1 | 1)} disabled={disabled} style={{ background: "none", border: `1px solid ${border}`, color: disabled ? "#333" : "#888", width: 26, height: 26, cursor: disabled ? "default" : "pointer", fontSize: "0.7rem" }}>{d === -1 ? "↑" : "↓"}</button>
          })}
          <button onClick={onRemove} style={{ background: "none", border: "1px solid #3a2020", color: "#e07070", width: 26, height: 26, cursor: "pointer", fontSize: "0.75rem" }}>×</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
        {(["sets", "reps", "rest"] as const).map((field) => (
          <div key={field}>
            <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>{field}</label>
            <input value={ex[field]} onChange={(e) => onChange({ ...ex, [field]: e.target.value })} placeholder={field === "sets" ? "3" : field === "reps" ? "10–12" : "60s"} style={f} />
          </div>
        ))}
      </div>
      <div>
        <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", marginBottom: 4 }}>Note</label>
        <input value={ex.note} onChange={(e) => onChange({ ...ex, note: e.target.value })} placeholder="Optional coaching note" style={f} />
      </div>
    </div>
  )
}

type VideoOption = { id: string; slug: string; name: string; muscleGroups: string | null; equipment: string | null }

function ExerciseSearchModal({ onSelect, onClose }: { onSelect: (v: VideoOption) => void; onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [all, setAll] = useState<VideoOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    client.models.ExerciseVideo.list({ filter: { isPublished: { eq: true } }, authMode: "userPool" })
      .then(({ data }) => {
        setAll(data.map((v) => ({ id: v.id, slug: v.slug, name: v.name, muscleGroups: v.muscleGroups ?? null, equipment: v.equipment ?? null })).sort((a, b) => a.name.localeCompare(b.name)))
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [])

  const filtered = all.filter((v) => !query || v.name.toLowerCase().includes(query.toLowerCase()) || v.slug.includes(query.toLowerCase()))

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 2, width: "100%", maxWidth: 560, maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}` }}>
          <input autoFocus type="search" placeholder="Search exercise…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "10px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? <p style={{ padding: "1.5rem 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555" }}>Loading…</p> : filtered.map((v) => (
            <button key={v.id} onClick={() => onSelect(v)} style={{ display: "block", width: "100%", padding: "12px 20px", background: "none", border: "none", borderBottom: `1px solid ${border}`, textAlign: "left", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a1a")} onMouseLeave={(e) => (e.currentTarget.style.background = "none")}>
              <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#f0e6d3" }}>{v.name}</p>
            </button>
          ))}
        </div>
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${border}` }}>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${border}`, color: "#888", padding: "8px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function DayPanel({ day, onChange }: { day: DayData; onChange: (u: DayData) => void }) {
  const [showModal, setShowModal] = useState(false)

  function addExercise(v: VideoOption) {
    onChange({ ...day, exercises: [...day.exercises, { slug: v.slug, name: v.name, sets: "3", reps: "10–12", rest: "60s", note: "" }] })
    setShowModal(false)
  }

  return (
    <div>
      {day.exercises.map((ex, i) => (
        <ExerciseRow key={`${ex.slug}-${i}`} ex={ex} index={i} total={day.exercises.length}
          onChange={(u) => { const exs = [...day.exercises]; exs[i] = u; onChange({ ...day, exercises: exs }) }}
          onRemove={() => onChange({ ...day, exercises: day.exercises.filter((_, idx) => idx !== i) })}
          onMove={(d) => { const exs = [...day.exercises]; const j = i + d; if (j >= 0 && j < exs.length) { [exs[i], exs[j]] = [exs[j], exs[i]]; onChange({ ...day, exercises: exs }) } }}
        />
      ))}
      <button onClick={() => setShowModal(true)} style={{ background: "none", border: `1px dashed ${border}`, color: gold, width: "100%", padding: "10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>+ Add Exercise</button>
      {showModal && <ExerciseSearchModal onSelect={addExercise} onClose={() => setShowModal(false)} />}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────

export default function BlockEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [blockNumber, setBlockNumber] = useState(1)
  const [startDate, setStartDate] = useState("")
  const [days, setDays] = useState<DayData[]>([])
  const [activeDay, setActiveDay] = useState(0)
  const [isPublished, setIsPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    client.models.WorkoutBlock.get({ id }, { authMode: "userPool" })
      .then(({ data: b }) => {
        if (!b) return
        setTitle(b.title)
        setBlockNumber(b.blockNumber)
        setStartDate(b.startDate)
        setIsPublished(b.isPublished)
        try {
          const parsed = JSON.parse(b.days) as DayData[]
          setDays(parsed)
        } catch {
          setDays([{ dayLabel: "Day A", exercises: [] }, { dayLabel: "Day B", exercises: [] }, { dayLabel: "Day C", exercises: [] }])
        }
        setLoaded(true)
      }).catch(() => {})
  }, [id])

  const updateDay = useCallback((i: number, updated: DayData) => {
    setDays((prev) => { const next = [...prev]; next[i] = updated; return next })
  }, [])

  async function handleSave() {
    if (!title.trim() || !startDate) { setError("Title and start date are required."); return }
    setSaving(true)
    setError(null)
    try {
      const client = generateClient<Schema>({ authMode: "userPool" })
      await client.models.WorkoutBlock.update({ id, title: title.trim(), blockNumber, startDate, days: JSON.stringify(days), isPublished })
      router.push("/admin/masterclass/blocks")
    } catch {
      setError("Failed to save.")
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const client = generateClient<Schema>({ authMode: "userPool" })
      await client.models.WorkoutBlock.delete({ id })
      router.push("/admin/masterclass/blocks")
    } catch {
      setError("Failed to delete.")
      setDeleting(false)
    }
  }

  if (!loaded) return <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555" }}>Loading…</p>

  return (
    <div>
      <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em", cursor: "pointer", padding: 0, marginBottom: "1.5rem", display: "block" }}>← Blocks</button>

      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "2rem" }}>Edit Block</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 180px", gap: 16, marginBottom: "2rem" }}>
        {[
          { label: "Block Title", value: title, onChange: (v: string) => setTitle(v), placeholder: "Block 1: Foundation", type: "text" },
          { label: "Block #", value: String(blockNumber), onChange: (v: string) => setBlockNumber(Number(v)), placeholder: "", type: "number" },
          { label: "Start Date", value: startDate, onChange: (v: string) => setStartDate(v), placeholder: "", type: "date" },
        ].map(({ label, value, onChange, placeholder, type }) => (
          <div key={label}>
            <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} min={type === "number" ? 1 : undefined} style={{ width: "100%", background: "#161616", border: `1px solid ${border}`, color: "#f0e6d3", padding: "10px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
          </div>
        ))}
      </div>

      <div style={{ borderBottom: `1px solid ${border}`, marginBottom: "1.5rem", display: "flex" }}>
        {days.map((day, i) => (
          <button key={day.dayLabel} onClick={() => setActiveDay(i)} style={{ background: "none", border: "none", borderBottom: i === activeDay ? `2px solid ${gold}` : "2px solid transparent", color: i === activeDay ? gold : "#888", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", padding: "10px 20px", cursor: "pointer", marginBottom: -1 }}>
            {day.dayLabel} <span style={{ color: "#555", fontWeight: 400 }}>({day.exercises.length})</span>
          </button>
        ))}
      </div>

      {days[activeDay] && <DayPanel day={days[activeDay]} onChange={(u) => updateDay(activeDay, u)} />}

      <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setIsPublished(!isPublished)} style={{ width: 44, height: 24, borderRadius: 12, background: isPublished ? gold : "#2a2a2a", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
          <span style={{ position: "absolute", top: 3, left: isPublished ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: isPublished ? "#0a0a0a" : "#888", transition: "left 0.2s" }} />
        </button>
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: isPublished ? "#f0e6d3" : "#555" }}>{isPublished ? "Published" : "Draft"}</span>
      </div>

      {error && <p style={{ color: "#e07070", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", marginTop: 12 }}>{error}</p>}

      <div style={{ marginTop: "2rem", display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={handleSave} disabled={saving} style={{ background: saving ? "#333" : gold, color: saving ? "#888" : "#0a0a0a", border: "none", padding: "13px 28px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving…" : "Save Changes"}</button>
        <button onClick={handleDelete} disabled={deleting} style={{ background: "none", border: "1px solid #3a2020", color: "#e07070", padding: "13px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", cursor: deleting ? "not-allowed" : "pointer" }}>{deleting ? "Deleting…" : "Delete Block"}</button>
      </div>
    </div>
  )
}
