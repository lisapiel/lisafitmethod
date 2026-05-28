"use client"

import { useState, useEffect } from "react"
import { generateClient } from "aws-amplify/data"
import Link from "next/link"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

type QAItem = { id: string; question: string; answer: string | null; answeredAt: string | null }

export default function QAPage() {
  const [items, setItems] = useState<QAItem[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = generateClient<Schema>({ authMode: "userPool" })
    client.models.QAndAEntry.list({
      filter: { and: [{ status: { eq: "PUBLISHED" } }, { isPublic: { eq: true } }] },
      authMode: "userPool",
    }).then(({ data }) => {
      setItems(
        data
          .map((q) => ({ id: q.id, question: q.question, answer: q.answer ?? null, answeredAt: q.answeredAt ?? null }))
          .sort((a, b) => (b.answeredAt ?? "").localeCompare(a.answeredAt ?? ""))
      )
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = items.filter(
    (q) =>
      !search ||
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      (q.answer ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: "2rem 2rem 4rem", maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 300, color: "#f0e6d3", margin: 0, lineHeight: 1.2 }}>Q&A</h1>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555", marginTop: 8 }}>
            {items.length} answered questions
          </p>
        </div>
        <Link href="/masterclass/qa/ask">
          <button style={{ background: gold, color: "#0a0a0a", border: "none", padding: "10px 20px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>
            Ask a Question
          </button>
        </Link>
      </div>

      <input
        type="search"
        placeholder="Search questions…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", background: "#161616", border: `1px solid ${border}`, color: "#f0e6d3", padding: "10px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", marginBottom: "1.5rem", outline: "none", boxSizing: "border-box" }}
      />

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
          <div style={{ width: 28, height: 28, border: "2px solid #2a2a2a", borderTop: `2px solid ${gold}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#555" }}>
          {search ? "No questions match your search." : "No answered questions yet. Be the first to ask!"}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {filtered.map((q) => (
            <div key={q.id} style={{ borderBottom: `1px solid ${border}`, padding: "1.5rem 0" }}>
              <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", fontWeight: 600, color: "#f0e6d3", margin: "0 0 1rem", lineHeight: 1.5 }}>
                {q.question}
              </p>
              {q.answer && (
                <div style={{ paddingLeft: "1rem", borderLeft: `2px solid ${gold}` }}>
                  <p style={{ margin: "0 0 6px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: gold }}>
                    Lisa
                  </p>
                  <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#d0c8b8", lineHeight: 1.7, margin: 0 }}>
                    {q.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
