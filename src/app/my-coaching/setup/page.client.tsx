"use client"

import { useState, useEffect } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ACTIVITY_LEVELS, GOAL_META, remapLegacyActivity, type NutritionGoal, type Sex } from "@/lib/nutrition"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"

// Goal picker order — Fat Loss first (most common), then the two maintenance-
// class goals grouped together, then Muscle Gain. Labels + descriptions come
// from GOAL_META so any UI surface stays in sync.
const GOAL_ORDER: NutritionGoal[] = ["fat-loss", "recomp", "maintain", "muscle-gain"]

export default function SetupClient() {
  const router = useRouter()
  const [sex, setSex] = useState<Sex>("female")
  const [age, setAge] = useState("")
  const [weightLbs, setWeightLbs] = useState("")
  const [heightFeet, setHeightFeet] = useState("")
  const [heightInches, setHeightInches] = useState("")
  const [activity, setActivity] = useState<number>(1.35)
  const [goal, setGoal] = useState<NutritionGoal>("fat-loss")
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Pre-fill from the client record if some fields already exist
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/coaching/program")
        if (!res.ok) return
        const data = await res.json() as { client?: { sex?: Sex; age?: number; heightInches?: number; activityLevel?: number; nutritionGoal?: NutritionGoal; startingWeight?: number } }
        const c = data.client
        if (!c) return
        if (c.sex) setSex(c.sex)
        if (c.age) setAge(String(c.age))
        if (c.heightInches != null) {
          setHeightFeet(String(Math.floor(c.heightInches / 12)))
          setHeightInches(String(c.heightInches % 12))
        }
        // Remap legacy activity values (1.375, 1.55, 1.725, 1.9) to the
        // nearest new value so the correct button pre-selects. The database
        // record is not touched — that only updates when the client saves.
        if (c.activityLevel) setActivity(remapLegacyActivity(c.activityLevel) ?? 1.35)
        if (c.nutritionGoal) setGoal(c.nutritionGoal)
        if (c.startingWeight) setWeightLbs(String(c.startingWeight))
      } catch { /* ignore */ }
    }
    load()
  }, [])

  async function handleSave() {
    setErrorMsg("")
    const ageNum = parseInt(age)
    const weightNum = parseFloat(weightLbs)
    const ft = parseInt(heightFeet)
    const inch = parseFloat(heightInches || "0")

    if (!ageNum || ageNum < 16 || ageNum > 100) { setErrorMsg("Enter a valid age (16–100)"); return }
    if (!weightNum || weightNum < 80 || weightNum > 500) { setErrorMsg("Enter your current weight in pounds"); return }
    if (!ft || ft < 4 || ft > 7) { setErrorMsg("Enter a valid height in feet (4–7)"); return }
    if (inch < 0 || inch >= 12) { setErrorMsg("Inches must be 0–11"); return }
    const heightIn = ft * 12 + inch

    setSaving(true)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) { setErrorMsg("You need to be logged in."); setSaving(false); return }
      const res = await fetch("/api/coaching/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          heightInches: heightIn,
          age: ageNum,
          sex,
          activityLevel: activity,
          nutritionGoal: goal,
          currentWeight: weightNum,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }))
        setErrorMsg((data as { error?: string }).error ?? "Something went wrong.")
        setSaving(false)
        return
      }
      // Mark that they've completed setup so the home banner clears
      try { localStorage.removeItem("lfm-setup-skipped") } catch { /* ignore */ }
      router.push("/my-coaching/nutrition")
    } catch {
      setErrorMsg("Something went wrong.")
    }
    setSaving(false)
  }

  function handleSkip() {
    try { localStorage.setItem("lfm-setup-skipped", "1") } catch { /* ignore */ }
    router.push("/my-coaching")
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "1.25rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, margin: "0 0 6px" }}>
          One quick step
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.9rem", fontWeight: 700, color: black, margin: "0 0 8px", lineHeight: 1.2 }}>
          Let&apos;s personalise your nutrition.
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: muted, margin: 0, lineHeight: 1.55 }}>
          Answer a few questions so I can build your macro targets. You can update these anytime.
        </p>
      </div>

      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.25rem 1.25rem" }}>
        {/* Sex */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, display: "block", marginBottom: 6 }}>
            Biological sex (for BMR formula)
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {(["female", "male"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                style={{
                  flex: 1, background: sex === s ? accent : "transparent",
                  border: `1px solid ${sex === s ? accent : border}`,
                  color: sex === s ? black : muted,
                  fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", fontWeight: sex === s ? 700 : 500,
                  padding: "10px 14px", cursor: "pointer", borderRadius: 4, textTransform: "capitalize",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Age + Weight */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div>
            <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, display: "block", marginBottom: 6 }}>
              Age
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="32"
              style={{ width: "100%", background: "#faf8f5", border: `1px solid ${border}`, color: black, padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", borderRadius: 4 }}
            />
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, display: "block", marginBottom: 6 }}>
              Current weight (lbs)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={weightLbs}
              onChange={(e) => setWeightLbs(e.target.value)}
              placeholder="145"
              style={{ width: "100%", background: "#faf8f5", border: `1px solid ${border}`, color: black, padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", borderRadius: 4 }}
            />
          </div>
        </div>

        {/* Height */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, display: "block", marginBottom: 6 }}>
            Height
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input
              type="text"
              inputMode="numeric"
              value={heightFeet}
              onChange={(e) => setHeightFeet(e.target.value)}
              placeholder="5 ft"
              style={{ width: "100%", background: "#faf8f5", border: `1px solid ${border}`, color: black, padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", borderRadius: 4 }}
            />
            <input
              type="text"
              inputMode="numeric"
              value={heightInches}
              onChange={(e) => setHeightInches(e.target.value)}
              placeholder="6 in"
              style={{ width: "100%", background: "#faf8f5", border: `1px solid ${border}`, color: black, padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.9rem", outline: "none", boxSizing: "border-box", borderRadius: 4 }}
            />
          </div>
        </div>

        {/* Activity */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, display: "block", marginBottom: 6 }}>
            Activity level
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ACTIVITY_LEVELS.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => setActivity(a.value)}
                style={{
                  textAlign: "left", background: activity === a.value ? `${accent}18` : "transparent",
                  border: `1px solid ${activity === a.value ? accent : border}`,
                  padding: "10px 12px", cursor: "pointer", borderRadius: 4,
                }}
              >
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.82rem", fontWeight: activity === a.value ? 700 : 600, color: black, margin: "0 0 2px" }}>
                  {a.label}
                </p>
                <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", color: muted, margin: 0 }}>
                  {a.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Goal */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, display: "block", marginBottom: 6 }}>
            Nutrition goal
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {GOAL_ORDER.map((value) => {
              const meta = GOAL_META[value]
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGoal(value)}
                  style={{
                    textAlign: "left", background: goal === value ? `${accent}18` : "transparent",
                    border: `1px solid ${goal === value ? accent : border}`,
                    padding: "10px 12px", cursor: "pointer", borderRadius: 4,
                  }}
                >
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.82rem", fontWeight: goal === value ? 700 : 600, color: black, margin: "0 0 2px" }}>
                    {meta.label}
                  </p>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", color: muted, margin: 0, lineHeight: 1.45 }}>
                    {meta.desc}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {errorMsg && (
          <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", color: "#c14646", margin: "0 0 12px" }}>
            {errorMsg}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%", background: saving ? "#ccc" : black, color: white, border: "none",
            padding: "13px 20px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem",
            fontWeight: 700, letterSpacing: "0.08em", cursor: saving ? "wait" : "pointer", borderRadius: 4,
          }}
        >
          {saving ? "Saving…" : "See my macros →"}
        </button>

        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button
            onClick={handleSkip}
            style={{ background: "none", border: "none", color: muted, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline" }}
          >
            Skip for now
          </button>
        </div>
      </div>

      <div style={{ marginTop: "1rem", textAlign: "center" }}>
        <Link href="/my-coaching" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, textDecoration: "none" }}>
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
