"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, confirmSignIn } from "aws-amplify/auth"

type Step = "credentials" | "new-password"

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

export function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") ?? "/training-foundations"

  const [step, setStep] = useState<Step>("credentials")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn({ username: email.trim().toLowerCase(), password })

      if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        setStep("new-password")
      } else if (result.isSignedIn) {
        router.push(redirect)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed."
      if (message.includes("Incorrect username or password")) {
        setError("Incorrect email or password.")
      } else if (message.includes("User does not exist")) {
        setError("No account found with that email.")
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmNewPassword) {
      setError("Passwords don't match.")
      return
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setLoading(true)
    try {
      const result = await confirmSignIn({ challengeResponse: newPassword })
      if (result.isSignedIn) {
        router.push(redirect)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password.")
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
        {step === "credentials" && (
          <>
            <p style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#c9a96e",
              marginBottom: 8,
            }}>
              Member Access
            </p>
            <h1 style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 28,
              fontWeight: 400,
              color: "#f0e6d3",
              marginBottom: 32,
            }}>
              Welcome back
            </h1>

            <form onSubmit={handleSignIn}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={fieldStyle}
              />
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={fieldStyle}
              />

              {error && (
                <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16 }}>{error}</p>
              )}

              <button type="submit" disabled={loading} style={submitStyle}>
                {loading ? "Signing in…" : "Sign In →"}
              </button>
            </form>

            <div style={{ marginTop: 24, textAlign: "center" }}>
              <Link
                href="/forgot-password"
                style={{ fontSize: 12, color: "#555", textDecoration: "none", letterSpacing: "0.05em" }}
              >
                Forgot your password?
              </Link>
            </div>

            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #1a1a1a", textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "#444", lineHeight: 1.8 }}>
                Don&apos;t have access yet?{" "}
                <Link href="/checkout" style={{ color: "#c9a96e", textDecoration: "none" }}>
                  Get the course →
                </Link>
              </p>
            </div>
          </>
        )}

        {step === "new-password" && (
          <>
            <p style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#c9a96e",
              marginBottom: 8,
            }}>
              First Login
            </p>
            <h1 style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: 28,
              fontWeight: 400,
              color: "#f0e6d3",
              marginBottom: 12,
            }}>
              Set your password
            </h1>
            <p style={{ fontSize: 13, color: "#666", lineHeight: 1.7, marginBottom: 32 }}>
              Choose a permanent password for your account. At least 8 characters.
            </p>

            <form onSubmit={handleNewPassword}>
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
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                style={fieldStyle}
              />

              {error && (
                <p style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16 }}>{error}</p>
              )}

              <button type="submit" disabled={loading} style={submitStyle}>
                {loading ? "Saving…" : "Set Password & Log In →"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
