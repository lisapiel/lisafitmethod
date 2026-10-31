"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn, signOut } from "aws-amplify/auth"

const ACCENT = "#c8a97e"
const BLACK = "#0a0a0a"
const CREAM = "#f5f2ee"
const MUTED = "rgba(245,242,238,0.55)"
const BORDER = "rgba(200,169,126,0.25)"

const buttonStyle: React.CSSProperties = {
  display: "block", width: "100%", textAlign: "center", background: ACCENT, color: BLACK,
  fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 13, fontWeight: 700,
  letterSpacing: "0.2em", textTransform: "uppercase", border: "none",
  padding: "18px 32px", cursor: "pointer", textDecoration: "none", marginBottom: 14,
}
const secondaryStyle: React.CSSProperties = {
  ...buttonStyle, background: "transparent", color: ACCENT, border: `1px solid ${BORDER}`,
}
const fieldStyle: React.CSSProperties = {
  display: "block", width: "100%", background: "#111", border: `1px solid ${BORDER}`,
  color: CREAM, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 16,
  padding: "14px 16px", outline: "none", marginBottom: 14, boxSizing: "border-box",
}
const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.2em",
  textTransform: "uppercase", color: "#777", marginBottom: 8,
}

type Props = {
  variant: "signed-out" | "set-password" | "link" | "link-needs-token" | "foreign"
  applicationId: string
  firstName: string
  invitedEmail: string
  sessionEmail?: string
  token?: string
  hasAccount?: boolean
}

