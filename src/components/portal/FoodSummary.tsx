"use client"

import { useId, useState, type ReactNode } from "react"

type View = "today" | "week"

const OPTIONS: Array<{ v: View; label: string }> = [
  { v: "today", label: "Today" },
  { v: "week", label: "Last 7 days" },
]

// Opens on Today every visit. The toggle only changes what this card shows;
// it never touches the day that new food entries are saved under.
export default function FoodSummary({ today, week }: { today: ReactNode; week: ReactNode }) {
  const [view, setView] = useState<View>("today")
  const panel = useId()
  return (
    <section className="pt-food-today" aria-label="Nutrition summary">
      <div className="pt-food-toggle" role="group" aria-label="Show nutrition for">
        {OPTIONS.map((o) => (
          <button key={o.v} type="button" aria-pressed={view === o.v} aria-controls={panel} onClick={() => setView(o.v)}>
            {o.label}
          </button>
        ))}
      </div>
      <div id={panel} className="pt-food-panel" data-view={view}>
        {view === "today" ? today : week}
      </div>
    </section>
  )
}
