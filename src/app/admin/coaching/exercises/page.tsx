"use client"

import { useState, useEffect, useRef } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import Link from "next/link"
import type { ScannedExercise } from "@/app/api/admin/coaching/exercises/scan/route"

const gold = "#c9a96e"
const border = "#2a2a2a"
const CDN = process.env.NEXT_PUBLIC_AMBRISA_CDN_URL ?? ""

const CATEGORIES = ["All", "Glutes", "Quads", "Hamstrings", "Back", "Chest", "Shoulders", "Biceps", "Triceps", "Core", "Full Body", "Mobility", "Warm-up", "Cardio"]
const EQUIPMENT = ["All", "Dumbbells", "Barbell", "Smith Machine", "Cable", "Machine", "Bench", "Bands", "Kettlebell", "Bodyweight", "Cardio Machine", "Other"]
const DIFFICULTIES = ["All", "BEGINNER", "INTERMEDIATE", "ADVANCED"]

type Exercise = {
  id: string
  name: string
  videoS3Key: string | null
  thumbnailS3Key: string | null
  primaryMuscle: string | null
  category: string | null
  equipment: string | null
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | null
  status: "ACTIVE" | "INACTIVE" | null
}

function cdnUrl(key: string | null | undefined): string {
  if (!key) return ""
  return `${CDN}/${encodeURIComponent(key)}`
}

