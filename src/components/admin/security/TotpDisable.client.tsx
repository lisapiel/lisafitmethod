"use client"

import { useState } from "react"
import Link from "next/link"
import { confirmSignIn, signIn, signOut, updateMFAPreference, type SignInOutput } from "aws-amplify/auth"
import { TotpCodeInput } from "@/components/auth/TotpCodeInput"
import { chooseTotpIfAsked } from "@/lib/signInFlow.client"
import { TOTP_PROMPT, isCompleteTotpCode, signInStepView, totpErrorMessage } from "@/lib/totp"
import { bodyStyle, buttonStyle, cardStyle, errorStyle, gold, headingStyle, inputStyle, labelStyle } from "./styles"

// Turning two-factor off proves the code is current by doing a fresh sign-in
// with it. Amplify's updateMFAPreference alone would accept any signed-in
// session, including one left open on a borrowed laptop.
export function TotpDisable({
  email,
  mfaRequired,
  onDisabled,
}: {
  email: string
  mfaRequired: boolean
  onDisabled: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [awaitingCode, setAwaitingCode] = useState(false)
  const [signedOut, setSignedOut] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function finish(result: SignInOutput) {
    const next = await chooseTotpIfAsked(result)
    if (!next.isSignedIn && signInStepView(next.nextStep.signInStep) !== "done") {
      setError("The sign-in needs a step this page can't finish. Please sign in again from the admin sign-in page.")
      return
    }
    setSignedOut(false)
    await updateMFAPreference({ totp: "DISABLED" })
    setOpen(false)
    setPassword("")
    setCode("")
    setAwaitingCode(false)
    await onDisabled()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!isCompleteTotpCode(code)) {
      setError(TOTP_PROMPT)
      return
    }
    setBusy(true)
    setError(null)
    try {
      if (awaitingCode) {
        await finish(await confirmSignIn({ challengeResponse: code }))
        return
      }
      await signOut()
      setSignedOut(true)
      const first = await chooseTotpIfAsked(await signIn({ username: email, password }))
      if (signInStepView(first.nextStep.signInStep) === "totp") {
        setAwaitingCode(true)
        await finish(await confirmSignIn({ challengeResponse: code }))
      } else {
        await finish(first)
      }
    } catch (err) {
      setCode("")
      const message = err instanceof Error ? err.message : ""
      if (message.includes("Incorrect username or password")) {
        setAwaitingCode(false)
        setError("That password isn't right. Please try again.")
      } else {
        setError(totpErrorMessage(err, "Two-factor couldn't be turned off. Please try again."))
      }
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <section style={cardStyle} aria-labelledby="mfa-off-heading">
        <h2 id="mfa-off-heading" style={headingStyle}>Turn off two-factor</h2>
        <p style={bodyStyle}>Only do this if you are moving to a new phone or have been asked to. You&apos;ll need your password and a current code.</p>
        <button type="button" onClick={() => setOpen(true)} style={buttonStyle(false, "quiet")}>
          Turn off two-factor
        </button>
      </section>
    )
  }

  return (
    <section style={cardStyle} aria-labelledby="mfa-off-heading">
      <h2 id="mfa-off-heading" style={headingStyle}>Turn off two-factor</h2>
      {mfaRequired && (
        <p style={{ ...bodyStyle, color: gold }}>
          Two-factor is required for the admin area right now, so this account won&apos;t be able to use the admin area again until you set it up again.
        </p>
      )}
      <p style={bodyStyle}>To confirm it&apos;s you, this signs you in again with your password and a current code.</p>
      <form onSubmit={submit}>
        {!awaitingCode && (
          <>
            <label htmlFor="disable-password" style={labelStyle}>Password</label>
            <input
              id="disable-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </>
        )}
        <label htmlFor="disable-code" style={labelStyle}>6-digit code</label>
        <p style={bodyStyle}>{TOTP_PROMPT}</p>
        <TotpCodeInput id="disable-code" value={code} onChange={setCode} style={inputStyle} autoFocus={false} />
        {error && <p role="alert" style={errorStyle}>{error}</p>}
        {signedOut && error && (
          <p style={bodyStyle}>
            You&apos;re signed out at the moment. Try the code again, or <Link href="/admin/login" style={{ color: gold }}>sign in again</Link>.
          </p>
        )}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="submit" disabled={busy} style={buttonStyle(busy)}>
            {busy ? "Checking…" : "Turn off two-factor"}
          </button>
          {!signedOut && (
            <button type="button" disabled={busy} onClick={() => { setOpen(false); setError(null); setCode("") }} style={buttonStyle(false, "quiet")}>
              Keep it on
            </button>
          )}
        </div>
      </form>
    </section>
  )
}
