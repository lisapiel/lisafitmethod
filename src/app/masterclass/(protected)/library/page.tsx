"use client"

import { useState, useEffect } from "react"
import { generateClient } from "aws-amplify/data"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

type Block = {
  id: string
  title: string
  blockNumber: number
  startDate: string
  exerciseCount: number
}

export default function LibraryPage() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    const today = new Date().toISOString().split("T")[0]

    client.models.WorkoutBlock.list({
      filter: { and: [{ isPublished: { eq: true } }, { startDate: { le: today } }] },
      authMode: "userPool",
    }).then(({ data }) => {
      const sorted = [...data]
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, 6) // last 6 blocks accessible

      setBlocks(sorted.map((b) => {
        let count = 0
        try {
          const days = JSON.parse(b.days) as { exercises: unknown[] }[]
          count = days.reduce((s, d) => s + d.exercises.length, 0)
        } catch { /* ignore */ }
        return { id: b.id, title: b.title, blockNumber: b.blockNumber, startDate: b.startDate, exerciseCount: count }
      }))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ padding: "3rem 2rem", display: "flex", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: "2rem 2rem 4rem", maxWidth: 760 }}>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.5rem" }}>
        Block Library
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555", marginBottom: "2.5rem" }}>
        Previous workout blocks. All exercises accessible anytime.
      </p>

      {blocks.length === 0 ? (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555" }}>
          No previous blocks yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {blocks.map((b, i) => (
            <Link key={b.id} href={`/masterclass/block/${b.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: "#111",
                border: `1px solid ${border}`,
                borderRadius: 2,
                padding: "20px 24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "border-color 0.15s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = gold)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = border)}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    {i === 0 && (
                      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: gold, background: "rgba(201,169,110,0.1)", padding: "2px 8px", borderRadius: 2 }}>
                        Current
                      </span>
                    )}
                    <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555" }}>
                      Block {b.blockNumber}
                    </p>
                  </div>
                  <p style={{ margin: 0, fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", fontWeight: 300, color: "#f0e6d3", lineHeight: 1.2 }}>
                    {b.title}
                  </p>
                  <p style={{ margin: "4px 0 0", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#555" }}>
                    Started {new Date(b.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {b.exerciseCount} exercises
                  </p>
                </div>
                <span style={{ color: "#444", fontSize: "1.1rem" }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
