"use client"

import { useCallback, useEffect, useState } from "react"
import { fetchAuthSession } from "aws-amplify/auth"
import ReviewProgramSection from "@/components/coaching/warmups/ReviewProgramSection"
import type { ReviewProgram } from "@/components/coaching/warmups/reviewGroups"
import { WarmupStyles, wu } from "@/components/coaching/warmups/WarmupUi"

async function token() {
  return (await fetchAuthSession()).tokens?.accessToken?.toString() ?? ""
}

export default function WarmupReviewClient() {
  const [programs, setPrograms] = useState<ReviewProgram[] | null>(null)
  const [error, setError] = useState("")
  const [showTemplates, setShowTemplates] = useState(false)

  const load = useCallback(async () => {
    setError("")
    try {
      const res = await fetch("/api/admin/coaching/warmup-review", { headers: { Authorization: `Bearer ${await token()}` } })
      if (!res.ok) throw new Error(String(res.status))
      setPrograms(((await res.json()) as { programs: ReviewProgram[] }).programs)
    } catch {
      setError("Couldn't load the review. Check your connection and reload the page.")
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function apply(p: ReviewProgram, selection: { week: number; dayIndex: number; kind: "warmup" | "cooldown" }[]) {
    try {
      const res = await fetch("/api/admin/coaching/warmup-review", {
        method: "POST",
        headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ programId: p.id, updatedAt: p.updatedAt, selection }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 409) return "This program was edited since the review loaded. Reload the page and check again."
      if (!res.ok) return "Not applied. Check your connection and try again."
      await load()
      return `Added ${data.applied} ${data.applied === 1 ? "sequence" : "sequences"}.${data.skipped ? ` ${data.skipped} skipped because they already had content.` : ""}`
    } catch {
      return "Not applied. Check your connection and try again."
    }
  }

  const clients = programs?.filter((p) => !p.isTemplate) ?? []
  const templates = programs?.filter((p) => p.isTemplate) ?? []

  return (
    <div style={{ maxWidth: 1040 }}>
      <WarmupStyles />
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: wu.cream, margin: 0 }}>Warm-up review</h1>
      <p style={{ fontFamily: wu.font, fontSize: "0.9375rem", lineHeight: 1.6, color: wu.muted, margin: "6px 0 18px", maxWidth: "68ch" }}>
        Days in existing programs with no warm-up or cool-down, and what your sequences would add. Nothing changes until you confirm a program&apos;s additions.
        Client settings are changed in each client&apos;s program editor.
      </p>

      {error && <p role="alert" style={{ fontFamily: wu.font, fontSize: "0.9375rem", color: wu.warn }}>{error}</p>}
      {!programs && !error && <p style={{ fontFamily: wu.font, fontSize: "0.9375rem", color: wu.muted }}>Loading…</p>}
      {programs && clients.length === 0 && (
        <p style={{ fontFamily: wu.font, fontSize: "0.9375rem", color: wu.cream }}>Every client program has its warm-ups and cool-downs.</p>
      )}

      {clients.map((p) => <ReviewProgramSection key={p.id} program={p} onApply={apply} />)}

      {templates.length > 0 && (
        <div style={{ borderTop: `1px solid ${wu.line}`, paddingTop: 18, marginTop: 10 }}>
          <button type="button" className="wu-btn wu-btn-quiet" aria-expanded={showTemplates} onClick={() => setShowTemplates((v) => !v)}>
            {showTemplates ? "Hide" : "Show"} {templates.length} {templates.length === 1 ? "template" : "templates"} with gaps
          </button>
          {showTemplates && templates.map((p) => <ReviewProgramSection key={p.id} program={p} onApply={apply} />)}
        </div>
      )}
    </div>
  )
}
