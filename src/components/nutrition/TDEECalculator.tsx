"use client"

import { useState } from "react"
import { ACTIVITY_LEVELS, GOAL_META, computeBMR, computeTDEE, computeMacros, type NutritionGoal } from "@/lib/nutrition"

const gold = "#c9a96e"
const goldDeep = "#a8895e"
const cream = "#f0e6d3"
const muted = "#888"
const dark = "#111"
const border = "#2a2a2a"

// Consumes the canonical ACTIVITY_LEVELS + GOAL_META from @/lib/nutrition so
// this public calculator can never drift from the coaching engine's numbers.
const GOAL_ORDER: NutritionGoal[] = ["fat-loss", "recomp", "maintain", "muscle-gain"]

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "#1a1a1a",
  border: `1px solid ${border}`,
  color: cream,
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: "0.9rem",
  padding: "0.75rem 1rem",
  outline: "none",
  boxSizing: "border-box",
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.6rem",
  fontWeight: 600,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: muted,
  fontFamily: "var(--font-montserrat), sans-serif",
  marginBottom: "0.5rem",
}

interface NutritionProfile {
  calories: number
  protein: number
  carbs: number
  fat: number
  weightLbs: number
  tdee: number
  goal: NutritionGoal
}

export default function TDEECalculator() {
  const [sex, setSex] = useState<"male" | "female">("female")
  const [age, setAge] = useState("")
  const [weightLbs, setWeightLbs] = useState("")
  const [heightFeet, setHeightFeet] = useState("")
  const [heightInches, setHeightInches] = useState("")
  const [activity, setActivity] = useState<number>(1.35)
  const [goal, setGoal] = useState<NutritionGoal>("fat-loss")
  const [result, setResult] = useState<NutritionProfile | null>(null)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  function calculate() {
    const errs: string[] = []
    const ageNum = parseInt(age)
    const weightNum = parseFloat(weightLbs)
    const feetNum = parseInt(heightFeet)
    const inchesNum = parseFloat(heightInches || "0")

    if (!ageNum || ageNum < 16 || ageNum > 100) errs.push("Enter a valid age (16–100)")
    if (!weightNum || weightNum < 80 || weightNum > 500) errs.push("Enter a valid weight in lbs (80–500)")
    if (!feetNum || feetNum < 4 || feetNum > 7) errs.push("Enter a valid height in feet (4–7)")
    if (inchesNum < 0 || inchesNum >= 12) errs.push("Inches must be 0–11")

    setErrors(errs)
    if (errs.length > 0) return

    const heightIn = feetNum * 12 + inchesNum
    const bmr = computeBMR({ sex, weightLbs: weightNum, heightInches: heightIn, age: ageNum })
    const tdee = Math.round(computeTDEE(bmr, activity))
    const macros = computeMacros({ tdee, goal, weightLbs: weightNum })

    setResult({ calories: macros.calories, protein: macros.protein, carbs: macros.carbs, fat: macros.fat, weightLbs: weightNum, tdee, goal })
    setSaved(false)
  }

  function saveProfile() {
    if (!result) return
    localStorage.setItem("lfm_nutrition_profile", JSON.stringify(result))
    setSaved(true)
  }

  const selectedGoalLabel = GOAL_META[goal].label

  return (
    <div>
      {/* Form */}
      <div style={{ background: dark, border: `1px solid ${border}`, padding: "1.75rem" }}>
        <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: goldDeep, marginBottom: "1.5rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Your Details
        </p>

        {/* Sex */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={labelStyle}>Biological Sex</label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["female", "male"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                style={{
                  flex: 1,
                  padding: "0.7rem",
                  background: sex === s ? "rgba(201,169,110,0.15)" : "#1a1a1a",
                  border: sex === s ? `1px solid ${gold}` : `1px solid ${border}`,
                  color: sex === s ? gold : muted,
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {s === "female" ? "Female" : "Male"}
              </button>
            ))}
          </div>
          <p style={{ fontSize: "0.62rem", color: "#555", marginTop: "0.4rem", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.5 }}>
            Used for the BMR formula only. The Mifflin-St Jeor equation requires biological sex as an input variable.
          </p>
        </div>

        {/* Age + Weight row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.25rem" }}>
          <div>
            <label style={labelStyle}>Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 32"
              min={16}
              max={100}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Weight (lbs)</label>
            <input
              type="number"
              value={weightLbs}
              onChange={(e) => setWeightLbs(e.target.value)}
              placeholder="e.g. 150"
              min={80}
              max={500}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Height */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={labelStyle}>Height</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input
              type="number"
              value={heightFeet}
              onChange={(e) => setHeightFeet(e.target.value)}
              placeholder="Feet (e.g. 5)"
              min={4}
              max={7}
              style={inputStyle}
            />
            <input
              type="number"
              value={heightInches}
              onChange={(e) => setHeightInches(e.target.value)}
              placeholder="Inches (e.g. 6)"
              min={0}
              max={11}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Activity Level */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={labelStyle}>Activity Level</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setActivity(level.value)}
                style={{
                  textAlign: "left",
                  padding: "0.75rem 1rem",
                  background: activity === level.value ? "rgba(201,169,110,0.1)" : "#1a1a1a",
                  border: activity === level.value ? `1px solid ${gold}` : `1px solid ${border}`,
                  color: activity === level.value ? cream : muted,
                  fontFamily: "var(--font-montserrat), sans-serif",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", display: "block", color: activity === level.value ? gold : "#777" }}>
                  {level.label}
                </span>
                <span style={{ fontSize: "0.65rem", lineHeight: 1.5, color: activity === level.value ? "#b0a090" : "#555" }}>
                  {level.desc}
                </span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: "0.62rem", color: "#555", marginTop: "0.5rem", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.5 }}>
            Research shows ~80% of people overestimate their activity level by one tier. When in doubt, go one level lower.
          </p>
        </div>

        {/* Goal */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Your Goal</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {GOAL_ORDER.map((value) => {
              const meta = GOAL_META[value]
              const isSelected = goal === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGoal(value)}
                  style={{
                    textAlign: "left",
                    padding: "0.75rem 1rem",
                    background: isSelected ? "rgba(201,169,110,0.1)" : "#1a1a1a",
                    border: isSelected ? `1px solid ${gold}` : `1px solid ${border}`,
                    color: isSelected ? cream : muted,
                    fontFamily: "var(--font-montserrat), sans-serif",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", display: "block", color: isSelected ? gold : "#777" }}>
                    {meta.label}
                  </span>
                  <span style={{ fontSize: "0.65rem", lineHeight: 1.5, color: isSelected ? "#b0a090" : "#555" }}>
                    {meta.desc}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {errors.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            {errors.map((e) => (
              <p key={e} style={{ color: "#ff6b6b", fontSize: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif", marginBottom: "0.25rem" }}>
                {e}
              </p>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={calculate}
          style={{
            width: "100%",
            background: gold,
            color: "#0a0a0a",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            border: "none",
            padding: "1rem",
            cursor: "pointer",
          }}
        >
          Calculate My Numbers →
        </button>
      </div>

      {/* Results */}
      {result && (
        <div style={{ marginTop: 16, background: "#0a0a0a", border: `1px solid ${gold}` }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid #1a1a1a` }}>
            <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.5rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
              Your Results — {selectedGoalLabel}
            </p>
            <p style={{ fontSize: "0.72rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.5, margin: 0 }}>
              Based on the Mifflin-St Jeor equation. These numbers are estimates, not absolutes. Use them as a starting point and adjust based on your progress over the next 2&ndash;3 weeks.
            </p>
          </div>

          {/* Key numbers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid #1a1a1a` }}>
            {[
              { label: "Resting BMR", value: `${Math.round(result.tdee / activity)} kcal` },
              { label: "Your TDEE", value: `${result.tdee} kcal` },
              { label: "Starting Target", value: `${result.calories} kcal` },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: "1.25rem 1rem", borderRight: `1px solid #1a1a1a` }}>
                <p style={{ fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#555", marginBottom: "0.35rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
                  {stat.label}
                </p>
                <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.4rem", color: gold, margin: 0, lineHeight: 1 }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Macro targets */}
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid #1a1a1a` }}>
            <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "1rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
              Daily Macro Targets
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[
                { label: "Protein", value: `${result.protein}g`, note: goal === "fat-loss" || goal === "recomp" ? "~2.0 g/kg bodyweight" : "~1.8 g/kg bodyweight" },
                { label: "Carbs", value: `${result.carbs}g`, note: "remaining calories" },
                { label: "Fat", value: `${result.fat}g`, note: "~30% of calories" },
              ].map((macro) => (
                <div key={macro.label} style={{ background: "#111", padding: "0.875rem", border: `1px solid ${border}` }}>
                  <p style={{ fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#555", marginBottom: "0.25rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
                    {macro.label}
                  </p>
                  <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.5rem", color: cream, margin: "0 0 0.2rem", lineHeight: 1 }}>
                    {macro.value}
                  </p>
                  <p style={{ fontSize: "0.6rem", color: "#555", margin: 0, fontFamily: "var(--font-montserrat), sans-serif" }}>
                    {macro.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Training vs rest day */}
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: `1px solid #1a1a1a` }}>
            <p style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#555", marginBottom: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
              Training Day vs. Rest Day (Optional)
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: "#111", padding: "0.875rem", border: `1px solid ${border}` }}>
                <p style={{ fontSize: "0.6rem", color: goldDeep, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.25rem", fontFamily: "var(--font-montserrat), sans-serif" }}>Training Day</p>
                <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", color: gold, margin: 0 }}>{result.calories + 150} kcal</p>
              </div>
              <div style={{ background: "#111", padding: "0.875rem", border: `1px solid ${border}` }}>
                <p style={{ fontSize: "0.6rem", color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.25rem", fontFamily: "var(--font-montserrat), sans-serif" }}>Rest Day</p>
                <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.3rem", color: muted, margin: 0 }}>{result.calories - 150} kcal</p>
              </div>
            </div>
            <p style={{ fontSize: "0.65rem", color: "#555", marginTop: "0.75rem", fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.5 }}>
              The meal plan in Module 3 is built around your daily target of <strong style={{ color: "#777" }}>{result.calories} kcal</strong>. Training/rest day splits are optional — the difference adds up but the daily target is a solid starting point.
            </p>
          </div>

          {/* Save button */}
          <div style={{ padding: "1.25rem 1.5rem" }}>
            <button
              type="button"
              onClick={saveProfile}
              style={{
                background: saved ? "rgba(201,169,110,0.1)" : gold,
                color: saved ? gold : "#0a0a0a",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                border: saved ? `1px solid ${gold}` : "none",
                padding: "0.875rem 1.5rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {saved ? "✓ Profile Saved — Module 3 will use these numbers" : "Save My Profile → Personalise Module 3"}
            </button>
            {!saved && (
              <p style={{ fontSize: "0.62rem", color: "#555", marginTop: "0.5rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
                Saves to your browser. Used in Module 3 to calculate your personalised portion sizes.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
