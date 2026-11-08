"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import type { CoachingOverview } from "@/lib/coachingOverview"
import CheckInList from "@/components/coaching/admin/CheckInList"
import { initials, timeAgo } from "@/components/coaching/admin/AdminUi"
import { useAdminFetch } from "@/components/coaching/admin/useAdminFetch"
import { OVERVIEW_PATH } from "@/components/coaching/admin/paths"

export default function CheckInsPage() {
  const clientFilter = useSearchParams().get("client") ?? undefined
  const { data } = useAdminFetch<CoachingOverview>(OVERVIEW_PATH)
  const names = useMemo(() => new Map((data?.clients ?? []).map((c) => [c.email, c.displayName])), [data])
  const notYet = (data?.clients ?? []).filter((c) => c.status === "ACTIVE" && c.checkIn.state === "not-yet")
  const filteredName = clientFilter ? names.get(clientFilter.toLowerCase()) ?? clientFilter : null

  return (
    <div className="ca-page" style={{ maxWidth: 860 }}>
      <header className="ca-head">
        <div>
          <h1 className="ca-title">Check-ins</h1>
          <p className="ca-sub">{filteredName ? <>Showing {filteredName} · <Link className="ca-link" href="/admin/coaching/check-ins">Show everyone</Link></> : "Weekly check-ins, oldest first so no one waits too long."}</p>
        </div>
      </header>

      <section className="ca-section" aria-label="Check-ins">
        <CheckInList names={names} clientEmail={clientFilter} />
      </section>

      {!clientFilter && data && notYet.length > 0 && (
        <section className="ca-section" aria-labelledby="ca-notyet">
          <div className="ca-section-head">
            <h2 id="ca-notyet" className="ca-label">Not in yet this week<span className="ca-count">{notYet.length}</span></h2>
          </div>
          <div className="ca-card">
            <ul className="ca-list">
              {notYet.map((c) => (
                <li key={c.email}>
                  <Link href={`/admin/coaching/clients/${encodeURIComponent(c.email)}`} className="ca-row" style={{ minHeight: 52 }}>
                    <span className="ca-avatar" aria-hidden="true" style={{ width: 32, height: 32, fontSize: "0.9rem" }}>{initials(c.displayName)}</span>
                    <span className="ca-row-title ca-trunc">{c.displayName}</span>
                    <span className="ca-row-aside">{c.checkIn.lastSubmittedAt ? `Last ${timeAgo(c.checkIn.lastSubmittedAt)}` : "Never checked in"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
