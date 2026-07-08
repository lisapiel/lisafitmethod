"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useParams } from "next/navigation"
import Link from "next/link"

const gold = "#c9a96e"
const border = "#2a2a2a"

type ProgramExercise = { exerciseId: string; name: string; videoS3Key: string; sets: string; reps: string; weight: string; rpe: string; rest: string; tempo: string; coachNotes: string }
type ProgramDay = { dayLabel: string; notes: string; exercises: ProgramExercise[] }
type ProgramWeek = { weekNumber: number; label: string; days: ProgramDay[] }

export default function ClientProgramPage() {
  const params = useParams()
  const emailParam = decodeURIComponent(params.email as string)

  const [clientName, setClientName] = useState("")
  const [programName, setProgramName] = useState("")
  const [programId, setProgramId] = useState("")
  const [weeks, setWeeks] = useState<ProgramWeek[]>([])
  const [activeWeek, setActiveWeek] = useState(0)
  const [activeDay, setActiveDay] = useState(0)
  const [loading, setLoading] = useState(true)

  const CDN = process.env.NEXT_PUBLIC_AMBRISA_CDN_URL ?? ""

  const load = useCallback(async () => {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) { setLoading(false); return }

      const clientRes = await fetch(`/api/admin/coaching/clients/${encodeURIComponent(emailParam)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (clientRes.ok) {
        const data = await clientRes.json()
        const c = data.client
        if (c) {
          setClientName(c.displayName)
          if (c.currentProgramId) {
            const progRes = await fetch(`/api/admin/coaching/programs/${c.currentProgramId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            if (progRes.ok) {
              const pData = await progRes.json()
              const prog = pData.program
              if (prog) {
                setProgramName(prog.name)
                setProgramId(prog.id)
                try { setWeeks(JSON.parse(prog.weeks) as ProgramWeek[]) } catch { /* empty */ }
              }
            }
          }
        }
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [emailParam])

  useEffect(() => { load() }, [load])

  const week = weeks[activeWeek]
  const day = week?.days[activeDay]

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "3rem", color: "#555" }}>
      <div style={{ width: 18, height: 18, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>
      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem" }}>Loading…</span>
    </div>
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <Link href={`/admin/coaching/clients/${encodeURIComponent(emailParam)}`} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", textDecoration: "none" }}>← {clientName || emailParam}</Link>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, color: "#f0e6d3", margin: 0, flex: 1 }}>{programName || "Program"}</h1>
        {programId && (
          <Link href={`/admin/coaching/programs/${programId}`} style={{ background: "none", border: `1px solid ${border}`, color: gold, padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", textDecoration: "none" }}>
            Edit Program
          </Link>
        )}
      </div>

      {weeks.length === 0 ? (
        <div style={{ background: "#111", border: `1px solid ${border}`, padding: "3rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", color: "#444" }}>No program assigned</p>
          <Link href={`/admin/coaching/clients/${encodeURIComponent(emailParam)}`} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: gold, textDecoration: "none" }}>← Back to profile to assign one</Link>
        </div>
      ) : (
        <>
          {/* Week tabs */}
          <div className="h-scroll" style={{ display: "flex", gap: 6, marginBottom: "1rem", flexWrap: "wrap" }}>
            {weeks.map((w, wi) => (
              <button key={wi} onClick={() => { setActiveWeek(wi); setActiveDay(0) }}
                style={{ background: wi === activeWeek ? gold : "#161616", border: `1px solid ${wi === activeWeek ? gold : border}`, color: wi === activeWeek ? "#0a0a0a" : "#888", padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: wi === activeWeek ? 700 : 400, cursor: "pointer" }}>
                {w.label}
              </button>
            ))}
          </div>

          {/* Day tabs */}
          <div className="h-scroll" style={{ display: "flex", gap: 6, marginBottom: "1.25rem", flexWrap: "wrap" }}>
            {week?.days.map((d, di) => (
              <button key={di} onClick={() => setActiveDay(di)}
                style={{ background: di === activeDay ? "#2a2a2a" : "transparent", border: `1px solid ${di === activeDay ? "#3a3a3a" : border}`, color: di === activeDay ? "#f0e6d3" : "#666", padding: "6px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", cursor: "pointer" }}>
                {d.dayLabel}
              </button>
            ))}
          </div>

          {day && (
            <div>
              {day.notes && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555", marginBottom: "1rem" }}>{day.notes}</p>}
              {day.exercises.length === 0 ? (
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#333" }}>No exercises for this day.</p>
              ) : (
                day.exercises.map((ex, i) => (
                  <div key={i} style={{ background: "#0f0f0f", border: `1px solid ${border}`, padding: "14px 18px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 40, height: 40, flexShrink: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {ex.videoS3Key && <img src={`${CDN}/${encodeURIComponent(ex.videoS3Key.replace(/\.mp4$/i, ".jpg"))}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", fontWeight: 600, color: "#f0e6d3", margin: "0 0 6px" }}>{ex.name}</p>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        {([["Sets", ex.sets], ["Reps", ex.reps], ex.weight ? ["Weight", ex.weight] : null, ex.rpe ? ["RPE", ex.rpe] : null, ["Rest", ex.rest], ex.tempo ? ["Tempo", ex.tempo] : null] as (string[] | null)[]).filter((x): x is string[] => x !== null).map(([label, val]) => (
                          <span key={label} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666" }}>
                            <span style={{ color: "#444", textTransform: "uppercase", fontSize: "0.55rem", letterSpacing: "0.08em" }}>{label} </span>{val}
                          </span>
                        ))}
                      </div>
                      {ex.coachNotes && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: gold, margin: "6px 0 0" }}>{ex.coachNotes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
