"use client"

import type { DayPlan, Sequence, SequenceKind, SequenceState } from "@/lib/warmups/engine"
import type { AutoMode } from "./useAutoSequences"
import { Bar, BarText, Flags, wu } from "./WarmupUi"

function noun(kind: SequenceKind) { return kind === "warmup" ? "warm-up" : "cool-down" }

function ruleText(plan: DayPlan, kind: SequenceKind) {
  const p = plan[kind]
  return `${p.rule}, from the ${plan.decidedBy}${p.adjustments.length ? ` · ${p.adjustments.join(" · ")}` : ""}`
}

export default function SequenceStatus({ kind, state, plan, mode, hasExercises, showFlags, onApply, onKeep }: {
  kind: SequenceKind
  state: SequenceState
  plan: DayPlan | null
  mode: AutoMode
  hasExercises: boolean
  showFlags: boolean
  onApply: (seq: Sequence) => void
  onKeep: () => void
}) {
  const flags = showFlags && plan ? <Flags flags={plan.flags} /> : null
  const quiet = (children: React.ReactNode) => (
    <p style={{ margin: "0 0 8px", fontFamily: wu.font, fontSize: "0.8125rem", lineHeight: 1.5, color: wu.muted }}>{children}</p>
  )

  if (state.status === "no-plan") {
    return hasExercises ? null : quiet(`Add main exercises and the ${noun(kind)} is chosen for you.`)
  }
  if (state.status === "auto-current" && plan) {
    return <div style={{ marginBottom: 8 }}>{quiet(<>Chosen automatically: {ruleText(plan, kind)}.</>)}{flags}</div>
  }
  if (state.status === "empty" && plan) {
    return (
      <Bar tone="attention">
        <BarText>
          No {noun(kind)} yet. Suggested: {ruleText(plan, kind)} ({state.proposal.exercises.length} drills).
          {mode === "client" ? " Nothing changes for the client until you add it and save." : ""}
        </BarText>
        <button type="button" className="wu-btn wu-btn-primary" onClick={() => onApply(state.proposal)}>Add suggested {noun(kind)}</button>
        {flags && <div style={{ flexBasis: "100%" }}>{flags}</div>}
      </Bar>
    )
  }
  if (state.status === "auto-outdated" && plan) {
    return (
      <Bar tone="attention">
        <BarText>The exercises or settings changed. The rules now suggest: {ruleText(plan, kind)} ({state.proposal.exercises.length} drills).</BarText>
        <button type="button" className="wu-btn wu-btn-primary" onClick={() => onApply(state.proposal)}>Update {noun(kind)}</button>
        <button type="button" className="wu-btn wu-btn-quiet" onClick={onKeep}>Keep current</button>
        {flags && <div style={{ flexBasis: "100%" }}>{flags}</div>}
      </Bar>
    )
  }
  if (state.status === "manual" && plan) {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 12px", marginBottom: 8 }}>
        <p style={{ flex: "1 1 260px", margin: 0, fontFamily: wu.font, fontSize: "0.8125rem", lineHeight: 1.5, color: wu.muted }}>
          Set by you{state.differs ? `. The rules would suggest: ${ruleText(plan, kind)}.` : ", matching the rules."}
        </p>
        {state.differs && (
          <button type="button" className="wu-btn wu-btn-quiet" onClick={() => onApply(state.proposal)}>Use suggested</button>
        )}
        {flags && <div style={{ flexBasis: "100%" }}>{flags}</div>}
      </div>
    )
  }
  return null
}
