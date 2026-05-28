"use client"

import { useEffect, useState, use } from "react"
import { generateClient } from "aws-amplify/data"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

const MUSCLE_GROUPS = ["glutes", "hamstrings", "quads", "calves", "hip flexors", "adductors", "abductors", "chest", "back", "shoulders", "biceps", "triceps", "core", "full body"]
const EQUIPMENT_OPTIONS = ["bodyweight", "dumbbell", "barbell", "resistance band", "cable", "machine", "bench", "pull-up bar", "kettlebell"]

type VideoRecord = {
  id: string
  slug: string
  name: string
  url: string
  s3Key: string
  durationSeconds: number | null
  muscleGroups: string | null
  equipment: string | null
  tags: string | null
  isPublished: boolean
}

export default function ExerciseEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const [video, setVideo] = useState<VideoRecord | null>(null)
  const [name, setName] = useState("")
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([])
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [tags, setTags] = useState("")
  const [isPublished, setIsPublished] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    client.models.ExerciseVideo.list({
      filter: { slug: { eq: slug } },
      authMode: "userPool",
    }).then(({ data }) => {
      const v = data[0]
      if (!v) return
      setVideo({
        id: v.id,
        slug: v.slug,
        name: v.name,
        url: v.url,
        s3Key: v.s3Key,
        durationSeconds: v.durationSeconds ?? null,
        muscleGroups: v.muscleGroups ?? null,
        equipment: v.equipment ?? null,
        tags: v.tags ?? null,
        isPublished: v.isPublished,
      })
      setName(v.name)
      try { setSelectedMuscles(JSON.parse(v.muscleGroups ?? "[]") as string[]) } catch { setSelectedMuscles([]) }
      try { setSelectedEquipment(JSON.parse(v.equipment ?? "[]") as string[]) } catch { setSelectedEquipment([]) }
      try { setTags((JSON.parse(v.tags ?? "[]") as string[]).join(", ")) } catch { setTags("") }
      setIsPublished(v.isPublished)
    }).catch(() => {})
  }, [slug])

  function toggleItem(list: string[], item: string, setter: (v: string[]) => void) {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item])
  }

  async function handleSave() {
    if (!video) return
    setSaving(true)
    setSaved(false)
    const client = generateClient<Schema>({ authMode: "userPool" })
    const tagsArray = tags.split(",").map((t) => t.trim()).filter(Boolean)
    await client.models.ExerciseVideo.update({
      id: video.id,
      name: name.trim() || video.name,
      muscleGroups: JSON.stringify(selectedMuscles),
      equipment: JSON.stringify(selectedEquipment),
      tags: JSON.stringify(tagsArray),
      isPublished,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!video) {
    return (
      <div style={{ color: "#888", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem" }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <Link href="/admin/masterclass/exercises" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#555", textDecoration: "none", letterSpacing: "0.1em" }}>
          ← Exercise Library
        </Link>
      </div>

      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.25rem" }}>
        {video.name}
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#555", marginBottom: "2rem" }}>
        {video.slug}
      </p>

      {/* Video preview */}
      {video.url && (
        <div style={{ marginBottom: "2rem", background: "#111", border: `1px solid ${border}`, borderRadius: 2, overflow: "hidden" }}>
          <video
            src={video.url}
            controls
            playsInline
            muted
            style={{ width: "100%", display: "block", maxHeight: 300 }}
          />
        </div>
      )}

      {/* Name */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>
          Display Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
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

      {/* Muscle groups */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 10 }}>
          Muscle Groups
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {MUSCLE_GROUPS.map((m) => {
            const active = selectedMuscles.includes(m)
            return (
              <button
                key={m}
                onClick={() => toggleItem(selectedMuscles, m, setSelectedMuscles)}
                style={{
                  padding: "5px 12px",
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.6rem",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background: active ? "#c9a96e" : "#161616",
                  color: active ? "#0a0a0a" : "#888",
                  border: `1px solid ${active ? gold : border}`,
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {m}
              </button>
            )
          })}
        </div>
      </div>

      {/* Equipment */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 10 }}>
          Equipment
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EQUIPMENT_OPTIONS.map((eq) => {
            const active = selectedEquipment.includes(eq)
            return (
              <button
                key={eq}
                onClick={() => toggleItem(selectedEquipment, eq, setSelectedEquipment)}
                style={{
                  padding: "5px 12px",
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.6rem",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background: active ? "#c9a96e" : "#161616",
                  color: active ? "#0a0a0a" : "#888",
                  border: `1px solid ${active ? gold : border}`,
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {eq}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tags */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 8 }}>
          Tags (comma-separated)
        </label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. lower, compound, hinge"
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
          }}
        />
      </div>

      {/* Published toggle */}
      <div style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => setIsPublished(!isPublished)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: isPublished ? gold : "#2a2a2a",
            border: "none",
            cursor: "pointer",
            position: "relative",
            transition: "background 0.2s",
            flexShrink: 0,
          }}
        >
          <span style={{
            position: "absolute",
            top: 3,
            left: isPublished ? 22 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: isPublished ? "#0a0a0a" : "#888",
            transition: "left 0.2s",
          }} />
        </button>
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: isPublished ? "#f0e6d3" : "#555" }}>
          {isPublished ? "Published — visible in program builder" : "Hidden — not available in program builder"}
        </span>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? "#333" : gold,
            color: saving ? "#888" : "#0a0a0a",
            border: "none",
            padding: "12px 28px",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </button>
        <button
          onClick={() => router.push("/admin/masterclass/exercises")}
          style={{
            background: "none",
            border: `1px solid ${border}`,
            color: "#888",
            padding: "12px 20px",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.65rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
