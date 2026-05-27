"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const dmSans = "var(--font-dm-sans), sans-serif"
const playfair = "var(--font-playfair), serif"
const gold = "#c8a97e"
const ink = "#1a1a1a"
const muted = "#6b6560"
const line = "#ddd8cf"

export default function FreeGuideTeaser() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle")
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
      const res = await fetch("/api/free-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "courses-page-teaser" }),
      })
      if (res.ok) {
        router.push("/free-guide?unlocked=1")
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

  return (
    <section style={{ background: "#f5f2ee", padding: "clamp(80px, 10vw, 120px) clamp(24px, 6vw, 80px)" }}>
      <style>{`
        .fgt-inner { max-width: 680px; margin: 0 auto; }
        .fgt-form { display: flex; gap: 8px; max-width: 480px; }
        @media (max-width: 520px) {
          .fgt-form { flex-direction: column; }
          .fgt-form input, .fgt-form button { width: 100%; }
        }
      `}</style>
      <div className="fgt-inner">
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: 16, fontFamily: dmSans }}>
          Not ready to commit yet?
        </p>
        <h2 style={{ fontFamily: playfair, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, color: ink, lineHeight: 1.1, marginBottom: 16, letterSpacing: "-0.02em" }}>
          Try it first.{" "}
          <em style={{ fontStyle: "italic", color: "#a8895e" }}>No payment required.</em>
        </h2>
        <p style={{ fontFamily: dmSans, fontSize: "clamp(14px, 2vw, 16px)", color: muted, lineHeight: 1.65, marginBottom: 32, maxWidth: 520 }}>
          The free guide covers the five movement patterns the whole program is built on, with the exact coaching cues I teach, plus a look inside one full workout day. Enter your email and it is yours instantly.
        </p>

        <form onSubmit={handleSubmit} noValidate className="fgt-form">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
            placeholder="Your email address"
            style={{
              flex: "1 1 200px",
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
              color: "#0a0a0a",
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
            {status === "submitting" ? "Sending..." : "Send me the free guide →"}
          </button>
        </form>

        {status === "error" && (
          <p style={{ fontFamily: dmSans, fontSize: "0.8rem", color: "#cc6666", marginTop: "0.5rem" }}>
            {errorMsg}
          </p>
        )}
        <p style={{ fontFamily: dmSans, fontSize: "0.7rem", color: "#9c9590", marginTop: "0.75rem" }}>
          Free. No credit card. Unsubscribe any time.
        </p>
      </div>
    </section>
  )
}
