"use client"

import { useState, useEffect, use } from "react"
import { generateClient } from "aws-amplify/data"
import Link from "next/link"
import VideoEmbed from "@/components/training/VideoEmbed"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

type ExerciseEntry = { slug: string; name: string; sets: string; reps: string; rest: string; note: string }
type DayData = { dayLabel: string; exercises: ExerciseEntry[] }
type BlockData = { id: string; title: string; blockNumber: number; startDate: string; days: DayData[] }

export default function BlockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [block, setBlock] = useState<BlockData | null>(null)
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({})
  const [activeDay, setActiveDay] = useState(0)
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set())
  const [completing, setCompleting] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    client.models.WorkoutBlock.get({ id }, { authMode: "userPool" })
      .then(({ data: b }) => {
        if (!b) { setLoading(false); return }
        let days: DayData[] = []
        try { days = JSON.parse(b.days) as DayData[] } catch { days = [] }
        setBlock({ id: b.id, title: b.title, blockNumber: b.blockNumber, startDate: b.startDate, days })

        const slugs = [...new Set(days.flatMap((d) => d.exercises.map((e) => e.slug)))]
        if (slugs.length) {
          Promise.all(
            slugs.map((slug) =>
              client.models.ExerciseVideo.list({ filter: { slug: { eq: slug } }, authMode: "userPool" })
                .then(({ data: vids }) => vids[0] ? { slug, url: vids[0].url } : null)
                .catch(() => null)
            )
          ).then((results) => {
            const map: Record<string, string> = {}
            for (const r of results) { if (r) map[r.slug] = r.url }
            setVideoUrls(map)
          })
        }
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [id])

  async function handleMarkComplete(dayLabel: string) {
    if (!block) return
    const key = `${block.id}-${dayLabel}`
    setCompleting(key)
    try {
      await fetch("/api/masterclass/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId: block.id, dayLabel }),
      })
      setCompletedDays((prev) => new Set(prev).add(key))
    } finally {
      setCompleting(null)
    }
  }

  if (loading) return (
    <div style={{ padding: "3rem 2rem", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!block) return (
    <div style={{ padding: "3rem 2rem" }}>
      <Link href="/masterclass/library" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#555", textDecoration: "none" }}>← Library</Link>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555", marginTop: "2rem" }}>Block not found.</p>
    </div>
  )

  const currentDay = block.days[activeDay]

  return (
    <div style={{ padding: "2rem 2rem 4rem", maxWidth: 760 }}>
      <div style={{ marginBottom: "0.75rem" }}>
        <Link href="/masterclass/library" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#555", textDecoration: "none", letterSpacing: "0.1em" }}>← Library</Link>
      </div>
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ margin: "0 0 8px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "#555" }}>Block {block.blockNumber}</p>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 300, color: "#f0e6d3", margin: 0, lineHeight: 1.2 }}>{block.title}</h1>
      </div>

      <div style={{ display: "flex", borderBottom: `1px solid ${border}`, marginBottom: "2rem" }}>
        {block.days.map((day, i) => {
          const done = completedDays.has(`${block.id}-${day.dayLabel}`)
          return (
            <button key={day.dayLabel} onClick={() => setActiveDay(i)} style={{ background: "none", border: "none", borderBottom: i === activeDay ? `2px solid ${gold}` : "2px solid transparent", color: i === activeDay ? gold : "#888", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", padding: "10px 20px", cursor: "pointer", marginBottom: -1, display: "flex", alignItems: "center", gap: 6 }}>
              {day.dayLabel}
              {done && <span style={{ color: "#4caf50", fontSize: "0.8rem" }}>✓</span>}
            </button>
          )
        })}
      </div>

      {currentDay && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "2rem" }}>
            {currentDay.exercises.map((ex, i) => (
              <div key={`${ex.slug}-${i}`} style={{ borderBottom: `1px solid ${border}`, paddingBottom: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div>
                    <h2 style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", fontWeight: 600, color: "#f0e6d3", margin: 0, textTransform: "uppercase", letterSpacing: "0.1em" }}>{ex.name}</h2>
                    <p style={{ margin: "4px 0 0", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#555" }}>
                      {[ex.sets && `${ex.sets} sets`, ex.reps, ex.rest && `${ex.rest} rest`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: "#444", fontWeight: 500 }}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                {videoUrls[ex.slug] && <VideoEmbed videoId="" title={ex.name} s3Url={videoUrls[ex.slug]} />}
                {ex.note && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#888", marginTop: "0.75rem", lineHeight: 1.6, borderLeft: `2px solid ${gold}`, paddingLeft: "0.75rem", fontStyle: "italic" }}>{ex.note}</p>}
              </div>
            ))}
          </div>
          {currentDay.exercises.length > 0 && (
            <button onClick={() => handleMarkComplete(currentDay.dayLabel)} disabled={!!completing || completedDays.has(`${block.id}-${currentDay.dayLabel}`)} style={{ background: completedDays.has(`${block.id}-${currentDay.dayLabel}`) ? "none" : gold, color: completedDays.has(`${block.id}-${currentDay.dayLabel}`) ? "#4caf50" : "#0a0a0a", border: completedDays.has(`${block.id}-${currentDay.dayLabel}`) ? "1px solid #4caf50" : "none", padding: "14px 28px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", cursor: completedDays.has(`${block.id}-${currentDay.dayLabel}`) ? "default" : "pointer" }}>
              {completing ? "Logging…" : completedDays.has(`${block.id}-${currentDay.dayLabel}`) ? "✓ Completed" : `Mark ${currentDay.dayLabel} Complete`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
