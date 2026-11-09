"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { resolveMacrosFor } from "@/lib/nutrition"
import { RECIPES } from "@/lib/nutritionRecipes"
import type { Recipe } from "@/components/nutrition/RecipeCard"
import type { CoachingClientRecord, NutritionLogRecord } from "@/lib/authTokens"
import NutritionComposer from "@/components/coaching/NutritionComposer.client"
import { ChevronDown, ChevronRight } from "@/components/portal/PortalIcons"
import LogFoodModal from "@/components/coaching/LogFoodModal.client"
import FoodToday from "@/components/portal/FoodToday"
import FoodWeek from "@/components/portal/FoodWeek"
import FoodEntries from "@/components/portal/FoodEntries"
import { localDateKey, addDaysToKey, type LocalDateKey } from "@/lib/localDate"
import { buildDailyTotals, summarizePeriod, recentRepeatedMeals, type DailyTotals, type MacroTarget, type RepeatedMeal } from "@/lib/nutritionAnalytics"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"

const PRINCIPLES: Array<{ title: string; body: string }> = [
  {
    title: "Protein first",
    body: "Build each meal around a source of protein, then add your carbs, fats and vegetables. Aim for about 1 g of protein per pound of body weight across the day.",
  },
  {
    title: "Look at the weekly average",
    body: "Missed your numbers one day? That's okay. What matters is the trend. If you hit your target as a 7-day average, you're on track.",
  },
  {
    title: "Don't drop fat too low",
    body: "Your hormones depend on dietary fat. Even while you're losing fat, keep it at 0.3 to 0.4 g per pound of body weight. Nuts, olive oil, avocado and eggs are all good sources.",
  },
  {
    title: "Water and sleep count too",
    body: "Both affect how hungry you feel, your energy and your recovery. Aim for half your body weight (in pounds) in ounces of water, and at least 7 hours of sleep. Get these right before you worry about your macros.",
  },
]

const WEEKLY_INTRO = `Aim for these numbers as a weekly average. You don't need to hit them perfectly every day, and one bigger day is fine if you balance it out over the week. If your goal is fat loss, keep your weekly average slightly under your target. If it's muscle gain, keep it slightly over. The trend matters more than any single day.`

type Loaded = { client: CoachingClientRecord | null }

function macroRecipes(): Recipe[] {
  const all = Object.values(RECIPES) as Recipe[]
  // Sort by protein-to-calorie density (highest first) so protein-forward
  // recipes bubble to the top — matches the "protein first" principle.
  return [...all]
    .sort((a, b) => (b.proteinG / b.calories) - (a.proteinG / a.calories))
    .slice(0, 6)
}

interface NutritionClientProps {
  ownsNutritionCourse: boolean
  email: string
}

