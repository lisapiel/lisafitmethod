"use client"

import { useState } from "react"

const gold = "#c9a96e"
const goldDeep = "#a8895e"
const cream = "#f0e6d3"
const muted = "#888"
const dark = "#111"
const border = "#2a2a2a"

const ACTIVITY_LEVELS = [
  {
    value: 1.2,
    label: "Sedentary",
    desc: "Desk job, little movement outside of training. Under 5,000 steps/day.",
  },
  {
    value: 1.375,
    label: "Lightly Active",
    desc: "Training 2–3x/week + a desk job. 5,000–7,500 steps/day. Most people overestimate here — if you sit most of the day, this is probably you.",
  },
  {
    value: 1.55,
    label: "Moderately Active",
    desc: "Training 4–5x/week + active job, or 7,500–10,000 steps/day consistently.",
  },
  {
    value: 1.725,
    label: "Very Active",
    desc: "Hard training 6–7x/week or a physically demanding job.",
  },
  {
    value: 1.9,
    label: "Extremely Active",
    desc: "Training twice a day, or a very physical job plus daily training.",
  },
]

const GOALS = [
  { value: "fat_loss", label: "Fat Loss", adjustment: -400 },
  { value: "maintain", label: "Maintain / Body Recomp", adjustment: 0 },
  { value: "muscle_gain", label: "Muscle Gain", adjustment: 300 },
]

function mifflinBMR(sex: "male" | "female", weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === "male" ? base + 5 : base - 161
}

function lbsToKg(lbs: number) { return lbs * 0.453592 }
function inToCm(feet: number, inches: number) { return (feet * 12 + inches) * 2.54 }

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
  goal: string
}

export default function TDEECalculator() {
  const [sex, setSex] = useState<"male" | "female">("female")
  const [age, setAge] = useState("")
  const [weightLbs, setWeightLbs] = useState("")
  const [heightFeet, setHeightFeet] = useState("")
  const [heightInches, setHeightInches] = useState("")
  const [activity, setActivity] = useState<number>(1.375)
  const [goal, setGoal] = useState<string>("fat_loss")
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

    const weightKg = lbsToKg(weightNum)
    const heightCm = inToCm(feetNum, inchesNum)
    const bmr = mifflinBMR(sex, weightKg, heightCm, ageNum)
    const tdee = Math.round(bmr * activity)
    const goalObj = GOALS.find((g) => g.value === goal)!
    const targetCals = tdee + goalObj.adjustment

    // Macro split: protein 1g/lb, fat 0.35g/lb, carbs remainder
    const proteinG = Math.round(weightNum * 1.0)
    const fatG = Math.round(weightNum * 0.35)
    const proteinCals = proteinG * 4
    const fatCals = fatG * 9
    const carbCals = Math.max(targetCals - proteinCals - fatCals, 0)
    const carbG = Math.round(carbCals / 4)

    setResult({ calories: targetCals, protein: proteinG, carbs: carbG, fat: fatG, weightLbs: weightNum, tdee, goal })
    setSaved(false)
  }

  function saveProfile() {
    if (!result) return
    localStorage.setItem("lfm_nutrition_profile", JSON.stringify(result))
    setSaved(true)
  }

  const selectedGoal = GOALS.find((g) => g.value === goal)

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
            {GOALS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGoal(g.value)}
                style={{
                  textAlign: "left",
                  padding: "0.75rem 1rem",
                  background: goal === g.value ? "rgba(201,169,110,0.1)" : "#1a1a1a",
                  border: goal === g.value ? `1px solid ${gold}` : `1px solid ${border}`,
                  color: goal === g.value ? cream : muted,
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {g.label}
                <span style={{ fontSize: "0.62rem", fontWeight: 400, color: goal === g.value ? goldDeep : "#555" }}>
                  {g.adjustment > 0 ? `+${g.adjustment} kcal` : g.adjustment < 0 ? `${g.adjustment} kcal` : "at TDEE"}
                </span>
              </button>
            ))}
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
              Your Results — {selectedGoal?.label}
            </p>
            <p style={{ fontSize: "0.72rem", color: muted, fontFamily: "var(--font-montserrat), sans-serif", lineHeight: 1.5, margin: 0 }}>
              Based on the Mifflin-St Jeor equation. Individual variation is ±10% — use this as a starting point and adjust after 2–3 weeks if progress stalls.
            </p>
          </div>

          {/* Key numbers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid #1a1a1a` }}>
            {[
              { label: "Resting BMR", value: `${Math.round(result.tdee / (ACTIVITY_LEVELS.find(a => a.value === activity)?.value ?? 1.375))} kcal` },
              { label: "Your TDEE", value: `${result.tdee} kcal` },
              { label: "Daily Target", value: `${result.calories} kcal` },
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
                { label: "Protein", value: `${result.protein}g`, note: "1g per lb bodyweight" },
                { label: "Carbs", value: `${result.carbs}g`, note: "remaining calories" },
                { label: "Fat", value: `${result.fat}g`, note: "0.35g per lb bodyweight" },
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
