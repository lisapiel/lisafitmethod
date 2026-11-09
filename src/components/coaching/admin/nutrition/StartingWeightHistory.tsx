import type { StartingWeightChangeRecord } from "@/lib/startingWeight"
import { dateTime, targetLine } from "./format"

function weight(lbs: number | null): string {
  return lbs == null ? "Not given" : `${lbs} lb`
}

export function StartingWeightHistory({ changes, error }: { changes: StartingWeightChangeRecord[] | null; error: string }) {
  if (error) return <p className="can-note">{error}</p>
  if (changes == null) return <p className="can-note">Loading history…</p>
  if (changes.length === 0) return <p className="can-note">No corrections recorded yet.</p>
  return (
    <ol className="can-history" aria-label="Starting weight history">
      {changes.map((c) => (
        <li key={c.id}>
          <small>{dateTime(c.changedAt)} · {c.changedBy}</small>
          <span className="can-num">
            {weight(c.previous)} → {weight(c.next)}{c.unit === "KG" ? ` (entered as ${c.entered} kg)` : ""}
          </span>
          <small>Reason: {c.reason}</small>
          {c.automaticEstimate?.previous && c.automaticEstimate.next && (
            <small>Starting estimate: {targetLine(c.automaticEstimate.previous)} → {targetLine(c.automaticEstimate.next)}</small>
          )}
        </li>
      ))}
    </ol>
  )
}