export default function NutritionClient({ ownsNutritionCourse, email }: NutritionClientProps) {
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<Loaded>({ client: null })
  const [logs, setLogs] = useState<NutritionLogRecord[]>([])
  const [logOpen, setLogOpen] = useState<{
    open: boolean
    mealType?: "breakfast" | "lunch" | "dinner" | "snack"
    prefill?: Partial<Pick<NutritionLogRecord, "calories" | "protein" | "carbs" | "fat" | "description" | "mealType" | "isDaySummary">>
    editLogId?: string
  }>({ open: false })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadLogs = useCallback(async () => {
    try {
      // Fetch last 14 days so we have enough context for TODAY + THIS WEEK + a short history.
      const today = localDateKey()
      const from = addDaysToKey(today, -13)
      const res = await fetch(`/api/coaching/nutrition-logs?from=${from}&to=${today}`)
      if (res.ok) {
        const data = await res.json() as { logs: NutritionLogRecord[] }
        setLogs(data.logs ?? [])
      }
    } catch { /* ignore — UI falls back to empty state */ }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/coaching/program")
        if (res.ok) {
          const data = await res.json() as Loaded
          setState(data)
        }
      } catch { /* ignore */ }
      await loadLogs()
      setLoading(false)
    }
    load()
  }, [loadLogs])

  const macros = useMemo(() => {
    if (!state.client) return null
    return resolveMacrosFor(state.client)
  }, [state.client])

  const todayKey: LocalDateKey = localDateKey()
  const weekFrom = addDaysToKey(todayKey, -6)
  const currentTarget: MacroTarget | undefined = useMemo(
    () => (macros ? { calories: macros.calories, protein: macros.protein, carbs: macros.carbs, fat: macros.fat } : undefined),
    [macros],
  )

  const todayLogs = useMemo(() => logs.filter((l) => l.date === todayKey), [logs, todayKey])
  const todayTotals: DailyTotals | null = useMemo(() => {
    if (!macros) return null
    const [row] = buildDailyTotals({ logs: todayLogs, from: todayKey, to: todayKey, currentTarget })
    return row ?? null
  }, [todayLogs, todayKey, currentTarget, macros])

  const weekDailies = useMemo(() => buildDailyTotals({ logs, from: weekFrom, to: todayKey, currentTarget }), [logs, weekFrom, todayKey, currentTarget])
  const weekSummary = useMemo(() => summarizePeriod({ dailies: weekDailies, today: todayKey }), [weekDailies, todayKey])


  // Recent/repeated meals — top 4 from the last 14 days (we already fetched
  // those). Each becomes a one-tap re-log button.
  const repeats = useMemo<RepeatedMeal[]>(() => recentRepeatedMeals(logs, { limit: 4 }), [logs])

  // Delete a log the authed client owns. Confirms, then DELETEs, then reloads
  // so TODAY totals + THIS WEEK averages + Recent Meals all pick up the
  // change in one pass. The admin Nutrition page reads the same records so
  // it reflects the deletion automatically.
  const [selectedDay, setSelectedDay] = useState<LocalDateKey>(localDateKey())
  const flagEstimate = useCallback(async (l: NutritionLogRecord) => {
    if (typeof window === "undefined") return
    const note = window.prompt("What's not right about this estimate? I'll take a look.", "")
    if (note == null) return
    const res = await fetch(`/api/coaching/nutrition-logs/${encodeURIComponent(l.id)}/flag`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: note.slice(0, 500) }) }).catch(() => null)
    window.alert(res?.ok ? "Thanks. I'll take a look." : "That didn't send. Please try again, or message me.")
  }, [])

  const deleteLog = useCallback(async (logId: string, label: string) => {
    if (typeof window !== "undefined" && !window.confirm(`Delete ${label}? You can't undo this.`)) return
    setDeletingId(logId)
    try {
      const res = await fetch(`/api/coaching/nutrition-logs/${encodeURIComponent(logId)}`, { method: "DELETE" })
      if (!res.ok) {
        let message = `Server returned ${res.status}`
        try { const data = await res.json() as { error?: string }; if (data?.error) message = data.error } catch {}
        if (typeof window !== "undefined") window.alert(`That didn't delete. ${message}`)
      } else {
        await loadLogs()
      }
    } catch (err) {
      if (typeof window !== "undefined") window.alert(`That didn't delete. ${err instanceof Error ? err.message : "Check your connection and try again."}`)
    }
    setDeletingId(null)
  }, [loadLogs])

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
        <div style={{ width: 24, height: 24, border: `3px solid ${border}`, borderTop: `3px solid ${accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  const client = state.client

  // Needs setup
  if (!client || !macros) {
    return (
      <div>
        <div style={{ marginBottom: "1.25rem" }}>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.9rem", fontWeight: 700, color: black, margin: 0, lineHeight: 1.2 }}>
            Your personalised macros
          </h1>
        </div>

        <div style={{ background: `${accent}15`, border: `1px solid ${accent}`, borderRadius: 8, padding: "1.5rem 1.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.2rem", fontWeight: 700, color: black, margin: "0 0 8px" }}>
            Finish your setup to see your targets
          </p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: muted, margin: "0 0 16px", lineHeight: 1.55 }}>
            I need a few quick details (height, age, activity and goal) to build your macros. It takes about 90 seconds.
          </p>
          <Link
            href="/my-coaching/setup"
            style={{ display: "inline-block", background: black, color: white, padding: "12px 26px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none", borderRadius: 4, letterSpacing: "0.06em" }}
          >
            Set up my nutrition profile →
          </Link>
        </div>
      </div>
    )
  }

  const recipes = macroRecipes()

  return (
    <div className="pt" style={{ maxWidth: 680 }}>
      <header className="pt-hello" style={{ marginBottom: "1rem" }}>
        <h1>Food</h1>
        <p className="pt-date">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      </header>

      <FoodToday logs={todayLogs} totals={todayTotals} target={{ calories: macros.calories, protein: macros.protein, carbs: macros.carbs, fat: macros.fat }} setByLisa={macros.source === "override"} />

      <FoodEntries
        title={selectedDay === todayKey ? "Today's food" : new Date(`${selectedDay}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        entries={logs.filter((l) => l.date === selectedDay)}
        onAdd={() => setLogOpen({ open: true })}
        onEdit={(l) => setLogOpen({ open: true, editLogId: l.id, prefill: { calories: l.calories, protein: l.protein, carbs: l.carbs, fat: l.fat, description: l.description, mealType: l.mealType, isDaySummary: l.isDaySummary } })}
        onDelete={(l) => deleteLog(l.id, "this entry")}
        onFlag={flagEstimate}
        busyId={deletingId}
      />

      <FoodWeek days={weekDailies} summary={weekSummary} target={{ calories: macros.calories, protein: macros.protein }} todayKey={todayKey} selected={selectedDay} onSelect={setSelectedDay} />

      {repeats.length > 0 && (
        <section className="pt-recent" aria-label="Recent meals">
          <h2>Recent meals</h2>
          <p>Tap one to log it again with the same numbers.</p>
          <div className="pt-recent-list">
            {repeats.map((r) => (
              <button key={r.key} type="button" className="pt-recent-item" onClick={() => setLogOpen({ open: true, mealType: r.mealType, prefill: { calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat, description: r.description, mealType: r.mealType } })}>
                <b>{r.description || (r.mealType ? r.mealType[0].toUpperCase() + r.mealType.slice(1) : "Entry")}</b>
                <span>{r.calories} kcal{r.protein != null ? ` · ${r.protein} g protein` : ""} · logged {r.count}×</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <LogFoodModal
        recentLogs={logs}
        open={logOpen.open}
        onClose={() => setLogOpen({ open: false })}
        initialMealType={logOpen.mealType}
        prefill={logOpen.prefill}
        editLogId={logOpen.editLogId}
        onLogged={() => { loadLogs() }}
      />

      {/* Starting-estimate framing — short, not clinical. Only shown for
          auto-computed targets; when Lisa has set an explicit target this
          note would be misleading. */}
      {macros.source === "auto" && (
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, lineHeight: 1.6, margin: "0 0 1rem", padding: "0 4px" }}>
          These are starting numbers from your profile. We&apos;ll adjust them as we see how you respond.
        </p>
      )}

      {/* Low-calorie guardrail note — auto targets never automatically go
          below 1,200 kcal/day. If the raw estimate would have been lower we
          clamp to the floor and surface this line. */}
      {macros.source === "auto" && macros.belowGuard && (
        <div style={{ background: `${accent}12`, border: `1px solid ${accent}55`, borderRadius: 8, padding: "12px 14px", marginBottom: "1rem" }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, margin: "0 0 4px" }}>
            Individual review
          </p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", color: black, margin: 0, lineHeight: 1.55 }}>
            I prefer to set very low calorie targets with you one on one.
            Please message me before going any lower. If needed, it&apos;s also a
            good idea to talk with a qualified nutrition or medical professional.
          </p>
        </div>
      )}

      <details className="pt-about" style={{ marginBottom: 12 }}>
        <summary>Ask me about your nutrition <ChevronDown /></summary>
        <div style={{ padding: "0 12px 12px" }}>
          <NutritionComposer email={email} />
        </div>
      </details>

      <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.25rem", fontWeight: 700, color: black, margin: "1.75rem 0 0.75rem" }}>Guides</h2>
      <div style={{ display: "grid", gap: 8, marginBottom: "1.25rem" }}>
        <details className="pt-about">
          <summary>How to read your targets <ChevronDown /></summary>
          <p className="pt-about-body">{WEEKLY_INTRO}</p>
        </details>
        <details className="pt-about">
          <summary>Four things that matter <ChevronDown /></summary>
          <div className="pt-about-body" style={{ display: "grid", gap: 14 }}>
            {PRINCIPLES.map((p) => (
              <div key={p.title}>
                <p style={{ fontWeight: 700, margin: "0 0 2px" }}>{p.title}</p>
                <p style={{ margin: 0, color: muted }}>{p.body}</p>
              </div>
            ))}
          </div>
        </details>
        <details className="pt-about">
          <summary>High-protein meal ideas <ChevronDown /></summary>
          <ul className="pt-about-body" style={{ listStyle: "none", margin: 0, display: "grid", gap: 14 }}>
            {recipes.map((r, i) => (
              <li key={i}>
                <p style={{ fontWeight: 700, margin: "0 0 2px" }}>{r.name}</p>
                <p style={{ margin: "0 0 2px", fontSize: "0.875rem", color: muted }}>{r.mealType} · {r.prepMins} min · {r.proteinG}g protein · {r.calories} kcal</p>
                <p style={{ margin: 0, fontSize: "0.875rem" }}>{r.description.split(".")[0]}.</p>
              </li>
            ))}
          </ul>
        </details>
      </div>

      {/* Nutrition Foundations is a separately sold course; the link branches on whether the client owns it. */}
      <Link className="pt-row" href={ownsNutritionCourse ? "/nutrition-foundations" : "/nutrition"} style={{ marginBottom: "1rem" }}>
        <span className="pt-row-main">
          <span className="pt-row-title">{ownsNutritionCourse ? "Open Nutrition Foundations" : "Nutrition Foundations"}</span>
          <span className="pt-row-sub">
            {ownsNutritionCourse
              ? "Your course covers the full system behind calories, macros, meal structure and lasting habits."
              : "My self-guided course on calories, macros, meal structure and habits that last."}
          </span>
        </span>
        <span className="pt-chev"><ChevronRight /></span>
      </Link>

      {/* Small link to setup for edits */}
      <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
        <Link href="/my-coaching/setup" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", color: muted, textDecoration: "underline" }}>
          Update your profile
        </Link>
      </div>
    </div>
  )
}
