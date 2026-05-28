"use client"

import { useEffect, useState, useCallback } from "react"
import { generateClient } from "aws-amplify/data"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

type VideoRow = {
  id: string
  slug: string
  name: string
  url: string
  muscleGroups: string | null
  equipment: string | null
  tags: string | null
  isPublished: boolean
}

type S3VideoItem = {
  key: string
  slug: string
  name: string
  url: string
}

export default function AdminExercisesPage() {
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [indexing, setIndexing] = useState(false)
  const [indexResult, setIndexResult] = useState<string | null>(null)

  const loadVideos = useCallback(async () => {
    setLoading(true)
    const client = generateClient<Schema>({ authMode: "userPool" })
    const { data } = await client.models.ExerciseVideo.list({ authMode: "userPool" })
    setVideos(
      data
        .map((v) => ({
          id: v.id,
          slug: v.slug,
          name: v.name,
          url: v.url,
          muscleGroups: v.muscleGroups ?? null,
          equipment: v.equipment ?? null,
          tags: v.tags ?? null,
          isPublished: v.isPublished,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  async function handleIndexVideos() {
    setIndexing(true)
    setIndexResult(null)
    try {
      const res = await fetch("/api/admin/masterclass/index-videos")
      const data = await res.json() as { count: number; videos: S3VideoItem[]; error?: string }
      if (!res.ok || data.error) {
        setIndexResult(`Error: ${data.error ?? "Failed to scan S3"}`)
        return
      }

      const client = generateClient<Schema>({ authMode: "userPool" })
      const existing = new Set(videos.map((v) => v.slug))
      let created = 0

      for (const item of data.videos) {
        if (existing.has(item.slug)) continue
        await client.models.ExerciseVideo.create({
          slug: item.slug,
          name: item.name,
          s3Key: item.key,
          url: item.url,
          isPublished: true,
        })
        created++
      }

      setIndexResult(`Scanned ${data.count} S3 files: created ${created} new records, skipped ${data.count - created} already indexed.`)
      await loadVideos()
    } catch {
      setIndexResult("Error: Failed to index videos.")
    } finally {
      setIndexing(false)
    }
  }

  const filtered = videos.filter(
    (v) =>
      !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.slug.includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.35rem" }}>
            Exercise Library
          </h1>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#888" }}>
            {videos.length} videos indexed
          </p>
        </div>
        <button
          onClick={handleIndexVideos}
          disabled={indexing}
          style={{
            background: indexing ? "#222" : "#c9a96e",
            color: indexing ? "#666" : "#0a0a0a",
            border: "none",
            padding: "10px 20px",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: indexing ? "not-allowed" : "pointer",
          }}
        >
          {indexing ? "Scanning S3…" : "Index Videos from S3"}
        </button>
      </div>

      {indexResult && (
        <div style={{
          background: "#111",
          border: `1px solid ${border}`,
          borderRadius: 2,
          padding: "12px 16px",
          marginBottom: "1.5rem",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.7rem",
          color: indexResult.startsWith("Error") ? "#e07070" : gold,
        }}>
          {indexResult}
        </div>
      )}

      <input
        type="search"
        placeholder="Search by name or slug…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          background: "#161616",
          border: `1px solid ${border}`,
          color: "#f0e6d3",
          padding: "10px 14px",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.75rem",
          marginBottom: "1.5rem",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {loading ? (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555" }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555" }}>
          {search ? "No exercises match your search." : "No exercises indexed yet. Click \"Index Videos from S3\" to get started."}
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {filtered.map((v) => (
            <Link
              key={v.id}
              href={`/admin/masterclass/exercises/${v.slug}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "#111",
                  border: `1px solid ${border}`,
                  borderRadius: 2,
                  padding: "16px",
                  cursor: "pointer",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = gold)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = border)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <p style={{
                    margin: 0,
                    fontFamily: "var(--font-montserrat), sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "#f0e6d3",
                    lineHeight: 1.3,
                  }}>
                    {v.name}
                  </p>
                  <span style={{
                    fontSize: "0.55rem",
                    fontFamily: "var(--font-montserrat), sans-serif",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: v.isPublished ? "#4caf50" : "#888",
                    marginLeft: 8,
                    flexShrink: 0,
                  }}>
                    {v.isPublished ? "Live" : "Hidden"}
                  </span>
                </div>
                <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#555", letterSpacing: "0.05em" }}>
                  {v.slug}
                </p>
                {v.muscleGroups && (
                  <p style={{ margin: "6px 0 0", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#888" }}>
                    {(() => {
                      try {
                        const groups = JSON.parse(v.muscleGroups!) as string[]
                        return groups.join(", ")
                      } catch {
                        return v.muscleGroups
                      }
                    })()}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
