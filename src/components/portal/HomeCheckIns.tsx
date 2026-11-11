import Link from "next/link"
import { nextCheckInDue } from "@/lib/portalProgram"
import { ChevronRight } from "./PortalIcons"

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric" })

// Compact check-in summary near the bottom of Home. The "Weekly check-in /
// Start" prompt above stays the only call to action when one is due.
export default function HomeCheckIns({ submittedAt }: { submittedAt: string[] }) {
  const sched = nextCheckInDue(submittedAt)
  return (
    <section className="pt-mini" aria-labelledby="home-checkins">
      <h2 id="home-checkins">Your check-ins</h2>
      {!sched.last ? (
        <p className="pt-mini-text">No check-ins yet. Your first one is ready whenever you are.</p>
      ) : (
        <>
          <dl className="pt-mini-facts">
            <div><dt>Last check-in</dt><dd>{fmt(sched.last)}</dd></div>
            <div><dt>Next one</dt><dd>{sched.due ? "Due now" : fmt(sched.next as Date)}</dd></div>
          </dl>
          <Link className="pt-mini-link" href="/my-coaching/check-in/history">
            View check-in history <ChevronRight />
          </Link>
        </>
      )}
    </section>
  )
}
