"use client"

import Link from "next/link"
import { useState } from "react"
import type { AttentionItem } from "@/lib/coachingOverview"
import { ATTENTION_ICON, Empty, Icon, timeAgo } from "./AdminUi"

const ACTION: Record<AttentionItem["kind"], string> = {
  pain: "Safety", reply: "Reply", "check-in": "Review", application: "Decide", task: "Task",
  "no-program": "Assign", "program-ending": "Plan", inactive: "Check in", payment: "Waiting",
}

export default function AttentionList({ items, limit = 7 }: { items: AttentionItem[]; limit?: number }) {
  const [expanded, setExpanded] = useState(false)
  if (items.length === 0) return <div className="ca-card"><Empty>You&apos;re all caught up. Nothing needs you right now.</Empty></div>
  const shown = expanded ? items : items.slice(0, limit)
  return (
    <div className="ca-card">
      <ul className="ca-list">
        {shown.map((a) => (
          <li key={a.id}>
            <Link href={a.href} className={`ca-row${a.urgency === 1 ? " ca-urgent" : ""}`}>
              <span className="ca-icon" data-tone={a.urgency === 1 ? "danger" : a.urgency === 2 ? "accent" : undefined}>
                <Icon name={ATTENTION_ICON[a.kind]} />
              </span>
              <span className="ca-row-main">
                <span className="ca-row-title ca-clamp2">{a.title}</span>
                {a.detail && <span className="ca-row-meta ca-clamp2">{a.detail}</span>}
              </span>
              <span className="ca-row-aside">
                {a.at && <span className="ca-sr">{timeAgo(a.at)}</span>}
                <span className="ca-chip" data-tone={a.urgency === 1 ? "danger" : "plain"}>{ACTION[a.kind]}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {items.length > limit && (
        <div style={{ borderTop: "1px solid var(--ca-line-soft)", padding: "0 16px" }}>
          <button type="button" className="ca-link" style={{ background: "none", border: 0, cursor: "pointer", width: "100%", textAlign: "left", minHeight: 44 }} onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
            {expanded ? "Show fewer" : `Show ${items.length - limit} more`}
          </button>
        </div>
      )}
    </div>
  )
}
