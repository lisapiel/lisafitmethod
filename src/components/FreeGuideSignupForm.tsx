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
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes("@")) {
      setErrorMsg("Please enter a valid email address.")
      setStatus("error")
      return
    }
    setStatus("submitting")
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source }),
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
      <>
        <style>{`
          .fgsf-row { display: flex; gap: 8px; flex-wrap: wrap; }
          .fgsf-row input { flex: 1 1 220px; min-width: 0; }
          @media (max-width: 500px) {
            .fgsf-row { flex-direction: column; gap: 8px; }
            .fgsf-row input, .fgsf-row button { width: 100%; }
          }
        `}</style>
        <form onSubmit={handleSubmit} noValidate>
          <div className="fgsf-row">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
              placeholder="Your email address"
              style={{
                background: "#fff",
                border: `1px solid ${status === "error" ? "#cc6666" : line}`,
                color: ink,
                fontFamily: dmSans,
                fontSize: "0.92rem",
                padding: "14px 18px",
                outline: "none",
                minHeight: 50,
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
                padding: "14px 22px",
                cursor: status === "submitting" ? "default" : "pointer",
                opacity: status === "submitting" ? 0.75 : 1,
                whiteSpace: "nowrap",
                minHeight: 50,
                flexShrink: 0,
              }}
            >
              {status === "submitting" ? "Sending..." : "Send Me the Free Guide →"}
            </button>
          </div>
          {status === "error" && (
            <p style={{ fontFamily: dmSans, fontSize: "0.78rem", color: "#cc6666", marginTop: "0.4rem", margin: "0.4rem 0 0" }}>
              {errorMsg}
            </p>
          )}
        </form>
      </>
    )
  }

  // ── formOnly — parent provides the container; just render the form row ──────
  if (formOnly) {
    if (status === "done") return null
    return (
      <>
        <style>{`
          .fgsf-gate { display: flex; gap: 0.5rem; max-width: 480px; flex-wrap: wrap; }
          @media (max-width: 480px) {
            .fgsf-gate { flex-direction: column; }
            .fgsf-gate input, .fgsf-gate button { width: 100%; }
          }
        `}</style>
        <form onSubmit={handleSubmit} noValidate className="fgsf-gate">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
            placeholder="your@email.com"
            style={{
              flex: "1 1 200px",
              background: "#1a1a1a",
              border: `1px solid ${status === "error" ? "#884444" : "#2a2722"}`,
              color: "#f0ebe2",
              fontFamily: dmSans,
              fontSize: "0.9rem",
              padding: "0.75rem 1rem",
              outline: "none",
              minHeight: 48,
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
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "0.75rem 1.5rem",
              cursor: status === "submitting" ? "default" : "pointer",
              opacity: status === "submitting" ? 0.7 : 1,
              flexShrink: 0,
              whiteSpace: "nowrap",
              minHeight: 48,
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

  // ── Default variant — used on the /free-guide page gate ──────────────────
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
        Enter your email to see inside the program
      </h2>
      <p style={{ fontSize: "0.88rem", color: "#b3ab9c", marginBottom: "1.5rem", maxWidth: 480, lineHeight: 1.65, fontFamily: dmSans }}>
        Get the Day A workout breakdown, the full pitch, and a copy of this guide sent straight to your inbox.
      </p>
      <style>{`
        .fgsf-gate { display: flex; gap: 0.5rem; max-width: 480px; flex-wrap: wrap; }
        @media (max-width: 480px) {
          .fgsf-gate { flex-direction: column; }
          .fgsf-gate input, .fgsf-gate button { width: 100%; }
        }
      `}</style>
      <form onSubmit={handleSubmit} noValidate className="fgsf-gate">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
          placeholder="your@email.com"
          style={{
            flex: "1 1 200px",
            background: "#1a1a1a",
            border: `1px solid ${status === "error" ? "#884444" : "#2a2722"}`,
            color: "#f0ebe2",
            fontFamily: dmSans,
            fontSize: "0.9rem",
            padding: "0.75rem 1rem",
            outline: "none",
            minHeight: 48,
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
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            padding: "0.75rem 1.5rem",
            cursor: status === "submitting" ? "default" : "pointer",
            opacity: status === "submitting" ? 0.7 : 1,
            flexShrink: 0,
            whiteSpace: "nowrap",
            minHeight: 48,
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
