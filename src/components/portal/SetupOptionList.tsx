"use client"

import { ACTIVITY_LEVELS, GOAL_META, type NutritionGoal } from "@/lib/nutrition"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"

export type SetupOption<T> = { value: T; label: string; desc: string }

// Goal picker order: Fat Loss first (most common), then the two maintenance
// class goals together, then Muscle Gain.
const GOAL_ORDER: NutritionGoal[] = ["fat-loss", "recomp", "maintain", "muscle-gain"]

export const GOAL_OPTIONS: SetupOption<NutritionGoal>[] = GOAL_ORDER.map((value) => ({ value, ...GOAL_META[value] }))
export const ACTIVITY_OPTIONS: SetupOption<number>[] = ACTIVITY_LEVELS.map((a) => ({ value: a.value, label: a.label, desc: a.desc }))

export function SetupOptionList<T extends string | number>({ options, selected, onSelect, current, label, testId }: {
  options: SetupOption<T>[]
  selected: T | null
  onSelect: (v: T) => void
  current?: T | null
  label: string
  testId?: string
}) {
  return (
    <div role="group" aria-label={label} data-testid={testId} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {options.map((o) => {
        const on = selected === o.value
        const isCurrent = current != null && current === o.value
        return (
          <button
            key={String(o.value)}
            type="button"
            aria-pressed={on}
            disabled={isCurrent}
            onClick={() => onSelect(o.value)}
            style={{
              textAlign: "left", background: on ? `${accent}18` : "transparent",
              border: `1px solid ${on ? accent : border}`,
              padding: "10px 12px", cursor: isCurrent ? "default" : "pointer", borderRadius: 4,
              opacity: isCurrent ? 0.6 : 1,
            }}
          >
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.82rem", fontWeight: on ? 700 : 600, color: black, margin: "0 0 2px" }}>
              {o.label}{isCurrent ? " (current)" : ""}
            </p>
            <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: "0.7rem", color: muted, margin: 0, lineHeight: 1.45 }}>
              {o.desc}
            </p>
          </button>
        )
      })}
    </div>
  )
}
