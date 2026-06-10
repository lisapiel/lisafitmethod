"use client"

import { useState } from "react"
import { generateClient } from "aws-amplify/data"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

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
}

const EMPTY: FormState = {
  name: "", videoS3Key: "", thumbnailS3Key: "", primaryMuscle: "",
  secondaryMuscles: [], equipment: [], category: "",
  difficulty: "", movementPattern: "", setup: "", execution: "",
  coachingCues: "", commonMistakes: "", notes: "",
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
            <button key={opt} type="button" onClick={() => toggle(opt)} style={{ background: active ? gold : "#111", border: `1px solid ${active ? gold : border}`, color: active ? "#0a0a0a" : "#888", padding: "5px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: active ? 700 : 400, letterSpacing: "0.08em", cursor: "pointer" }}>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ width: 18, height: 18, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function NewExercisePage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const set = (key: keyof FormState) => (val: FormState[keyof FormState]) =>
    setForm((f) => ({ ...f, [key]: val }))

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required"); return }
    setSaving(true); setError("")
    const client = generateClient<Schema>({ authMode: "userPool" })
    try {
      const { data: created } = await client.models.Exercise.create({
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
        status: "ACTIVE",
      })
      if (created?.id) router.push(`/admin/coaching/exercises/${created.id}`)
    } catch {
      setError("Failed to create exercise. Please try again.")
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/admin/coaching/exercises" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", textDecoration: "none", letterSpacing: "0.08em" }}>
          ← Exercises
        </Link>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, color: "#f0e6d3", margin: 0 }}>Add Exercise</h1>
      </div>

      <div style={{ display: "grid", gap: "1.5rem" }}>
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
          <TextArea value={form.notes} onChange={set("notes") as (v: string) => void} placeholder="Any additional notes…" rows={3} />
        </div>

        {error && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#e07070" }}>{error}</p>}

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ background: saving ? "#555" : gold, color: "#0a0a0a", border: "none", padding: "12px 28px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
          >
            {saving && <Spinner />}
            {saving ? "Creating…" : "Create Exercise"}
          </button>
          <button onClick={() => router.push("/admin/coaching/exercises")} style={{ background: "none", border: "none", color: "#555", padding: "12px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
