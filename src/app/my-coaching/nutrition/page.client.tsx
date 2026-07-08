"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { resolveMacrosFor } from "@/lib/nutrition"
import { RECIPES } from "@/lib/nutritionRecipes"
import type { Recipe } from "@/components/nutrition/RecipeCard"
import type { CoachingClientRecord } from "@/lib/authTokens"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"

const PRINCIPLES: Array<{ title: string; body: string }> = [
  {
    title: "Protein first",
    body: "Anchor every meal with protein. Carbs, fats, and veg build around it. Aim for ~1g per lb of bodyweight across the day.",
  },
  {
    title: "Weekly average beats daily perfection",
    body: "Miss a day? Not a problem. What matters is the trend — hit your target as a 7-day average and you're on track.",
  },
  {
    title: "Don't drop fat too low",
    body: "Dietary fat drives hormones. Even in a cut, keep it at 0.3–0.4g per lb of bodyweight. Nuts, olive oil, avocado, eggs.",
  },
  {
    title: "Water + sleep are levers",
    body: "Both change hunger, energy, and recovery cues. Half your bodyweight in ounces of water, 7+ hours of sleep — before you touch macros.",
  },
]

const WEEKLY_INTRO = `Aim for these numbers as a weekly average — not daily perfection. One heavy day is fine if you balance across the week. Fat loss = weekly average slightly under target; muscle gain = slightly over. Trend matters more than any single day.`

type Loaded = { client: CoachingClientRecord | null }

function macroRecipes(): Recipe[] {
  const all = Object.values(RECIPES) as Recipe[]
  // Sort by protein-to-calorie density (highest first) so protein-forward
  // recipes bubble to the top — matches the "protein first" principle.
  return [...all]
    .sort((a, b) => (b.proteinG / b.calories) - (a.proteinG / a.calories))
    .slice(0, 6)
}

export default function NutritionClient() {
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<Loaded>({ client: null })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/coaching/program")
        if (res.ok) {
          const data = await res.json() as Loaded
          setState(data)
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  const macros = useMemo(() => {
    if (!state.client) return null
    return resolveMacrosFor(state.client)
  }, [state.client])

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
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, margin: "0 0 4px" }}>
            Nutrition
          </p>
          <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.9rem", fontWeight: 700, color: black, margin: 0, lineHeight: 1.2 }}>
            Your personalised macros
          </h1>
        </div>

        <div style={{ background: `${accent}15`, border: `1px solid ${accent}`, borderRadius: 8, padding: "1.5rem 1.5rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.2rem", fontWeight: 700, color: black, margin: "0 0 8px" }}>
            Finish your setup to see your targets
          </p>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: muted, margin: "0 0 16px", lineHeight: 1.55 }}>
            I need a few quick details — height, age, activity, goal — to build your macros. Takes 90 seconds.
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
    <div>
      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, margin: "0 0 4px" }}>
          Nutrition
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.9rem", fontWeight: 700, color: black, margin: 0, lineHeight: 1.2 }}>
          Your daily target
        </h1>
      </div>

      {/* Hero macro card */}
      <div style={{ background: black, color: white, borderRadius: 8, padding: "1.5rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, margin: 0 }}>
            Daily target · Weekly average
          </p>
          {macros.source === "override" ? (
            <span style={{ background: accent, color: black, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", padding: "3px 8px", borderRadius: 3, textTransform: "uppercase" }}>
              Set by Lisa
            </span>
          ) : (
            <span style={{ color: "#a4a09a", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem" }}>
              Auto from your profile
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-playfair), serif", fontSize: "2.4rem", fontWeight: 700, lineHeight: 1 }}>
            {macros.calories.toLocaleString()}
          </span>
          <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", color: "#c9c4bd" }}>
            kcal
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {[
            { label: "Protein", value: macros.protein, note: "1g per lb" },
            { label: "Carbs",   value: macros.carbs,   note: "the rest" },
            { label: "Fat",     value: macros.fat,     note: "0.35g per lb" },
          ].map((m) => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "10px 12px" }}>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", color: accent, textTransform: "uppercase", margin: "0 0 3px" }}>
                {m.label}
              </p>
              <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.4rem", fontWeight: 700, color: white, margin: 0, lineHeight: 1 }}>
                {m.value}<span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: "#a4a09a", marginLeft: 3 }}>g</span>
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", color: "#7b7770", margin: "3px 0 0" }}>
                {m.note}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly-average explainer */}
      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, margin: "0 0 8px" }}>
          Read this once
        </p>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: black, margin: 0, lineHeight: 1.7 }}>
          {WEEKLY_INTRO}
        </p>
      </div>

      {/* Key principles */}
      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, margin: "1.5rem 0 0.75rem" }}>
        Four things that matter
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: "1.5rem" }}>
        {PRINCIPLES.map((p) => (
          <div key={p.title} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "14px 16px" }}>
            <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1rem", fontWeight: 700, color: black, margin: "0 0 6px" }}>
              {p.title}
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", color: muted, margin: 0, lineHeight: 1.55 }}>
              {p.body}
            </p>
          </div>
        ))}
      </div>

      {/* Meal ideas */}
      <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: accent, margin: "0 0 0.75rem" }}>
        Meal ideas · high protein
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, marginBottom: "1.5rem" }}>
        {recipes.map((r, i) => (
          <div key={i} style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "14px 16px" }}>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em", color: accent, textTransform: "uppercase", margin: "0 0 4px" }}>
              {r.mealType} · {r.prepMins} min
            </p>
            <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1rem", fontWeight: 700, color: black, margin: "0 0 6px" }}>
              {r.name}
            </p>
            <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
              <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", color: black, fontWeight: 600 }}>
                {r.proteinG}g protein
              </span>
              <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", color: muted }}>
                {r.calories} kcal
              </span>
            </div>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", color: muted, margin: 0, lineHeight: 1.5 }}>
              {r.description.split(".")[0]}.
            </p>
          </div>
        ))}
      </div>

      {/* Full curriculum CTA */}
      <div style={{ background: `${accent}12`, border: `1px solid ${accent}55`, borderRadius: 8, padding: "1.25rem 1.5rem", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.05rem", fontWeight: 700, color: black, margin: "0 0 6px" }}>
          Want to go deeper?
        </p>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.8rem", color: muted, margin: "0 0 14px", lineHeight: 1.55 }}>
          Your coaching subscription includes the full Nutrition Foundations course — 4 modules, meal-prep plans, and the science behind everything above.
        </p>
        <Link
          href="/nutrition-foundations"
          style={{ display: "inline-block", background: accent, color: black, padding: "10px 22px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", fontWeight: 700, textDecoration: "none", borderRadius: 4, letterSpacing: "0.06em" }}
        >
          Open Nutrition Foundations →
        </Link>
      </div>

      {/* Small link to setup for edits */}
      <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
        <Link href="/my-coaching/setup" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.72rem", color: muted, textDecoration: "underline" }}>
          Update your profile
        </Link>
      </div>
    </div>
  )
}
