"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const dmSans = "var(--font-dm-sans), sans-serif"
const playfair = "var(--font-playfair), serif"
const gold = "#c8a97e"
const ink = "#1a1a1a"
const muted = "#6b6560"
const line = "#ddd8cf"

type CourseChoice = "training" | "nutrition" | "both"

export default function FreeGuideTeaser() {
  const router = useRouter()
  const [choice, setChoice] = useState<CourseChoice>("training")
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
      if (choice === "both") {
        await Promise.allSettled([
          fetch("/api/free-guide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: trimmed, source: "courses-page-teaser-both" }) }),
          fetch("/api/free-guide-nutrition", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: trimmed, source: "courses-page-teaser-both" }) }),
        ])
        router.push("/free-guide?unlocked=1")
        return
      }
      const endpoint = choice === "nutrition" ? "/api/free-guide-nutrition" : "/api/free-guide"
      const redirect = choice === "nutrition" ? "/free-guide-nutrition?unlocked=1" : "/free-guide?unlocked=1"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "courses-page-teaser" }),
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

  const options: { id: CourseChoice; label: string }[] = [
    { id: "training", label: "Training" },
    { id: "nutrition", label: "Nutrition" },
    { id: "both", label: "Both" },
  ]

  return (
    <section style={{ background: "#f5f2ee", padding: "clamp(80px, 10vw, 120px) clamp(24px, 6vw, 80px)" }}>
      <style>{`
        .fgt-inner { max-width: 640px; margin: 0 auto; }
        .fgt-choice { display: flex; gap: 0; margin-bottom: 28px; border: 1px solid ${line}; width: fit-content; }
        .fgt-choice-btn {
          background: none; border: none; cursor: pointer;
          font-family: ${dmSans}; font-size: 11px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase;
          padding: 10px 22px; color: ${muted}; transition: all 0.15s;
          border-right: 1px solid ${line};
        }
        .fgt-choice-btn:last-child { border-right: none; }
        .fgt-choice-btn.active { background: ${gold}; color: #0a0a0a; }
        .fgt-form { display: flex; gap: 8px; max-width: 420px; }
        @media (max-width: 520px) {
          .fgt-form { flex-direction: column; }
          .fgt-form input, .fgt-form button { width: 100%; }
          .fgt-choice { width: 100%; }
          .fgt-choice-btn { flex: 1; }
        }
      `}</style>
      <div className="fgt-inner">
        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.25em", textTransform: "uppercase", color: gold, marginBottom: 16, fontFamily: dmSans }}>
          Not ready to commit yet?
        </p>
        <h2 style={{ fontFamily: playfair, fontSize: "clamp(26px, 4vw, 38px)", fontWeight: 700, color: ink, lineHeight: 1.1, marginBottom: 12, letterSpacing: "-0.02em" }}>
          Try it first.{" "}
          <em style={{ fontStyle: "italic", color: "#a8895e" }}>No payment required.</em>
        </h2>
        <p style={{ fontFamily: dmSans, fontSize: "clamp(13px, 2vw, 15px)", color: muted, lineHeight: 1.65, marginBottom: 28, maxWidth: 480 }}>
          Get a free guide delivered instantly. Choose which one you want.
        </p>

        <div className="fgt-choice" role="group" aria-label="Guide selection">
          {options.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`fgt-choice-btn${choice === id ? " active" : ""}`}
              onClick={() => setChoice(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate className="fgt-form">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle") }}
            placeholder="Your email"
            style={{
              flex: "1 1 160px",
              background: "#fff",
              border: `1px solid ${status === "error" ? "#cc6666" : line}`,
              color: ink,
              fontFamily: dmSans,
              fontSize: "0.875rem",
              padding: "11px 14px",
              outline: "none",
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
              padding: "11px 18px",
              cursor: status === "submitting" ? "default" : "pointer",
              opacity: status === "submitting" ? 0.75 : 1,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {status === "submitting" ? "Sending..." : "Send →"}
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
