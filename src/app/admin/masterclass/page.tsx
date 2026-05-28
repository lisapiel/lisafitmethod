"use client"

import { useEffect, useState } from "react"
import { generateClient } from "aws-amplify/data"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

export default function AdminMasterclassDashboard() {
  const [videoCount, setVideoCount] = useState<number | null>(null)
  const [blockCount, setBlockCount] = useState<number | null>(null)
  const [pendingQA, setPendingQA] = useState<number | null>(null)

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })

    client.models.ExerciseVideo.list({ authMode: "userPool" })
      .then(({ data }) => setVideoCount(data.length))
      .catch(() => setVideoCount(0))

    client.models.WorkoutBlock.list({ authMode: "userPool" })
      .then(({ data }) => setBlockCount(data.length))
      .catch(() => setBlockCount(0))

    client.models.QAndAEntry.list({
      filter: { status: { eq: "PENDING" } },
      authMode: "userPool",
    })
      .then(({ data }) => setPendingQA(data.length))
      .catch(() => setPendingQA(0))
  }, [])

  const statCards = [
    { label: "Exercise Videos", value: videoCount, href: "/admin/masterclass/exercises", cta: "Manage Library" },
    { label: "Workout Blocks", value: blockCount, href: "/admin/masterclass/blocks", cta: "Manage Blocks" },
    { label: "Pending Q&A", value: pendingQA, href: "/admin/masterclass/qa", cta: "Answer Questions", highlight: (pendingQA ?? 0) > 0 },
  ]

  const quickLinks = [
    { href: "/admin/masterclass/blocks/new", label: "Build New Block", desc: "Create next month's workout program" },
    { href: "/admin/masterclass/exercises", label: "Exercise Library", desc: "Browse and edit all 361 exercises" },
    { href: "/admin/masterclass/qa", label: "Answer Q&A", desc: "Batch-answer pending member questions" },
  ]

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.35rem" }}>
        Masterclass
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#888", marginBottom: "2.5rem" }}>
        Monthly subscription program management
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: "2.5rem" }}>
        {statCards.map((card) => (
          <Link key={card.href} href={card.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: "#111",
              border: `1px solid ${card.highlight ? gold : border}`,
              borderRadius: 2,
              padding: "20px 24px",
              cursor: "pointer",
            }}>
              <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: card.highlight ? gold : "#888" }}>
                {card.label}
              </p>
              <p style={{ margin: "8px 0 4px", fontFamily: "var(--font-cormorant), serif", fontSize: "2.5rem", fontWeight: 300, color: "#f0e6d3", lineHeight: 1 }}>
                {card.value ?? "-"}
              </p>
              <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: gold }}>
                {card.cta} →
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "1rem", paddingBottom: "0.5rem", borderBottom: `1px solid ${border}` }}>
        Quick Actions
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: "#0e0e0e",
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
                <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", fontWeight: 600, color: "#f0e6d3" }}>
                  {link.label}
                </p>
                <p style={{ margin: "3px 0 0", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#555" }}>
                  {link.desc}
                </p>
              </div>
              <span style={{ color: gold, fontSize: "1rem" }}>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
