"use client"

import { useState } from "react"
import { generateClient } from "aws-amplify/data"
import { fetchUserAttributes } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import type { Schema } from "@/lib/amplifyConfig"

const gold = "#c9a96e"
const border = "#2a2a2a"

export default function AskPage() {
  const router = useRouter()
  const [question, setQuestion] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const attrs = await fetchUserAttributes()
      const email = attrs.email ?? "unknown"
      const client = generateClient<Schema>({ authMode: "userPool" })
      await client.models.QAndAEntry.create({
        userEmail: email,
        question: question.trim(),
        status: "PENDING",
        isPublic: true,
      }, { authMode: "userPool" })
      setSubmitted(true)
    } catch {
      setError("Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ padding: "2rem 2rem 4rem", maxWidth: 560 }}>
        <div style={{ background: "#111", border: `1px solid ${border}`, borderRadius: 2, padding: "2rem", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "2rem", fontWeight: 300, color: gold, marginBottom: 12 }}>Question submitted.</p>
          <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: "#888", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Lisa answers questions in batch once a month. You&apos;ll see the answer in the Q&A section when it&apos;s published.
          </p>
          <button onClick={() => router.push("/masterclass/qa")} style={{ background: gold, color: "#0a0a0a", border: "none", padding: "12px 24px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>
            Back to Q&A
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: "2rem 2rem 4rem", maxWidth: 560 }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", color: "#555", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", letterSpacing: "0.1em", cursor: "pointer", padding: 0 }}>
          ← Q&A
        </button>
      </div>

      <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 300, color: "#f0e6d3", marginBottom: "0.5rem" }}>
        Ask a Question
      </h1>
      <p style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#555", marginBottom: "2rem", lineHeight: 1.6 }}>
        Lisa answers questions once a month. Keep it specific — training form, exercise substitutions, programming questions.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: 10 }}>
            Your Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What would you like to ask Lisa?"
            rows={5}
            style={{ width: "100%", background: "#161616", border: `1px solid ${border}`, color: "#f0e6d3", padding: "12px 14px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }}
          />
        </div>

        {error && <p style={{ color: "#e07070", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", marginBottom: 12 }}>{error}</p>}

        <button type="submit" disabled={submitting || !question.trim()} style={{ background: submitting ? "#333" : gold, color: submitting ? "#888" : "#0a0a0a", border: "none", padding: "13px 28px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", cursor: submitting || !question.trim() ? "not-allowed" : "pointer" }}>
          {submitting ? "Submitting…" : "Submit Question"}
        </button>
      </form>
    </div>
  )
}