function VideoPreviewModal({ videoKey, name, onClose }: { videoKey: string; name: string; onClose: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}
    >
      <div style={{ maxWidth: 640, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.2rem", color: "#f0e6d3", marginBottom: "0.75rem" }}>{name}</p>
        <video
          src={cdnUrl(videoKey)}
          controls
          autoPlay
          style={{ width: "100%", borderRadius: 2, background: "#000" }}
        />
        <button
          onClick={onClose}
          style={{ marginTop: 12, background: "none", border: `1px solid ${border}`, color: "#888", padding: "8px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [phase, setPhase] = useState<"idle" | "scanning" | "preview" | "importing" | "done">("idle")
  const [exercises, setExercises] = useState<ScannedExercise[]>([])
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [error, setError] = useState("")
  const abortRef = useRef(false)

  async function startScan() {
    setPhase("scanning")
    setError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      const res = await fetch("/api/admin/coaching/exercises/scan", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json() as { exercises: ScannedExercise[]; total: number }
      setExercises(data.exercises)
      setPhase("preview")
    } catch {
      setError("Failed to scan S3 bucket. Check your AWS credentials.")
      setPhase("idle")
    }
  }

  async function runImport() {
    setPhase("importing")
    setProgress({ done: 0, total: exercises.length })
    abortRef.current = false

    const session = await fetchAuthSession()
    const token = session.tokens?.accessToken?.toString()
    if (!token) { setPhase("idle"); setError("Not authenticated"); return }

    const BATCH = 25
    for (let i = 0; i < exercises.length; i += BATCH) {
      if (abortRef.current) break
      const batch = exercises.slice(i, i + BATCH).map((ex) => ({
        name: ex.name,
        videoS3Key: ex.videoS3Key,
        thumbnailS3Key: ex.thumbnailS3Key,
      }))
      await fetch("/api/admin/coaching/exercises/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ exercises: batch }),
      })
      setProgress({ done: Math.min(i + BATCH, exercises.length), total: exercises.length })
    }
    setPhase("done")
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={phase === "idle" ? onClose : undefined}>
      <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 2, width: "100%", maxWidth: 560, maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${border}` }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 300, color: "#f0e6d3", margin: 0 }}>Import Exercise Library</p>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", margin: "4px 0 0" }}>Scans the Ambrisa S3 bucket and creates Exercise records. Prioritises your F (female) videos.</p>
        </div>

        <div style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
          {phase === "idle" && (
            <div>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", lineHeight: 1.6, marginBottom: 20 }}>
                This will scan <strong style={{ color: "#f0e6d3" }}>ambrisa-video-preset-s3-final</strong> and create an Exercise record for each unique exercise (~490 exercises). It won&apos;t overwrite exercises that already exist — you can run it again safely.
              </p>
              {error && <p style={{ color: "#e07070", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", marginBottom: 12 }}>{error}</p>}
              <button onClick={startScan} style={{ background: gold, color: "#0a0a0a", border: "none", padding: "11px 24px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>
                Scan S3 Bucket →
              </button>
            </div>
          )}

          {phase === "scanning" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Spinner />
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888" }}>Scanning S3…</p>
            </div>
          )}

          {phase === "preview" && (
            <div>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginBottom: 8 }}>
                Found <strong style={{ color: gold }}>{exercises.length} unique exercises</strong>. Click Import to create them all.
              </p>
              <div style={{ background: "#111", border: `1px solid ${border}`, maxHeight: 200, overflowY: "auto", marginBottom: 16 }}>
                {exercises.slice(0, 30).map((ex) => (
                  <div key={ex.name} style={{ padding: "6px 12px", borderBottom: `1px solid #1a1a1a`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#f0e6d3" }}>{ex.name}</span>
                    {ex.hasFVersion && <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: gold, letterSpacing: "0.1em" }}>F</span>}
                  </div>
                ))}
                {exercises.length > 30 && (
                  <p style={{ padding: "6px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#555" }}>…and {exercises.length - 30} more</p>
                )}
              </div>
              <button onClick={runImport} style={{ background: gold, color: "#0a0a0a", border: "none", padding: "11px 24px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>
                Import All {exercises.length} Exercises →
              </button>
            </div>
          )}

          {phase === "importing" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <Spinner />
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888" }}>
                  Importing… {progress.done} / {progress.total}
                </p>
              </div>
              <div style={{ background: "#111", border: `1px solid ${border}`, borderRadius: 2, height: 6 }}>
                <div style={{ background: gold, height: "100%", borderRadius: 2, width: `${(progress.done / progress.total) * 100}%`, transition: "width 0.3s" }} />
              </div>
            </div>
          )}

          {phase === "done" && (
            <div>
              <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", color: gold, marginBottom: 8 }}>✓ Import complete</p>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", marginBottom: 20 }}>
                {progress.total} exercises are now in your library. You can edit each one to add muscle groups, equipment, coaching cues and more.
              </p>
              <button onClick={onDone} style={{ background: gold, color: "#0a0a0a", border: "none", padding: "11px 24px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>
                View Library →
              </button>
            </div>
          )}
        </div>

        {phase !== "done" && phase !== "importing" && (
          <div style={{ padding: "16px 24px", borderTop: `1px solid ${border}` }}>
            <button onClick={onClose} style={{ background: "none", border: `1px solid ${border}`, color: "#888", padding: "8px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ width: 18, height: 18, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", flexShrink: 0, animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function CoachingExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [catFilter, setCatFilter] = useState("All")
  const [equipFilter, setEquipFilter] = useState("All")
  const [diffFilter, setDiffFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INACTIVE" | "All">("ACTIVE")
  const [previewVideo, setPreviewVideo] = useState<{ key: string; name: string } | null>(null)
  const [showImport, setShowImport] = useState(false)

  async function load() {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) { setLoading(false); return }
      const res = await fetch("/api/admin/coaching/exercises", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setExercises(
          (data.exercises ?? []).map((e: Record<string, unknown>) => ({
            id: e.id as string,
            name: e.name as string,
            videoS3Key: (e.videoS3Key as string | null) ?? null,
            thumbnailS3Key: (e.thumbnailS3Key as string | null) ?? null,
            primaryMuscle: (e.primaryMuscle as string | null) ?? null,
            category: (e.category as string | null) ?? null,
            equipment: (e.equipment as string | null) ?? null,
            difficulty: (e.difficulty as Exercise["difficulty"]) ?? null,
            status: (e.status as Exercise["status"]) ?? null,
          }))
        )
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = exercises.filter((e) => {
    if (statusFilter !== "All" && e.status !== statusFilter) return false
    if (catFilter !== "All" && e.category !== catFilter) return false
    if (equipFilter !== "All") {
      const eqs: string[] = (() => { try { return JSON.parse(e.equipment ?? "[]") as string[] } catch { return [] } })()
      if (!eqs.includes(equipFilter)) return false
    }
    if (diffFilter !== "All" && e.difficulty !== diffFilter) return false
    if (query && !e.name.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.25rem" }}>Exercise Library</h1>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#888" }}>
            {loading ? "Loading…" : `${exercises.filter((e) => e.status !== "INACTIVE").length} active exercises`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowImport(true)}
            style={{ background: "none", border: `1px solid ${border}`, color: "#888", padding: "9px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Import from S3
          </button>
          <Link
            href="/admin/coaching/exercises/new"
            style={{ display: "inline-block", background: gold, color: "#0a0a0a", padding: "9px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}
          >
            + Add Exercise
          </Link>
        </div>
      </div>

      {/* Search + filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: "1.5rem" }}>
        <input
          type="search"
          placeholder="Search exercises…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: "1 1 200px", background: "#161616", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", minWidth: 180 }}
        />
        <FilterSelect label="Category" value={catFilter} options={CATEGORIES} onChange={setCatFilter} />
        <FilterSelect label="Equipment" value={equipFilter} options={EQUIPMENT} onChange={setEquipFilter} />
        <FilterSelect label="Difficulty" value={diffFilter} options={DIFFICULTIES} onChange={setDiffFilter} />
        <FilterSelect label="Status" value={statusFilter} options={["ACTIVE", "INACTIVE", "All"]} onChange={(v) => setStatusFilter(v as typeof statusFilter)} />
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "3rem 0", color: "#555" }}>
          <Spinner />
          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem" }}>Loading exercises…</span>
        </div>
      ) : exercises.length === 0 ? (
        <div style={{ background: "#111", border: `1px solid ${border}`, padding: "3rem 2rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", color: "#444", marginBottom: 8 }}>No exercises yet</p>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555", marginBottom: 20 }}>
            Import your 490 exercises from S3 to get started, or add them manually.
          </p>
          <button
            onClick={() => setShowImport(true)}
            style={{ background: gold, color: "#0a0a0a", border: "none", padding: "12px 24px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Import from S3 →
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555", padding: "2rem 0" }}>No exercises match your filters.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {filtered.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onPreview={() => ex.videoS3Key && setPreviewVideo({ key: ex.videoS3Key, name: ex.name })}
            />
          ))}
        </div>
      )}

      {previewVideo && (
        <VideoPreviewModal videoKey={previewVideo.key} name={previewVideo.name} onClose={() => setPreviewVideo(null)} />
      )}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onDone={() => { setShowImport(false); load() }} />
      )}
    </div>
  )
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ background: "#161616", border: `1px solid ${border}`, color: value === "All" ? "#555" : "#f0e6d3", padding: "9px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", outline: "none", cursor: "pointer" }}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o === "All" ? label : o}</option>
      ))}
    </select>
  )
}

function ExerciseCard({ exercise: ex, onPreview }: { exercise: Exercise; onPreview: () => void }) {
  const thumb = cdnUrl(ex.thumbnailS3Key)
  const inactive = ex.status === "INACTIVE"

  return (
    <div style={{ background: "#111", border: `1px solid ${border}`, opacity: inactive ? 0.5 : 1, position: "relative" }}>
      {/* Thumbnail */}
      <div
        style={{ height: 140, background: "#0a0a0a", overflow: "hidden", position: "relative", cursor: ex.videoS3Key ? "pointer" : "default" }}
        onClick={onPreview}
      >
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={ex.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#333" }}>No video</span>
          </div>
        )}
        {ex.videoS3Key && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 2.5l8 4.5-8 4.5V2.5Z" fill="#f0e6d3" /></svg>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "12px 14px" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#f0e6d3", marginBottom: 4, lineHeight: 1.3 }}>
          {ex.name}
        </p>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#555", marginBottom: 10 }}>
          {ex.primaryMuscle ?? ex.category ?? "Uncategorised"}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href={`/admin/coaching/exercises/${ex.id}`}
            style={{ flex: 1, textAlign: "center", background: "none", border: `1px solid ${border}`, color: gold, padding: "6px 0", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  )
}
