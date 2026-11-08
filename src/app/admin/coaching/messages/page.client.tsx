"use client"

import Link from "next/link"
import { useState } from "react"
import type { CoachingOverview } from "@/lib/coachingOverview"
import { Empty, LoadError, SkeletonRows, initials, timeAgo } from "@/components/coaching/admin/AdminUi"
import { useAdminFetch } from "@/components/coaching/admin/useAdminFetch"
import { OVERVIEW_PATH } from "@/components/coaching/admin/paths"

type View = "reply" | "all"

export default function MessagesPage() {
  const { data, error, loading, reload } = useAdminFetch<CoachingOverview>(OVERVIEW_PATH, { pollMs: 30_000 })
  const [view, setView] = useState<View | null>(null)
  const threads = data?.threads ?? []
  const waiting = threads.filter((t) => t.lastFromClient)
  const active = view ?? (waiting.length > 0 ? "reply" : "all")
  const shown = active === "reply" ? waiting : threads

  return (
    <div className="ca-page" style={{ maxWidth: 760 }}>
      <header className="ca-head">
        <div>
          <h1 className="ca-title">Messages</h1>
          {data && <p className="ca-sub">{waiting.length === 0 ? "Every conversation is answered." : `${waiting.length} waiting for your reply`}</p>}
        </div>
      </header>
      {error && <LoadError error={error} onRetry={reload} hasData={!!data} />}
      {data && (
        <div className="ca-filters" role="group" aria-label="Show">
          <button type="button" className="ca-filter" aria-pressed={active === "reply"} onClick={() => setView("reply")}>Needs reply <span style={{ opacity: 0.75 }}>{waiting.length}</span></button>
          <button type="button" className="ca-filter" aria-pressed={active === "all"} onClick={() => setView("all")}>All <span style={{ opacity: 0.75 }}>{threads.length}</span></button>
        </div>
      )}
      <div className="ca-card">
        {!data ? (loading ? <SkeletonRows rows={5} label="Loading messages" /> : null) : shown.length === 0 ? (
          active === "reply" ? <Empty>No one is waiting on a reply.</Empty> : <p className="ca-empty" style={{ color: "var(--ca-muted)" }}>No conversations yet.</p>
        ) : (
          <ul className="ca-list">
            {shown.map((t) => (
              <li key={t.threadId}>
                <Link href={`/admin/coaching/clients/${encodeURIComponent(t.clientEmail)}/messages`} className="ca-row" style={{ alignItems: "start" }}>
                  <span className="ca-avatar" aria-hidden="true">{initials(t.clientName)}</span>
                  <span className="ca-row-main">
                    <span style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
                      <span className="ca-row-title ca-trunc" style={{ flex: "1 1 auto", fontWeight: t.unreadCount > 0 ? 700 : 600 }}>{t.clientName}</span>
                      <span className="ca-row-meta" style={{ flex: "none" }}>{timeAgo(t.lastAt)}</span>
                    </span>
                    <span className="ca-row-meta ca-clamp2" style={{ color: t.unreadCount > 0 ? "var(--ca-text-2)" : undefined }}>
                      {t.lastFromClient ? "" : "You: "}{t.lastMessage}
                    </span>
                    {t.lastFromClient && <span><span className="ca-chip" data-tone="warn">Awaiting your reply</span></span>}
                  </span>
                  <span className="ca-row-aside" style={{ alignSelf: "center" }}>
                    {t.unreadCount > 0 && <span className="ca-badge" aria-label={`${t.unreadCount} unread`}>{t.unreadCount}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
