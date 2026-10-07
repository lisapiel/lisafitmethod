"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  resolveMacrosFor, formatHeight, activityLabel, validateMacroCalorieConsistency,
} from "@/lib/nutrition"
import type { CoachingClientRecord, NutritionLogRecord } from "@/lib/authTokens"
import { toLbs, normalizeUnit, type WeightUnit } from "@/lib/weight"
import { localDateKey, addDaysToKey, type LocalDateKey } from "@/lib/localDate"
import {
  buildDailyTotals, summarizePeriod, summarizeWeight, periodWindow,
  generateCoachInsights, compareWeeks, measurementChanges,
  type DailyTotals, type MacroTarget, type WeightPoint, type MeasurementChange,
} from "@/lib/nutritionAnalytics"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"
const green = "#5c9e6a"
const red = "#e07070"

const GOAL_LABEL: Record<string, string> = {
  "fat-loss":    "Fat Loss",
  "recomp":      "Body Recomposition",
  "maintain":    "Maintain",
  "muscle-gain": "Muscle Gain",
}

type Timeframe = "7D" | "30D" | "90D" | "ALL"

type AdminCheckIn = {
  id?: string
  clientEmail?: string
  submittedAt?: string
  weight?: number
  weightUnit?: string
}

type AdminSnapshot = {
  id?: string
  clientEmail?: string
  snapshotDate?: string
  weight?: number
  weightUnit?: string
  waist?: number
  hips?: number
  chest?: number
  arm?: number
  thigh?: number
  glutes?: number
  customMeasurements?: string
}

function fmtKcal(n: number): string { return `${Math.round(n).toLocaleString()}` }
function fmtGrams(n: number): string { return `${Math.round(n)}g` }
function fmtPct(n: number): string { return `${Math.round(n * 100)}%` }
function fmtDelta(n: number, unit = ""): string {
  if (n === 0) return `0${unit}`
  return `${n > 0 ? "+" : ""}${Math.round(n)}${unit}`
}

function Chip({ label, children, tone = "default" }: { label: string; children: React.ReactNode; tone?: "default" | "accent" | "muted" }) {
  const color = tone === "accent" ? gold : tone === "muted" ? muted : cream
  return (
    <div>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, margin: "0 0 4px" }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.95rem", color, margin: 0, fontWeight: 600 }}>
        {children}
      </p>
    </div>
  )
}

// Compact SVG line chart. Deliberately small — the Nutrition dashboard shows
// multiple side-by-side mini-trends, not one giant chart. Separate from the
// Progress page's inline WeightChart (left untouched by design).
function MiniLine({
  points, target, color = gold, height = 90, label,
}: {
  points: Array<{ x: string | number; y: number | null }>
  target?: number
  color?: string
  height?: number
  label: string
}) {
  const valid = points.filter((p) => p.y != null) as Array<{ x: string | number; y: number }>
  if (valid.length === 0) {
    return (
      <div style={{ padding: "0.5rem 0" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, margin: "0 0 4px" }}>{label}</p>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted, margin: 0 }}>No data yet</p>
      </div>
    )
  }
  const ys = valid.map((p) => p.y)
  if (target != null) ys.push(target)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const padY = (maxY - minY) * 0.15 || 1
  const yLo = minY - padY
  const yHi = maxY + padY
  const W = 100
  const H = height
  const stepX = points.length > 1 ? W / (points.length - 1) : 0
  const toY = (y: number) => H - ((y - yLo) / Math.max(0.001, yHi - yLo)) * H
  const d = points
    .map((p, i) => (p.y != null ? `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(2)},${toY(p.y).toFixed(2)}` : ""))
    .filter(Boolean)
    .join(" ")
  const targetY = target != null ? toY(target) : null
  return (
    <div>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, margin: "0 0 4px" }}>{label}</p>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block", background: "#0a0a0a", border: `1px solid ${border}` }}>
        {targetY != null && (
          <line x1={0} y1={targetY} x2={W} y2={targetY} stroke={muted} strokeWidth={0.5} strokeDasharray="2 2" />
        )}
        <path d={d} fill="none" stroke={color} strokeWidth={1.4} />
        {points.map((p, i) =>
          p.y != null ? (
            <circle key={i} cx={i * stepX} cy={toY(p.y)} r={1.4} fill={color} />
          ) : null
        )}
      </svg>
    </div>
  )
}

