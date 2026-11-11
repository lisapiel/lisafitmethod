"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { goalProgressPct, toHomeGoal, type HomeGoal } from "@/lib/goalsView"

const font = "var(--font-montserrat), sans-serif"
const STATUS: Record<string, string> = { ON_TRACK: "On track", NEEDS_ATTENTION: "Needs attention", ACHIEVED: "Achieved" }

// The client's current goals, read-only, while reviewing a check-in. Editing
// stays in one place: the client's profile.
export default function CheckInGoals({ token, clientEmail }: { token: string; clientEmail: string }) {
  const [goals, setGoals] = useState<HomeGoal[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!token || !clientEmail) return
    fetch(`/api/admin/coaching/goals?clientEmail=${encodeURIComponent(clientEmail)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { goals?: Array<Record<string, unknown>> }) => setGoals((d.goals ?? []).map(toHomeGoal)))
      .catch(() => setFailed(true))
  }, [token, clientEmail])

  const editHref = `/admin/coaching/clients/${encodeURIComponent(clientEmail.toLowerCase())}#goals`
  return (
    <section aria-labelledby="ci-goals" style={{ background: "var(--ca-surface)", border: "1px solid var(--ca-line)", padding: "16px 20px", marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
        <h2 id="ci-goals" style={{ fontFamily: font, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--ca-accent-mark)", margin: 0 }}>Current goals</h2>
        <Link href={editHref} style={{ fontFamily: font, fontSize: "0.75rem", fontWeight: 600, color: "var(--ca-accent-mark)", textDecoration: "underline", textUnderlineOffset: 4 }}>Edit goals</Link>
      </div>
      {failed ? (
        <p style={{ fontFamily: font, fontSize: "0.8rem", color: "var(--ca-muted)", margin: 0 }}>Goals didn&apos;t load. They&apos;re on the client&apos;s profile.</p>
      ) : goals === null ? (
        <p style={{ fontFamily: font, fontSize: "0.8rem", color: "var(--ca-muted)", margin: 0 }}>Loading…</p>
      ) : goals.length === 0 ? (
        <p style={{ fontFamily: font, fontSize: "0.8rem", color: "var(--ca-muted)", margin: 0 }}>No goals set yet. Add them on the client&apos;s profile.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
          {goals.map((g) => {
            const pct = goalProgressPct(g)
            const unit = g.unit ? ` ${g.unit}` : ""
            return (
              <li key={g.id} style={{ display: "grid", gap: 2, paddingBottom: 10, borderBottom: "1px solid var(--ca-line-soft, var(--ca-line))" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: font, fontSize: "0.85rem", fontWeight: 600, color: "var(--ca-text)" }}>{g.label || "Goal"}</span>
                  <span style={{ fontFamily: font, fontSize: "0.75rem", color: g.status === "NEEDS_ATTENTION" ? "var(--ca-warn)" : g.status === "ACHIEVED" ? "var(--ca-ok)" : "var(--ca-muted)" }}>{STATUS[g.status ?? ""] ?? "On track"}</span>
                </div>
                <span style={{ fontFamily: font, fontSize: "0.75rem", color: "var(--ca-muted)" }}>
                  {[
                    g.startValue != null || g.targetValue != null ? `${g.startValue ?? "—"} → ${g.targetValue ?? "—"}${unit}` : null,
                    g.currentValue != null ? `now ${g.currentValue}${unit}${pct != null ? ` (${pct}%)` : ""}` : null,
                    g.targetDate ? `by ${new Date(`${g.targetDate.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : null,
                  ].filter(Boolean).join(" · ")}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
