"use client"

import type { ReactNode } from "react"
import type { AttentionKind, ClientSummary } from "@/lib/coachingOverview"
import type { AdminFetchError } from "./useAdminFetch"

const paths: Record<string, ReactNode> = {
  message: <path d="M4 5h16a1 1 0 011 1v11a1 1 0 01-1 1H9l-5 4V6a1 1 0 011-1z" />,
  checkin: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M4 11h16M9 15l2 2 4-4" /></>,
  alert: <><path d="M12 3l9.5 17h-19L12 3z" /><path d="M12 10v4M12 17.5v.01" /></>,
  person: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
  task: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>,
  program: <><path d="M4 6h16M4 12h10M4 18h7" /><path d="M17 15l3 3-3 3" /></>,
  idle: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  card: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
}

export function Icon({ name, size = 18 }: { name: keyof typeof paths | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

export const ATTENTION_ICON: Record<AttentionKind, string> = {
  pain: "alert", reply: "message", "check-in": "checkin", application: "person", task: "task",
  "no-program": "program", "program-ending": "program", inactive: "idle", payment: "card",
  "profile-request": "person",
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"
}

export function timeAgo(iso: string | null, now = Date.now()) {
  if (!iso) return ""
  const diff = now - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function dayCount(n: number | null) {
  if (n === null) return "never"
  if (n <= 0) return "today"
  if (n === 1) return "yesterday"
  return `${n} days ago`
}

export function CheckInChip({ state }: { state: ClientSummary["checkIn"]["state"] }) {
  if (state === "reviewed") return <span className="ca-chip" data-tone="ok">Check-in reviewed</span>
  if (state === "pending") return <span className="ca-chip" data-tone="warn">Check-in to review</span>
  return <span className="ca-chip" data-tone="muted">No check-in yet</span>
}

export function StatusChip({ status }: { status: ClientSummary["status"] }) {
  if (status === "ACTIVE") return null
  const label = status === "PENDING_PAYMENT" ? "Awaiting payment" : status === "PAUSED" ? "Paused" : "Inactive"
  return <span className="ca-chip" data-tone={status === "PENDING_PAYMENT" ? "warn" : "muted"}>{label}</span>
}

export function WeekDots({ done, total }: { done: number; total: number }) {
  if (total <= 0) return null
  return (
    <span className="ca-dots" aria-hidden="true">
      {Array.from({ length: Math.min(total, 7) }, (_, i) => <i key={i} {...(i < done ? { "data-on": "" } : {})} />)}
    </span>
  )
}

export function SkeletonRows({ rows = 4, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label}>
      <ul className="ca-list">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="ca-row" style={{ gridTemplateColumns: "auto minmax(0,1fr)" }}>
            <span className="ca-skel" style={{ width: 40, height: 40, borderRadius: "50%" }} />
            <span style={{ display: "grid", gap: 8 }}>
              <span className="ca-skel" style={{ height: 14, width: `${55 + ((i * 17) % 30)}%` }} />
              <span className="ca-skel" style={{ height: 11, width: `${35 + ((i * 23) % 40)}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LoadError({ error, onRetry, hasData }: { error: AdminFetchError; onRetry: () => void; hasData: boolean }) {
  return (
    <div className="ca-error" role="alert">
      <p>{hasData ? `Showing the last loaded data. ${error.message}` : error.message}</p>
      {error.status === 401
        ? <a className="ca-btn" href="/admin/login">Sign in</a>
        : <button type="button" className="ca-btn" onClick={onRetry}>Try again</button>}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="ca-empty"><Icon name="check" size={20} />{children}</p>
}
