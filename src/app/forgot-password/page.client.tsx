"use client"
import { useState } from "react"
import Link from "next/link"

type Step = "email" | "sent"

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "#161616",
  border: "1px solid #2a2a2a",
  color: "#f0e6d3",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: 16,
  padding: "14px 16px",
  outline: "none",
  marginBottom: 16,
  boxSizing: "border-box" as const,
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: "#666",
  fontFamily: "var(--font-montserrat), sans-serif",
  marginBottom: 8,
}

const submitStyle: React.CSSProperties = {
  width: "100%",
  background: "#c9a96e",
  color: "#0a0a0a",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  border: "none",
  padding: "18px 32px",
  cursor: "pointer",
  marginTop: 8,
}

export function ForgotPasswordClient() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      if (!res.ok) {
        setError("Something went wrong. Please try again.")
        return
      }
      setStep("sent")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{
      background: "#0a0a0a",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      fontFamily: "var(--font-montserrat), sans-serif",
    }}>
      <Link href="/" style={{ textDecoration: "none", marginBottom: 48 }}>
        <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 24, fontWeight: 600, color: "#f0e6d3" }}>
          Lisa <span style={{ color: "#c9a96e" }}>Fit Method</span>
        </span>
      </Link>

      <div style={{ width: "100%", maxWidth: 420, background: "#111", border: "1px solid #1a1a1a", padding: "48px 40px" }}>

        {step === "email" && (
          <>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a96e", marginBottom: 8 }}>
              Password Reset
            </p>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 28, fontWeight: 400, color: "#f0e6d3", marginBottom: 12 }}>
              Forgot your password?
            </h1>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginBottom: 32 }}>
              Enter your email and we&apos;ll send you a link to set a new password.
            </p>

            <form onSubmit={handleRequestReset}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                required
                autoComplete="email"
                style={fieldStyle}
              />

              {error && (
                <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16 }}>{error}</p>
              )}

              <button type="submit" disabled={loading} style={{ ...submitStyle, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Sending…" : "Send Reset Link →"}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Link href="/login" style={{ fontSize: 12, color: "#555", textDecoration: "none" }}>
                ← Back to login
              </Link>
            </div>
          </>
        )}

        {step === "sent" && (
          <>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a96e", marginBottom: 8 }}>
              Check Your Email
            </p>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 28, fontWeight: 400, color: "#f0e6d3", marginBottom: 12 }}>
              Link on its way
            </h1>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginBottom: 8 }}>
              If <strong style={{ color: "#888" }}>{email}</strong> has an account, you&apos;ll receive a password reset link shortly.
            </p>
            <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, marginBottom: 32 }}>
              The link expires in 48 hours. Check your spam folder if you don&apos;t see it within a minute.
            </p>
            <Link
              href="/login"
              style={{ display: "block", textAlign: "center", fontSize: 12, color: "#555", textDecoration: "none", letterSpacing: "0.05em" }}
            >
              ← Back to login
            </Link>
          </>
        )}

      </div>
    </main>
  )
}
