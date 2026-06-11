"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"

type WeightPoint = { date: string; weight: number; unit: string }
type Snapshot = {
  id: string
  snapshotDate: string
  weight: number | null
  weightUnit: string | null
  waist: number | null
  hips: number | null
  chest: number | null
  arm: number | null
  thigh: number | null
  notes: string | null
}

function WeightChart({ data }: { data: WeightPoint[] }) {
  if (data.length < 2) {
    return (
      <div style={{ background: "#faf8f5", borderRadius: 8, padding: "2rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted }}>
          {data.length === 0 ? "Weight data will appear here once you've submitted check-ins." : "Submit one more check-in to see your trend."}
        </p>
      </div>
    )
  }

  const W = 580, H = 130, padX = 40, padY = 18
  const plotW = W - padX * 2, plotH = H - padY * 2
  const weights = data.map((d) => d.weight)
  const minW = Math.min(...weights), maxW = Math.max(...weights)
  const range = maxW - minW || 1
  const toX = (i: number) => padX + (i / (data.length - 1)) * plotW
  const toY = (w: number) => padY + ((maxW - w) / range) * plotH
  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d.weight)}`).join(" ")
  const areaD = `${pathD} L ${toX(data.length - 1)} ${padY + plotH} L ${padX} ${padY + plotH} Z`
  const latest = data[data.length - 1]
  const first = data[0]
  const diff = +(latest.weight - first.weight).toFixed(1)

  return (
    <div>
      <div style={{ display: "flex", gap: 28, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Current</p>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: black, margin: 0 }}>{latest.weight} <span style={{ fontSize: "0.85rem", fontWeight: 400, color: muted }}>{latest.unit}</span></p>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Change</p>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: diff < 0 ? "#5c9e6a" : diff > 0 ? "#d97460" : muted, margin: 0 }}>
            {diff > 0 ? "+" : ""}{diff} <span style={{ fontSize: "0.85rem", fontWeight: 400, color: muted }}>{latest.unit}</span>
          </p>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 2px" }}>Check-ins</p>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.8rem", fontWeight: 700, color: black, margin: 0 }}>{data.length}</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }}>
        <defs>
          <linearGradient id="wg-client" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#wg-client)" />
        <path d={pathD} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.weight)} r={i === data.length - 1 ? 4 : 3} fill={i === data.length - 1 ? accent : `${accent}88`} />
        ))}
        <text x={padX} y={H - 4} fontFamily="var(--font-dm-sans), sans-serif" fontSize="9" fill={muted}>
          {new Date(data[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </text>
        <text x={W - padX} y={H - 4} fontFamily="var(--font-dm-sans), sans-serif" fontSize="9" fill={muted} textAnchor="end">
          {new Date(data[data.length - 1].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </text>
        <text x={padX - 4} y={toY(maxW) + 4} fontFamily="var(--font-dm-sans), sans-serif" fontSize="9" fill={muted} textAnchor="end">{maxW}</text>
        <text x={padX - 4} y={toY(minW) + 4} fontFamily="var(--font-dm-sans), sans-serif" fontSize="9" fill={muted} textAnchor="end">{minW}</text>
      </svg>
    </div>
  )
}

function MeasRow({ label, value, unit = "in" }: { label: string; value: number | null; unit?: string }) {
  if (!value) return null
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${border}` }}>
      <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted }}>{label}</span>
      <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: black, fontWeight: 600 }}>{value} {unit}</span>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function ProgressClient() {
  const [loading, setLoading] = useState(true)
  const [weightData, setWeightData] = useState<WeightPoint[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [checkInsRes, snapshotsRes] = await Promise.allSettled([
          fetch("/api/coaching/check-in").then((r) => r.json()),
          fetch("/api/coaching/progress").then((r) => r.json()),
        ])

        if (checkInsRes.status === "fulfilled") {
          const ciList: Array<Record<string, unknown>> = (checkInsRes.value.checkIns ?? []).filter((ci: Record<string, unknown>) => ci.weight)
          setWeightData(
            ciList
              .sort((a, b) => (a.submittedAt as string).localeCompare(b.submittedAt as string))
              .map((ci) => ({ date: ci.submittedAt as string, weight: Number(ci.weight), unit: (ci.weightUnit as string) ?? "lbs" }))
          )
        }

        if (snapshotsRes.status === "fulfilled") {
          const snaps: Array<Record<string, unknown>> = snapshotsRes.value.snapshots ?? []
          setSnapshots(
            snaps
              .sort((a, b) => (b.snapshotDate as string).localeCompare(a.snapshotDate as string))
              .map((s) => ({
                id: s.id as string,
                snapshotDate: s.snapshotDate as string,
                weight: s.weight != null ? Number(s.weight) : null,
                weightUnit: (s.weightUnit as string | null) ?? null,
                waist: s.waist != null ? Number(s.waist) : null,
                hips: s.hips != null ? Number(s.hips) : null,
                chest: s.chest != null ? Number(s.chest) : null,
                arm: s.arm != null ? Number(s.arm) : null,
                thigh: s.thigh != null ? Number(s.thigh) : null,
                notes: (s.notes as string | null) ?? null,
              }))
          )
        }
      } catch { /* handled by layout */ }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <Spinner />

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent, margin: "0 0 4px" }}>Your</p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2rem", fontWeight: 700, color: black, margin: 0 }}>Progress</h1>
        </div>
        <Link href="/my-coaching/progress/log" style={{ display: "inline-block", background: black, color: white, padding: "10px 22px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>
          + Log Measurements
        </Link>
      </div>

      {/* Weight chart */}
      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem", marginBottom: "1.25rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 16px" }}>
          Weight Trend — from weekly check-ins
        </p>
        <WeightChart data={weightData} />
        {weightData.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <Link href="/my-coaching/check-in" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: accent, textDecoration: "none", fontWeight: 600 }}>
              Submit your first check-in →
            </Link>
          </div>
        )}
      </div>

      {/* Measurement snapshots */}
      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 8 }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: 0 }}>
            Measurement History
          </p>
          {snapshots.length > 0 && (
            <Link href="/my-coaching/progress/log" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: accent, textDecoration: "none", fontWeight: 600 }}>
              + Log today
            </Link>
          )}
        </div>

        {snapshots.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.875rem", color: muted, margin: "0 0 16px", lineHeight: 1.5 }}>
              Log your measurements to track body composition over time.
            </p>
            <Link href="/my-coaching/progress/log" style={{ display: "inline-block", background: accent, color: black, padding: "11px 24px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none", borderRadius: 4 }}>
              Log First Measurements
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {snapshots.map((s, i) => (
              <div key={s.id} style={{ background: i === 0 ? "#fdf9f4" : "#faf8f5", border: `1px solid ${i === 0 ? "#f0e4cc" : border}`, borderRadius: 6, padding: "1rem 1.25rem" }}>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: i === 0 ? accent : muted, margin: "0 0 10px" }}>
                  {i === 0 ? "Most Recent — " : ""}{new Date(s.snapshotDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
                {s.weight && <MeasRow label="Weight" value={s.weight} unit={s.weightUnit ?? "lbs"} />}
                <MeasRow label="Waist" value={s.waist} />
                <MeasRow label="Hips" value={s.hips} />
                <MeasRow label="Chest" value={s.chest} />
                <MeasRow label="Arm" value={s.arm} />
                <MeasRow label="Thigh" value={s.thigh} />
                {s.notes && <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, marginTop: 8 }}>{s.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