// Everything between arriving from the email and the acknowledgements.
//
// The offer is never withdrawn on this screen — every path leads back to the
// same invitation once we know who is holding it.
export default function AcceptGate({
  variant, applicationId, firstName, invitedEmail, sessionEmail, token, hasAccount,
}: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  const acceptPath = `/coaching/accept/${applicationId}${token ? `?t=${token}` : ""}`
  const loginHref = `/login?redirect=${encodeURIComponent(acceptPath)}`

  async function requestLink() {
    setBusy(true); setError(null)
    try {
      const res = await fetch("/api/coaching/invite-setup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      })
      if (!res.ok) throw new Error()
      setSent(true)
    } catch {
      setError("Could not send that just now. Please email contact@lisafitmethod.com.")
    } finally { setBusy(false) }
  }

  // Set a password and carry straight on — no second email, no trip back to
  // the inbox, no separate sign-in screen.
  async function createLogin(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError("Those passwords don't match."); return }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return }
    setBusy(true); setError(null)
    try {
      const res = await fetch("/api/coaching/claim", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, token, password }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; signInInstead?: boolean }
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not set that up. Please try again.")
        setBusy(false)
        return
      }
      // Clear any stale auth record before signing in, so Amplify cannot
      // refuse with "there is already a signed in user".
      await signOut().catch(() => {})
      await signIn({ username: invitedEmail, password })
      router.replace(acceptPath)
      router.refresh()
    } catch {
      setError("Your login was created, but signing in failed. Please use the sign-in page.")
      setBusy(false)
    }
  }

  async function linkAccount() {
    setBusy(true); setError(null)
    try {
      const res = await fetch("/api/coaching/link-application", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, token }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error ?? "failed")
      router.replace(`/coaching/accept/${applicationId}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error && err.message !== "failed" ? err.message : "Could not connect this invitation.")
      setBusy(false)
    }
  }

  return (
    <main style={{ background: BLACK, minHeight: "100vh", color: CREAM, fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "clamp(56px, 8vw, 96px) clamp(20px, 4vw, 32px) 80px" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: ACCENT, marginBottom: 20 }}>
          Final step · 1:1 Coaching
        </p>
        <h1 style={{ fontFamily: "var(--font-playfair), serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, lineHeight: 1.15, marginBottom: 16 }}>
          You&apos;re in, {firstName}.
        </h1>

        {variant === "set-password" && (
          <>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 28 }}>
              Choose a password for <strong style={{ color: CREAM }}>{invitedEmail}</strong> and you&apos;ll go straight to your enrolment.
            </p>
            <form onSubmit={createLogin}>
              <label style={labelStyle} htmlFor="pw">Create a password</label>
              <input id="pw" type="password" autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)} style={fieldStyle} required />
              <label style={labelStyle} htmlFor="pw2">Confirm password</label>
              <input id="pw2" type="password" autoComplete="new-password" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} style={fieldStyle} required />
              <button type="submit" disabled={busy} style={{ ...buttonStyle, cursor: busy ? "wait" : "pointer" }}>
                {busy ? "Setting up…" : "Continue to enrolment →"}
              </button>
            </form>
            <p style={{ fontSize: 12, color: "rgba(245,242,238,0.35)", textAlign: "center", lineHeight: 1.7 }}>
              Already have a Lisa Fit Method login?{" "}
              <Link href={loginHref} style={{ color: ACCENT, textDecoration: "underline" }}>Sign in instead</Link>
            </p>
          </>
        )}

        {variant === "signed-out" && (
          <>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 32 }}>
              Your place is held. Sign in to confirm your acknowledgements and complete payment — your invitation stays open until you do.
            </p>
            <Link href={loginHref} style={buttonStyle}>Sign in to continue →</Link>
            {sent ? (
              <p style={{ fontSize: 13, color: ACCENT, lineHeight: 1.7 }}>
                Sent. Check <strong>{invitedEmail}</strong> for a link that takes you straight back here.
              </p>
            ) : (
              <button type="button" onClick={requestLink} disabled={busy} style={{ ...secondaryStyle, cursor: busy ? "wait" : "pointer" }}>
                {busy ? "Sending…" : hasAccount ? "Email me a sign-in link" : "I don't have a login yet"}
              </button>
            )}
          </>
        )}

        {variant === "link" && (
          <>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 24 }}>
              You applied as <strong style={{ color: CREAM }}>{invitedEmail}</strong>, and you&apos;re signed in as{" "}
              <strong style={{ color: CREAM }}>{sessionEmail}</strong>.
            </p>
            <div style={{ background: "#161616", border: `1px solid ${BORDER}`, borderLeft: `3px solid ${ACCENT}`, padding: "20px 24px", marginBottom: 28 }}>
              <p style={{ fontSize: 14, color: "rgba(245,242,238,0.85)", lineHeight: 1.7, margin: 0 }}>
                Connect this invitation to the account you&apos;re signed in to, and your coaching will live alongside your courses — one login for everything. Nothing you already have is changed or lost.
              </p>
            </div>
            <button type="button" onClick={linkAccount} disabled={busy} style={{ ...buttonStyle, cursor: busy ? "wait" : "pointer" }}>
              {busy ? "Connecting…" : `Use ${sessionEmail} →`}
            </button>
            <Link href={loginHref} style={secondaryStyle}>Sign in as {invitedEmail} instead</Link>
          </>
        )}

        {variant === "link-needs-token" && (
          <>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 24 }}>
              This invitation was sent to <strong style={{ color: CREAM }}>{invitedEmail}</strong>, and you&apos;re signed in as{" "}
              <strong style={{ color: CREAM }}>{sessionEmail}</strong>. To connect the two, open the button in your approval email —
              that&apos;s how we know the invitation is yours.
            </p>
            {sent ? (
              <p style={{ fontSize: 13, color: ACCENT, lineHeight: 1.7 }}>
                Sent. Check <strong>{invitedEmail}</strong> and open the link from there.
              </p>
            ) : (
              <button type="button" onClick={requestLink} disabled={busy} style={{ ...buttonStyle, cursor: busy ? "wait" : "pointer" }}>
                {busy ? "Sending…" : "Email me the link again"}
              </button>
            )}
          </>
        )}

        {variant === "foreign" && (
          <>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 24 }}>
              This invitation is already connected to <strong style={{ color: CREAM }}>{invitedEmail}</strong>, and you&apos;re signed in as{" "}
              <strong style={{ color: CREAM }}>{sessionEmail}</strong>. Sign in with that account to continue.
            </p>
            <Link href={loginHref} style={buttonStyle}>Sign in as {invitedEmail} →</Link>
          </>
        )}

        {error && <p style={{ color: "#ff9080", fontSize: 13, marginTop: 8 }}>{error}</p>}

        <p style={{ fontSize: 12, color: "rgba(245,242,238,0.3)", marginTop: 32, textAlign: "center" }}>
          Need a hand?{" "}
          <Link href="mailto:contact@lisafitmethod.com" style={{ color: ACCENT, textDecoration: "underline" }}>contact@lisafitmethod.com</Link>
        </p>
      </div>
    </main>
  )
}
