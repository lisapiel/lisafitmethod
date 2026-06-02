"use client"
import { useState } from "react"

const dmSans = "var(--font-dm-sans), sans-serif"
const playfair = "var(--font-playfair), serif"
const gold = "#c8a97e"
const goldDeep = "#a8895e"
const black = "#0a0a0a"
const ink = "#1a1a1a"
const muted = "#6b6560"
const panel = "#f0ebe2"
const line = "#ddd8cf"

interface FreeGuideSignupFormProps {
  source: string
  apiEndpoint?: string
  variant?: "compact"
  formOnly?: boolean
  onSuccess?: () => void
}

export function FreeGuideSignupForm({ source, apiEndpoint = "/api/free-guide", variant, formOnly, onSuccess }: FreeGuideSignupFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName) {
      setErrorMsg("Please enter your first name.")
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
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, source }),
      })
      if (res.ok) {
        setStatus("done")
        onSuccess?.()
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

  const inputStyleDark = (hasError: boolean): React.CSSProperties => ({
    width: "100%",
    boxSizing: "border-box",
    background: "#1a1a1a",
    border: `1px solid ${hasError ? "#884444" : "#2a2722"}`,
    color: "#f0ebe2",
    fontFamily: dmSans,
    fontSize: "1rem",
    padding: "0.6rem 0.875rem",
    outline: "none",
  })

  // ── Compact variant — used on the homepage ────────────────────────────────
  if (variant === "compact") {
    if (status === "done") {
      return (
        <p style={{ fontFamily: dmSans, fontSize: "0.9rem", color: goldDeep, fontStyle: "italic", margin: 0 }}>
          Your guide is on its way. Check your inbox.
        </p>
      )
    }
    return (
      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 420 }}>
        <input
          type="text"
          autoComplete="given-name"
          value={name}
          onChange={(e) => { setName(e.target.value); if (status === "error") setStatus("idle") }}
          placeholder="Your first name"
          style={{
            background: "#fff",
            border: `1px solid ${status === "error" && !name.trim() ? "#cc6666" : line}`,
            color: ink,
            fontFamily: dmSans,
            fontSize: "1rem",
            padding: "10px 14px",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
            placeholder="Your email address"
            style={{
              flex: 1,
              background: "#fff",
              border: `1px solid ${status === "error" && !email.trim() ? "#cc6666" : line}`,
              color: ink,
              fontFamily: dmSans,
              fontSize: "1rem",
              padding: "10px 14px",
              outline: "none",
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            style={{
              background: gold,
              color: black,
              border: "none",
              fontFamily: dmSans,
              fontSize: "0.65rem",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "10px 20px",
              cursor: status === "submitting" ? "default" : "pointer",
              opacity: status === "submitting" ? 0.75 : 1,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {status === "submitting" ? "Sending..." : "Send Me the Free Guide →"}
          </button>
        </div>
        {status === "error" && (
          <p style={{ fontFamily: dmSans, fontSize: "0.78rem", color: "#cc6666", margin: 0 }}>
            {errorMsg}
          </p>
        )}
      </form>
    )
  }

  // ── formOnly — parent provides the container; just render the form ──────────
  if (formOnly) {
    if (status === "done") return null
    return (
      <>
        <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 480 }}>
          <input
            type="text"
            autoComplete="given-name"
            value={name}
            onChange={(e) => { setName(e.target.value); if (status === "error") setStatus("idle") }}
            placeholder="Your first name"
            style={inputStyleDark(status === "error" && !name.trim())}
          />
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
            placeholder="your@email.com"
            style={inputStyleDark(status === "error" && !email.trim())}
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            style={{
              background: gold,
              color: black,
              border: "none",
              fontFamily: dmSans,
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "0.75rem 1.25rem",
              cursor: status === "submitting" ? "default" : "pointer",
              opacity: status === "submitting" ? 0.7 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {status === "submitting" ? "Sending..." : "Get the Guide"}
          </button>
        </form>
        {status === "error" && (
          <p style={{ fontFamily: dmSans, fontSize: "0.8rem", color: "#cc6666", marginTop: "0.5rem" }}>
            {errorMsg}
          </p>
        )}
        <p style={{ fontFamily: dmSans, fontSize: "0.68rem", color: "#555", marginTop: "0.75rem" }}>
          No spam. Unsubscribe any time.
        </p>
      </>
    )
  }

  // ── Default variant ──────────────────────────────────────────────────────────
  if (status === "done") {
    return (
      <div style={{ background: panel, borderLeft: `2px solid ${gold}`, padding: "1.5rem 1.75rem", marginBottom: "2.5rem" }}>
        <p style={{ fontFamily: playfair, fontStyle: "italic", fontSize: "1.1rem", color: goldDeep, marginBottom: "0.3rem" }}>
          You are in.
        </p>
        <p style={{ fontFamily: dmSans, fontSize: "0.85rem", color: muted, margin: 0 }}>
          The full guide is unlocked below. Check your inbox for a copy to keep.
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: black, padding: "clamp(1.75rem, 5vw, 2.5rem) clamp(1.5rem, 5vw, 2.75rem)", marginBottom: "2.5rem" }}>
      <p style={{ fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.3em", textTransform: "uppercase", color: goldDeep, marginBottom: "0.75rem", fontFamily: dmSans }}>
        One more step
      </p>
      <h2 style={{ fontFamily: playfair, fontSize: "clamp(1.4rem, 3.5vw, 1.75rem)", color: "#fff", fontWeight: 700, marginBottom: "0.75rem", marginTop: 0, lineHeight: 1.15 }}>
        Enter your details to see inside the program
      </h2>
      <p style={{ fontSize: "0.88rem", color: "#b3ab9c", marginBottom: "1.5rem", maxWidth: 480, lineHeight: 1.65, fontFamily: dmSans }}>
        Get the Day A workout breakdown, the full pitch, and a copy of this guide sent straight to your inbox.
      </p>
      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 480 }}>
        <input
          type="text"
          autoComplete="given-name"
          value={name}
          onChange={(e) => { setName(e.target.value); if (status === "error") setStatus("idle") }}
          placeholder="Your first name"
          style={inputStyleDark(status === "error" && !name.trim())}
        />
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
          placeholder="your@email.com"
          style={inputStyleDark(status === "error" && !email.trim())}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          style={{
            background: gold,
            color: black,
            border: "none",
            fontFamily: dmSans,
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding: "0.75rem 1.25rem",
            cursor: status === "submitting" ? "default" : "pointer",
            opacity: status === "submitting" ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {status === "submitting" ? "Sending..." : "Get the Guide"}
        </button>
      </form>
      {status === "error" && (
        <p style={{ fontFamily: dmSans, fontSize: "0.8rem", color: "#cc6666", marginTop: "0.5rem" }}>
          {errorMsg}
        </p>
      )}
      <p style={{ fontFamily: dmSans, fontSize: "0.68rem", color: "#555", marginTop: "0.75rem" }}>
        No spam. Unsubscribe any time.
      </p>
    </div>
  )
}
