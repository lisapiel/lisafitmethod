"use client"

import { useState, useEffect, use } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import Link from "next/link"
import { toLbs, normalizeUnit, type WeightUnit } from "@/lib/weight"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"

// Internal chart points are always lb-canonical so a client who switched
// LBS↔KG mid-journey still charts correctly. The chart renders the
// client-preferred unit label (last-entry wins; falls back to the stored
// weightUnit on the coaching_client record).
type WeightPoint = { date: string; lbs: number }
type MeasurementRow = { date: string; waist: number | null; hips: number | null; chest: number | null; arm: number | null; thigh: number | null; glutes?: number | null; custom?: Array<{ label: string; value: string; unit: string }>; notes?: string | null }

function WeightChart({ data, displayUnit }: { data: WeightPoint[]; displayUnit: WeightUnit }) {
  if (data.length < 2) {
    return (
      <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted }}>Need at least 2 data points to chart</p>
      </div>
    )
  }
  const W = 600, H = 130, padX = 44, padY = 18
  const plotW = W - padX * 2, plotH = H - padY * 2
  // Convert canonical lbs → display unit for render. Keeps axes labeled
  // in the unit the client logged in.
  const toDisplay = (lbs: number) => displayUnit === "KG" ? +(lbs / 2.20462).toFixed(1) : +lbs.toFixed(1)
  const displayed = data.map((d) => toDisplay(d.lbs))
  const minW = Math.min(...displayed), maxW = Math.max(...displayed)
  const range = maxW - minW || 1
  const toX = (i: number) => padX + (i / (data.length - 1)) * plotW
  const toY = (w: number) => padY + ((maxW - w) / range) * plotH
  const pathD = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(toDisplay(d.lbs))}`).join(" ")
  const areaD = `${pathD} L ${toX(data.length - 1)} ${padY + plotH} L ${padX} ${padY + plotH} Z`
  const latest = data[data.length - 1]
  const first = data[0]
  // Diff is computed on canonical lbs, then converted to the display unit.
  const diffDisplay = toDisplay(latest.lbs) - toDisplay(first.lbs)
  const unitLabel = displayUnit === "KG" ? "kg" : "lb"

  return (
    <div>
      <div style={{ display: "flex", gap: 24, marginBottom: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.12em", margin: "0 0 2px" }}>STARTING</p>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", fontWeight: 700, color: cream, margin: 0 }}>{toDisplay(first.lbs)} <span style={{ fontSize: "0.8rem", fontWeight: 400, color: muted }}>{unitLabel}</span></p>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.12em", margin: "0 0 2px" }}>CURRENT</p>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 700, color: gold, margin: 0 }}>{toDisplay(latest.lbs)} <span style={{ fontSize: "0.9rem", fontWeight: 400, color: muted }}>{unitLabel}</span></p>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.12em", margin: "0 0 2px" }}>CHANGE</p>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 700, color: diffDisplay < 0 ? "#5c9e6a" : diffDisplay > 0 ? "#d97460" : muted, margin: 0 }}>
            {diffDisplay > 0 ? "+" : ""}{diffDisplay.toFixed(1)} <span style={{ fontSize: "0.9rem", fontWeight: 400, color: muted }}>{unitLabel}</span>
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
          <circle key={i} cx={toX(i)} cy={toY(toDisplay(d.lbs))} r={i === data.length - 1 ? 4 : 3} fill={i === data.length - 1 ? gold : `${gold}88`} />
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

function MeasRow({ label, value, unit = "in" }: { label: string; value: number | null | undefined; unit?: string }) {
  if (value == null || !Number.isFinite(value) || value <= 0) return null
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

// Parse the free-form measurementSnapshot JSON blob that lives on every
// check-in. Each entry is {label, value, unit}. The structured check-in
// form writes known-label entries (Waist / Hips / Chest / Thigh / Arm);
// legacy / coach-typed entries might use any label.
function parseMeasurementSnapshot(raw: unknown): Array<{ label: string; value: string; unit: string }> {
  if (typeof raw !== "string" || !raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((m): m is { label: string; value: string; unit: string } =>
      m && typeof m === "object" && typeof m.label === "string" && typeof m.value === "string"
    )
  } catch { return [] }
}

// Map a free-form measurement label onto one of the structured slots
// (waist / hips / chest / arm / thigh / glutes). Anything we can't
// match drops into the `custom` list so the UI still surfaces it.
function pickStructuredField(label: string): "waist" | "hips" | "chest" | "arm" | "thigh" | "glutes" | null {
  const l = label.trim().toLowerCase()
  if (l.includes("waist"))  return "waist"
  if (l.includes("hip"))    return "hips"
  if (l.includes("chest"))  return "chest"
  if (l.includes("glute"))  return "glutes"
  if (l.includes("thigh") || l.includes("leg")) return "thigh"
  if (l === "arm" || l.startsWith("arm ") || l.includes(" arm") || l.includes("bicep")) return "arm"
  return null
}

export default function AdminClientProgressPage({ params }: { params: Promise<{ email: string }> }) {
  const { email: encodedEmail } = use(params)
  const clientEmail = decodeURIComponent(encodedEmail)

  const [loading, setLoading] = useState(true)
  const [clientName, setClientName] = useState("")
  const [weightData, setWeightData] = useState<WeightPoint[]>([])
  const [displayUnit, setDisplayUnit] = useState<WeightUnit>("LBS")
  const [measurements, setMeasurements] = useState<MeasurementRow[]>([])

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

        // Client record — needed for displayName, startingWeight (first chart
        // point), weightUnit (display unit when no check-ins log one).
        type ClientSummary = { displayName?: string; startingWeight?: number; weightUnit?: string; createdAt?: string; subscriptionStartDate?: string }
        const client: ClientSummary = clientRes.status === "fulfilled" ? (clientRes.value.client ?? {}) : {}
        if (client.displayName) setClientName(client.displayName)

        // Build canonical lb weight series — startingWeight (if any) first,
        // then every check-in with a weight entry, all normalized through
        // @/lib/weight.toLbs so historical unit switches don't break math.
        const checkIns: Array<Record<string, unknown>> = checkInsRes.status === "fulfilled" ? (checkInsRes.value.checkIns ?? []) : []
        const myCheckIns = checkIns
          .filter((ci) => typeof ci.clientEmail === "string" && (ci.clientEmail as string).toLowerCase() === clientEmail.toLowerCase())
          .sort((a, b) => (a.submittedAt as string).localeCompare(b.submittedAt as string))

        const points: WeightPoint[] = []
        // Point 1: startingWeight if the client record carries one. Dated
        // at subscriptionStartDate (preferred) or createdAt, and only shown
        // when it precedes any check-in so we don't invent a point mid-journey.
        const startDate = client.subscriptionStartDate || client.createdAt
        if (client.startingWeight != null && startDate) {
          const startLbs = toLbs(client.startingWeight, normalizeUnit(client.weightUnit))
          if (startLbs != null) {
            const firstCheckInDate = myCheckIns.find((ci) => ci.weight != null)?.submittedAt as string | undefined
            // Only prepend if genuinely before the first check-in — otherwise
            // we'd duplicate the first check-in point.
            if (!firstCheckInDate || startDate <= firstCheckInDate) {
              points.push({ date: startDate, lbs: startLbs })
            }
          }
        }
        for (const ci of myCheckIns) {
          if (ci.weight == null) continue
          const lbs = toLbs(ci.weight as number, normalizeUnit(ci.weightUnit as string | undefined))
          if (lbs == null) continue
          points.push({ date: ci.submittedAt as string, lbs })
        }
        setWeightData(points)

        // Display unit: last check-in's unit if present, else client record.
        const lastCiUnit = [...myCheckIns].reverse().find((ci) => ci.weight != null)?.weightUnit as string | undefined
        setDisplayUnit(normalizeUnit(lastCiUnit) ?? normalizeUnit(client.weightUnit))

        // Measurement rows: union of ProgressSnapshotRecord entries + the
        // measurementSnapshot JSON that lives on each check-in, newest first.
        type SnapIn = { id: string; snapshotDate: string; weight?: number; weightUnit?: string; waist?: number; hips?: number; chest?: number; arm?: number; thigh?: number; glutes?: number; notes?: string }
        const snaps: SnapIn[] = snapshotsRes.status === "fulfilled" ? (snapshotsRes.value.snapshots ?? []) : []
        const snapRows: MeasurementRow[] = snaps.map((s) => ({
          date:  s.snapshotDate,
          waist: s.waist  != null ? Number(s.waist)  : null,
          hips:  s.hips   != null ? Number(s.hips)   : null,
          chest: s.chest  != null ? Number(s.chest)  : null,
          arm:   s.arm    != null ? Number(s.arm)    : null,
          thigh: s.thigh  != null ? Number(s.thigh)  : null,
          glutes:s.glutes != null ? Number(s.glutes) : null,
          notes: s.notes ?? null,
        }))

        const checkInRows: MeasurementRow[] = []
        for (const ci of myCheckIns) {
          const entries = parseMeasurementSnapshot(ci.measurementSnapshot)
          if (entries.length === 0) continue
          const row: MeasurementRow = { date: ci.submittedAt as string, waist: null, hips: null, chest: null, arm: null, thigh: null, glutes: null, custom: [] }
          for (const e of entries) {
            const slot = pickStructuredField(e.label)
            const n = Number(e.value)
            if (slot && Number.isFinite(n) && n > 0) {
              row[slot] = n
            } else if (e.value.trim()) {
              row.custom!.push(e)
            }
          }
          const hasAny = row.waist || row.hips || row.chest || row.arm || row.thigh || row.glutes || (row.custom && row.custom.length > 0)
          if (hasAny) checkInRows.push(row)
        }

        // Merge + sort newest first.
        const combined = [...snapRows, ...checkInRows].sort((a, b) => b.date.localeCompare(a.date))
        setMeasurements(combined)
      } catch { /* handled by layout */ }
      setLoading(false)
    }
    load()
  }, [clientEmail])

  const latest = measurements[0]

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
                Weight
              </p>
              {weightData.length === 0 ? (
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: muted }}>No weight data logged yet</p>
              ) : (
                <WeightChart data={weightData} displayUnit={displayUnit} />
              )}
            </div>

            {/* Latest measurements summary */}
            {latest && (latest.waist || latest.hips || latest.chest || latest.arm || latest.thigh || latest.glutes) && (
              <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem", marginBottom: "1.25rem" }}>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 10px" }}>
                  Latest measurements · {new Date(latest.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <MeasRow label="Waist"  value={latest.waist} />
                <MeasRow label="Hips"   value={latest.hips} />
                <MeasRow label="Chest"  value={latest.chest} />
                <MeasRow label="Glutes" value={latest.glutes ?? null} />
                <MeasRow label="Thigh"  value={latest.thigh} />
                <MeasRow label="Arm"    value={latest.arm} />
              </div>
            )}

            {/* Measurement history */}
            <div style={{ background: "#161616", border: `1px solid ${border}`, borderRadius: 8, padding: "1.5rem" }}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, margin: "0 0 16px" }}>
                Measurement history
              </p>
              {measurements.length === 0 ? (
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: muted }}>No measurements logged yet</p>
              ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                  {measurements.map((m, i) => (
                    <div key={`${m.date}-${i}`} style={{ border: `1px solid ${border}`, borderRadius: 6, padding: "1rem" }}>
                      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: gold, margin: "0 0 10px", fontWeight: 600 }}>
                        {new Date(m.date).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
                      </p>
                      <MeasRow label="Waist"  value={m.waist} />
                      <MeasRow label="Hips"   value={m.hips} />
                      <MeasRow label="Chest"  value={m.chest} />
                      <MeasRow label="Glutes" value={m.glutes ?? null} />
                      <MeasRow label="Thigh"  value={m.thigh} />
                      <MeasRow label="Arm"    value={m.arm} />
                      {m.custom && m.custom.map((c, ci) => (
                        <MeasRow key={ci} label={c.label} value={Number(c.value)} unit={c.unit || "in"} />
                      ))}
                      {m.notes && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted, marginTop: 8 }}>{m.notes}</p>}
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
