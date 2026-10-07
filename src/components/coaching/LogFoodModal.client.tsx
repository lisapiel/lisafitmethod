"use client"

import { useEffect, useState } from "react"
import { localDateKey, resolveTimeZone } from "@/lib/localDate"
import type { NutritionLogRecord } from "@/lib/authTokens"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const red = "#c04040"

type Mode = "quick" | "meal"
type MealType = "breakfast" | "lunch" | "dinner" | "snack"

export interface LogFoodModalProps {
  open: boolean
  onClose: () => void
  onLogged: (log: NutritionLogRecord) => void
  initialMealType?: MealType
  // Allow caller to prefill a quick-add for a repeat meal (phase 2). Unused in phase 1.
  prefill?: Partial<Pick<NutritionLogRecord, "calories" | "protein" | "carbs" | "fat" | "description" | "mealType">>
}

export default function LogFoodModal({ open, onClose, onLogged, initialMealType, prefill }: LogFoodModalProps) {
  const [mode, setMode] = useState<Mode>(initialMealType ? "meal" : "quick")
  const [mealType, setMealType] = useState<MealType>(initialMealType ?? "breakfast")
  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fat, setFat] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setMode(initialMealType ? "meal" : "quick")
    setMealType(initialMealType ?? "breakfast")
    setCalories(prefill?.calories != null ? String(prefill.calories) : "")
    setProtein(prefill?.protein != null ? String(prefill.protein) : "")
    setCarbs(prefill?.carbs != null ? String(prefill.carbs) : "")
    setFat(prefill?.fat != null ? String(prefill.fat) : "")
    setDescription(prefill?.description ?? "")
    setError("")
  }, [open, initialMealType, prefill])

  if (!open) return null

  async function save() {
    setSaving(true)
    setError("")
    const n = (s: string) => (s === "" ? NaN : Number(s))
    const kcal = n(calories)
    const pro = n(protein)
    if (!Number.isFinite(kcal) || kcal < 0 || kcal > 5000) {
      setError("Enter calories between 0 and 5000.")
      setSaving(false)
      return
    }
    if (!Number.isFinite(pro) || pro < 0 || pro > 400) {
      setError("Enter protein between 0 and 400g.")
      setSaving(false)
      return
    }
    const carbsN = carbs === "" ? undefined : n(carbs)
    const fatN = fat === "" ? undefined : n(fat)
    if (carbsN != null && (!Number.isFinite(carbsN) || carbsN < 0 || carbsN > 800)) {
      setError("Carbs must be between 0 and 800g.")
      setSaving(false)
      return
    }
    if (fatN != null && (!Number.isFinite(fatN) || fatN < 0 || fatN > 300)) {
      setError("Fat must be between 0 and 300g.")
      setSaving(false)
      return
    }
    const timeZone = resolveTimeZone()
    const date = localDateKey(new Date(), timeZone)
    const body = {
      kind: mode,
      mealType: mode === "meal" ? mealType : undefined,
      date, timeZone,
      calories: Math.round(kcal),
      protein: Math.round(pro),
      carbs: carbsN != null ? Math.round(carbsN) : undefined,
      fat: fatN != null ? Math.round(fatN) : undefined,
      description: description.trim() || undefined,
    }
    try {
      const res = await fetch("/api/coaching/nutrition-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json() as { log: NutritionLogRecord }
        onLogged(data.log)
        onClose()
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

  return (
    <div
      role="dialog"
      aria-label="Log food"
      style={{
        position: "fixed", inset: 0, background: "rgba(10,10,10,0.55)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520, background: "#fff",
          borderTopLeftRadius: 12, borderTopRightRadius: 12,
          padding: "1.25rem 1.25rem 1.5rem", maxHeight: "92vh", overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.3rem", fontWeight: 700, color: black, margin: 0 }}>
            Log food
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.4rem", color: muted, cursor: "pointer", lineHeight: 1 }} aria-label="Close">×</button>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
          {([
            { k: "quick" as Mode, label: "Quick add" },
            { k: "meal" as Mode, label: "Meal" },
          ]).map((o) => (
            <button
              key={o.k}
              onClick={() => setMode(o.k)}
              style={{
                background: mode === o.k ? black : "#fff",
                color: mode === o.k ? "#fff" : black,
                border: `1px solid ${mode === o.k ? black : border}`,
                padding: "9px 12px",
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em",
                borderRadius: 4, cursor: "pointer",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {mode === "meal" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 14 }}>
            {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((mt) => (
              <button
                key={mt}
                onClick={() => setMealType(mt)}
                style={{
                  background: mealType === mt ? accent : "#fff",
                  color: mealType === mt ? black : muted,
                  border: `1px solid ${mealType === mt ? accent : border}`,
                  padding: "8px 4px",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase", borderRadius: 4, cursor: "pointer",
                }}
              >
                {mt}
              </button>
            ))}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <Field label="Calories" required value={calories} onChange={setCalories} placeholder="e.g. 450" />
          <Field label="Protein (g)" required value={protein} onChange={setProtein} placeholder="e.g. 35" />
          <Field label="Carbs (g)" value={carbs} onChange={setCarbs} placeholder="optional" />
          <Field label="Fat (g)" value={fat} onChange={setFat} placeholder="optional" />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, display: "block", marginBottom: 4 }}>
            What you ate (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 3 eggs, oatmeal, blueberries"
            style={{ width: "100%", background: "#fff", border: `1px solid ${border}`, color: black, padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.85rem", outline: "none", borderRadius: 4, boxSizing: "border-box" }}
          />
        </div>

        {error && <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.75rem", color: red, margin: "0 0 10px" }}>{error}</p>}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={save}
            disabled={saving}
            style={{
              flex: 1, background: saving ? "#555" : black, color: "#fff", border: "none",
              padding: "12px 20px", fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.06em",
              borderRadius: 4, cursor: saving ? "wait" : "pointer",
            }}
          >
            {saving ? "Saving…" : "Save log"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              background: "none", border: `1px solid ${border}`, color: muted,
              padding: "12px 16px", fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em",
              borderRadius: 4, cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, value, onChange, placeholder }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: muted, display: "block", marginBottom: 4 }}>
        {label}{required ? " *" : ""}
      </label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", background: "#fff", border: `1px solid ${border}`, color: black, padding: "10px 12px", fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.95rem", outline: "none", borderRadius: 4, boxSizing: "border-box" }}
      />
    </div>
  )
}
