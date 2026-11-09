"use client"

import { useEffect, useState } from "react"
import { localDateKey, resolveTimeZone } from "@/lib/localDate"
import type { NutritionLogRecord } from "@/lib/authTokens"

type MealType = "breakfast" | "lunch" | "dinner" | "snack"
type Label = "none" | MealType | "summary"

const LABELS: Array<{ value: Label; text: string }> = [
  { value: "none", text: "No label" },
  { value: "breakfast", text: "Breakfast" },
  { value: "lunch", text: "Lunch" },
  { value: "dinner", text: "Dinner" },
  { value: "snack", text: "Snack" },
  { value: "summary", text: "Daily summary" },
]

export interface LogFoodModalProps {
  open: boolean
  onClose: () => void
  onLogged: (log: NutritionLogRecord) => void
  initialMealType?: MealType
  // Prefill from a previous entry (Recent meals) or the entry being edited.
  prefill?: Partial<Pick<NutritionLogRecord, "calories" | "protein" | "carbs" | "fat" | "description" | "mealType" | "isDaySummary">>
  // Edit mode: Save updates this entry instead of creating a new one.
  editLogId?: string
  // Recent entries, used to warn before saving a repeat or an overlapping summary.
  recentLogs?: NutritionLogRecord[]
}

type Notice = null | { kind: "repeat" } | { kind: "day-has-entries"; logged: number; count: number } | { kind: "day-has-summary" }

