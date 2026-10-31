"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const ACCENT = "#c8a97e"
const BLACK = "#0a0a0a"
const CREAM = "#f5f2ee"
const MUTED = "rgba(245,242,238,0.55)"
const BORDER = "rgba(200,169,126,0.25)"

const buttonStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "center",
  background: ACCENT,
  color: BLACK,
  fontFamily: "var(--font-dm-sans), sans-serif",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  border: "none",
  padding: "18px 32px",
  cursor: "pointer",
  textDecoration: "none",
  marginBottom: 14,
}

const secondaryStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "transparent",
  color: ACCENT,
  border: `1px solid ${BORDER}`,
}

type Props = {
  variant: "signed-out" | "link" | "foreign"
  applicationId: string
  firstName: string
  invitedEmail: string
  sessionEmail?: string
}

// What someone sees when the invitation is real but they are not yet known to
// be the person it was sent to. The offer is never withdrawn here — every
// path leads back to the same invitation once identity is settled.
export default function AcceptGate({ variant, applicationId, firstName, invitedEmail, sessionEmail }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const acceptPath = `/coaching/accept/${applicationId}`

  async function sendSetupLink() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/coaching/invite-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      })
      if (!res.ok) throw new Error("failed")
      setSent(true)
    } catch {
      setError("Could not send that just now. Please email contact@lisafitmethod.com.")
    } finally {
      setBusy(false)
    }
  }

  async function linkAccount() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/coaching/link-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error ?? "failed")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error && err.message !== "failed"
        ? err.message
        : "Could not connect this invitation. Please email contact@lisafitmethod.com.")
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

        {variant === "signed-out" && (
          <>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 32 }}>
              Your place is held. Sign in to confirm your acknowledgements and complete payment — your invitation stays open until you do.
            </p>
            <Link href={`/login?redirect=${encodeURIComponent(acceptPath)}`} style={buttonStyle}>
              Sign in to continue →
            </Link>
            {sent ? (
              <p style={{ fontSize: 13, color: ACCENT, lineHeight: 1.7, marginTop: 8 }}>
                Sent. Check <strong>{invitedEmail}</strong> for a link to choose a password, then you&apos;ll come straight back here.
              </p>
            ) : (
              <button type="button" onClick={sendSetupLink} disabled={busy} style={{ ...secondaryStyle, cursor: busy ? "wait" : "pointer" }}>
                {busy ? "Sending…" : "I don't have a login yet"}
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
            <Link href={`/login?redirect=${encodeURIComponent(acceptPath)}`} style={secondaryStyle}>
              Sign in as {invitedEmail} instead
            </Link>
          </>
        )}

        {variant === "foreign" && (
          <>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, marginBottom: 24 }}>
              This invitation is already connected to <strong style={{ color: CREAM }}>{invitedEmail}</strong>, and you&apos;re signed in as{" "}
              <strong style={{ color: CREAM }}>{sessionEmail}</strong>. Sign in with that account to continue.
            </p>
            <Link href={`/login?redirect=${encodeURIComponent(acceptPath)}`} style={buttonStyle}>
              Sign in as {invitedEmail} →
            </Link>
          </>
        )}

        {error && <p style={{ color: "#ff9080", fontSize: 13, marginTop: 8 }}>{error}</p>}

        <p style={{ fontSize: 12, color: "rgba(245,242,238,0.3)", marginTop: 32, textAlign: "center" }}>
          Need a hand?{" "}
          <Link href="mailto:contact@lisafitmethod.com" style={{ color: ACCENT, textDecoration: "underline" }}>
            contact@lisafitmethod.com
          </Link>
        </p>
      </div>
    </main>
  )
}
