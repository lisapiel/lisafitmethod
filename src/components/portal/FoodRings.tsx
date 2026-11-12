"use client"

import ProgressRing from "./ProgressRing"

export type FoodMacroKey = "protein" | "carbs" | "fat"

export type FoodRingsProps = {
  calories: { value: number | null; target: number; center: string; sub: string; label: string }
  status: { text: string; tone: string } | null
  range: string
  macros: Array<{ k: FoodMacroKey; name: string; value: number | null; target: number; center: string; detail: string; foot: string; label: string }>
  foot?: string
}

export default function FoodRings({ calories, status, range, macros, foot }: FoodRingsProps) {
  return (
    <>
      <ProgressRing
        size={208} stroke={16} tone="calories"
        state={calories.value == null ? "unknown" : "logged"}
        value={calories.value} target={calories.target}
        center={calories.center}
        sub={calories.sub}
        label={calories.label}
      />
      {status && <p className="pt-food-status" style={{ color: status.tone }}>{status.text}</p>}
      <p className="pt-food-range">{range}</p>
      <div className="pt-food-macros">
        {macros.map((m) => (
          <div key={m.k} className="pt-food-macro">
            <ProgressRing
              size={78} stroke={8} tone={m.k}
              state={m.value == null ? "unknown" : "logged"}
              value={m.value} target={m.target}
              center={m.center}
              label={m.label}
            />
            <b>{m.name}</b>
            <span>{m.detail}</span>
            <small>{m.foot}</small>
          </div>
        ))}
      </div>
      {foot && <p className="pt-food-foot">{foot}</p>}
    </>
  )
}
