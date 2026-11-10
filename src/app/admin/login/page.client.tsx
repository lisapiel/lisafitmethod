"use client"

import { useState } from "react"
import { signIn, signOut, confirmSignIn, type SignInOutput } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import { TotpCodeInput } from "@/components/auth/TotpCodeInput"
import { TotpSetupDetails } from "@/components/auth/TotpSetupDetails"
import { chooseTotpIfAsked, totpSetupFrom, type TotpSetup } from "@/lib/signInFlow.client"
import { TOTP_PROMPT, isCompleteTotpCode, signInStepView, totpErrorMessage } from "@/lib/totp"

const gold = "#c9a96e"
const border = "#2a2a2a"

type Step = "credentials" | "totp" | "totp-setup"

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: "0.6rem",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "#888",
  marginBottom: "0.5rem",
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#111",
  border: `1px solid ${border}`,
  color: "#f0e6d3",
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: "0.85rem",
  padding: "0.75rem 1rem",
  outline: "none",
  boxSizing: "border-box",
}

const noteStyle: React.CSSProperties = {
  fontFamily: "var(--font-montserrat), sans-serif",
  fontSize: "0.8rem",
  lineHeight: 1.6,
  color: "#cfc6b6",
  margin: 0,
}

export default function AdminLoginClient() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("credentials")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [setup, setSetup] = useState<TotpSetup | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleNext(raw: SignInOutput) {
    const result = await chooseTotpIfAsked(raw)
    const view = signInStepView(result.nextStep.signInStep)
    if (result.isSignedIn || view === "done") {
      router.push("/admin")
      router.refresh()
      return
    }
    setCode("")
    if (view === "totp") {
      setStep("totp")
      return
    }
    if (view === "totp-setup") {
      setSetup(totpSetupFrom(result, email.trim().toLowerCase()))
      setStep("totp-setup")
      return
    }
    setStep("credentials")
    setError("This account needs a step this page can't finish. Please sign in once on the member sign-in page, then come back here.")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // Clear any stale session before signing in
      try { await signOut() } catch { /* no session, that's fine */ }
      await handleNext(await signIn({ username: email, password }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCode(e: React.FormEvent) {
    e.preventDefault()
    if (!isCompleteTotpCode(code)) {
      setError(TOTP_PROMPT)
      return
    }
    setLoading(true)
    setError(null)
    try {
      await handleNext(await confirmSignIn({ challengeResponse: code }))
    } catch (err) {
      setCode("")
      setError(totpErrorMessage(err, "That didn't work. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  function startOver() {
    setStep("credentials")
    setCode("")
    setSetup(null)
    setError(null)
  }

  const buttonStyle: React.CSSProperties = {
    background: loading ? "#555" : gold,
    color: "#0a0a0a",
    border: "none",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontSize: "0.7rem",
    fontWeight: 600,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    padding: "1rem",
    cursor: loading ? "not-allowed" : "pointer",
    marginTop: "0.5rem",
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: step === "totp-setup" ? 440 : 360 }}>
        <p
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "1.8rem",
            fontWeight: 300,
            color: gold,
            marginBottom: "0.25rem",
          }}
        >
          Lisa Fit Method
        </p>
        <p
          style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#555",
            marginBottom: "2.5rem",
          }}
        >
          {step === "credentials" ? "Admin Access" : "Two-factor sign-in"}
        </p>

        {step === "credentials" && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            {error && (
              <p role="alert" style={{ fontSize: "0.75rem", color: "#e07070", fontFamily: "var(--font-montserrat), sans-serif" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        )}

        {(step === "totp" || step === "totp-setup") && (
          <form onSubmit={handleCode} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {step === "totp-setup" && (
              <>
                <p style={noteStyle}>Two-factor is required for this account. Add it to your authenticator app first.</p>
                {setup ? (
                  <TotpSetupDetails secret={setup.secret} setupUri={setup.uri} />
                ) : (
                  <p style={noteStyle}>The setup key didn&apos;t load. Please start again.</p>
                )}
              </>
            )}
            <div>
              <label htmlFor="admin-totp-code" style={labelStyle}>6-digit code</label>
              <p style={{ ...noteStyle, marginBottom: "0.75rem" }}>{TOTP_PROMPT}</p>
              <TotpCodeInput id="admin-totp-code" value={code} onChange={setCode} style={inputStyle} />
            </div>

            {error && (
              <p role="alert" style={{ fontSize: "0.75rem", color: "#e07070", fontFamily: "var(--font-montserrat), sans-serif" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Checking…" : "Confirm code"}
            </button>
            <button
              type="button"
              onClick={startOver}
              style={{ background: "none", border: "none", color: "#888", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", cursor: "pointer", padding: "0.5rem" }}
            >
              Start again
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