export default function LogFoodModal({ open, onClose, onLogged, initialMealType, prefill, editLogId, recentLogs = [] }: LogFoodModalProps) {
  const todayKey = localDateKey(new Date(), resolveTimeZone())
  const [day, setDay] = useState(todayKey)
  const [label, setLabel] = useState<Label>(initialMealType ?? "none")
  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fat, setFat] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState<Notice>(null)
  const isEdit = !!editLogId

  useEffect(() => {
    if (!open) return
    setDay(todayKey)
    setLabel(prefill?.isDaySummary ? "summary" : ((prefill?.mealType as MealType | undefined) ?? initialMealType ?? "none"))
    setCalories(prefill?.calories != null ? String(prefill.calories) : "")
    setProtein(prefill?.protein != null ? String(prefill.protein) : "")
    setCarbs(prefill?.carbs != null ? String(prefill.carbs) : "")
    setFat(prefill?.fat != null ? String(prefill.fat) : "")
    setDescription(prefill?.description ?? "")
    setError("")
    setNotice(null)
  }, [open, initialMealType, prefill, todayKey])

  if (!open) return null

  const num = (s: string) => (s.trim() === "" ? undefined : Number(s))

  function check(): { kcal: number; pro?: number; c?: number; f?: number } | null {
    const kcal = num(calories)
    if (kcal == null || !Number.isFinite(kcal) || kcal < 0 || kcal > 5000) { setError("Add your calories (0 to 5,000)."); return null }
    const pro = num(protein), c = num(carbs), f = num(fat)
    if (pro != null && (!Number.isFinite(pro) || pro < 0 || pro > 400)) { setError("Protein should be between 0 and 400 g."); return null }
    if (c != null && (!Number.isFinite(c) || c < 0 || c > 800)) { setError("Carbs should be between 0 and 800 g."); return null }
    if (f != null && (!Number.isFinite(f) || f < 0 || f > 300)) { setError("Fat should be between 0 and 300 g."); return null }
    return { kcal: Math.round(kcal), pro: pro != null ? Math.round(pro) : undefined, c: c != null ? Math.round(c) : undefined, f: f != null ? Math.round(f) : undefined }
  }

  async function send(url: string, method: "POST" | "PATCH", body: Record<string, unknown>) {
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({})) as { log?: NutritionLogRecord; error?: string; logged?: number; count?: number }
      if (res.ok && data.log) { onLogged(data.log); onClose(); return }
      if (res.status === 409 && data.error === "day-has-entries") { setNotice({ kind: "day-has-entries", logged: data.logged ?? 0, count: data.count ?? 0 }); return }
      if (res.status === 409 && data.error === "day-has-summary") { setNotice({ kind: "day-has-summary" }); return }
      setError(data.error ?? "That didn't save. Check your connection and try again.")
    } catch {
      setError("That didn't save. Check your connection and try again.")
    }
  }

  async function save(opts: { confirmRepeat?: boolean; confirmExtra?: boolean; asRegular?: boolean } = {}) {
    setError("")
    const v = check()
    if (!v) return
    setSaving(true)
    const useLabel: Label = opts.asRegular ? "none" : label
    if (isEdit) {
      await send(`/api/coaching/nutrition-logs/${encodeURIComponent(editLogId!)}`, "PATCH", {
        calories: v.kcal,
        protein: v.pro ?? null, carbs: v.c ?? null, fat: v.f ?? null,
        description: description.trim(),
        ...(useLabel !== "none" && useLabel !== "summary" ? { mealType: useLabel } : {}),
      })
      setSaving(false)
      return
    }
    const date = day && day <= todayKey ? day : todayKey
    const sameDay = recentLogs.filter((l) => l.date === date)
    if (!opts.confirmRepeat && !opts.confirmExtra) {
      const sameLabel = (l: NutritionLogRecord) => (l.mealType ?? "none") === (useLabel === "summary" ? "none" : useLabel) && !!l.isDaySummary === (useLabel === "summary")
      if (sameDay.some((l) => l.calories === v.kcal && sameLabel(l) && Date.now() - Date.parse(l.loggedAt) < 10 * 60_000)) {
        setNotice({ kind: "repeat" }); setSaving(false); return
      }
    }
    await send("/api/coaching/nutrition-logs", "POST", {
      date, timeZone: resolveTimeZone(),
      kind: useLabel === "none" || useLabel === "summary" ? "quick" : "meal",
      mealType: useLabel === "none" || useLabel === "summary" ? undefined : useLabel,
      isDaySummary: useLabel === "summary" || undefined,
      confirmExtra: opts.confirmExtra || undefined,
      calories: v.kcal, protein: v.pro, carbs: v.c, fat: v.f,
      description: description.trim() || undefined,
    })
    setSaving(false)
  }

  return (
    <div className="pt pt-sheet-backdrop" role="presentation" onClick={onClose}>
      <div className="pt-sheet" role="dialog" aria-modal="true" aria-labelledby="log-food-title" onClick={(e) => e.stopPropagation()}>
        <div className="pt-sheet-head">
          <h2 id="log-food-title">{isEdit ? "Edit entry" : "Log food"}</h2>
          <button type="button" className="pt-icon-btn" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <form className="pt-form pt-form-flat" onSubmit={(e) => { e.preventDefault(); save() }}>
          {!isEdit && (
            <div className="pt-field">
              <label htmlFor="log-day">Day</label>
              <input id="log-day" className="pt-input pt-input-short" type="date" value={day} max={todayKey} onChange={(e) => { setDay(e.target.value); setNotice(null) }} />
            </div>
          )}

          <fieldset className="pt-field">
            <legend>Label <span className="pt-optional">Optional</span></legend>
            <div className="pt-chips" role="radiogroup" aria-label="Label">
              {LABELS.filter((o) => !isEdit || o.value !== "summary" || label === "summary").map((o) => (
                <button key={o.value} type="button" role="radio" aria-checked={label === o.value} className="pt-chip" disabled={isEdit && (o.value === "summary" || label === "summary")} onClick={() => { setLabel(o.value); setNotice(null) }}>{o.text}</button>
              ))}
            </div>
          </fieldset>

          <div className="pt-field-grid">
            <div className="pt-field">
              <label htmlFor="log-kcal">Calories</label>
              <input id="log-kcal" className="pt-input" inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="e.g. 450" />
            </div>
            <div className="pt-field">
              <label htmlFor="log-protein">Protein (g) <span className="pt-optional">Helpful</span></label>
              <input id="log-protein" className="pt-input" inputMode="numeric" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="e.g. 35" />
            </div>
            <div className="pt-field">
              <label htmlFor="log-carbs">Carbs (g) <span className="pt-optional">Optional</span></label>
              <input id="log-carbs" className="pt-input" inputMode="numeric" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
            </div>
            <div className="pt-field">
              <label htmlFor="log-fat">Fat (g) <span className="pt-optional">Optional</span></label>
              <input id="log-fat" className="pt-input" inputMode="numeric" value={fat} onChange={(e) => setFat(e.target.value)} />
            </div>
          </div>

          <div className="pt-field">
            <label htmlFor="log-desc">What you ate <span className="pt-optional">Helpful</span></label>
            <input id="log-desc" className="pt-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. 3 eggs, oatmeal, blueberries" maxLength={500} />
          </div>

          {notice?.kind === "repeat" && (
            <div className="pt-notice" role="alert">
              <p>Looks like you just added this. Add it again?</p>
              <div className="pt-notice-actions"><button type="button" className="pt-btn pt-btn-sm" onClick={() => save({ confirmRepeat: true })}>Add again</button><button type="button" className="pt-textbtn" onClick={() => setNotice(null)}>Cancel</button></div>
            </div>
          )}
          {notice?.kind === "day-has-entries" && (
            <div className="pt-notice" role="alert">
              <p>You&apos;ve already logged {notice.logged.toLocaleString()} kcal on this day ({notice.count} {notice.count === 1 ? "entry" : "entries"}). A daily summary would count that food twice.</p>
              <p>Add what&apos;s left of the day as a regular entry instead, or edit your earlier entries.</p>
              <div className="pt-notice-actions"><button type="button" className="pt-btn pt-btn-sm" onClick={() => { setLabel("none"); setNotice(null); save({ asRegular: true }) }}>Add as a regular entry</button><button type="button" className="pt-textbtn" onClick={() => setNotice(null)}>Cancel</button></div>
            </div>
          )}
          {notice?.kind === "day-has-summary" && (
            <div className="pt-notice" role="alert">
              <p>You logged a daily summary for this day. Only add this if it wasn&apos;t included in that summary.</p>
              <div className="pt-notice-actions"><button type="button" className="pt-btn pt-btn-sm" onClick={() => save({ confirmExtra: true })}>It wasn&apos;t included, add it</button><button type="button" className="pt-textbtn" onClick={() => setNotice(null)}>Cancel</button></div>
            </div>
          )}

          {error && <p className="pt-error" role="alert">{error}</p>}

          {!notice && (
            <div className="pt-sheet-actions">
              <button type="submit" className="pt-btn" data-wide="" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save changes" : "Save"}</button>
            </div>
          )}

          <p className="pt-sheet-note">Keep it simple! You can log your daily totals all at once at the end of the day, or add meals and snacks throughout the day. Whatever works best for you 😊</p>
        </form>
      </div>
    </div>
  )
}
