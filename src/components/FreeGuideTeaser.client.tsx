"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const dmSans = "var(--font-dm-sans), sans-serif"
const playfair = "var(--font-playfair), serif"
const gold = "#c8a97e"
const goldDeep = "#a8895e"
const ink = "#1a1a1a"
const muted = "#6b6560"
const line = "#ddd8cf"

type CourseChoice = "training" | "nutrition" | "both"

const GUIDES: { id: CourseChoice; label: string; desc: string }[] = [
  {
    id: "training",
    label: "Training Guide",
    desc: "Five foundational movements, the coaching cues I teach, and a preview of the 4-week program.",
  },
  {
    id: "nutrition",
    label: "Nutrition Guide",
    desc: "Five science-backed nutrition principles behind fat loss, muscle growth, and body composition.",
  },
  {
    id: "both",
    label: "Both guides",
    desc: "Everything above, sent together in one email.",
  },
]

export default function FreeGuideTeaser() {
  const router = useRouter()
  const [choice, setChoice] = useState<CourseChoice>("both")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName) {
      setErrorMsg("Please enter your name.")
      setStatus("error")
      return
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.")
      setStatus("error")
      return
    }
    setStatus("submitting")
    try {
      if (choice === "both") {
        await Promise.allSettled([
          fetch("/api/free-guide", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: trimmedName, email: trimmedEmail, source: "free-guide-teaser-both" }),
          }),
          fetch("/api/free-guide-nutrition", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: trimmedName, email: trimmedEmail, source: "free-guide-teaser-both" }),
          }),
        ])
        router.push("/free-guide?unlocked=1")
        return
      }
      const endpoint = choice === "nutrition" ? "/api/free-guide-nutrition" : "/api/free-guide"
      const redirect = choice === "nutrition" ? "/free-guide-nutrition?unlocked=1" : "/free-guide?unlocked=1"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, source: "free-guide-teaser" }),
      })
      if (res.ok) {
        router.push(redirect)
      } else {
        const data = await res.json() as { error?: string }
        setErrorMsg(data.error ?? "Something went wrong. Please try again.")
        setStatus("error")
      }
    } catch {
      setErrorMsg("Connection error. Please try again.")
      setStatus("error")
    }
  }

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    background: "#fff",
    border: `1px solid ${hasError ? "#cc6666" : line}`,
    color: ink,
    fontFamily: dmSans,
    fontSize: "0.95rem",
    padding: "11px 14px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  })

  return (
    <section style={{ background: "#faf8f5", padding: "clamp(80px, 10vw, 120px) clamp(24px, 6vw, 80px)" }}>
      <style>{`
        .fgt-option { transition: background 0.15s, border-color 0.15s; }
        .fgt-option:hover { background: #f5f0ea; }
      `}</style>
      <div style={{ maxWidth: 540, margin: "0 auto" }}>

        <p style={{ fontFamily: dmSans, fontSize: 10, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: goldDeep, marginBottom: 18 }}>
          Not ready to commit yet?
        </p>

        <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.9rem, 4vw, 2.6rem)", fontWeight: 700, color: ink, lineHeight: 1.08, letterSpacing: "-0.02em", margin: "0 0 16px" }}>
          Start with a free guide.
        </h2>

        <p style={{ fontFamily: dmSans, fontSize: "clamp(0.875rem, 2vw, 0.95rem)", color: muted, lineHeight: 1.72, margin: "0 0 36px", maxWidth: 460 }}>
          Two guides built on the same research that drives the courses. Both free. No payment, no catch. Pick what fits where you are.
        </p>

        {/* Guide selector */}
        <div style={{ marginBottom: 28 }}>
          {GUIDES.map(({ id, label, desc }) => {
            const selected = choice === id
            return (
              <button
                key={id}
                type="button"
                className="fgt-option"
                onClick={() => setChoice(id)}
                style={{
                  display: "block",
                  width: "100%",
                  background: selected ? "#f5f0ea" : "transparent",
                  border: "none",
                  borderLeft: `2px solid ${selected ? gold : "transparent"}`,
                  cursor: "pointer",
                  padding: "13px 16px",
                  marginBottom: 2,
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{
                    display: "inline-block",
                    width: 13,
                    height: 13,
                    borderRadius: "50%",
                    border: `1.5px solid ${selected ? gold : "#c4bfb8"}`,
                    background: selected ? gold : "transparent",
                    flexShrink: 0,
                    marginTop: 4,
                  }} />
                  <div>
                    <p style={{ fontFamily: dmSans, fontSize: "0.78rem", fontWeight: 600, color: selected ? ink : muted, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
                      {label}
                    </p>
                    <p style={{ fontFamily: dmSans, fontSize: "0.8rem", color: muted, margin: "4px 0 0", lineHeight: 1.55 }}>
                      {desc}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: line, marginBottom: 24 }} />

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => { setName(e.target.value); if (status === "error") setStatus("idle") }}
            placeholder="Your name"
            style={inputStyle(status === "error" && !name.trim())}
          />
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
            placeholder="Your email"
            style={inputStyle(status === "error" && !email.trim())}
          />
          <div>
            <button
              type="submit"
              disabled={status === "submitting"}
              style={{
                background: gold,
                color: "#0a0a0a",
                border: "none",
                fontFamily: dmSans,
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "13px 28px",
                cursor: status === "submitting" ? "default" : "pointer",
                opacity: status === "submitting" ? 0.75 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {status === "submitting" ? "Sending..." : "Send Me the Guide →"}
            </button>
          </div>
        </form>

        {status === "error" && (
          <p style={{ fontFamily: dmSans, fontSize: "0.78rem", color: "#cc6666", marginTop: "0.5rem" }}>
            {errorMsg}
          </p>
        )}

        <p style={{ fontFamily: dmSans, fontSize: "0.68rem", color: "#9c9590", marginTop: "0.875rem" }}>
          Free. No credit card. Unsubscribe any time.
        </p>
      </div>
    </section>
  )
}
