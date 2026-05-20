"use client"

import { useState, useEffect } from "react"
import CourseHeader from "@/components/training/CourseHeader"
import CourseSidebar from "@/components/training/CourseSidebar"

const STORAGE_KEY = "lfm_access"

export default function TrainingFoundationsLayout({ children }: { children: React.ReactNode }) {
  const [hasAccess, setHasAccess] = useState(false)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setHasAccess(true)
    setChecking(false)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setMessage({ text: "Please enter your email address.", isError: true })
      return
    }
    setSubmitting(true)
    setMessage(null)

    // Dummy auth: accept any email after a brief delay
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, email.trim())
      setHasAccess(true)
      setSubmitting(false)
    }, 800)
  }

  if (checking) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#888", fontSize: "0.9rem", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Checking your access…
        </p>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "2rem",
          padding: "2rem",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "1.1rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#c9a96e",
          }}
        >
          Lisa Fit Method
        </div>
        <h2
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            fontWeight: 300,
            textAlign: "center",
            color: "#f0e6d3",
            lineHeight: 1.2,
          }}
        >
          Welcome to<br />
          <em>Training Foundations</em>
        </h2>
        <p style={{ color: "#888", fontSize: "0.85rem", textAlign: "center", fontFamily: "var(--font-montserrat), sans-serif" }}>
          Enter the email you used to purchase.<br />
          We&apos;ll send you a magic link — no password needed.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: 360 }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            disabled={submitting}
            style={{
              background: "#161616",
              border: "1px solid #2a2a2a",
              color: "#f0e6d3",
              padding: "1rem 1.25rem",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.9rem",
              outline: "none",
              textAlign: "center",
            }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: "#c9a96e",
              color: "#0a0a0a",
              border: "none",
              padding: "1rem",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Checking…" : "Access My Course"}
          </button>
          {message && (
            <p
              style={{
                color: message.isError ? "#e08a8a" : "#8ecba0",
                fontSize: "0.8rem",
                textAlign: "center",
                fontFamily: "var(--font-montserrat), sans-serif",
              }}
            >
              {message.isError ? message.text : `✓ ${message.text}`}
            </p>
          )}
        </form>
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        background: "#0a0a0a",
        color: "#f0e6d3",
        fontFamily: "var(--font-montserrat), sans-serif",
        fontWeight: 300,
        lineHeight: 1.7,
      }}
    >
      <CourseHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <CourseSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            scrollbarWidth: "thin",
          }}
          className="course-scroll-area"
        >
          <style>{`
            .course-scroll-area::-webkit-scrollbar { width: 4px; }
            .course-scroll-area::-webkit-scrollbar-thumb { background: #2a2a2a; }
          `}</style>
          {children}
        </div>
      </div>
    </div>
  )
}
