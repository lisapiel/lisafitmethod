"use client"

import { useState } from "react"
import { confirmSignIn, type SignInOutput } from "aws-amplify/auth"
import { TotpCodeInput } from "@/components/auth/TotpCodeInput"
import { TotpSetupDetails } from "@/components/auth/TotpSetupDetails"
import type { TotpSetup } from "@/lib/signInFlow.client"
import { TOTP_PROMPT, isCompleteTotpCode, totpErrorMessage } from "@/lib/totp"

export function TotpStep({
  setup,
  showSetup,
  onConfirmed,
  onStartOver,
  labelStyle,
  fieldStyle,
  submitStyle,
  outerError = null,
}: {
  setup: TotpSetup | null
  showSetup: boolean
  onConfirmed: (result: SignInOutput) => Promise<void>
  onStartOver: () => void
  labelStyle: React.CSSProperties
  fieldStyle: React.CSSProperties
  submitStyle: React.CSSProperties
  outerError?: string | null
}) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isCompleteTotpCode(code)) {
      setError(TOTP_PROMPT)
      return
    }
    setError(null)
    setLoading(true)
    try {
      await onConfirmed(await confirmSignIn({ challengeResponse: code }))
    } catch (err) {
      setCode("")
      setError(totpErrorMessage(err, "That didn't work. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <p style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.3em",
        textTransform: "uppercase",
        color: "#c9a96e",
        marginBottom: 8,
      }}>
        Two-factor sign-in
      </p>
      <h1 style={{
        fontFamily: "var(--font-cormorant), serif",
        fontSize: 28,
        fontWeight: 400,
        color: "#f0e6d3",
        marginBottom: 12,
      }}>
        {showSetup ? "Set up two-factor" : "Enter your code"}
      </h1>
      <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, marginBottom: 24 }}>
        {showSetup ? "Your account needs an authenticator app to sign in. Add it to the app, then enter the code it shows." : TOTP_PROMPT}
      </p>

      {showSetup && (
        <div style={{ marginBottom: 24 }}>
          {setup ? (
            <TotpSetupDetails secret={setup.secret} setupUri={setup.uri} />
          ) : (
            <p style={{ fontSize: 13, color: "#888" }}>The setup key didn&apos;t load. Please start again.</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label htmlFor="totp-code" style={labelStyle}>6-digit code</label>
        <TotpCodeInput id="totp-code" value={code} onChange={setCode} style={fieldStyle} />

        {(error ?? outerError) && (
          <p role="alert" style={{ color: "#ff6b6b", fontSize: 13, marginBottom: 16 }}>{error ?? outerError}</p>
        )}

        <button type="submit" disabled={loading} style={submitStyle}>
          {loading ? "Checking…" : "Confirm Code →"}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <button
          type="button"
          onClick={onStartOver}
          style={{ background: "none", border: "none", fontSize: 12, color: "#555", cursor: "pointer", letterSpacing: "0.05em" }}
        >
          Start again
        </button>
      </div>
    </>
  )
}
