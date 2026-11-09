"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useParams } from "next/navigation"
import Link from "next/link"
import { resolveMacrosFor } from "@/lib/nutrition"
import type { CoachingClientRecord, NutritionLogRecord } from "@/lib/authTokens"
import { localDateKey, addDaysToKey } from "@/lib/localDate"
import { buildDailyTotals, type MacroTarget } from "@/lib/nutritionAnalytics"
import { buildDayInfo } from "@/components/coaching/admin/nutrition/dayInfo"
import { SummaryCard } from "@/components/coaching/admin/nutrition/SummaryCard"
import { CaloriesChart } from "@/components/coaching/admin/nutrition/CaloriesChart"
import { WeightCard } from "@/components/coaching/admin/nutrition/WeightCard"
import { DaysList } from "@/components/coaching/admin/nutrition/DaysList"
import { TargetCard } from "@/components/coaching/admin/nutrition/TargetCard"
import { RecoverySection } from "@/components/coaching/admin/nutrition/RecoverySection"
import { BodyDataCard } from "@/components/coaching/admin/nutrition/BodyDataCard"
import type { AdminCheckIn, AdminSnapshot } from "@/components/coaching/admin/nutrition/types"
import "@/components/coaching/admin/nutrition/nutritionAdmin.css"

const CHART_DAYS = 30

function pickMacros(m: MacroTarget | null | undefined): MacroTarget | null {
  return m ? { calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat } : null
}

export default function AdminClientNutritionPage() {
  const params = useParams()
  const emailParam = decodeURIComponent(params.email as string)

  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<CoachingClientRecord | null>(null)
  const [logs, setLogs] = useState<NutritionLogRecord[]>([])
  const [checkIns, setCheckIns] = useState<AdminCheckIn[]>([])
  const [snapshots, setSnapshots] = useState<AdminSnapshot[]>([])

  const load = useCallback(async () => {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) return
      const auth = { Authorization: `Bearer ${token}` }
      const base = `/api/admin/coaching/clients/${encodeURIComponent(emailParam)}`
      const [clientRes, logsRes, checkInsRes, snapsRes] = await Promise.allSettled([
        fetch(base, { headers: auth, cache: "no-store" }).then((r) => r.json()),
        fetch(`${base}/nutrition-logs`, { headers: auth, cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/admin/coaching/check-ins`, { headers: auth, cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/admin/coaching/progress/${encodeURIComponent(emailParam)}`, { headers: auth, cache: "no-store" }).then((r) => r.json()),
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
    } catch { /* each section shows its own empty state */ }
  }, [emailParam])

  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  const effective = useMemo(() => (client ? resolveMacrosFor(client) : null), [client])
  const starting = useMemo(() => (client ? pickMacros(resolveMacrosFor({ ...client, customMacros: undefined })) : null), [client])
  const currentTarget = useMemo(() => pickMacros(effective), [effective])

  const todayKey = localDateKey()
  const days = useMemo(() => {
    const dailies = buildDailyTotals({
      logs, from: addDaysToKey(todayKey, -(CHART_DAYS - 1)), to: todayKey, currentTarget: currentTarget ?? undefined,
    })
    return buildDayInfo(dailies, logs)
  }, [logs, todayKey, currentTarget])
  const week = useMemo(() => days.slice(-7), [days])

  if (loading) {
    return (
      <div role="status" style={{ display: "flex", alignItems: "center", gap: 10, padding: "3rem 0", color: "var(--ca-muted)" }}>
        <div style={{ width: 18, height: 18, border: "2px solid var(--ca-line)", borderTop: "2px solid var(--ca-accent-mark)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
        <span style={{ fontSize: "0.875rem" }}>Loading…</span>
      </div>
    )
  }

  if (!client) {
    return (
      <div style={{ padding: "2rem 0", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--ca-serif)", fontSize: "1.4rem", color: "var(--ca-muted)" }}>Client not found</p>
        <Link href="/admin/coaching/clients" className="ca-link">Back to clients</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="ca-title" style={{ marginBottom: 16 }}>Nutrition</h1>
      <div className="can">
        <div className="can-col">
          <div className="can-o1"><SummaryCard week={week} target={currentTarget} todayKey={todayKey} /></div>
          <div className="can-o2"><CaloriesChart days={days} targetCalories={currentTarget?.calories ?? null} todayKey={todayKey} /></div>
          <div className="can-o4"><DaysList logs={logs} currentTarget={currentTarget ?? undefined} todayKey={todayKey} /></div>
        </div>
        <div className="can-col">
          <div className="can-o5">
            <TargetCard email={emailParam} current={currentTarget} isCustom={effective?.source === "override"} starting={starting} onChanged={load} />
          </div>
          <div className="can-o3"><WeightCard client={client} checkIns={checkIns} /></div>
          <div className="can-o6"><RecoverySection email={emailParam} onLogsChanged={load} /></div>
          <div className="can-o7"><BodyDataCard client={client} email={emailParam} snapshots={snapshots} checkIns={checkIns} /></div>
        </div>
      </div>
    </div>
  )
}
