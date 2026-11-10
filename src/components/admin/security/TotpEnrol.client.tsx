"use client"

import { useState } from "react"
import { setUpTOTP, updateMFAPreference, verifyTOTPSetup } from "aws-amplify/auth"
import { TotpCodeInput } from "@/components/auth/TotpCodeInput"
import { TotpSetupDetails } from "@/components/auth/TotpSetupDetails"
import { TOTP_ISSUER, TOTP_PROMPT, isCompleteTotpCode, totpErrorMessage } from "@/lib/totp"
import { bodyStyle, buttonStyle, cardStyle, errorStyle, headingStyle, inputStyle, labelStyle } from "./styles"

export function TotpEnrol({ email, onEnabled }: { email: string; onEnabled: () => Promise<void> }) {
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function start() {
    setBusy(true)
    setError(null)
    try {
      const out = await setUpTOTP()
      setSetup({ secret: out.sharedSecret, uri: out.getSetupUri(TOTP_ISSUER, email).toString() })
    } catch (err) {
      setError(err instanceof Error ? err.message : "The setup key couldn't be created. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault()
    if (!isCompleteTotpCode(code)) {
      setError(TOTP_PROMPT)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await verifyTOTPSetup({ code })
    } catch (err) {
      setCode("")
      setError(totpErrorMessage(err, "That code didn't work. Please try again."))
      setBusy(false)
      return
    }
    try {
      await updateMFAPreference({ totp: "PREFERRED" })
      setSetup(null)
      setCode("")
      await onEnabled()
    } catch (err) {
      const detail = err instanceof Error ? ` (${err.message})` : ""
      setError(`Your code was right, but two-factor couldn't be switched on for this account. The sign-in settings in AWS may not allow it yet.${detail}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section style={cardStyle} aria-labelledby="mfa-setup-heading">
      <h2 id="mfa-setup-heading" style={headingStyle}>Set up two-factor</h2>
      {!setup ? (
        <>
          <p style={bodyStyle}>
            Once it&apos;s on, signing in to this account asks for your password and then a 6-digit code from an authenticator app on your phone.
          </p>
          {error && <p role="alert" style={errorStyle}>{error}</p>}
          <button type="button" onClick={start} disabled={busy} style={buttonStyle(busy)}>
            {busy ? "Preparing…" : "Set up two-factor"}
          </button>
        </>
      ) : (
        <form onSubmit={confirm}>
          <TotpSetupDetails secret={setup.secret} setupUri={setup.uri} />
          <div style={{ marginTop: "1.5rem" }}>
            <label htmlFor="enrol-code" style={labelStyle}>6-digit code</label>
            <p style={bodyStyle}>{TOTP_PROMPT}</p>
            <TotpCodeInput id="enrol-code" value={code} onChange={setCode} style={inputStyle} />
          </div>
          {error && <p role="alert" style={errorStyle}>{error}</p>}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button type="submit" disabled={busy} style={buttonStyle(busy)}>
              {busy ? "Checking…" : "Turn on two-factor"}
            </button>
            <button type="button" disabled={busy} onClick={() => { setSetup(null); setCode(""); setError(null) }} style={buttonStyle(false, "quiet")}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
