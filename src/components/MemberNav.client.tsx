"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { signOut } from "aws-amplify/auth"
import { useRouter } from "next/navigation"

const gold = "#c9a96e"

interface AccessState {
  email: string | null
  training: boolean
  nutrition: boolean
  tracker: boolean
  coaching: boolean
  masterclass: boolean
}

const PORTALS = [
  { id: "training" as const, label: "Training Foundations", href: "/training-foundations", upgradeHref: "/checkout" },
  { id: "nutrition" as const, label: "Nutrition Foundations", href: "/nutrition-foundations", upgradeHref: "/checkout" },
  { id: "coaching" as const, label: "1:1 Coaching", href: "/my-coaching", upgradeHref: "/coaching" },
  { id: "masterclass" as const, label: "Masterclass", href: "/masterclass", upgradeHref: "/masterclass" },
  { id: "tracker" as const, label: "Progress Tracker", href: "/my-tracker", upgradeHref: "/account/courses/tracker" },
]

interface Props {
  currentPortal: "training" | "nutrition" | "coaching" | "masterclass" | "tracker"
  onClose?: () => void
}

export default function MemberNav({ currentPortal, onClose }: Props) {
  const [access, setAccess] = useState<AccessState | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/member/access")
      .then((r) => r.json())
      .then((d) => setAccess({
        email: d.email ?? null,
        training: !!d.training,
        nutrition: !!d.nutrition,
        tracker: !!d.tracker,
        coaching: !!d.coaching,
        masterclass: !!d.masterclass,
      }))
      .catch(() => setAccess({ email: null, training: false, nutrition: false, tracker: false, coaching: false, masterclass: false }))
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push("/")
  }

  const initials = access?.email ? access.email[0].toUpperCase() : ""
  const ownedPortals = access ? PORTALS.filter((p) => access[p.id]) : []
  const lockedPortals = access ? PORTALS.filter((p) => !access[p.id]) : []

  return (
    <div style={{ flexShrink: 0, borderBottom: "1px solid #1e1e1e" }}>
      <style>{`
        .mn-owned-row:hover { background: rgba(201,169,110,0.06) !important; }
        .mn-locked-row:hover .mn-locked-label { color: #666 !important; }
        .mn-signout:hover { color: #666 !important; }
        .mn-account-link:hover .mn-account-email { color: #888 !important; }
      `}</style>

      {/* Account header */}
      <Link
        href="/account"
        onClick={onClose}
        className="mn-account-link"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0.85rem 1.25rem",
          textDecoration: "none",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(201,169,110,0.12)",
          border: "1px solid rgba(201,169,110,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.55rem", fontWeight: 700, color: gold, letterSpacing: "0.05em",
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "#3a3a3a", marginBottom: 3,
            fontFamily: "var(--font-montserrat), sans-serif",
          }}>
            My Account
          </p>
          <p className="mn-account-email" style={{
            fontSize: "0.62rem", color: "#555",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            fontFamily: "var(--font-montserrat), sans-serif", transition: "color 0.15s",
          }}>
            {access?.email ?? ""}
          </p>
        </div>
        <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ flexShrink: 0, opacity: 0.3 }}>
          <path d="M1 1l4 4-4 4" stroke="#f0e6d3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>

      {/* Owned portals */}
      <div style={{ padding: "0.5rem 0" }}>
        {ownedPortals.length > 0 && (
          <p style={{
            fontSize: "0.45rem", fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "#2e2e2e",
            padding: "0.25rem 1.25rem 0.35rem",
            fontFamily: "var(--font-montserrat), sans-serif",
          }}>
            Your Portals
          </p>
        )}

        {ownedPortals.map((portal) => {
          const isCurrent = portal.id === currentPortal
          return (
            <Link
              key={portal.id}
              href={portal.href}
              onClick={onClose}
              className="mn-owned-row"
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "0.6rem 1.25rem",
                textDecoration: "none",
                background: isCurrent ? "rgba(201,169,110,0.1)" : "transparent",
                borderLeft: isCurrent ? `2px solid ${gold}` : "2px solid transparent",
                transition: "background 0.15s",
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                background: isCurrent ? gold : "rgba(201,169,110,0.35)",
              }} />
              <span style={{
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.68rem",
                fontWeight: isCurrent ? 600 : 500,
                color: isCurrent ? gold : "rgba(201,169,110,0.55)",
                letterSpacing: "0.02em",
              }}>
                {portal.label}
              </span>
            </Link>
          )
        })}

        {/* Locked portals */}
        {lockedPortals.length > 0 && (
          <>
            <p style={{
              fontSize: "0.45rem", fontWeight: 700, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "#2e2e2e",
              padding: "0.6rem 1.25rem 0.35rem",
              fontFamily: "var(--font-montserrat), sans-serif",
              borderTop: "1px solid #1a1a1a", marginTop: "0.25rem",
            }}>
              Get Access
            </p>
            {lockedPortals.map((portal) => (
              <Link
                key={portal.id}
                href={portal.upgradeHref}
                onClick={onClose}
                className="mn-locked-row"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 8, padding: "0.55rem 1.25rem", textDecoration: "none",
                  borderLeft: "2px solid transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <svg width="9" height="11" viewBox="0 0 9 11" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                    <rect x="0.5" y="4.5" width="8" height="6" rx="0.5" stroke="#888" strokeWidth="1"/>
                    <path d="M2.5 4.5V3A2 2 0 0 1 6.5 3v1.5" stroke="#888" strokeWidth="1"/>
                  </svg>
                  <span className="mn-locked-label" style={{
                    fontFamily: "var(--font-montserrat), sans-serif",
                    fontSize: "0.68rem", fontWeight: 500, color: "#444",
                    letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap", transition: "color 0.15s",
                  }}>
                    {portal.label}
                  </span>
                </div>
                <span style={{
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.7rem", color: "rgba(201,169,110,0.4)",
                  flexShrink: 0,
                }}>→</span>
              </Link>
            ))}
          </>
        )}
      </div>

      {/* Sign out */}
      <div style={{ padding: "0.5rem 1.25rem 0.75rem", borderTop: "1px solid #1a1a1a" }}>
        <button
          onClick={handleSignOut}
          className="mn-signout"
          style={{
            background: "none", border: "none", color: "#333",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.52rem", fontWeight: 500,
            letterSpacing: "0.18em", textTransform: "uppercase",
            cursor: "pointer", padding: 0, transition: "color 0.15s",
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
