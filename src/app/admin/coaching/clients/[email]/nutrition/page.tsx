"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import { useParams } from "next/navigation"
import Link from "next/link"
import { resolveMacrosFor, formatHeight, activityLabel } from "@/lib/nutrition"
import type { CoachingClientRecord } from "@/lib/authTokens"

const gold = "#c9a96e"
const border = "#2a2a2a"
const cream = "#f0e6d3"
const muted = "#888"
const green = "#5c9e6a"

const GOAL_LABEL: Record<string, string> = {
  "fat-loss":    "Fat loss",
  "maintain":    "Maintain",
  "muscle-gain": "Muscle gain",
}

type FieldProps = { label: string; children: React.ReactNode }
function Field({ label, children }: FieldProps) {
  return (
    <div>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, margin: "0 0 3px" }}>
        {label}
      </p>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: cream, margin: 0, fontWeight: 600 }}>
        {children}
      </p>
    </div>
  )
}

export default function AdminClientNutritionPage() {
  const params = useParams()
  const emailParam = decodeURIComponent(params.email as string)

  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<CoachingClientRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [error, setError] = useState("")

  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fat, setFat] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) { setLoading(false); return }
      const res = await fetch(`/api/admin/coaching/clients/${encodeURIComponent(emailParam)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json() as { client?: CoachingClientRecord }
        if (data.client) {
          setClient(data.client)
          const cm = data.client.customMacros
          setCalories(cm?.calories != null ? String(cm.calories) : "")
          setProtein(cm?.protein != null ? String(cm.protein) : "")
          setCarbs(cm?.carbs != null ? String(cm.carbs) : "")
          setFat(cm?.fat != null ? String(cm.fat) : "")
        }
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [emailParam])

  useEffect(() => { load() }, [load])

  const autoMacros = useMemo(() => (client ? resolveMacrosFor(client) : null), [client])
  // resolveMacrosFor returns override macros if set — compute auto by clearing customMacros temporarily
  const autoOnly = useMemo(() => {
    if (!client) return null
    const withoutOverride: CoachingClientRecord = { ...client, customMacros: undefined }
    return resolveMacrosFor(withoutOverride)
  }, [client])

  async function save() {
    setSaving(true)
    setError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      const res = await fetch(`/api/admin/coaching/clients/${encodeURIComponent(emailParam)}/nutrition`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          customMacros: {
            calories: calories ? Number(calories) : undefined,
            protein: protein ? Number(protein) : undefined,
            carbs: carbs ? Number(carbs) : undefined,
            fat: fat ? Number(fat) : undefined,
          },
        }),
      })
      if (res.ok) {
        setSavedFlash(true)
        setTimeout(() => setSavedFlash(false), 2000)
        await load()
      } else {
        setError("Save failed. Try again.")
      }
    } catch {
      setError("Save failed. Try again.")
    }
    setSaving(false)
  }

  async function clearOverride() {
    setSaving(true)
    setError("")
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      await fetch(`/api/admin/coaching/clients/${encodeURIComponent(emailParam)}/nutrition`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ customMacros: null }),
      })
      setCalories(""); setProtein(""); setCarbs(""); setFat("")
      await load()
    } catch {
      setError("Clear failed.")
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
  const hasOverride = !!(client.customMacros && (client.customMacros.calories != null))

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

      {/* Body data */}
      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: 0 }}>
            Body data
          </p>
          <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: muted, letterSpacing: "0.08em" }}>
            Client edits at /my-coaching/setup
          </span>
        </div>
        {hasBodyData ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14 }}>
            <Field label="Sex">{client.sex}</Field>
            <Field label="Age">{client.age}</Field>
            <Field label="Height">{formatHeight(client.heightInches!)}</Field>
            <Field label="Weight (start)">{client.startingWeight ? `${client.startingWeight} lbs` : "—"}</Field>
            <Field label="Activity">{activityLabel(client.activityLevel) ?? "—"}</Field>
            <Field label="Goal">{client.nutritionGoal ? GOAL_LABEL[client.nutritionGoal] : "—"}</Field>
          </div>
        ) : (
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.78rem", color: muted, margin: 0 }}>
            No body data yet — client hasn&apos;t completed setup.
          </p>
        )}
      </div>

      {/* Auto-computed macros */}
      {autoOnly && (
        <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: "0 0 10px" }}>
            Auto-computed from body data
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <Field label="Calories">{autoOnly.calories.toLocaleString()}</Field>
            <Field label="Protein">{autoOnly.protein} g</Field>
            <Field label="Carbs">{autoOnly.carbs} g</Field>
            <Field label="Fat">{autoOnly.fat} g</Field>
          </div>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: muted, margin: "10px 0 0" }}>
            This is what the client sees if you don&apos;t set an override.
          </p>
        </div>
      )}

      {/* Coach override */}
      <div style={{ background: "#161616", border: `1px solid ${border}`, padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: gold, margin: 0 }}>
            Your override
          </p>
          {hasOverride && (
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: green, letterSpacing: "0.08em" }}>
              ● ACTIVE (client sees your numbers)
            </span>
          )}
        </div>
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: muted, margin: "0 0 14px", lineHeight: 1.5 }}>
          Fill any of these to override the auto-computed values. Leave blank to keep the auto number for that macro.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 12 }}>
          {[
            { label: "Calories", value: calories, set: setCalories, placeholder: autoOnly ? String(autoOnly.calories) : "e.g. 2100" },
            { label: "Protein (g)", value: protein, set: setProtein, placeholder: autoOnly ? String(autoOnly.protein) : "e.g. 180" },
            { label: "Carbs (g)", value: carbs, set: setCarbs, placeholder: autoOnly ? String(autoOnly.carbs) : "e.g. 200" },
            { label: "Fat (g)", value: fat, set: setFat, placeholder: autoOnly ? String(autoOnly.fat) : "e.g. 60" },
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
                placeholder={f.placeholder}
                style={{ width: "100%", background: "#0a0a0a", border: `1px solid ${border}`, color: cream, padding: "9px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          ))}
        </div>
        {error && <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#e07070", margin: "0 0 10px" }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              background: saving ? "#555" : gold, color: "#0a0a0a", border: "none",
              padding: "9px 20px", fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
              cursor: saving ? "wait" : "pointer",
            }}
          >
            {saving ? "Saving…" : "Save override"}
          </button>
          {hasOverride && (
            <button
              onClick={clearOverride}
              disabled={saving}
              style={{
                background: "none", border: `1px solid ${border}`, color: muted,
                padding: "9px 16px", fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Clear override
            </button>
          )}
          {savedFlash && (
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", color: green, fontWeight: 600 }}>
              ✓ Saved
            </span>
          )}
        </div>
      </div>

      {/* Current effective targets */}
      {autoMacros && (
        <div style={{ background: "#0f0f0f", border: `1px dashed ${border}`, padding: "1rem 1.25rem" }}>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: muted, margin: "0 0 4px" }}>
            Client sees ({autoMacros.source === "override" ? "your override" : "auto"})
          </p>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem", color: cream, margin: 0 }}>
            <strong>{autoMacros.calories.toLocaleString()} kcal</strong> · {autoMacros.protein}g P · {autoMacros.carbs}g C · {autoMacros.fat}g F
          </p>
        </div>
      )}
    </div>
  )
}
