"use client"

import Link from "next/link"
import type { CoachingOverview } from "@/lib/coachingOverview"
import ClientRoster from "@/components/coaching/admin/ClientRoster"
import { LoadError, SkeletonRows } from "@/components/coaching/admin/AdminUi"
import { useAdminFetch } from "@/components/coaching/admin/useAdminFetch"
import { OVERVIEW_PATH } from "@/components/coaching/admin/paths"

export default function ClientsPage() {
  const { data, error, loading, reload } = useAdminFetch<CoachingOverview>(OVERVIEW_PATH, { pollMs: 60_000 })
  return (
    <div className="ca-page" style={{ maxWidth: 860 }}>
      <header className="ca-head">
        <div>
          <h1 className="ca-title">Clients</h1>
          {data && <p className="ca-sub">{data.counts.active} active · {data.clients.length} in total</p>}
        </div>
        <Link className="ca-btn" data-variant="primary" href="/admin/coaching/clients/new">Add client</Link>
      </header>
      {error && <LoadError error={error} onRetry={reload} hasData={!!data} />}
      {data ? <ClientRoster overview={data} /> : loading ? <div className="ca-card"><SkeletonRows rows={7} label="Loading clients" /></div> : null}
    </div>
  )
}
