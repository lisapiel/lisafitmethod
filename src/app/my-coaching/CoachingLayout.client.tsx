"use client"

import { usePathname, useRouter } from "next/navigation"
import { signOut } from "aws-amplify/auth"
import Link from "next/link"

const accent = "#c8a97e"
const accentDark = "#a8895e"
const warmWhite = "#faf8f5"
const black = "#0a0a0a"
const muted = "#6b6560"
const border = "#e8e2dc"

const navLinks = [
  { href: "/my-coaching", label: "Home", exact: true, icon: HomeIcon },
  { href: "/my-coaching/workouts", label: "Workouts", icon: DumbellIcon },
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

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 3h12v8H9l-3 2.5V11H2V3Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

export default function CoachingClientLayout({
  children,
  email,
}: {
  children: React.ReactNode
  email: string
}) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  async function handleSignOut() {
    await signOut()
    router.push("/login")
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

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: "0.75rem",
            color: muted,
          }}>
            {email}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              background: "none",
              border: `1px solid ${border}`,
              color: muted,
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: "0.7rem",
              fontWeight: 500,
              letterSpacing: "0.08em",
              padding: "0.35rem 0.9rem",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
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

      {/* Mobile bottom nav */}
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

void accentDark
