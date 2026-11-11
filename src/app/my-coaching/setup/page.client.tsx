"use client"

import { useState, useEffect } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { remapLegacyActivity, type NutritionGoal, type Sex } from "@/lib/nutrition"
import { isCurrentActivityLevel } from "@/lib/profileRequests"
import { ACTIVITY_OPTIONS, GOAL_OPTIONS, SetupOptionList } from "@/components/portal/SetupOptionList"
import { ProfileChangeRequest } from "@/components/portal/ProfileChangeRequest"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"

const ACTIVITY_REQUIRED = "Choose the option that matches a normal week."
const GOAL_REQUIRED = "Choose your nutrition goal."

export default function SetupClient() {
  const router = useRouter()
  const [sex, setSex] = useState<Sex>("female")
  const [age, setAge] = useState("")
  const [weightLbs, setWeightLbs] = useState("")
  const [startingWeight, setStartingWeight] = useState<number | null>(null)
  const [keptNotice, setKeptNotice] = useState(false)
  const [heightFeet, setHeightFeet] = useState("")
  const [heightInches, setHeightInches] = useState("")
  // Nothing is preselected for a new client: the activity level has to be a
  // deliberate choice, and the goal is preselected only when the application
  // says the same thing.
  const [activity, setActivity] = useState<number | null>(null)
  const [goal, setGoal] = useState<NutritionGoal | null>(null)
  const [locked, setLocked] = useState<{ goal: NutritionGoal; activity: number } | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [activityError, setActivityError] = useState("")
  const [goalError, setGoalError] = useState("")
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Pre-fill from the client record if some fields already exist
  useEffect(() => {
    async function suggestGoal() {
      try {
        const token = (await fetchAuthSession()).tokens?.accessToken?.toString()
        if (!token) return
        const res = await fetch("/api/coaching/setup", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
        if (!res.ok) return
        const data = await res.json() as { suggestedGoal?: NutritionGoal | null }
        if (data.suggestedGoal) setGoal((g) => g ?? data.suggestedGoal ?? null)
      } catch { /* nothing preselected */ }
    }
    async function load() {
      try {
        const res = await fetch("/api/coaching/program?view=client")
        if (!res.ok) { await suggestGoal(); return }
        const data = await res.json() as { client?: { sex?: Sex; age?: number; heightInches?: number; activityLevel?: number; nutritionGoal?: NutritionGoal; startingWeight?: number } }
        const c = data.client
        if (!c) { await suggestGoal(); return }
        if (c.sex) setSex(c.sex)
        if (c.age) setAge(String(c.age))
        if (c.heightInches != null) {
          setHeightFeet(String(Math.floor(c.heightInches / 12)))
          setHeightInches(String(c.heightInches % 12))
        }
        // Once both are saved they are read-only here and change only
        // through a request to Lisa.
        if (c.nutritionGoal && c.activityLevel) {
          setLocked({ goal: c.nutritionGoal, activity: c.activityLevel })
        } else {
          const remapped = c.activityLevel ? remapLegacyActivity(c.activityLevel) : undefined
          if (isCurrentActivityLevel(remapped)) setActivity(remapped)
          if (c.nutritionGoal) setGoal(c.nutritionGoal)
          else await suggestGoal()
        }
        if (c.startingWeight) setStartingWeight(c.startingWeight)
      } catch { /* ignore */ }
    }
    load().finally(() => setLoaded(true))
  }, [])

  async function handleSave() {
    setErrorMsg("")
    setActivityError("")
    setGoalError("")
    const ageNum = parseInt(age)
    const weightNum = parseFloat(weightLbs)
    const ft = parseInt(heightFeet)
    const inch = parseFloat(heightInches || "0")

    if (!ageNum || ageNum < 16 || ageNum > 100) { setErrorMsg("Please enter an age between 16 and 100."); return }
    if (startingWeight == null && (!weightNum || weightNum < 80 || weightNum > 500)) { setErrorMsg("Please enter your current weight in pounds."); return }
    if (!ft || ft < 4 || ft > 7) { setErrorMsg("Please enter your height in feet, between 4 and 7."); return }
    if (inch < 0 || inch >= 12) { setErrorMsg("Inches should be between 0 and 11."); return }
    const heightIn = ft * 12 + inch
    if (!locked && (activity == null || goal == null)) {
      if (activity == null) setActivityError(ACTIVITY_REQUIRED)
      if (goal == null) setGoalError(GOAL_REQUIRED)
      setErrorMsg(activity == null ? ACTIVITY_REQUIRED : GOAL_REQUIRED)
      return
    }

    setSaving(true)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) { setErrorMsg("Please log in again to save this."); setSaving(false); return }
      const res = await fetch("/api/coaching/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          heightInches: heightIn,
          age: ageNum,
          sex,
          ...(locked ? {} : { activityLevel: activity, nutritionGoal: goal }),
          ...(startingWeight == null ? { currentWeight: weightNum } : {}),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }))
        setErrorMsg((data as { error?: string }).error ?? "Something went wrong. Please try again.")
        setSaving(false)
        return
      }
      // Mark that they've completed setup so the home banner clears
      try { localStorage.removeItem("lfm-setup-skipped") } catch { /* ignore */ }
      const saved = await res.json().catch(() => ({})) as { startingWeight?: number | null; startingWeightKept?: boolean }
      if (!locked && activity != null && goal != null) setLocked({ goal, activity })
      if (saved.startingWeightKept) {
        // A starting weight already existed, so the typed weight wasn't saved.
        if (typeof saved.startingWeight === "number") setStartingWeight(saved.startingWeight)
        setKeptNotice(true)
        setSaving(false)
        return
      }
      router.push("/my-coaching/nutrition")
    } catch {
      setErrorMsg("Something went wrong. Please try again.")
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
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.9rem", fontWeight: 700, color: black, margin: "0 0 8px", lineHeight: 1.2 }}>
          Let&apos;s personalise your nutrition.
        </h1>
        <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", color: muted, margin: 0, lineHeight: 1.55 }}>
          Answer a few questions so I can build your macro targets.
        </p>
      </div>

      <div style={{ background: white, border: `1px solid ${border}`, borderRadius: 8, padding: "1.25rem 1.25rem" }}>
        {/* Sex */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, display: "block", marginBottom: 6 }}>
            Biological sex (used to estimate your calorie needs)
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
              style={{ width: "100%", background: "#faf8f5", border: `1px solid ${border}`, color: black, padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1rem", outline: "none", boxSizing: "border-box", borderRadius: 4 }}
            />
          </div>
          {startingWeight == null ? (
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
                style={{ width: "100%", background: "#faf8f5", border: `1px solid ${border}`, color: black, padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1rem", outline: "none", boxSizing: "border-box", borderRadius: 4 }}
              />
            </div>
          ) : (
            <div>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 6px" }}>
                Starting weight
              </p>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1rem", color: black, margin: 0, padding: "10px 0" }}>
                {startingWeight} lb
              </p>
            </div>
          )}
        </div>
        {startingWeight != null && (
          <p data-testid="starting-weight-note" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", color: muted, margin: "-6px 0 16px", lineHeight: 1.55 }}>
            This was saved when you set up coaching. If it&apos;s wrong, <Link href="/my-coaching/messages" style={{ color: black }}>message me</Link> and I&apos;ll correct it. To record what you weigh today, <Link href="/my-coaching/progress/log" style={{ color: black }}>log today&apos;s weight on Progress</Link>.
          </p>
        )}

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
              style={{ width: "100%", background: "#faf8f5", border: `1px solid ${border}`, color: black, padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1rem", outline: "none", boxSizing: "border-box", borderRadius: 4 }}
            />
            <input
              type="text"
              inputMode="numeric"
              value={heightInches}
              onChange={(e) => setHeightInches(e.target.value)}
              placeholder="6 in"
              style={{ width: "100%", background: "#faf8f5", border: `1px solid ${border}`, color: black, padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "1rem", outline: "none", boxSizing: "border-box", borderRadius: 4 }}
            />
          </div>
        </div>

        {!loaded ? null : locked ? (
          <ProfileChangeRequest goal={locked.goal} activity={locked.activity} />
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 6px" }}>
                Activity level
              </p>
              <SetupOptionList
                options={ACTIVITY_OPTIONS} selected={activity} label="Activity level" testId="setup-activity"
                onSelect={(v) => { setActivity(v); setActivityError("") }}
              />
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: muted, margin: "8px 0 0", lineHeight: 1.55 }}>
                Pick what matches a normal week. If you train a few times a week but sit most of the day, Lightly Active or Moderately Active is usually the best fit.
              </p>
              {activityError && (
                <p role="alert" data-testid="activity-error" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", color: "#c14646", margin: "6px 0 0" }}>
                  {activityError}
                </p>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: muted, margin: "0 0 6px" }}>
                Nutrition goal
              </p>
              <SetupOptionList
                options={GOAL_OPTIONS} selected={goal} label="Nutrition goal" testId="setup-goal"
                onSelect={(v) => { setGoal(v); setGoalError("") }}
              />
              {goalError && (
                <p role="alert" data-testid="goal-error" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.78rem", color: "#c14646", margin: "6px 0 0" }}>
                  {goalError}
                </p>
              )}
            </div>
          </>
        )}

        {keptNotice && startingWeight != null && (
          <div role="status" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.82rem", color: black, background: `${accent}18`, border: `1px solid ${accent}`, borderRadius: 4, padding: "10px 12px", margin: "0 0 12px", lineHeight: 1.55 }}>
            <p style={{ margin: "0 0 6px" }}>
              Your other details are saved. You already had a starting weight of {startingWeight} lb, so I kept that one and didn&apos;t save the new number. If it&apos;s wrong, message me and I&apos;ll correct it.
            </p>
            <Link href="/my-coaching/nutrition" style={{ color: black, fontWeight: 700 }}>See my macros</Link>
          </div>
        )}

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
