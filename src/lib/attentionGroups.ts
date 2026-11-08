import type { AttentionItem, AttentionKind } from "@/lib/coachingOverview"

// When several items share a kind, one summary row replaces them so a busy
// week reads as a handful of decisions rather than a long feed. Pain reports
// are never folded: each one is a safety check.
export const GROUP_AT: Partial<Record<AttentionKind, number>> = {
  reply: 4, "check-in": 4, application: 3, task: 3,
  "no-program": 2, "program-ending": 2, inactive: 2, payment: 2,
}
export const GROUP_TITLE: Partial<Record<AttentionKind, (n: number) => string>> = {
  reply: (n) => `${n} clients waiting for a reply`,
  "check-in": (n) => `${n} check-ins to review`,
  application: (n) => `${n} new applications`,
  task: (n) => `${n} tasks due or overdue`,
  "no-program": (n) => `${n} clients need a program`,
  "program-ending": (n) => `${n} clients need their next block`,
  inactive: (n) => `${n} clients haven't trained in 10+ days`,
  payment: (n) => `${n} accepted clients haven't paid yet`,
}
export const GROUP_HREF: Partial<Record<AttentionKind, string>> = {
  reply: "/admin/coaching/messages", "check-in": "/admin/coaching/check-ins",
  application: "/admin/coaching/applications", task: "/admin/coaching/tasks",
}

export type AttentionRow =
  | { type: "item"; item: AttentionItem }
  | { type: "group"; kind: AttentionKind; urgency: AttentionItem["urgency"]; items: AttentionItem[] }

export function groupAttention(items: AttentionItem[]): AttentionRow[] {
  const byKind = new Map<AttentionKind, AttentionItem[]>()
  for (const a of items) byKind.set(a.kind, [...(byKind.get(a.kind) ?? []), a])
  const rows: AttentionRow[] = []
  const seen = new Set<AttentionKind>()
  for (const a of items) {
    const group = byKind.get(a.kind)!
    const at = GROUP_AT[a.kind]
    if (at && group.length >= at) {
      if (seen.has(a.kind)) continue
      seen.add(a.kind)
      rows.push({ type: "group", kind: a.kind, urgency: a.urgency, items: group })
    } else {
      rows.push({ type: "item", item: a })
    }
  }
  return rows
}

