"use client"

import { useState, useEffect, use } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import Link from "next/link"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"

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
      <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted }}>Need at least 2 data points to chart</p>
      </div>
    )
  }
  const W = 600, H = 130, padX = 44, padY = 18
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
  const diff = latest.weight - first.weight

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.12em", margin: "0 0 2px" }}>CURRENT</p>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 700, color: gold, margin: 0 }}>{latest.weight} <span style={{ fontSize: "0.9rem", fontWeight: 400, color: muted }}>{latest.unit}</span></p>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.12em", margin: "0 0 2px" }}>CHANGE</p>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 700, color: diff < 0 ? "#5c9e6a" : diff > 0 ? "#d97460" : muted, margin: 0 }}>
            {diff > 0 ? "+" : ""}{diff.toFixed(1)} <span style={{ fontSize: "0.9rem", fontWeight: 400, color: muted }}>{latest.unit}</span>
          </p>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.12em", margin: "0 0 2px" }}>DATA POINTS</p>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 700, color: cream, margin: 0 }}>{data.length}</p>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }}>
        <defs>
          <linearGradient id="wg-admin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gold} stopOpacity="0.18" />
            <stop offset="100%" stopColor={gold} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#wg-admin)" />
        <path d={pathD} fill="none" stroke={gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.weight)} r={i === data.length - 1 ? 4 : 3} fill={i === data.length - 1 ? gold : `${gold}88`} />
        ))}
        <text x={padX} y={H - 4} fontFamily="var(--font-montserrat), sans-serif" fontSize="9" fill={muted}>
          {new Date(data[0].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </text>
        <text x={W - padX} y={H - 4} fontFamily="var(--font-montserrat), sans-serif" fontSize="9" fill={muted} textAnchor="end">
          {new Date(data[data.length - 1].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </text>
        <text x={padX - 4} y={toY(maxW) + 4} fontFamily="var(--font-montserrat), sans-serif" fontSize="9" fill={muted} textAnchor="end">{maxW}</text>
        <text x={padX - 4} y={toY(minW) + 4} fontFamily="var(--font-montserrat), sans-serif" fontSize="9" fill={muted} textAnchor="end">{minW}</text>
      </svg>
    </div>
  )
}

function MeasRow({ label, value, unit = "in" }: { label: string; value: number | null; unit?: string }) {
  if (!value) return null
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${border}` }}>
      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted }}>{label}</span>
      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: cream, fontWeight: 600 }}>{value} {unit}</span>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <div style={{ width: 20, height: 20, border: `2px solid ${border}`, borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function AdminClientProgressPage({ params }: { params: Promise<{ email: string }> }) {
  const { email: encodedEmail } = use(params)
  const clientEmail = decodeURIComponent(encodedEmail)

  const [loading, setLoading] = useState(true)
  const [clientName, setClientName] = useState("")
  const [weightData, setWeightData] = useState<WeightPoint[]>([])
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])

  useEffect(() => {
    async function load() {
      try {
        const session = await fetchAuthSession()
        const token = session.tokens?.accessToken?.toString()
        if (!token) { setLoading(false); return }

        const [clientRes, checkInsRes, snapshotsRes] = await Promise.allSettled([
          fetch(`/api/admin/coaching/clients/${encodeURIComponent(clientEmail)}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
          fetch("/api/admin/coaching/check-ins", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
          fetch(`/api/admin/coaching/progress/${encodeURIComponent(clientEmail)}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
        ])

        if (clientRes.status === "fulfilled" && clientRes.value.client) {
          setClientName(clientRes.value.client.displayName)
        }

        const checkIns: Array<Record<string, unknown>> = checkInsRes.status === "fulfilled" ? (checkInsRes.value.checkIns ?? []) : []
        const myCheckIns = checkIns.filter((ci) => (ci.clientEmail as string).toLowerCase() === clientEmail.toLowerCase() && ci.weight)
        const wData = myCheckIns
          .sort((a, b) => (a.submittedAt as string).localeCompare(b.submittedAt as string))
          .map((ci) => ({ date: ci.submittedAt as string, weight: Number(ci.weight), unit: (ci.weightUnit as string) ?? "lbs" }))
        setWeightData(wData)

        const snaps: Array<Record<string, unknown>> = snapshotsRes.status === "fulfilled" ? (snapshotsRes.value.snapshots ?? []) : []
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
      } catch { /* handled by layout */ }
      setLoading(false)
    }
    load()
  }, [clientEmail])

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: cream, padding: "2.5rem 2rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href={`/admin/coaching/clients/${encodedEmail}`} style={{ color: muted, fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: "1.5rem" }}>
          ← {clientName || clientEmail}
        </Link>

        <div style={{ marginBottom: "2rem" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold, margin: "0 0 6px" }}>
            {clientName || clientEmail}
          </p>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 700, color: cream, margin: 0 }}>Progress</h1>
        </div>

        {loading ? <Spinner /> : (
          <>
            {/* Weight chart */}
            <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem", marginBottom: "1.25rem" }}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 16px" }}>
                Weight — from check-ins
              </p>
              {weightData.length === 0 ? (
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: muted }}>No weight data logged yet</p>
              ) : (
                <WeightChart data={weightData} />
              )}
            </div>

            {/* Measurement snapshots */}
            <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem" }}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 16px" }}>
                Measurement Snapshots
              </p>
              {snapshots.length === 0 ? (
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: muted }}>No measurements logged yet</p>
              ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {snapshots.map((s) => (
                    <div key={s.id} style={{ border: `1px solid ${border}`, borderRadius: 6, padding: "1rem" }}>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: gold, margin: "0 0 10px", fontWeight: 600 }}>
                        {new Date(s.snapshotDate).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
                      </p>
                      {s.weight && <MeasRow label="Weight" value={s.weight} unit={s.weightUnit ?? "lbs"} />}
                      <MeasRow label="Waist" value={s.waist} />
                      <MeasRow label="Hips" value={s.hips} />
                      <MeasRow label="Chest" value={s.chest} />
                      <MeasRow label="Arm" value={s.arm} />
                      <MeasRow label="Thigh" value={s.thigh} />
                      {s.notes && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted, marginTop: 8 }}>{s.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
