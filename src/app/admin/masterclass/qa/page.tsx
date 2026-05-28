"use client"

import { useState, useEffect, useCallback } from "react"
import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

type QAItem = {
  id: string
  userEmail: string
  question: string
  answer: string | null
  status: "PENDING" | "ANSWERED" | "PUBLISHED"
  isPublic: boolean
  answeredAt: string | null
}

type Tab = "PENDING" | "ANSWERED" | "PUBLISHED"

export default function AdminQAPage() {
  const [items, setItems] = useState<QAItem[]>([])
  const [tab, setTab] = useState<Tab>("PENDING")
  const [loading, setLoading] = useState(true)
  const [answeringId, setAnsweringId] = useState<string | null>(null)
  const [answerDraft, setAnswerDraft] = useState("")
  const [saving, setSaving] = useState(false)

  const loadItems = useCallback(async () => {
    setLoading(true)
    const client = generateClient<Schema>({ authMode: "userPool" })
    const { data } = await client.models.QAndAEntry.list({ authMode: "userPool" })
    setItems(
      data
        .map((q) => ({
          id: q.id,
          userEmail: q.userEmail,
          question: q.question,
          answer: q.answer ?? null,
          status: (q.status ?? "PENDING") as Tab,
          isPublic: q.isPublic ?? true,
          answeredAt: q.answeredAt ?? null,
        }))
        .sort((a, b) => (b.answeredAt ?? "").localeCompare(a.answeredAt ?? ""))
    )
    setLoading(false)
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  async function handleSaveAnswer(id: string, publish: boolean) {
    if (!answerDraft.trim()) return
    setSaving(true)
    const client = generateClient<Schema>({ authMode: "userPool" })
    await client.models.QAndAEntry.update({
      id,
      answer: answerDraft.trim(),
      status: publish ? "PUBLISHED" : "ANSWERED",
      isPublic: publish,
      answeredAt: new Date().toISOString(),
    })
    setAnsweringId(null)
    setAnswerDraft("")
    setSaving(false)
    await loadItems()
  }

  async function handleUpdateStatus(id: string, status: Tab, isPublic: boolean) {
    const client = generateClient<Schema>({ authMode: "userPool" })
    await client.models.QAndAEntry.update({ id, status, isPublic })
    await loadItems()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this question?")) return
    const client = generateClient<Schema>({ authMode: "userPool" })
    await client.models.QAndAEntry.delete({ id })
    await loadItems()
  }

  const filtered = items.filter((q) => q.status === tab)
  const counts = { PENDING: items.filter((q) => q.status === "PENDING").length, ANSWERED: items.filter((q) => q.status === "ANSWERED").length, PUBLISHED: items.filter((q) => q.status === "PUBLISHED").length }

  return (
    <div>
      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.35rem" }}>Q&A</h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#888", marginBottom: "2rem" }}>
        Answer member questions and publish to the Q&A feed.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${border}`, marginBottom: "1.5rem" }}>
        {(["PENDING", "ANSWERED", "PUBLISHED"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", borderBottom: t === tab ? `2px solid ${gold}` : "2px solid transparent", color: t === tab ? gold : "#888", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", padding: "10px 16px", cursor: "pointer", marginBottom: -1 }}>
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555" }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555" }}>No {tab.toLowerCase()} questions.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((q) => (
            <div key={q.id} style={{ background: "#111", border: `1px solid ${border}`, borderRadius: 2, padding: "16px 20px" }}>
              <p style={{ margin: "0 0 4px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: "#555", letterSpacing: "0.1em" }}>
                From {q.userEmail}
              </p>
              <p style={{ margin: "0 0 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", fontWeight: 600, color: "#f0e6d3", lineHeight: 1.5 }}>
                {q.question}
              </p>

              {q.answer && answeringId !== q.id && (
                <div style={{ marginBottom: 12, padding: "12px 14px", background: "#0a0a0a", borderLeft: `2px solid ${gold}` }}>
                  <p style={{ margin: "0 0 4px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", color: gold, letterSpacing: "0.1em", fontWeight: 600 }}>YOUR ANSWER</p>
                  <p style={{ margin: 0, fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#d0c8b8", lineHeight: 1.7 }}>{q.answer}</p>
                </div>
              )}

              {answeringId === q.id ? (
                <div style={{ marginTop: 8 }}>
                  <textarea
                    autoFocus
                    value={answerDraft}
                    onChange={(e) => setAnswerDraft(e.target.value)}
                    placeholder="Write your answer…"
                    rows={4}
                    style={{ width: "100%", background: "#161616", border: `1px solid ${border}`, color: "#f0e6d3", padding: "10px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10, lineHeight: 1.6 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => handleSaveAnswer(q.id, true)} disabled={saving} style={{ background: gold, color: "#0a0a0a", border: "none", padding: "8px 16px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>Publish</button>
                    <button onClick={() => handleSaveAnswer(q.id, false)} disabled={saving} style={{ background: "none", border: `1px solid ${border}`, color: "#888", padding: "8px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>Save Draft</button>
                    <button onClick={() => { setAnsweringId(null); setAnswerDraft("") }} style={{ background: "none", border: "none", color: "#555", padding: "8px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => { setAnsweringId(q.id); setAnswerDraft(q.answer ?? "") }} style={{ background: "none", border: `1px solid ${gold}`, color: gold, padding: "6px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                    {q.answer ? "Edit Answer" : "Answer"}
                  </button>
                  {q.status === "ANSWERED" && (
                    <button onClick={() => handleUpdateStatus(q.id, "PUBLISHED", true)} style={{ background: "none", border: `1px solid ${border}`, color: "#888", padding: "6px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Publish</button>
                  )}
                  {q.status === "PUBLISHED" && (
                    <button onClick={() => handleUpdateStatus(q.id, "ANSWERED", false)} style={{ background: "none", border: `1px solid ${border}`, color: "#888", padding: "6px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Unpublish</button>
                  )}
                  <button onClick={() => handleDelete(q.id)} style={{ background: "none", border: "1px solid #3a2020", color: "#e07070", padding: "6px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
