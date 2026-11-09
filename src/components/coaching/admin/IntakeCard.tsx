"use client"

import { useEffect, useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import type { IntakeSummary } from "@/lib/intake"

const font = "var(--font-montserrat), sans-serif"
const border = "var(--ca-line)"

// What the client told Lisa on their application, for program design. Read
// only; it never sets a level or changes a program.
export function IntakeCard({ email }: { email: string }) {
  const [intake, setIntake] = useState<IntakeSummary | null | undefined>(undefined)
  const [error, setError] = useState(false)

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const token = (await fetchAuthSession()).tokens?.accessToken?.toString() ?? ""
        const res = await fetch(`/api/admin/coaching/clients/${encodeURIComponent(email)}/intake`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
        const data = await res.json().catch(() => ({})) as { intake?: IntakeSummary | null }
        if (!live) return
        if (res.ok) setIntake(data.intake ?? null)
        else setError(true)
      } catch {
        if (live) setError(true)
      }
    })()
    return () => { live = false }
  }, [email])

  const rows: Array<[string, string]> = intake ? [
    ["Training history", intake.trainingHistory ?? "Not given"],
    ["Strength exercises", intake.strengthConfidence],
    ["Days per week", intake.daysPerWeek ?? "Not given"],
    ["Session length", intake.sessionLength ?? "Not given"],
    ["Equipment", intake.equipment ?? "Not given"],
    ["Injuries or limitations", intake.injuries ?? "Not given"],
    ["Goal on application", intake.applicationGoal ?? "Not given"],
    ["Nutrition goal in setup", intake.nutritionGoal ?? "Not chosen yet"],
  ] : []

  return (
    <section data-testid="intake-card" aria-labelledby="intake-h" style={{ background: "var(--ca-surface)", border: `1px solid ${border}` }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${border}` }}>
        <h2 id="intake-h" style={{ fontFamily: font, fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ca-muted)", margin: 0 }}>Intake</h2>
      </div>
      <div style={{ padding: "16px 20px" }}>
        {error && <p style={{ fontFamily: font, fontSize: "0.75rem", color: "var(--ca-muted)", margin: 0 }}>The application answers couldn&apos;t be loaded.</p>}
        {!error && intake === undefined && <p style={{ fontFamily: font, fontSize: "0.75rem", color: "var(--ca-muted)", margin: 0 }}>Loading…</p>}
        {!error && intake === null && <p style={{ fontFamily: font, fontSize: "0.75rem", color: "var(--ca-muted)", margin: 0 }}>No application is linked to this client.</p>}
        {intake && (
          <dl style={{ display: "grid", gap: 8, margin: 0 }}>
            {rows.map(([k, v]) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "minmax(0, 9rem) minmax(0, 1fr)", gap: 10 }}>
                <dt style={{ fontFamily: font, fontSize: "0.7rem", color: "var(--ca-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{k}</dt>
                <dd style={{ fontFamily: font, fontSize: "0.75rem", color: "var(--ca-text)", margin: 0, lineHeight: 1.5, overflowWrap: "anywhere" }}>{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
}
