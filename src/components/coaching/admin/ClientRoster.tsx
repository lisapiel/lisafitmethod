"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import type { ClientSummary, CoachingOverview } from "@/lib/coachingOverview"
import { CheckInChip, Icon, StatusChip, WeekDots, dayCount, initials } from "./AdminUi"

type Filter = "ACTIVE" | "PENDING_PAYMENT" | "PAUSED" | "ALL"

function ClientRow({ c }: { c: ClientSummary }) {
  const p = c.program
  return (
    <Link href={`/admin/coaching/clients/${encodeURIComponent(c.email)}`} className="ca-row" style={{ alignItems: "start" }}>
      <span className="ca-avatar" aria-hidden="true">{initials(c.displayName)}</span>
      <span className="ca-row-main">
        <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flexWrap: "wrap" }}>
          <span className="ca-row-title ca-trunc" style={{ maxWidth: "100%" }}>{c.displayName}</span>
          <StatusChip status={c.status} />
        </span>
        <span className="ca-meta-line">
          {p ? (
            <span>{p.finished ? "Program complete" : `Week ${p.currentWeek} of ${p.totalWeeks}`}</span>
          ) : c.status === "ACTIVE" ? <span>No program yet</span> : null}
          {p && !p.finished && p.daysThisWeek > 0 && (
            <span><WeekDots done={p.doneThisWeek} total={p.daysThisWeek} />{p.doneThisWeek}/{p.daysThisWeek} this week</span>
          )}
          <span>Trained {dayCount(c.training.daysSinceWorkout)}</span>
          <span>Food {c.nutrition.daysLoggedLast7}/7 days</span>
        </span>
        <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
          {c.status === "ACTIVE" && <CheckInChip state={c.checkIn.state} />}
          {c.checkIn.painReported && <span className="ca-chip" data-tone="danger">Pain reported</span>}
          {c.messages.needsReply && <span className="ca-chip" data-tone="warn">Awaiting your reply</span>}
        </span>
      </span>
      <span className="ca-row-aside" style={{ alignSelf: "center" }}>
        {c.messages.unread > 0 && (
          <span className="ca-badge" aria-label={`${c.messages.unread} unread messages`}>{c.messages.unread}</span>
        )}
        <span style={{ color: "var(--ca-muted)", display: "inline-flex" }}><Icon name="chevron" /></span>
      </span>
    </Link>
  )
}

export default function ClientRoster({ overview, initialFilter = "ACTIVE", showSearch = true }: { overview: CoachingOverview; initialFilter?: Filter; showSearch?: boolean }) {
  const [filter, setFilter] = useState<Filter>(initialFilter)
  const [q, setQ] = useState("")
  const { counts, clients } = overview
  const filters: Array<[Filter, string, number]> = [
    ["ACTIVE", "Active", counts.active],
    ["PENDING_PAYMENT", "Awaiting payment", counts.awaitingPayment],
    ["PAUSED", "Paused", counts.paused],
    ["ALL", "All", clients.length],
  ]
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return clients.filter((c) => (filter === "ALL" || c.status === filter) && (!needle || c.displayName.toLowerCase().includes(needle) || c.email.includes(needle)))
  }, [clients, filter, q])

  return (
    <>
      <div className="ca-filters" role="group" aria-label="Filter clients">
        {filters.filter(([f, , n]) => f === "ACTIVE" || f === "ALL" || n > 0).map(([f, label, n]) => (
          <button key={f} type="button" className="ca-filter" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {label} <span className="ca-count" style={{ marginLeft: 0, color: "inherit", opacity: 0.75 }}>{n}</span>
          </button>
        ))}
      </div>
      {showSearch && clients.length > 6 && (
        <div style={{ margin: "0 0 10px" }}>
          <label className="ca-sr" htmlFor="ca-client-search">Search clients</label>
          <input id="ca-client-search" className="ca-search" type="search" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </div>
      )}
      <div className="ca-card">
        {shown.length === 0 ? (
          <p className="ca-empty" style={{ color: "var(--ca-muted)" }}>{q ? `No clients match "${q}".` : "No clients in this group."}</p>
        ) : (
          <ul className="ca-list">{shown.map((c) => <li key={c.email}><ClientRow c={c} /></li>)}</ul>
        )}
      </div>
    </>
  )
}
