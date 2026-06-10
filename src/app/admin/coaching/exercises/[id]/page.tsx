"use client"

import { useState, useEffect } from "react"
import { generateClient } from "aws-amplify/data"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"
const CDN = process.env.NEXT_PUBLIC_AMBRISA_CDN_URL ?? ""

const CATEGORIES = ["Glutes", "Quads", "Hamstrings", "Back", "Chest", "Shoulders", "Biceps", "Triceps", "Core", "Full Body", "Mobility", "Warm-up", "Cardio"]
const MUSCLE_GROUPS = ["Glutes", "Quads", "Hamstrings", "Hip Flexors", "Calves", "Back", "Lats", "Traps", "Chest", "Shoulders", "Front Delt", "Side Delt", "Rear Delt", "Biceps", "Triceps", "Core", "Abs", "Obliques", "Lower Back"]
const EQUIPMENT_OPTIONS = ["Dumbbells", "Barbell", "Smith Machine", "Cable", "Machine", "Bench", "Bands", "Kettlebell", "Bodyweight", "Cardio Machine", "Other"]

type FormState = {
  name: string
  videoS3Key: string
  thumbnailS3Key: string
  primaryMuscle: string
  secondaryMuscles: string[]
  equipment: string[]
  category: string
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | ""
  movementPattern: string
  setup: string
  execution: string
  coachingCues: string
  commonMistakes: string
  notes: string
  status: "ACTIVE" | "INACTIVE"
}

const EMPTY: FormState = {
  name: "", videoS3Key: "", thumbnailS3Key: "", primaryMuscle: "",
  secondaryMuscles: [], equipment: [], category: "",
  difficulty: "", movementPattern: "", setup: "", execution: "",
  coachingCues: "", commonMistakes: "", notes: "", status: "ACTIVE",
}

function cdnUrl(key: string) {
  return `${CDN}/${encodeURIComponent(key)}`
}

function Spinner() {
  return (
    <div style={{ width: 18, height: 18, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: 6 }}>{children}</label>
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }}
    />
  )
}

function TextArea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", resize: "vertical", boxSizing: "border-box" }}
    />
  )
}

