"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, confirmSignIn, fetchAuthSession, signOut } from "aws-amplify/auth"

type Step = "credentials" | "new-password"

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

// A session is only worth acting on if it still has an ID token with time
// left. Amplify hands back a session object either way, and treating the empty
// one as "signed in" is what used to bounce people into a protected page that
// immediately bounced them back here.
async function usableSession(): Promise<boolean> {
  try {
    const session = await fetchAuthSession()
    const exp = session.tokens?.idToken?.payload?.exp
    if (typeof exp !== "number") return false
    return exp * 1000 > Date.now() + 30_000
  } catch {
    return false
  }
}

function isAlreadySignedIn(err: unknown): boolean {
  const name = err && typeof err === "object" && "name" in err ? String((err as { name: unknown }).name) : ""
  const message = err instanceof Error ? err.message : ""
  return name === "UserAlreadyAuthenticatedException" || message.includes("There is already a signed in user")
}

// Only ever send people to a path on this site.
function safeRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/account"
  return raw
}

export function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = safeRedirect(searchParams.get("redirect"))
  // One automatic recovery per page load. Without a bound, a stale record that
  // will not clear turns into an endless sign-in/sign-out cycle.
  const recovered = useRef(false)

  const [step, setStep] = useState<Step>("credentials")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    usableSession().then((ok) => {
      if (!cancelled && ok) router.replace(redirect)
    })
    return () => { cancelled = true }
  }, [redirect, router])

  // Don't hand someone to a protected page until the session is genuinely
  // readable, or they just bounce back here. Cookies are written as part of
  // sign-in; this gives that a moment to settle, and gives up rather than
  // looping.
  const goToRedirect = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (await usableSession()) {
        router.replace(redirect)
        return
      }
      await new Promise((r) => setTimeout(r, 250))
    }
    setError("Signed in, but your session didn't stick. Please try once more.")
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const credentials = { username: email.trim().toLowerCase(), password }

    try {
      let result
      try {
        result = await signIn(credentials)
      } catch (err) {
        // A stale auth record from an expired refresh token makes Amplify
        // refuse to sign in at all. Clearing it and going straight back in is
        // the whole recovery — the previous version cleared it and then asked
        // the visitor to type everything again, and because the next attempt
        // succeeded and left a fresh record behind, the attempt after that
        // refused for the same reason and revoked those new tokens. That is
        // the loop Alanna could not get out of: nine good sign-ins, each one
        // signed straight back out.
        //
        // Nothing is signed out after a sign-in succeeds, and this runs at
        // most once per page load.
        if (!isAlreadySignedIn(err) || recovered.current) throw err
        recovered.current = true
        await signOut().catch(() => {})
        result = await signIn(credentials)
      }

      if (result.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        setStep("new-password")
      } else if (result.isSignedIn) {
        await goToRedirect()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed."
      if (isAlreadySignedIn(err)) {
        setError("We couldn't clear a previous session. Please close this tab, reopen the site and try once more.")
      } else if (message.includes("Incorrect username or password")) {
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
        await goToRedirect()
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
