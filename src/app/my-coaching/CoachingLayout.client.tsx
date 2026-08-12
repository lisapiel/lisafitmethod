"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchAuthSession } from "aws-amplify/auth"
import AccountDropdown from "@/components/AccountDropdown.client"

const accent = "#c8a97e"
const warmWhite = "#faf8f5"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"

const navLinks = [
  { href: "/my-coaching", label: "Home", exact: true, icon: HomeIcon },
  { href: "/my-coaching/workouts", label: "Workouts", icon: DumbellIcon },
  { href: "/my-coaching/nutrition", label: "Nutrition", icon: NutritionIcon },
  { href: "/my-coaching/progress", label: "Progress", icon: ChartIcon },
  { href: "/my-coaching/check-in", label: "Check-In", icon: CheckIcon },
  { href: "/my-coaching/goals", label: "Goals", icon: GoalIcon },
  { href: "/my-coaching/messages", label: "Messages", icon: MessageIcon },
]

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 6.5L8 2l6 4.5V14H10v-3.5H6V14H2V6.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

function DumbellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="6.5" width="2.5" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="12.5" y="6.5" width="2.5" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="3.5" y="5" width="2" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="10.5" y="5" width="2" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="5.5" y1="8" x2="10.5" y2="8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 12L6 7l3 3 3-4 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GoalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
    </svg>
  )
}

function NutritionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2c2.5 0 4.5 2 4.5 4.5 0 3.5-2.5 7-4.5 7S3.5 10 3.5 6.5C3.5 4 5.5 2 8 2Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 2v11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 3h12v8H9l-3 2.5V11H2V3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function ReacceptInterstitial({ onAccepted }: { onAccepted: () => void }) {
  const [termsChecked, setTermsChecked] = useState(false)
  const [waiverChecked, setWaiverChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!termsChecked || !waiverChecked) return
    setSubmitting(true)
    setError(null)
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) { setError("Session expired — please refresh the page."); setSubmitting(false); return }
      const res = await fetch("/api/coaching/reaccept", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      })
      if (!res.ok) { setError("Something went wrong. Please try again."); setSubmitting(false); return }
      onAccepted()
    } catch {
      setError("Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: warmWhite,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1.5rem",
    }}>
      <div style={{ maxWidth: 520, width: "100%" }}>
        <p style={{
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color: accent,
          marginBottom: 12,
          fontFamily: "var(--font-dm-sans), sans-serif",
        }}>
          1:1 Coaching
        </p>
        <h1 style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: "clamp(24px, 4vw, 32px)",
          fontWeight: 700,
          color: black,
          lineHeight: 1.2,
          marginBottom: 16,
        }}>
          Updated Terms & Waiver
        </h1>
        <p style={{
          fontSize: 15,
          color: muted,
          lineHeight: 1.7,
          marginBottom: 28,
          fontFamily: "var(--font-dm-sans), sans-serif",
        }}>
          Our Coaching Terms &amp; Conditions and Assumption of Risk &amp; Liability Waiver have been updated.
          Please review and accept them to continue using your coaching portal.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 16, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => setTermsChecked(e.target.checked)}
              style={{ marginTop: 3, accentColor: accent, flexShrink: 0, width: 16, height: 16, cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, color: muted, lineHeight: 1.6, fontFamily: "var(--font-dm-sans), sans-serif" }}>
              I have read and agree to the{" "}
              <a href="/terms#coaching" target="_blank" rel="noopener noreferrer" style={{ color: "#a8895e", textDecoration: "underline" }}>
                Coaching Terms &amp; Conditions
              </a>
              , including the cancellation and refund policy.
            </span>
          </label>

          <label style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 24, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={waiverChecked}
              onChange={(e) => setWaiverChecked(e.target.checked)}
              style={{ marginTop: 3, accentColor: accent, flexShrink: 0, width: 16, height: 16, cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, color: muted, lineHeight: 1.6, fontFamily: "var(--font-dm-sans), sans-serif" }}>
              I have read and agree to the{" "}
              <a href="/terms#risk" target="_blank" rel="noopener noreferrer" style={{ color: "#a8895e", textDecoration: "underline" }}>
                Assumption of Risk &amp; Liability Waiver
              </a>
              {" "}and understand that exercise, including remote/online training, involves inherent risks of injury, illness, or death. I confirm that I have disclosed any known injury, medical condition, physical limitation, pregnancy, or other circumstance relevant to my ability to exercise safely and agree to update Lisa Fit Method if that information changes.
            </span>
          </label>

          {error && (
            <p style={{ fontSize: 13, color: "#d9534f", marginBottom: 16, fontFamily: "var(--font-dm-sans), sans-serif" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!termsChecked || !waiverChecked || submitting}
            style={{
              width: "100%",
              background: (!termsChecked || !waiverChecked) ? "#ddd5ca" : submitting ? "#b8996a" : accent,
              color: (!termsChecked || !waiverChecked) ? "#9a9087" : black,
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              border: "none",
              padding: "16px 32px",
              cursor: (!termsChecked || !waiverChecked || submitting) ? "not-allowed" : "pointer",
              transition: "background 0.2s ease",
            }}
          >
            {submitting ? "Saving…" : "Accept & Continue"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function CoachingClientLayout({
  children,
  needsReaccept = false,
}: {
  children: React.ReactNode
  needsReaccept?: boolean
}) {
  const pathname = usePathname()
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [reacceptDone, setReacceptDone] = useState(false)

  // Hide mobile bottom nav while typing — when an input or textarea is focused,
  // the on-screen keyboard pushes the fixed bottom nav above the keyboard and
  // covers the action buttons. Letting the keyboard sit on top of the empty
  // nav space is the cleaner mobile pattern.
  useEffect(() => {
    function isEditable(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false
      const tag = el.tagName
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable
    }
    function onFocusIn(e: FocusEvent) { if (isEditable(e.target)) setKeyboardOpen(true) }
    function onFocusOut(e: FocusEvent) { if (isEditable(e.target)) setKeyboardOpen(false) }
    document.addEventListener("focusin", onFocusIn)
    document.addEventListener("focusout", onFocusOut)
    return () => {
      document.removeEventListener("focusin", onFocusIn)
      document.removeEventListener("focusout", onFocusOut)
    }
  }, [])

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  if (needsReaccept && !reacceptDone) {
    return <ReacceptInterstitial onAccepted={() => setReacceptDone(true)} />
  }

  return (
    <div style={{ minHeight: "100dvh", background: warmWhite, display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @media (max-width: 768px) {
          .coaching-sidebar { display: none !important; }
          .coaching-mobile-nav { display: flex !important; }
        }
        @media (min-width: 769px) {
          .coaching-mobile-nav { display: none !important; }
          .coaching-sidebar { display: flex !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{
        background: "#fff",
        borderBottom: `1px solid ${border}`,
        height: 58,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <Link href="/my-coaching" style={{ textDecoration: "none" }}>
          <span style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "1.1rem",
            fontWeight: 700,
            color: black,
            letterSpacing: "0.01em",
          }}>
            Lisa Fit Method
          </span>
          <span style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: "0.65rem",
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: accent,
            marginLeft: "0.6rem",
          }}>
            Coaching
          </span>
        </Link>

        <AccountDropdown />
      </header>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Desktop sidebar */}
        <nav className="coaching-sidebar" style={{
          width: 220,
          background: "#fff",
          borderRight: `1px solid ${border}`,
          padding: "2rem 0",
          flexDirection: "column",
          flexShrink: 0,
          position: "sticky",
          top: 58,
          height: "calc(100dvh - 58px)",
          overflowY: "auto",
        }}>
          {navLinks.map(({ href, label, exact, icon: Icon }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1.5rem",
                  textDecoration: "none",
                  color: active ? accent : muted,
                  background: active ? `${accent}12` : "transparent",
                  borderLeft: active ? `3px solid ${accent}` : "3px solid transparent",
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                <Icon />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0, padding: "2rem 1.5rem", maxWidth: 900 }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — hides when a text input is focused so the
          on-screen keyboard doesn't push it over the content. */}
      <nav className="coaching-mobile-nav" style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#fff",
        borderTop: `1px solid ${border}`,
        padding: "0.5rem 0 calc(0.5rem + env(safe-area-inset-bottom))",
        justifyContent: "space-around",
        zIndex: 100,
        transform: keyboardOpen ? "translateY(100%)" : "translateY(0)",
        transition: "transform 0.15s ease",
        pointerEvents: keyboardOpen ? "none" : "auto",
      }}>
        {navLinks.map(({ href, label, exact, icon: Icon }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
                textDecoration: "none",
                color: active ? accent : muted,
                padding: "0.25rem 0.75rem",
              }}
            >
              <Icon />
              <span style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "0.6rem",
                fontWeight: active ? 600 : 400,
                letterSpacing: "0.04em",
              }}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

