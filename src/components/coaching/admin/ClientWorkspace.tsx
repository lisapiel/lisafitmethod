"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { useParams, usePathname } from "next/navigation"
import type { CoachingOverview } from "@/lib/coachingOverview"
import { StatusChip, WeekDots, dayCount, initials } from "./AdminUi"
import { useAdminFetch } from "./useAdminFetch"
import { OVERVIEW_PATH } from "./paths"

const TABS = [
  { seg: "", label: "Overview" },
  { seg: "workouts", label: "Training" },
  { seg: "program", label: "Program" },
  { seg: "nutrition", label: "Nutrition" },
  { seg: "progress", label: "Progress" },
  { seg: "check-ins", label: "Check-ins" },
  { seg: "messages", label: "Messages" },
  { seg: "notes", label: "Notes" },
]

export default function ClientWorkspace({ children }: { children: React.ReactNode }) {
  const params = useParams<{ email: string }>()
  const pathname = usePathname()
  const email = decodeURIComponent(params.email ?? "").toLowerCase()
  const base = `/admin/coaching/clients/${encodeURIComponent(email)}`
  const current = pathname.slice(base.length).split("/").filter(Boolean)[0] ?? ""
  const { data } = useAdminFetch<CoachingOverview>(OVERVIEW_PATH)
  const c = data?.clients.find((x) => x.email === email)
  const name = c?.displayName ?? (data ? email : "")
  const p = c?.program

  const facts = c ? [
    { seg: "program", value: p ? (p.finished ? "Complete" : `Week ${p.currentWeek} of ${p.totalWeeks}`) : "No program", label: p ? p.name : "Assign one" },
    { seg: "workouts", value: p && !p.finished ? <><WeekDots done={p.doneThisWeek} total={p.daysThisWeek} />{p.doneThisWeek}/{p.daysThisWeek} this week</> : `${c.training.workoutsThisWeek} this week`, label: `Last trained ${dayCount(c.training.daysSinceWorkout)}` },
    { seg: "nutrition", value: `${c.nutrition.daysLoggedLast7}/7 days logged`, label: c.nutrition.lastLogDate ? `Last log ${new Date(`${c.nutrition.lastLogDate}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}` : "No food logged" },
    { seg: "check-ins", value: c.checkIn.state === "reviewed" ? "Reviewed" : c.checkIn.state === "pending" ? "To review" : "Not in yet", label: "This week's check-in" },
    { seg: "messages", value: c.messages.needsReply ? "Awaiting reply" : c.messages.threadId ? "Answered" : "No messages", label: c.messages.unread > 0 ? `${c.messages.unread} unread` : "Messages" },
  ] : []

  const tabsRef = useRef<HTMLElement>(null)
  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>("[aria-current=page]")?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [current])

  const badgeFor = (seg: string) => !c ? 0 : seg === "messages" ? c.messages.unread : seg === "check-ins" && c.checkIn.state === "pending" ? 1 : 0

  return (
    <div className="ca-page" style={{ maxWidth: 1000 }}>
      <header className="ca-client-head">
        <span className="ca-avatar" aria-hidden="true">{name ? initials(name) : ""}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", minWidth: 0 }}>
          <h1 className="ca-client-name ca-trunc">{name || <span className="ca-skel" style={{ display: "inline-block", width: 180, height: 28 }} />}</h1>
          {c && <StatusChip status={c.status} />}
          {c?.checkIn.painReported && <span className="ca-chip" data-tone="danger">Pain reported</span>}
        </div>
        <p className="ca-row-meta ca-trunc" style={{ margin: 0 }}>{email}{c?.goal ? ` · ${c.goal}` : ""}</p>
      </header>

      {facts.length > 0 && (
        <nav className="ca-facts" data-tab={current || "overview"} aria-label="At a glance">
          {facts.map((f) => (
            <Link key={f.seg} href={`${base}/${f.seg}`} replace className="ca-fact"><b>{f.value}</b><span className="ca-trunc">{f.label}</span></Link>
          ))}
        </nav>
      )}

      <nav ref={tabsRef} className="ca-tabs" aria-label="Client sections">
        {TABS.map((t) => (
          <Link key={t.seg} href={t.seg ? `${base}/${t.seg}` : base} replace scroll={false} className="ca-tab" aria-current={current === t.seg ? "page" : undefined}>
            {t.label}{badgeFor(t.seg) > 0 && <span className="ca-badge">{badgeFor(t.seg)}</span>}
          </Link>
        ))}
      </nav>

      <div className="ca-client-embed">{children}</div>
    </div>
  )
}
