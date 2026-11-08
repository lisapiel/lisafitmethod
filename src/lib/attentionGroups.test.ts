import { test } from "node:test"
import assert from "node:assert/strict"
import { groupAttention } from "./attentionGroups"
import type { AttentionItem } from "./coachingOverview"

const item = (id: string, kind: AttentionItem["kind"], urgency: AttentionItem["urgency"] = 3): AttentionItem =>
  ({ id, kind, urgency, title: id, detail: "", href: "/", clientEmail: null, clientName: id, at: null })

test("a busy week folds into a few rows; pain is never folded", () => {
  const items = [
    item("p1", "pain", 1), item("p2", "pain", 1),
    ...["r1", "r2", "r3", "r4", "r5"].map((id) => item(id, "reply", 2)),
    item("c1", "check-in", 2),
    ...Array.from({ length: 12 }, (_, i) => item(`i${i}`, "inactive")),
    item("pay1", "payment"),
  ]
  const rows = groupAttention(items)
  assert.deepEqual(rows.map((r) => (r.type === "item" ? r.item.id : `group:${r.kind}:${r.items.length}`)), ["p1", "p2", "group:reply:5", "c1", "group:inactive:12", "pay1"])
})

test("below the threshold items stay individual and keep their order", () => {
  const rows = groupAttention([item("r1", "reply", 2), item("r2", "reply", 2), item("i1", "inactive")])
  assert.deepEqual(rows.map((r) => r.type), ["item", "item", "item"])
})
