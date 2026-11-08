"use client"

import Link from "next/link"
import { useState } from "react"
import type { AttentionItem, AttentionKind } from "@/lib/coachingOverview"
import { ATTENTION_ICON, Empty, Icon, timeAgo } from "./AdminUi"
import { GROUP_HREF, GROUP_TITLE, groupAttention, type AttentionRow } from "@/lib/attentionGroups"

const ACTION: Record<AttentionKind, string> = {
  pain: "Safety", reply: "Reply", "check-in": "Review", application: "Decide", task: "Task",
  "no-program": "Assign", "program-ending": "Plan", inactive: "Check in", payment: "Waiting",
}

function ItemRow({ a, nested = false }: { a: AttentionItem; nested?: boolean }) {
  return (
    <Link href={a.href} className={`ca-row${a.urgency === 1 ? " ca-urgent" : ""}`} style={nested ? { minHeight: 52, paddingLeft: 68 } : undefined}>
      {nested ? <span aria-hidden="true" /> : (
        <span className="ca-icon" data-tone={a.urgency === 1 ? "danger" : a.urgency === 2 ? "accent" : undefined}>
          <Icon name={ATTENTION_ICON[a.kind]} />
        </span>
      )}
      <span className="ca-row-main">
        <span className={`ca-row-title ${nested ? "ca-trunc" : "ca-clamp2"}`} style={nested ? { fontSize: "0.9375rem", fontWeight: 500 } : undefined}>
          {nested ? a.clientName ?? a.title : a.title}
        </span>
        {a.detail && <span className="ca-row-meta ca-clamp2">{a.detail}</span>}
      </span>
      <span className="ca-row-aside">
        {a.at && <span className="ca-sr">{timeAgo(a.at)}</span>}
        {!nested && <span className="ca-chip" data-tone={a.urgency === 1 ? "danger" : "plain"}>{ACTION[a.kind]}</span>}
      </span>
    </Link>
  )
}

function GroupRow({ row }: { row: Extract<AttentionRow, { type: "group" }> }) {
  const [open, setOpen] = useState(false)
  const href = GROUP_HREF[row.kind]
  const title = GROUP_TITLE[row.kind]?.(row.items.length) ?? `${row.items.length} items`
  const names = row.items.map((i) => i.clientName ?? i.title).slice(0, 3).join(", ") + (row.items.length > 3 ? "…" : "")
  const head = (
    <>
      <span className="ca-icon" data-tone={row.urgency === 2 ? "accent" : undefined}><Icon name={ATTENTION_ICON[row.kind]} /></span>
      <span className="ca-row-main">
        <span className="ca-row-title ca-clamp2">{title}</span>
        <span className="ca-row-meta ca-trunc">{names}</span>
      </span>
      <span className="ca-row-aside">
        <span className="ca-chip" data-tone="plain">{href ? "Open" : open ? "Hide" : "Show"}</span>
      </span>
    </>
  )
  if (href) return <Link href={href} className="ca-row">{head}</Link>
  return (
    <>
      <button type="button" className="ca-row" aria-expanded={open} onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", background: "none", border: 0, textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit" }}>
        {head}
      </button>
      {open && (
        <ul className="ca-list" style={{ borderTop: "1px solid var(--ca-line-soft)" }}>
          {row.items.map((a) => <li key={a.id}><ItemRow a={a} nested /></li>)}
        </ul>
      )}
    </>
  )
}

export default function AttentionList({ items, limit = 7 }: { items: AttentionItem[]; limit?: number }) {
  const [expanded, setExpanded] = useState(false)
  if (items.length === 0) return <div className="ca-card"><Empty>You&apos;re all caught up. Nothing needs you right now.</Empty></div>
  const rows = groupAttention(items)
  const shown = expanded ? rows : rows.slice(0, limit)
  return (
    <div className="ca-card">
      <ul className="ca-list">
        {shown.map((r) => (
          <li key={r.type === "item" ? r.item.id : `group-${r.kind}`}>
            {r.type === "item" ? <ItemRow a={r.item} /> : <GroupRow row={r} />}
          </li>
        ))}
      </ul>
      {rows.length > limit && (
        <div style={{ borderTop: "1px solid var(--ca-line-soft)", padding: "0 16px" }}>
          <button type="button" className="ca-link" style={{ background: "none", border: 0, cursor: "pointer", width: "100%", textAlign: "left", minHeight: 44 }} onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
            {expanded ? "Show fewer" : `Show ${rows.length - limit} more`}
          </button>
        </div>
      )}
    </div>
  )
}
