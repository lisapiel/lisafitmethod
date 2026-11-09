import { kcal } from "./format"
import type { Macros } from "./types"

const ROWS = [
  { key: "calories", name: "Calories", unit: "kcal" },
  { key: "protein", name: "Protein", unit: "g" },
  { key: "carbs", name: "Carbs", unit: "g" },
  { key: "fat", name: "Fat", unit: "g" },
] as const

export function CompareTable({ before, after, beforeLabel, afterLabel }: { before: Macros | null; after: Macros | null; beforeLabel: string; afterLabel: string }) {
  const cell = (m: Macros | null, k: keyof Macros, unit: string) => (m ? `${k === "calories" ? kcal(m[k]) : m[k]} ${unit}` : "none")
  return (
    <table className="can-compare">
      <thead>
        <tr><th scope="col"><span className="ca-sr">Value</span></th><th scope="col">{beforeLabel}</th><th scope="col">{afterLabel}</th></tr>
      </thead>
      <tbody>
        {ROWS.map((r) => {
          const changed = before && after ? before[r.key] !== after[r.key] : true
          return (
            <tr key={r.key}>
              <th scope="row" style={{ textTransform: "none", letterSpacing: 0, fontSize: "0.875rem", color: "var(--ca-text)" }}>{r.name}</th>
              <td>{cell(before, r.key, r.unit)}</td>
              <td style={changed ? { fontWeight: 700 } : undefined}>{cell(after, r.key, r.unit)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
