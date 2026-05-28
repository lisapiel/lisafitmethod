"use client"

import { useEffect, useState } from "react"
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
  isPublished: boolean
}

export default function AdminBlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    client.models.WorkoutBlock.list({ authMode: "userPool" })
      .then(({ data }) => {
        setBlocks(
          data
            .map((b) => ({
              id: b.id,
              title: b.title,
              blockNumber: b.blockNumber,
              startDate: b.startDate,
              isPublished: b.isPublished,
            }))
            .sort((a, b) => b.blockNumber - a.blockNumber)
        )
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.25rem" }}>
            Workout Blocks
          </h1>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#888" }}>
            {blocks.length} blocks created
          </p>
        </div>
        <Link href="/admin/masterclass/blocks/new">
          <button style={{
            background: gold,
            color: "#0a0a0a",
            border: "none",
            padding: "10px 20px",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.65rem",
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}>
            + New Block
          </button>
        </Link>
      </div>

      {loading ? (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555" }}>Loading…</p>
      ) : blocks.length === 0 ? (
        <div style={{ border: `1px dashed ${border}`, borderRadius: 2, padding: "3rem 2rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555", marginBottom: "1rem" }}>
            No workout blocks yet.
          </p>
          <Link href="/admin/masterclass/blocks/new">
            <button style={{
              background: "none",
              border: `1px solid ${gold}`,
              color: gold,
              padding: "10px 20px",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.65rem",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}>
              Build First Block
            </button>
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {blocks.map((block) => (
            <Link key={block.id} href={`/admin/masterclass/blocks/${block.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: "#111",
                border: `1px solid ${border}`,
                borderRadius: 2,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = gold)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = border)}
              >
                <div>
                  <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#f0e6d3" }}>
                    {block.title}
                  </p>
                  <p style={{ margin: "3px 0 0", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#555" }}>
                    Block {block.blockNumber} · Starts {new Date(block.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
                <span style={{
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.55rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: block.isPublished ? "#4caf50" : "#888",
                  padding: "3px 10px",
                  border: `1px solid ${block.isPublished ? "#4caf50" : "#333"}`,
                  borderRadius: 2,
                }}>
                  {block.isPublished ? "Published" : "Draft"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
