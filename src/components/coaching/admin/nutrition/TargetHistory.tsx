import { dateTime, targetLine } from "./format"
import type { TargetChange } from "./types"

export function TargetHistory({ changes, error }: { changes: TargetChange[] | null; error: string }) {
  if (error) return <p className="can-note">{error}</p>
  if (changes == null) return <p className="can-note">Loading history…</p>
  if (changes.length === 0) return <p className="can-note">No changes recorded yet.</p>
  return (
    <ol className="can-history">
      {changes.map((c) => (
        <li key={c.id}>
          <small>{dateTime(c.changedAt)} · {c.changedBy}</small>
          <span className="can-num">
            {targetLine(c.previous)}{c.previous.automatic ? " (starting estimate)" : ""}
            {" → "}
            {targetLine(c.next)}{c.next.automatic ? " (starting estimate)" : ""}
          </span>
          <small>Reason: {c.reason}</small>
        </li>
      ))}
    </ol>
  )
}
