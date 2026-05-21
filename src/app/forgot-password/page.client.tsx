"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { resetPassword, confirmResetPassword } from "aws-amplify/auth"

type Step = "email" | "code"

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "#161616",
  border: "1px solid #2a2a2a",
  color: "#f0e6d3",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: 14,
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
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await resetPassword({ username: email.trim().toLowerCase() })
      setStep("code")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.")
      return
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setLoading(true)
    try {
      await confirmResetPassword({
        username: email.trim().toLowerCase(),
        confirmationCode: code.trim(),
        newPassword,
      })
      router.push("/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.")
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
        <span style={{
          fontFamily: "var(--font-cormorant), serif",
          fontSize: 24,
          fontWeight: 600,
          color: "#f0e6d3",
        }}>
          Lisa <span style={{ color: "#c9a96e" }}>Fit Method</span>
        </span>
      </Link>

      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "#111",
        border: "1px solid #1a1a1a",
        padding: "48px 40px",
      }}>
        {step === "email" && (
          <>
            <p style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#c9a96e",
              marginBottom: 8,
            }}>
              Password Reset
            </p>
            <h1 style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 28,
              fontWeight: 400,
              color: "#f0e6d3",
              marginBottom: 12,
            }}>
              Forgot your password?
            </h1>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginBottom: 32 }}>
              Enter your email and we&apos;ll send you a code to reset your password.
            </p>

            <form onSubmit={handleRequestCode}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={fieldStyle}
              />

              {error && (
                <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16 }}>{error}</p>
              )}

              <button type="submit" disabled={loading} style={submitStyle}>
                {loading ? "Sending…" : "Send Reset Code →"}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Link href="/login" style={{ fontSize: 12, color: "#555", textDecoration: "none" }}>
                ← Back to login
              </Link>
            </div>
          </>
        )}

        {step === "code" && (
          <>
            <p style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#c9a96e",
              marginBottom: 8,
            }}>
              Check Your Email
            </p>
            <h1 style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 28,
              fontWeight: 400,
              color: "#f0e6d3",
              marginBottom: 12,
            }}>
              Enter your code
            </h1>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginBottom: 32 }}>
              We sent a reset code to <strong style={{ color: "#888" }}>{email}</strong>. Enter it below with your new password.
            </p>

            <form onSubmit={handleConfirmReset}>
              <label style={labelStyle}>Reset Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                autoComplete="one-time-code"
                placeholder="000000"
                style={{ ...fieldStyle, letterSpacing: "0.2em", textAlign: "center" }}
              />
              <label style={labelStyle}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={fieldStyle}
              />
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={fieldStyle}
              />

              {error && (
                <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16 }}>{error}</p>
              )}

              <button type="submit" disabled={loading} style={submitStyle}>
                {loading ? "Saving…" : "Set New Password →"}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setStep("email")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#555",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "var(--font-montserrat), sans-serif",
                }}
              >
                ← Use a different email
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
