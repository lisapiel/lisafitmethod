"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import type { ReviewItem } from "@/lib/warmups/review"
import { groupDays, weekRange, type ReviewProgram } from "./reviewGroups"
import { Flags, wu } from "./WarmupUi"

function settingsLine(p: ReviewProgram) {
  const o = p.options
  return [
    o.beginner ? "beginner substitutions" : "standard progressions",
    o.bands ? "bands" : "no bands",
    o.backSafe ? "Pigeon Pose" : "Figure 4 instead of Pigeon",
    o.foamRoller ? "foam roller" : "no foam roller",
  ].join(" · ")
}

function Drills({ title, item }: { title: string; item: ReviewItem | null }) {
  return (
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: "0 0 4px", fontFamily: wu.font, fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: wu.gold }}>{title}</p>
      {item ? (
        <>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 2 }}>
            {item.drills.map((d, i) => (
              <li key={`${d.name}-${i}`} style={{ display: "flex", gap: 10, fontFamily: wu.font, fontSize: "0.875rem", lineHeight: 1.55, color: wu.cream }}>
                <span style={{ flex: "1 1 auto" }}>{d.name}</span>
                <span style={{ flex: "none", color: wu.muted, fontVariantNumeric: "tabular-nums" }}>
                  {/s$/.test(d.dose) ? d.dose : `${d.dose} reps`}{d.note ? " each side" : ""}
                </span>
              </li>
            ))}
          </ol>
          <p style={{ margin: "2px 0 0", fontFamily: wu.font, fontSize: "0.75rem", lineHeight: 1.5, color: wu.muted }}>
            {item.rule}{item.adjustments.length ? ` · ${item.adjustments.join(" · ")}` : ""}
          </p>
        </>
      ) : (
        <p style={{ margin: 0, fontFamily: wu.font, fontSize: "0.8125rem", color: wu.muted }}>Already set. No change.</p>
      )}
    </div>
  )
}

export default function ReviewProgramSection({ program, onApply }: {
  program: ReviewProgram
  onApply: (p: ReviewProgram, selection: { week: number; dayIndex: number; kind: "warmup" | "cooldown" }[]) => Promise<string>
}) {
  const groups = useMemo(() => groupDays(program.items), [program.items])
  const [selected, setSelected] = useState<Set<string>>(() => new Set(groups.map((g) => g.key)))
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState("")
  const chosen = groups.filter((g) => selected.has(g.key))
  const count = chosen.reduce((n, g) => n + g.selection.length, 0)
  const days = chosen.reduce((n, g) => n + g.weeks.length, 0)
  const who = program.client ? program.client.displayName : "this template"
  const headingId = `rv-${program.id}`

  async function apply() {
    setBusy(true)
    setResult(await onApply(program, chosen.flatMap((g) => g.selection)))
    setBusy(false); setConfirming(false)
  }

  return (
    <section aria-labelledby={headingId} style={{ borderTop: `1px solid ${wu.line}`, padding: "22px 0 8px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 14px" }}>
        <h2 id={headingId} style={{ margin: 0, fontFamily: "var(--font-cormorant), serif", fontSize: "1.6rem", fontWeight: 400, color: wu.cream }}>
          {program.client ? program.client.displayName : program.name}
        </h2>
        {program.client?.isCurrent && (
          <span style={{ fontFamily: wu.font, fontSize: "0.75rem", color: "#0a0a0a", background: wu.gold, borderRadius: 999, padding: "2px 10px" }}>Current program</span>
        )}
        <Link href={`/admin/coaching/programs/${program.id}`} style={{ fontFamily: wu.font, fontSize: "0.8125rem", color: wu.gold, textUnderlineOffset: 3 }}>
          {program.client ? program.name : "Open template"}
        </Link>
      </div>
      <p style={{ margin: "6px 0 0", fontFamily: wu.font, fontSize: "0.8125rem", lineHeight: 1.5, color: wu.muted }}>
        {program.client ? `${program.profileSaved ? "Settings" : "Suggested settings (not yet confirmed)"}: ` : "Template settings: "}
        {settingsLine(program)}
      </p>
      <Flags flags={program.profileFlags} />

      <ul style={{ listStyle: "none", margin: "14px 0 0", padding: 0 }}>
        {groups.map((g) => (
          <li key={g.key} style={{ display: "grid", gridTemplateColumns: "44px minmax(0, 1fr)", gap: 4, padding: "14px 0", borderTop: `1px solid #1f1f1f` }}>
            <label style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 2, minHeight: 44, cursor: "pointer" }}>
              <input
                type="checkbox" aria-label={`Include ${g.dayLabel}, ${weekRange(g.weeks)}`}
                checked={selected.has(g.key)}
                onChange={(e) => setSelected((s) => { const n = new Set(s); if (e.target.checked) n.add(g.key); else n.delete(g.key); return n })}
                style={{ width: 20, height: 20, accentColor: wu.gold }}
              />
            </label>
            <div>
              <p style={{ margin: 0, fontFamily: wu.font, fontSize: "0.9375rem", color: wu.cream }}>
                <strong style={{ fontWeight: 600 }}>{g.dayLabel}</strong>
                <span style={{ color: wu.muted }}> · {weekRange(g.weeks)} · Day {g.dayIndex + 1} · {g.sessionType}, from the {g.decidedBy}</span>
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px 28px", marginTop: 10 }}>
                <Drills title="Warm-up to add" item={g.warmup} />
                <Drills title="Cool-down to add" item={g.cooldown} />
              </div>
              <Flags flags={g.flags} />
            </div>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "12px 0 6px" }}>
        {!confirming ? (
          <button type="button" className="wu-btn wu-btn-primary" disabled={count === 0 || busy} onClick={() => { setConfirming(true); setResult("") }}>
            Review {count} {count === 1 ? "addition" : "additions"} for {who}
          </button>
        ) : (
          <div role="group" aria-label="Confirm changes" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, flex: "1 1 100%" }}>
            <p style={{ flex: "1 1 320px", margin: 0, fontFamily: wu.font, fontSize: "0.875rem", lineHeight: 1.55, color: wu.cream }}>
              This adds {count} {count === 1 ? "sequence" : "sequences"} to {days} {days === 1 ? "day" : "days"} of {program.client ? `${who}'s program` : "the template"}.
              Main exercises, sets, existing warm-ups and workout history are not touched.
            </p>
            <button type="button" className="wu-btn wu-btn-primary" onClick={apply} disabled={busy}>{busy ? "Applying…" : "Confirm and apply"}</button>
            <button type="button" className="wu-btn wu-btn-quiet" onClick={() => setConfirming(false)} disabled={busy}>Cancel</button>
          </div>
        )}
        {result && <p role="status" style={{ margin: 0, fontFamily: wu.font, fontSize: "0.875rem", color: result.startsWith("Added") ? wu.ok : wu.warn }}>{result}</p>}
      </div>
    </section>
  )
}
