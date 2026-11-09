"use client"

import type { PeriodSummary } from "@/lib/nutritionAnalytics"
import { CoachRing } from "./CoachRing"
import type { Macros } from "./types"

const MACROS = [
  { key: "protein", name: "Protein" },
  { key: "carbs", name: "Carbs" },
  { key: "fat", name: "Fat" },
] as const

export function MacroRings({ summary, target }: { summary: PeriodSummary; target: Macros | null }) {
  const calDays = summary.avgDays.calories
  return (
    <div className="can-rings" data-n="3">
      {MACROS.map(({ key, name }) => {
        const days = summary.avgDays[key]
        const avg = summary.avg && days > 0 ? summary.avg[key] : null
        const goal = target?.[key] ?? 0
        let caption = "not logged"
        if (avg != null) {
          caption = goal > 0 ? `${avg} of ${goal} g` : `${avg} g`
          if (days < calDays) caption += `, ${name.toLowerCase()} on ${days} of ${calDays} days`
        }
        return (
          <CoachRing
            key={key}
            tone={key}
            size={84}
            value={avg}
            target={goal}
            center={avg != null ? `${avg}` : undefined}
            sub={avg != null ? "g" : undefined}
            title={name}
            caption={caption}
            label={avg != null ? `${name}: ${caption}` : `${name}: not logged`}
          />
        )
      })}
    </div>
  )
}
