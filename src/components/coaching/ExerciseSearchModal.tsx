"use client"

import { useState, useEffect } from "react"
import { fetchAuthSession } from "aws-amplify/auth"

const gold = "#c9a96e"
const border = "#2a2a2a"

export type SearchExercise = {
  id: string
  name: string
  videoS3Key: string | null
  thumbnailS3Key: string | null
  primaryMuscle: string | null
  category: string | null
}

const CDN = process.env.NEXT_PUBLIC_AMBRISA_CDN_URL ?? ""
function cdnThumb(key: string | null | undefined) {
  if (!key) return ""
  return `${CDN}/${encodeURIComponent(key.replace(/\.mp4$/i, ".jpg"))}`
}

function Spinner() {
  return (
    <div style={{ width: 16, height: 16, border: "2px solid #333", borderTop: `2px solid ${gold}`, borderRadius: "50%", flexShrink: 0, animation: "spin 0.7s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function ExerciseSearchModal({ onSelect, onClose, title }: {
  onSelect: (ex: SearchExercise) => void
  onClose: () => void
  title?: string
}) {
  const [query, setQuery] = useState("")
  const [exercises, setExercises] = useState<SearchExercise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()
        if (!token) return
        const res = await fetch("/api/admin/coaching/exercises", { headers: { Authorization: `Bearer ${token}` } })
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

  const filtered = query.length < 2 ? exercises.slice(0, 100) : exercises.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 2, width: "100%", maxWidth: 520, maxHeight: "80vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}` }}>
          {title && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: gold, marginBottom: 8, letterSpacing: "0.12em", textTransform: "uppercase" }}>{title}</p>}
          <input autoFocus type="search" placeholder="Search exercises…" value={query} onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", background: "#111", border: `1px solid ${border}`, color: "#f0e6d3", padding: "9px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 20, color: "#555" }}><Spinner /><span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem" }}>Loading exercises…</span></div>
          ) : filtered.length === 0 ? (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555", padding: "16px 20px" }}>No exercises found.</p>
          ) : filtered.map((ex) => (
            <button key={ex.id} onClick={() => { onSelect(ex); onClose() }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", background: "none", border: "none", borderBottom: `1px solid #1a1a1a`, cursor: "pointer", textAlign: "left" }}>
              {ex.thumbnailS3Key && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cdnThumb(ex.thumbnailS3Key)} alt="" style={{ width: 40, height: 40, objectFit: "cover", flexShrink: 0, background: "#0a0a0a" }} />
              )}
              <div>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#f0e6d3", margin: 0 }}>{ex.name}</p>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#555", margin: 0 }}>{ex.primaryMuscle ?? ex.category ?? ""}</p>
              </div>
            </button>
          ))}
        </div>
        <div style={{ padding: "12px 20px", borderTop: `1px solid ${border}` }}>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${border}`, color: "#666", padding: "7px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