function MultiSelect({ label, options, selected, onChange }: { label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (v: string) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              style={{ background: active ? gold : "#111", border: `1px solid ${active ? gold : border}`, color: active ? "#0a0a0a" : "#888", padding: "5px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: active ? 700 : 400, letterSpacing: "0.08em", cursor: "pointer" }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function EditExercisePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    client.models.Exercise.get({ id }).then(({ data }) => {
      if (!data) { setLoading(false); return }
      setForm({
        name: data.name,
        videoS3Key: data.videoS3Key ?? "",
        thumbnailS3Key: data.thumbnailS3Key ?? "",
        primaryMuscle: data.primaryMuscle ?? "",
        secondaryMuscles: (() => { try { return JSON.parse(data.secondaryMuscles ?? "[]") as string[] } catch { return [] } })(),
        equipment: (() => { try { return JSON.parse(data.equipment ?? "[]") as string[] } catch { return [] } })(),
        category: data.category ?? "",
        difficulty: data.difficulty ?? "",
        movementPattern: data.movementPattern ?? "",
        setup: data.setup ?? "",
        execution: data.execution ?? "",
        coachingCues: (() => { try { return (JSON.parse(data.coachingCues ?? "[]") as string[]).join("\n") } catch { return data.coachingCues ?? "" } })(),
        commonMistakes: (() => { try { return (JSON.parse(data.commonMistakes ?? "[]") as string[]).join("\n") } catch { return data.commonMistakes ?? "" } })(),
        notes: data.notes ?? "",
        status: data.status ?? "ACTIVE",
      })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required"); return }
    setSaving(true); setError("")
    const client = generateClient<Schema>({ authMode: "userPool" })
    try {
      await client.models.Exercise.update({
        id,
        name: form.name.trim(),
        videoS3Key: form.videoS3Key || undefined,
        thumbnailS3Key: form.thumbnailS3Key || undefined,
        primaryMuscle: form.primaryMuscle || undefined,
        secondaryMuscles: form.secondaryMuscles.length ? JSON.stringify(form.secondaryMuscles) : undefined,
        equipment: form.equipment.length ? JSON.stringify(form.equipment) : undefined,
        category: form.category || undefined,
        difficulty: form.difficulty || undefined,
        movementPattern: form.movementPattern || undefined,
        setup: form.setup || undefined,
        execution: form.execution || undefined,
        coachingCues: form.coachingCues ? JSON.stringify(form.coachingCues.split("\n").map((l) => l.trim()).filter(Boolean)) : undefined,
        commonMistakes: form.commonMistakes ? JSON.stringify(form.commonMistakes.split("\n").map((l) => l.trim()).filter(Boolean)) : undefined,
        notes: form.notes || undefined,
        status: form.status,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Failed to save. Please try again.")
    }
    setSaving(false)
  }

  async function handleDeactivate() {
    const client = generateClient<Schema>({ authMode: "userPool" })
    await client.models.Exercise.update({ id, status: form.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })
    setForm((f) => ({ ...f, status: f.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }))
  }

  const set = (key: keyof FormState) => (val: FormState[keyof FormState]) =>
    setForm((f) => ({ ...f, [key]: val }))

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "3rem", color: "#555" }}>
        <Spinner />
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem" }}>Loading exercise…</span>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/admin/coaching/exercises" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", textDecoration: "none", letterSpacing: "0.08em" }}>
          ← Exercises
        </Link>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, color: "#f0e6d3", margin: 0 }}>
          {form.name || "Edit Exercise"}
        </h1>
        {form.status === "INACTIVE" && (
          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#888", border: "1px solid #333", padding: "3px 8px", letterSpacing: "0.1em" }}>INACTIVE</span>
        )}
      </div>

      {/* Video preview */}
      {form.videoS3Key && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div
            style={{ height: 180, background: "#0a0a0a", overflow: "hidden", position: "relative", cursor: "pointer", maxWidth: 320 }}
            onClick={() => setShowVideo(true)}
          >
            {form.thumbnailS3Key && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cdnUrl(form.thumbnailS3Key)} alt={form.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            )}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 2.5l10 5.5-10 5.5V2.5Z" fill="#f0e6d3" /></svg>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: "1.5rem" }}>
        {/* Name */}
        <div>
          <FieldLabel>Exercise Name *</FieldLabel>
          <TextInput value={form.name} onChange={set("name") as (v: string) => void} placeholder="e.g. Romanian Deadlift" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <FieldLabel>S3 Video Key</FieldLabel>
            <TextInput value={form.videoS3Key} onChange={set("videoS3Key") as (v: string) => void} placeholder="Exercise Name F.mp4" />
          </div>
          <div>
            <FieldLabel>S3 Thumbnail Key</FieldLabel>
            <TextInput value={form.thumbnailS3Key} onChange={set("thumbnailS3Key") as (v: string) => void} placeholder="Exercise Name F.jpg" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
          <div>
            <FieldLabel>Primary Muscle</FieldLabel>
            <select value={form.primaryMuscle} onChange={(e) => set("primaryMuscle")(e.target.value)} style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none" }}>
              <option value="">Select…</option>
              {MUSCLE_GROUPS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Category</FieldLabel>
            <select value={form.category} onChange={(e) => set("category")(e.target.value)} style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none" }}>
              <option value="">Select…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Difficulty</FieldLabel>
            <select value={form.difficulty} onChange={(e) => set("difficulty")(e.target.value as FormState["difficulty"])} style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none" }}>
              <option value="">Select…</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
        </div>

        <MultiSelect label="Equipment" options={EQUIPMENT_OPTIONS} selected={form.equipment} onChange={set("equipment") as (v: string[]) => void} />
        <MultiSelect label="Secondary Muscles" options={MUSCLE_GROUPS} selected={form.secondaryMuscles} onChange={set("secondaryMuscles") as (v: string[]) => void} />

        <div>
          <FieldLabel>Movement Pattern</FieldLabel>
          <TextInput value={form.movementPattern} onChange={set("movementPattern") as (v: string) => void} placeholder="e.g. Hip hinge, Vertical push" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <FieldLabel>Setup</FieldLabel>
            <TextArea value={form.setup} onChange={set("setup") as (v: string) => void} placeholder="How to set up for this exercise…" rows={4} />
          </div>
          <div>
            <FieldLabel>Execution</FieldLabel>
            <TextArea value={form.execution} onChange={set("execution") as (v: string) => void} placeholder="How to perform the movement…" rows={4} />
          </div>
        </div>

        <div>
          <FieldLabel>Coaching Cues (one per line)</FieldLabel>
          <TextArea value={form.coachingCues} onChange={set("coachingCues") as (v: string) => void} placeholder={"Drive through your heel\nKeep your chest tall\nSqueeze at the top"} rows={4} />
        </div>

        <div>
          <FieldLabel>Common Mistakes (one per line)</FieldLabel>
          <TextArea value={form.commonMistakes} onChange={set("commonMistakes") as (v: string) => void} placeholder={"Knees caving in\nRounding lower back"} rows={3} />
        </div>

        <div>
          <FieldLabel>Notes</FieldLabel>
          <TextArea value={form.notes} onChange={set("notes") as (v: string) => void} placeholder="Any additional notes for this exercise…" rows={3} />
        </div>

        {error && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#e07070" }}>{error}</p>}

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: saving ? "#555" : gold, color: "#0a0a0a", border: "none", padding: "12px 28px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            {saving && <Spinner />}
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
          </button>
          <button
            onClick={handleDeactivate}
            style={{ background: "none", border: `1px solid ${border}`, color: "#888", padding: "12px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
          >
            {form.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
          </button>
          <button
            onClick={() => router.push("/admin/coaching/exercises")}
            style={{ background: "none", border: "none", color: "#555", padding: "12px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </div>

      {showVideo && form.videoS3Key && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowVideo(false)}>
          <div style={{ maxWidth: 640, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.2rem", color: "#f0e6d3", marginBottom: "0.75rem" }}>{form.name}</p>
            <video src={cdnUrl(form.videoS3Key)} controls autoPlay style={{ width: "100%", borderRadius: 2, background: "#000" }} />
          </div>
        </div>
      )}
    </div>
  )
}
