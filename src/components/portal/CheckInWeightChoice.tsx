"use client"

import type { WeightStatus } from "@/lib/checkInAnswers"
import { formatReading, formatWeighInDay, type WeightReading } from "@/lib/weightHistory"

const accent = "#c8a97e"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"
const white = "#fff"
const font = "var(--font-dm-sans), sans-serif"

type Props = {
  latest: WeightReading | null
  choice: WeightStatus | ""
  weight: string
  unit: "LBS" | "KG"
  // Shown under "Same as last time" when it was picked for the client because
  // they logged a weight on Progress in the last couple of days.
  preselectedFromProgress: boolean
  onChoice: (v: WeightStatus) => void
  onWeight: (v: string) => void
  onUnit: (v: "LBS" | "KG") => void
}

export function lastWeighInSentence(latest: WeightReading | null): string {
  if (!latest) return "I don't have a weigh-in from you yet."
  return `Your last weigh-in was ${formatReading(latest)} on ${formatWeighInDay(latest.at)}.`
}

export default function CheckInWeightChoice({ latest, choice, weight, unit, preselectedFromProgress, onChoice, onWeight, onUnit }: Props) {
  const options: Array<{ value: WeightStatus; label: string }> = [
    { value: "new", label: "Enter a new weight" },
    ...(latest ? [{ value: "same" as const, label: "Same as last time" }] : []),
    { value: "skipped", label: "Skip this week" },
  ]

  return (
    <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
      <legend style={{ fontFamily: font, fontSize: "0.85rem", fontWeight: 600, color: black, marginBottom: 4, padding: 0 }}>Weight</legend>
      <p style={{ fontFamily: font, fontSize: "0.85rem", color: black, margin: "0 0 12px", lineHeight: 1.5 }}>{lastWeighInSentence(latest)}</p>

      <div role="radiogroup" aria-label="Weight this week" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {options.map((opt) => {
          const active = choice === opt.value
          return (
            <div key={opt.value}>
              <button
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChoice(opt.value)}
                style={{
                  width: "100%", minHeight: 52, display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                  background: active ? `${accent}18` : white,
                  border: `${active ? 2 : 1}px solid ${active ? accent : border}`,
                  color: black, padding: active ? "11px 13px" : "12px 14px",
                  fontFamily: font, fontSize: "0.95rem", fontWeight: active ? 700 : 600,
                  cursor: "pointer", borderRadius: 6, WebkitTapHighlightColor: "transparent",
                }}
              >
                <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, border: `2px solid ${active ? accent : "#c9c2bb"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {active && <span style={{ width: 10, height: 10, borderRadius: "50%", background: accent }} />}
                </span>
                {opt.label}
              </button>
              {active && opt.value === "same" && preselectedFromProgress && (
                <p style={{ fontFamily: font, fontSize: "0.75rem", color: muted, margin: "6px 2px 0", lineHeight: 1.5 }}>You logged this on Progress, so I&apos;ll use that one.</p>
              )}
              {active && opt.value === "new" && (
                <div style={{ marginTop: 10 }}>
                  <label htmlFor="checkin-weight" style={{ fontFamily: font, fontSize: "0.8rem", fontWeight: 600, color: black, display: "block", marginBottom: 6 }}>Today&apos;s weight</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                      id="checkin-weight"
                      type="text"
                      inputMode="decimal"
                      autoFocus
                      value={weight}
                      onChange={(e) => onWeight(e.target.value)}
                      placeholder="e.g. 145"
                      style={{ flex: "1 1 140px", minWidth: 0, background: "#faf8f5", border: `1px solid ${border}`, color: black, padding: "12px 14px", fontFamily: font, fontSize: 16, fontWeight: 600, outline: "none", borderRadius: 6, boxSizing: "border-box" }}
                    />
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {(["LBS", "KG"] as const).map((u) => (
                        <button key={u} type="button" onClick={() => onUnit(u)} aria-pressed={unit === u}
                          style={{ background: unit === u ? accent : white, border: `2px solid ${unit === u ? accent : border}`, color: unit === u ? black : muted, padding: "10px 14px", fontFamily: font, fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", borderRadius: 6 }}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {choice === "" && (
        <p style={{ fontFamily: font, fontSize: "0.75rem", color: muted, margin: "8px 2px 0" }}>Choose one to continue.</p>
      )}
    </fieldset>
  )
}
