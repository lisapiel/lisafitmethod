"use client"

import type { NutritionLogRecord } from "@/lib/authTokens"

const LABEL: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" }

function labelFor(l: NutritionLogRecord) {
  if (l.isDaySummary) return "Daily summary"
  return l.mealType ? LABEL[l.mealType] : "Entry"
}

function macros(l: NutritionLogRecord) {
  return [
    l.protein != null ? `${l.protein} g protein` : null,
    l.carbs != null ? `${l.carbs} g carbs` : null,
    l.fat != null ? `${l.fat} g fat` : null,
  ].filter(Boolean).join(" · ")
}

export default function FoodEntries({ entries, title, onAdd, onEdit, onDelete, onFlag, busyId }: {
  entries: NutritionLogRecord[]
  title: string
  onAdd: () => void
  onEdit: (l: NutritionLogRecord) => void
  onDelete: (l: NutritionLogRecord) => void
  onFlag: (l: NutritionLogRecord) => void
  busyId: string | null
}) {
  const sorted = [...entries].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
  const total = sorted.reduce((a, l) => a + (l.calories || 0), 0)
  return (
    <section className="pt-entries" aria-label={title}>
      <div className="pt-entries-head">
        <h2>{title}</h2>
        {sorted.length > 0 && <span>{sorted.length} {sorted.length === 1 ? "entry" : "entries"} · {total.toLocaleString()} kcal</span>}
      </div>
      <button type="button" className="pt-btn" data-wide="" onClick={onAdd}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        Log food
      </button>
      {sorted.length === 0 ? (
        <p className="pt-entries-empty">Nothing logged for this day yet.</p>
      ) : (
        <ul className="pt-entry-list">
          {sorted.map((l) => {
            const estimate = l.source === "message-estimate"
            return (
              <li key={l.id} className="pt-entry">
                <div className="pt-entry-main">
                  <span className="pt-entry-label" data-tone={l.isDaySummary ? "summary" : l.mealType === "snack" ? "snack" : undefined}>{labelFor(l)}</span>
                  {estimate && <span className="pt-tag-est">Estimate from your message</span>}
                  <span className="pt-entry-kcal">{l.calories.toLocaleString()} kcal</span>
                </div>
                {l.description && <p className="pt-entry-desc">{l.description}</p>}
                <p className="pt-entry-macros">{macros(l) || "No macros added"}</p>
                <div className="pt-entry-actions">
                  {estimate ? (
                    <button type="button" className="pt-textbtn" onClick={() => onFlag(l)}>This isn&apos;t right</button>
                  ) : (
                    <>
                      <button type="button" className="pt-textbtn" onClick={() => onEdit(l)}>Edit</button>
                      <button type="button" className="pt-textbtn pt-textbtn-quiet" disabled={busyId === l.id} onClick={() => onDelete(l)}>{busyId === l.id ? "Deleting…" : "Delete"}</button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