type MeasurementRow = { date: string; label: string; value: number; unit: string }
function parseMeasurementSnapshot(json: string | undefined, date: string): MeasurementRow[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((m: unknown) => (typeof m === "object" && m ? m as Record<string, unknown> : null))
      .filter((m): m is Record<string, unknown> => m != null)
      .map((m) => ({
        date,
        label: typeof m.label === "string" ? m.label : "",
        value: Number(m.value),
        unit: typeof m.unit === "string" ? m.unit : "in",
      }))
      .filter((m) => m.label && Number.isFinite(m.value))
  } catch {
    return []
  }
}

export default function AdminClientNutritionPage() {
  const params = useParams()
  const emailParam = decodeURIComponent(params.email as string)

  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<CoachingClientRecord | null>(null)
  const [logs, setLogs] = useState<NutritionLogRecord[]>([])
  const [checkIns, setCheckIns] = useState<AdminCheckIn[]>([])
  const [snapshots, setSnapshots] = useState<AdminSnapshot[]>([])
  const [timeframe, setTimeframe] = useState<Timeframe>("7D")

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [error, setError] = useState("")

  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fat, setFat] = useState("")

  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) { setLoading(false); return }
      const auth = { Authorization: `Bearer ${token}` }
      const [clientRes, logsRes, checkInsRes, snapsRes] = await Promise.allSettled([
        fetch(`/api/admin/coaching/clients/${encodeURIComponent(emailParam)}`, { headers: auth }).then((r) => r.json()),
        fetch(`/api/admin/coaching/clients/${encodeURIComponent(emailParam)}/nutrition-logs`, { headers: auth }).then((r) => r.json()),
        fetch(`/api/admin/coaching/check-ins`, { headers: auth }).then((r) => r.json()),
        fetch(`/api/admin/coaching/progress/${encodeURIComponent(emailParam)}`, { headers: auth }).then((r) => r.json()),
      ])
      if (clientRes.status === "fulfilled" && clientRes.value?.client) {
        setClient(clientRes.value.client as CoachingClientRecord)
      }
      if (logsRes.status === "fulfilled" && Array.isArray(logsRes.value?.logs)) {
        setLogs(logsRes.value.logs as NutritionLogRecord[])
      }
      if (checkInsRes.status === "fulfilled" && Array.isArray(checkInsRes.value?.checkIns)) {
        const all = checkInsRes.value.checkIns as AdminCheckIn[]
        setCheckIns(all.filter((c) => (c.clientEmail ?? "").toLowerCase() === emailParam.toLowerCase()))
      }
      if (snapsRes.status === "fulfilled" && Array.isArray(snapsRes.value?.snapshots)) {
        setSnapshots(snapsRes.value.snapshots as AdminSnapshot[])
      }
    } catch { /* silent — UI shows empty states */ }
    setLoading(false)
  }, [emailParam])

  useEffect(() => { load() }, [load])

  const effective = useMemo(() => (client ? resolveMacrosFor(client) : null), [client])
  const autoOnly = useMemo(() => {
    if (!client) return null
    const bare: CoachingClientRecord = { ...client, customMacros: undefined }
    return resolveMacrosFor(bare)
  }, [client])
  const hasOverride = effective?.source === "override"

  // Prefill edit form with the ACTIVE target values whenever we open editing.
  useEffect(() => {
    if (!editing) return
    const base = effective ?? autoOnly
    if (!base) return
    setCalories(String(base.calories))
    setProtein(String(base.protein))
    setCarbs(String(base.carbs))
    setFat(String(base.fat))
  }, [editing, effective, autoOnly])

  const todayKey = localDateKey()
  const firstLogDate = useMemo<LocalDateKey | undefined>(() => {
    const sorted = [...logs].map((l) => l.date).sort()
    return sorted[0] as LocalDateKey | undefined
  }, [logs])
  const window = useMemo(() => periodWindow(timeframe, todayKey, firstLogDate), [timeframe, todayKey, firstLogDate])

  const currentTarget: MacroTarget | undefined = useMemo(
    () => (effective ? { calories: effective.calories, protein: effective.protein, carbs: effective.carbs, fat: effective.fat } : undefined),
    [effective],
  )

  const dailies: DailyTotals[] = useMemo(() => buildDailyTotals({
    logs, from: window.from, to: window.to, currentTarget,
  }), [logs, window.from, window.to, currentTarget])

  const summary = useMemo(() => summarizePeriod({ dailies, today: todayKey }), [dailies, todayKey])
  const weekly = useMemo(() => compareWeeks({ logs, today: todayKey, currentTarget }), [logs, todayKey, currentTarget])

  // Weight points — reuse Progress source of truth, read via canonical toLbs.
  const weightPoints: WeightPoint[] = useMemo(() => {
    const points: WeightPoint[] = []
    const startLbs = client?.startingWeight && client.startingWeight > 0 ? client.startingWeight : null
    const sortedCheckIns = [...checkIns]
      .filter((ci) => ci.weight != null)
      .sort((a, b) => (a.submittedAt ?? "").localeCompare(b.submittedAt ?? ""))
    const firstCheckInDate = sortedCheckIns[0]?.submittedAt?.slice(0, 10)
    const startDate = (client?.subscriptionStartDate ?? client?.createdAt)?.slice(0, 10)
    if (startLbs && startDate && (!firstCheckInDate || startDate < firstCheckInDate)) {
      points.push({ date: startDate, lbs: startLbs })
    }
    for (const ci of sortedCheckIns) {
      const lbs = toLbs(ci.weight, ci.weightUnit)
      if (lbs != null && ci.submittedAt) {
        points.push({ date: ci.submittedAt.slice(0, 10), lbs })
      }
    }
    return points
  }, [checkIns, client])

  const weightTrend = useMemo(() => summarizeWeight(weightPoints), [weightPoints])
  const displayUnit: WeightUnit = normalizeUnit(client?.weightUnit)
  const insights = useMemo(() => generateCoachInsights({ summary, weight: weightTrend, currentTarget }), [summary, weightTrend, currentTarget])

  const measurementHistory: MeasurementRow[] = useMemo(() => {
    const rows: MeasurementRow[] = []
    for (const s of snapshots) {
      const d = s.snapshotDate?.slice(0, 10) ?? ""
      if (!d) continue
      const fields: Array<[string, number | undefined, string]> = [
        ["Waist", s.waist, "in"],
        ["Hips", s.hips, "in"],
        ["Chest", s.chest, "in"],
        ["Arm", s.arm, "in"],
        ["Thigh", s.thigh, "in"],
        ["Glutes", s.glutes, "in"],
      ]
      for (const [label, v, unit] of fields) {
        if (v != null && Number.isFinite(v)) rows.push({ date: d, label, value: v, unit })
      }
    }
    for (const ci of checkIns) {
      const parsed = parseMeasurementSnapshot((ci as unknown as { measurementSnapshot?: string }).measurementSnapshot, ci.submittedAt?.slice(0, 10) ?? "")
      for (const m of parsed) if (m.date) rows.push(m)
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date))
  }, [snapshots, checkIns])

  const latestMeasurements = useMemo(() => {
    const byLabel = new Map<string, MeasurementRow>()
    for (const m of measurementHistory) if (!byLabel.has(m.label)) byLabel.set(m.label, m)
    return Array.from(byLabel.values())
  }, [measurementHistory])

  // Measurement change scoped to the selected timeframe. Reuses the same
  // merged measurementHistory the Latest card uses — no duplicate records.
  const measurementChangeRows: MeasurementChange[] = useMemo(() => {
    const rows = measurementHistory.map((m) => ({ date: m.date, label: m.label, value: m.value, unit: m.unit }))
    return measurementChanges({ rows, from: window.from, to: window.to })
  }, [measurementHistory, window.from, window.to])

  async function saveOverride() {
    setSaving(true)
    setError("")
    const n = (s: string) => (s === "" ? NaN : Number(s))
    const complete = { calories: n(calories), protein: n(protein), carbs: n(carbs), fat: n(fat) }
    if ([complete.calories, complete.protein, complete.carbs, complete.fat].some((v) => !Number.isFinite(v) || v <= 0)) {
      setError("Enter all four macros to save a coach target. Reset Override to go back to the auto target.")
      setSaving(false)
      return
    }
    const inconsistency = validateMacroCalorieConsistency(complete)
    if (inconsistency) {
      setError(inconsistency + " Adjust the macros or calories so they agree, or Reset Override.")
      setSaving(false)
      return
    }
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      const res = await fetch(`/api/admin/coaching/clients/${encodeURIComponent(emailParam)}/nutrition`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ customMacros: complete }),
      })
      if (res.ok) {
        setEditing(false)
        setSavedFlash(true)
        setTimeout(() => setSavedFlash(false), 2000)
        await load()
      } else {
        let message = `Server returned ${res.status}`
        try { const data = await res.json() as { error?: string }; if (data?.error) message = data.error } catch {}
        setError(message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error while saving.")
    }
    setSaving(false)
  }

  async function resetOverride() {
    setSaving(true)
    setError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      const res = await fetch(`/api/admin/coaching/clients/${encodeURIComponent(emailParam)}/nutrition`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ customMacros: null }),
      })
      if (res.ok) {
        setEditing(false)
        await load()
      } else {
        let message = `Server returned ${res.status}`
        try { const data = await res.json() as { error?: string }; if (data?.error) message = data.error } catch {}
        setError(message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "3rem", color: muted }}>
        <div style={{ width: 18, height: 18, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem" }}>Loading…</span>
      </div>
    )
  }

  if (!client) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", color: muted }}>Client not found</p>
        <Link href="/admin/coaching/clients" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: gold, textDecoration: "none" }}>← Back to clients</Link>
      </div>
    )
  }

  const hasBodyData = client.heightInches != null && client.age != null && client.sex != null && client.activityLevel != null

  const caloriesSeries = dailies.map((d) => ({ x: d.date, y: d.logged ? d.calories : null }))
  const proteinSeries = dailies.map((d) => ({ x: d.date, y: d.logged ? d.protein : null }))
  const weightSeries = dailies.map((d) => {
    const match = weightPoints.find((p) => p.date.slice(0, 10) === d.date)
    return { x: d.date, y: match ? match.lbs : null }
  })

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <Link href={`/admin/coaching/clients/${encodeURIComponent(emailParam)}`} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: "#666", textDecoration: "none" }}>
          ← {client.displayName}
        </Link>
        <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.8rem", fontWeight: 300, color: cream, margin: 0, flex: 1 }}>
          Nutrition
        </h1>
      </div>

      {/* A. Current Targets ─────────────────────────────────────────────── */}
      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: 0 }}>
            Current Targets
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {hasOverride && (
              <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: green, letterSpacing: "0.08em", fontWeight: 700 }}>
                ● COACH OVERRIDE ACTIVE
              </span>
            )}
            {!hasOverride && effective && (
              <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.08em", fontWeight: 700 }}>
                AUTO RECOMMENDATION ACTIVE
              </span>
            )}
          </div>
        </div>
        {effective ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 14, marginBottom: 10 }}>
              <Chip label="Calories" tone="accent">{fmtKcal(effective.calories)} kcal</Chip>
              <Chip label="Protein">{fmtGrams(effective.protein)}</Chip>
              <Chip label="Carbs">{fmtGrams(effective.carbs)}</Chip>
              <Chip label="Fat">{fmtGrams(effective.fat)}</Chip>
            </div>
            {hasOverride && autoOnly && (
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: muted, margin: "0 0 10px" }}>
                Auto recommendation: {fmtKcal(autoOnly.calories)} kcal · {autoOnly.protein}P · {autoOnly.carbs}C · {autoOnly.fat}F
              </p>
            )}
          </>
        ) : (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: muted, margin: "0 0 10px" }}>
            No active target yet — client needs to complete body-data setup, or you can set a coach override below.
          </p>
        )}
        {!editing ? (
          <button
            onClick={() => { setEditing(true); setError("") }}
            style={{ background: "none", border: `1px solid ${gold}`, color: gold, padding: "7px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Edit Targets
          </button>
        ) : (
          <div style={{ marginTop: 12, padding: 12, background: "#0a0a0a", border: `1px solid ${border}` }}>
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: muted, margin: "0 0 10px", lineHeight: 1.5 }}>
              A coach target must include all four macros. Protein × 4 + carbs × 4 + fat × 9 must agree with calories within a small rounding tolerance; otherwise the save is refused.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 10 }}>
              {[
                { label: "Calories", value: calories, set: setCalories },
                { label: "Protein (g)", value: protein, set: setProtein },
                { label: "Carbs (g)", value: carbs, set: setCarbs },
                { label: "Fat (g)", value: fat, set: setFat },
              ].map((f) => (
                <div key={f.label}>
                  <label style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, display: "block", marginBottom: 4 }}>
                    {f.label}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: cream, padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>
            {error && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: red, margin: "0 0 10px" }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={saveOverride} disabled={saving} style={{ background: saving ? "#555" : gold, color: "#0a0a0a", border: "none", padding: "9px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: saving ? "wait" : "pointer" }}>
                {saving ? "Saving…" : "Save coach target"}
              </button>
              <button onClick={() => { setEditing(false); setError("") }} disabled={saving} style={{ background: "none", border: `1px solid ${border}`, color: muted, padding: "9px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                Cancel
              </button>
              {hasOverride && (
                <button onClick={resetOverride} disabled={saving} style={{ background: "none", border: `1px solid ${red}`, color: red, padding: "9px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", marginLeft: "auto" }}>
                  Reset override
                </button>
              )}
              {savedFlash && (
                <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: green, fontWeight: 600 }}>✓ Saved</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Body data (preserved) ─────────────────────────────────────────── */}
      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: 0 }}>
            Body data
          </p>
          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.08em" }}>
            Client edits at /my-coaching/setup
          </span>
        </div>
        {hasBodyData ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14 }}>
            <Chip label="Sex">{client.sex}</Chip>
            <Chip label="Age">{client.age}</Chip>
            <Chip label="Height">{formatHeight(client.heightInches!)}</Chip>
            <Chip label="Starting weight">{client.startingWeight ? `${client.startingWeight} lbs` : "—"}</Chip>
            <Chip label="Activity">{activityLabel(client.activityLevel) ?? "—"}</Chip>
            <Chip label="Goal">{client.nutritionGoal ? GOAL_LABEL[client.nutritionGoal] : "—"}</Chip>
          </div>
        ) : (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: muted, margin: 0 }}>
            No body data yet — client hasn&apos;t completed setup.
          </p>
        )}
      </div>

      {/* B. Progress Overview + timeframe ──────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: 0 }}>
          Progress Overview
        </p>
        <div style={{ display: "flex", gap: 4, marginLeft: "auto", flexWrap: "wrap" }}>
          {(["7D", "30D", "90D", "ALL"] as Timeframe[]).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              style={{
                background: timeframe === t ? gold : "transparent",
                color: timeframe === t ? "#0a0a0a" : muted,
                border: `1px solid ${timeframe === t ? gold : border}`,
                padding: "4px 10px",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em",
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
          <Chip label="Avg calories">
            {summary.avg ? `${fmtKcal(summary.avg.calories)} kcal` : "—"}
            {summary.avg && effective && (
              <span style={{ fontSize: "0.65rem", color: Math.abs(summary.avg.calories - effective.calories) <= effective.calories * 0.05 ? green : muted, marginLeft: 6, fontWeight: 500 }}>
                ({fmtDelta(summary.avg.calories - effective.calories, " vs target")})
              </span>
            )}
          </Chip>
          <Chip label="Avg protein">
            {summary.avg ? fmtGrams(summary.avg.protein) : "—"}
            {summary.avg && effective && (
              <span style={{ fontSize: "0.65rem", color: muted, marginLeft: 6, fontWeight: 500 }}>
                / {effective.protein}g
              </span>
            )}
          </Chip>
          <Chip label="Avg carbs">{summary.avg ? fmtGrams(summary.avg.carbs) : "—"}</Chip>
          <Chip label="Avg fat">{summary.avg ? fmtGrams(summary.avg.fat) : "—"}</Chip>
          <Chip label="Days logged">
            {summary.loggedDays} / {summary.expectedDays}
            <span style={{ fontSize: "0.65rem", color: muted, marginLeft: 6, fontWeight: 500 }}>
              ({fmtPct(summary.loggingAdherence)})
            </span>
          </Chip>
          {weightTrend.latest && (
            <Chip label="Latest weight">{weightTrend.latest.lbs.toFixed(1)} {displayUnit === "KG" ? "kg" : "lb"}</Chip>
          )}
          {weightTrend.first && weightTrend.latest && weightTrend.latest !== weightTrend.first && (
            <Chip label="Weight change">
              {fmtDelta(weightTrend.totalChangeLbs, " lb")}
            </Chip>
          )}
          {weightTrend.ratePerWeekLbs != null && (
            <Chip label="Weight trend">
              {weightTrend.ratePerWeekLbs > 0 ? "+" : ""}{weightTrend.ratePerWeekLbs.toFixed(1)} lb/wk
              <span style={{ fontSize: "0.6rem", color: muted, marginLeft: 6, fontWeight: 500 }}>({weightTrend.confidence} conf.)</span>
            </Chip>
          )}
        </div>
        {!summary.avg && (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: muted, margin: "10px 0 0" }}>
            No nutrition logs in this window yet.
          </p>
        )}
      </div>

      {/* C. Trends ─────────────────────────────────────────────────────── */}
      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: "0 0 10px" }}>
          Trends ({window.from} → {window.to})
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          <MiniLine points={caloriesSeries} target={effective?.calories} color={gold} label="Daily calories" />
          <MiniLine points={proteinSeries} target={effective?.protein} color="#e8c98a" label="Daily protein" />
          <MiniLine points={weightSeries} color={cream} label="Weight (lb)" />
        </div>
      </div>

      {/* D. Coach insights ─────────────────────────────────────────────── */}
      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: "0 0 10px" }}>
          Coach insights
        </p>
        <div>
          {insights.map((i) => {
            const toneColor = i.tone === "watch" ? "#e8a662" : i.tone === "positive" ? green : muted
            const dot = i.tone === "watch" ? "●" : i.tone === "positive" ? "✓" : "·"
            return (
              <div key={i.key} style={{ borderTop: `1px solid ${border}`, padding: "10px 0" }}>
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: cream, margin: 0, lineHeight: 1.5 }}>
                  <span style={{ color: toneColor, marginRight: 8, fontWeight: 700 }}>{dot}</span>
                  {i.headline}
                </p>
                {i.detail && (
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: muted, margin: "4px 0 0 18px", lineHeight: 1.5 }}>
                    {i.detail}
                  </p>
                )}
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, margin: "4px 0 0 18px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {i.confidence} confidence
                </p>
              </div>
            )
          })}
        </div>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: muted, margin: "12px 0 0", lineHeight: 1.5, fontStyle: "italic" }}>
          Decision support only. Nothing here automatically changes a client&apos;s target.
        </p>
      </div>

      {/* Weekly comparison ────────────────────────────────────────────── */}
      {(weekly.thisWeek.avg || weekly.previousWeek.avg) && (
        <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: "0 0 12px" }}>
            This week vs previous week
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, margin: "0 0 6px" }}>
                This week ({weekly.thisWeek.from} → {weekly.thisWeek.to})
              </p>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: cream, margin: "0 0 2px", fontWeight: 600 }}>
                {weekly.thisWeek.avg ? `${fmtKcal(weekly.thisWeek.avg.calories)} kcal` : "No logs"}
              </p>
              {weekly.thisWeek.avg && (
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: muted, margin: 0 }}>
                  {weekly.thisWeek.avg.protein}g protein · {weekly.thisWeek.loggedDays} days logged
                </p>
              )}
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, margin: "0 0 6px" }}>
                Previous week ({weekly.previousWeek.from} → {weekly.previousWeek.to})
              </p>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: cream, margin: "0 0 2px", fontWeight: 600 }}>
                {weekly.previousWeek.avg ? `${fmtKcal(weekly.previousWeek.avg.calories)} kcal` : "No logs"}
              </p>
              {weekly.previousWeek.avg && (
                <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: muted, margin: 0 }}>
                  {weekly.previousWeek.avg.protein}g protein · {weekly.previousWeek.loggedDays} days logged
                </p>
              )}
            </div>
          </div>
          {(weekly.caloriesDelta != null || weekly.proteinDelta != null || weekly.loggingDelta !== 0) && (
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: muted, margin: "12px 0 0", lineHeight: 1.5 }}>
              Δ {weekly.caloriesDelta != null ? `${fmtDelta(weekly.caloriesDelta)} kcal/day` : ""}
              {weekly.proteinDelta != null ? ` · ${fmtDelta(weekly.proteinDelta)}g protein/day` : ""}
              {weekly.loggingDelta !== 0 ? ` · ${fmtDelta(weekly.loggingDelta)} days logged` : ""}
            </p>
          )}
        </div>
      )}

      {/* Measurement change (reads from Progress source — read-only) ──── */}
      {measurementChangeRows.length > 0 && (
        <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
            <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: 0 }}>
              Measurement change
            </p>
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.08em" }}>
              {window.from} → {window.to}
            </span>
          </div>
          <div>
            {measurementChangeRows.map((r) => {
              const toneColor = r.tone === "down" ? green : r.tone === "up" ? "#e8a662" : muted
              const sign = r.deltaValue > 0 ? "+" : ""
              return (
                <div key={r.label} style={{ borderTop: `1px solid ${border}`, padding: "8px 0", display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: muted, minWidth: 70 }}>
                    {r.label}
                  </span>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", color: cream }}>
                    {r.startValue} → {r.endValue} {r.unit}
                  </span>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: toneColor, fontWeight: 700, marginLeft: "auto" }}>
                    {r.tone === "flat" ? "no change" : `${sign}${r.deltaValue.toFixed(1)} ${r.unit}`}
                  </span>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {r.readings} readings
                  </span>
                </div>
              )
            })}
          </div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: muted, margin: "10px 0 0" }}>
            Full measurement history lives on the <Link href={`/admin/coaching/clients/${encodeURIComponent(emailParam)}/progress`} style={{ color: gold, textDecoration: "none" }}>Progress page</Link>.
          </p>
        </div>
      )}

      {/* Latest measurements — single-reading labels fall through to this
          summary so we still surface what was captured. */}
      {latestMeasurements.length > 0 && (
        <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: "0 0 10px" }}>
            Latest measurements
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14 }}>
            {latestMeasurements.map((m) => (
              <Chip key={m.label} label={m.label}>{m.value}{m.unit}</Chip>
            ))}
          </div>
        </div>
      )}

      {/* E. Daily Nutrition History ────────────────────────────────────── */}
      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: "0 0 10px" }}>
          Daily nutrition history
        </p>
        {dailies.length === 0 ? (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted, margin: 0 }}>No days yet.</p>
        ) : (
          <div>
            {[...dailies].reverse().slice(0, 30).map((d) => {
              const expanded = !!expandedDays[d.date]
              const dayLogs = logs.filter((l) => l.date === d.date).sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
              const label = d.date === todayKey ? "TODAY" : d.date === addDaysToKey(todayKey, -1) ? "YESTERDAY" : new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
              return (
                <div key={d.date} style={{ borderTop: `1px solid ${border}`, padding: "10px 0" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", color: muted, minWidth: 90 }}>
                      {label}
                    </span>
                    {d.logged ? (
                      <>
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: cream, fontWeight: 600 }}>
                          {fmtKcal(d.calories)} / {d.target ? fmtKcal(d.target.calories) : "—"} kcal
                        </span>
                        <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: muted }}>
                          {fmtGrams(d.protein)} / {d.target ? fmtGrams(d.target.protein) : "—"} P
                        </span>
                        {d.entryCount > 0 && (
                          <button onClick={() => setExpandedDays((prev) => ({ ...prev, [d.date]: !prev[d.date] }))} style={{ background: "none", border: "none", color: gold, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", marginLeft: "auto" }}>
                            {expanded ? "Hide" : `View ${d.entryCount}`}
                          </button>
                        )}
                      </>
                    ) : (
                      <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: muted, fontStyle: "italic" }}>
                        Not logged
                      </span>
                    )}
                  </div>
                  {expanded && dayLogs.length > 0 && (
                    <div style={{ marginTop: 10, paddingLeft: 100 }}>
                      {dayLogs.map((l) => (
                        <div key={l.id} style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.72rem", color: cream, marginBottom: 4 }}>
                          <span style={{ color: muted, textTransform: "uppercase", fontSize: "0.55rem", letterSpacing: "0.08em", fontWeight: 700, marginRight: 8 }}>
                            {l.mealType ?? l.kind}
                          </span>
                          <strong>{fmtKcal(l.calories)}k</strong> · {l.protein}P
                          {l.carbs != null ? ` · ${l.carbs}C` : ""}
                          {l.fat != null ? ` · ${l.fat}F` : ""}
                          {l.description ? (
                            <span style={{ color: muted }}> — {l.description}</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {dailies.length > 30 && (
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", color: muted, margin: "10px 0 0" }}>
                Showing most recent 30 days. Pick a shorter timeframe to filter.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
