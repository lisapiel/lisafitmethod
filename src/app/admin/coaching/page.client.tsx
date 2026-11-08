"use client"

import Link from "next/link"
import type { CoachingOverview } from "@/lib/coachingOverview"
import AttentionList from "@/components/coaching/admin/AttentionList"
import ClientRoster from "@/components/coaching/admin/ClientRoster"
import { LoadError, SkeletonRows } from "@/components/coaching/admin/AdminUi"
import { useAdminFetch } from "@/components/coaching/admin/useAdminFetch"
import { OVERVIEW_PATH } from "@/components/coaching/admin/paths"
import InstallPrompt from "./InstallPrompt.client"

const LIBRARY = [
  { href: "/admin/coaching/programs", label: "Programs" },
  { href: "/admin/coaching/workouts", label: "Workout library" },
  { href: "/admin/coaching/exercises", label: "Exercise library" },
  { href: "/admin/coaching/warmups", label: "Warm-up review" },
  { href: "/admin/coaching/applications", label: "Applications" },
  { href: "/admin/coaching/tasks", label: "Tasks" },
  { href: "/admin/coaching/settings", label: "Coaching settings" },
  { href: "/admin/coaching/backfill-payment", label: "Backfill from Stripe" },
]

function Stats({ o }: { o: CoachingOverview }) {
  const items = [
    { href: "#clients", n: o.counts.active, label: o.counts.active === 1 ? "active client" : "active clients" },
    { href: "/admin/coaching/messages", n: o.counts.needsReply, label: o.counts.needsReply === 1 ? "message to answer" : "messages to answer" },
    { href: "/admin/coaching/check-ins", n: o.counts.pendingCheckIns, label: o.counts.pendingCheckIns === 1 ? "check-in to review" : "check-ins to review" },
    { href: "/admin/coaching/applications", n: o.counts.pendingApplications, label: o.counts.pendingApplications === 1 ? "new application" : "new applications" },
  ]
  return (
    <nav className="ca-stats" aria-label="Summary">
      {items.map((s) => (
        <Link key={s.label} href={s.href} className="ca-stat"><b>{s.n}</b><span>{s.label}</span></Link>
      ))}
    </nav>
  )
}

export default function CoachingToday() {
  const { data, error, loading, reload } = useAdminFetch<CoachingOverview>(OVERVIEW_PATH, { pollMs: 60_000 })
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

  return (
    <div className="ca-page">
      <header className="ca-head">
        <div>
          <h1 className="ca-title">Today</h1>
          <p className="ca-sub">{today}</p>
        </div>
        <div className="ca-shortcuts">
          <Link className="ca-btn" href="/admin/coaching/clients/new">Add client</Link>
          <Link className="ca-btn" data-variant="primary" href="/admin/coaching/programs/new">New program</Link>
        </div>
      </header>

      <InstallPrompt />
      {error && <LoadError error={error} onRetry={reload} hasData={!!data} />}

      {data ? <Stats o={data} /> : loading ? <div className="ca-stats" aria-hidden="true">{[0, 1, 2, 3].map((i) => <span key={i} className="ca-skel" style={{ height: 72, borderRadius: 8 }} />)}</div> : null}

      <div className="ca-dash">
        <section className="ca-section" aria-labelledby="ca-attn">
          <div className="ca-section-head">
            <h2 id="ca-attn" className="ca-label">Needs you{data && <span className="ca-count">{data.attention.length}</span>}</h2>
          </div>
          {data ? <AttentionList items={data.attention} /> : loading ? <div className="ca-card"><SkeletonRows rows={4} label="Loading what needs you" /></div> : null}
        </section>

        <section className="ca-section" id="clients" aria-labelledby="ca-clients" style={{ scrollMarginTop: 64 }}>
          <div className="ca-section-head">
            <h2 id="ca-clients" className="ca-label">Clients</h2>
            <Link className="ca-link" href="/admin/coaching/clients">Manage clients</Link>
          </div>
          {data ? <ClientRoster overview={data} /> : loading ? <div className="ca-card"><SkeletonRows rows={6} label="Loading clients" /></div> : null}
        </section>
      </div>

      <section className="ca-section" aria-labelledby="ca-lib">
        <div className="ca-section-head"><h2 id="ca-lib" className="ca-label">Library and tools</h2></div>
        <nav className="ca-shortcuts" aria-labelledby="ca-lib">
          {LIBRARY.map((l) => <Link key={l.href} className="ca-btn" href={l.href}>{l.label}</Link>)}
        </nav>
      </section>
    </div>
  )
}
