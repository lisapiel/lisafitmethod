"use client"

import { Bar, BarText } from "./WarmupUi"

export default function AutoFillNotice({ notice, onUndo, onDismiss }: {
  notice: { count: number } | null
  onUndo: () => void
  onDismiss: () => void
}) {
  if (!notice) return null
  return (
    <Bar role="status">
      <BarText>
        Added {notice.count} automatic warm-up{notice.count === 1 ? "" : "s"} and cool-down{notice.count === 1 ? "" : "s"} to days that had none. Review them, then save the program.
      </BarText>
      <button type="button" className="wu-btn wu-btn-quiet" onClick={onUndo}>Undo</button>
      <button type="button" className="wu-btn wu-btn-quiet" onClick={onDismiss}>Got it</button>
    </Bar>
  )
}
