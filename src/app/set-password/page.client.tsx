"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "aws-amplify/auth"

type State = "loading" | "form" | "invalid" | "done"
type TokenType = "setup" | "reset"
type InvalidReason = "expired" | "used" | "not_found" | "unknown"

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

const invalidMessages: Record<InvalidReason, { heading: string; body: string }> = {
  expired: {
    heading: "Link expired",
    body: "This link is more than 48 hours old. Request a new one below.",
  },
  used: {
    heading: "Link already used",
    body: "This link has already been used. Log in with the password you set, or request a new reset link.",
  },
  not_found: {
    heading: "Link not found",
    body: "This link isn't valid. It may have already been used or never existed.",
  },
  unknown: {
    heading: "Something went wrong",
    body: "We couldn't verify this link. Please try again or request a new one.",
  },
}

export function SetPasswordClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [state, setState] = useState<State>("loading")
  const [tokenType, setTokenType] = useState<TokenType>("setup")
  const [invalidReason, setInvalidReason] = useState<InvalidReason>("unknown")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) { setInvalidReason("not_found"); setState("invalid"); return }
    fetch(`/api/auth/validate-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data: { valid: boolean; email?: string; type?: TokenType; reason?: string }) => {
        if (!data.valid) {
          setInvalidReason((data.reason as InvalidReason) ?? "unknown")
          setState("invalid")
        } else {
          setTokenType(data.type ?? "setup")
          setState("form")
        }
      })
      .catch(() => { setInvalidReason("unknown"); setState("invalid") })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) { setError("Passwords don't match."); return }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json() as { email?: string; error?: string }
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return }

      // Auto-sign in with the new password
      const result = await signIn({ username: data.email!, password })
      if (result.isSignedIn) {
        router.push("/training-foundations")
      } else {
        // Signed in but needs further steps — just redirect to login
        router.push("/login")
      }
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

        {state === "loading" && (
          <p style={{ fontSize: 13, color: "#555", textAlign: "center", letterSpacing: "0.05em" }}>
            Verifying link…
          </p>
        )}

        {state === "invalid" && (
          <>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c97070", marginBottom: 8 }}>
              Link Invalid
            </p>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 28, fontWeight: 400, color: "#f0e6d3", marginBottom: 12 }}>
              {invalidMessages[invalidReason].heading}
            </h1>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginBottom: 32 }}>
              {invalidMessages[invalidReason].body}
            </p>
            {invalidReason === "used" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Link href="/login" style={{ display: "block", textAlign: "center", background: "#c9a96e", color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", padding: "16px 32px", textDecoration: "none" }}>
                  Go to Login →
                </Link>
                <Link href="/forgot-password" style={{ display: "block", textAlign: "center", fontSize: 12, color: "#555", textDecoration: "none", letterSpacing: "0.05em", marginTop: 4 }}>
                  Request a new reset link
                </Link>
              </div>
            ) : (
              <Link href="/forgot-password" style={{ display: "block", textAlign: "center", background: "#c9a96e", color: "#0a0a0a", fontFamily: "var(--font-montserrat), sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", padding: "16px 32px", textDecoration: "none" }}>
                Request a new link →
              </Link>
            )}
          </>
        )}

        {state === "form" && (
          <>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.3em", textTransform: "uppercase", color: "#c9a96e", marginBottom: 8 }}>
              {tokenType === "setup" ? "Welcome" : "Password Reset"}
            </p>
            <h1 style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 28, fontWeight: 400, color: "#f0e6d3", marginBottom: 12 }}>
              {tokenType === "setup" ? "Create your password" : "Reset your password"}
            </h1>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginBottom: 32 }}>
              {tokenType === "setup"
                ? "Choose a password for your account and you'll be taken straight to your course."
                : "Enter a new password for your account."}
              {" "}At least 8 characters.
            </p>

            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                required
                autoComplete="new-password"
                style={fieldStyle}
              />
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(null) }}
                required
                autoComplete="new-password"
                style={fieldStyle}
              />

              {error && (
                <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16 }}>{error}</p>
              )}

              <button type="submit" disabled={loading} style={{ ...submitStyle, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Setting password…" : tokenType === "setup" ? "Create Password & Start →" : "Set New Password →"}
              </button>
            </form>
          </>
        )}

      </div>
    </main>
  )
}
