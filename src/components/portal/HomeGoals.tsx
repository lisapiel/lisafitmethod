import Link from "next/link"
import { goalProgressPct, goalsForHome, type HomeGoal } from "@/lib/goalsView"
import { ChevronRight } from "./PortalIcons"

const num = (n: number) => Number.isInteger(n) ? String(n) : n.toFixed(1)

// The coaching goals Lisa set, near the bottom of Home. Only goals she has
// added are shown; nothing is inferred from logs or check-ins.
export default function HomeGoals({ goals }: { goals: HomeGoal[] }) {
  const shown = goalsForHome(goals)
  return (
    <section className="pt-mini" aria-labelledby="home-goals">
      <h2 id="home-goals">Your goals</h2>
      {shown.length === 0 ? (
        <p className="pt-mini-text">We haven&apos;t set your coaching goals yet. We&apos;ll build them together based on what you&apos;re working toward.</p>
      ) : (
        <ul className="pt-mini-goals">
          {shown.map((g) => {
            const pct = goalProgressPct(g)
            const unit = g.unit ? ` ${g.unit}` : ""
            const achieved = g.status === "ACHIEVED"
            return (
              <li key={g.id}>
                <div className="pt-mini-goal-top">
                  <b>{g.label || "Goal"}</b>
                  {achieved ? <span className="pt-mini-done">Achieved ✓</span> : pct != null && <span>{pct}%</span>}
                </div>
                {pct != null && !achieved && (
                  <span className="pt-mini-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${g.label || "Goal"} progress`}>
                    <i style={{ width: `${pct}%` }} />
                  </span>
                )}
                <span className="pt-mini-sub">
                  {[
                    g.currentValue != null && g.targetValue != null ? `${num(g.currentValue)}${unit} now · target ${num(g.targetValue)}${unit}` : g.targetValue != null ? `Target ${num(g.targetValue)}${unit}` : null,
                    g.targetDate ? `by ${new Date(`${g.targetDate.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : null,
                  ].filter(Boolean).join(" · ")}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {(shown.length > 0 || goals.length > 0) && (
        <Link className="pt-mini-link" href="/my-coaching/goals">
          {goals.length > shown.length ? `All ${goals.length} goals` : "Your goals page"} <ChevronRight />
        </Link>
      )}
    </section>
  )
}
