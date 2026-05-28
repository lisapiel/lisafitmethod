"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { signOut } from "aws-amplify/auth"
import { useRouter } from "next/navigation"

const gold = "#c9a96e"

interface AccessState {
  email: string | null
  training: boolean
  nutrition: boolean
  tracker: boolean
}

const COURSES = [
  { id: "training" as const, label: "Training Foundations", href: "/training-foundations", upgradeHref: "/account/courses/training", price: "$97" },
  { id: "nutrition" as const, label: "Nutrition Foundations", href: "/nutrition-foundations", upgradeHref: "/account/courses/nutrition", price: "$77" },
]

export default function AccountDropdown({ onNavigate }: { onNavigate?: () => void }) {
  const [open, setOpen] = useState(false)
  const [access, setAccess] = useState<AccessState | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/member/access")
      .then((r) => r.json())
      .then((d) => setAccess({ email: d.email ?? null, training: !!d.training, nutrition: !!d.nutrition, tracker: !!d.tracker }))
      .catch(() => setAccess({ email: null, training: false, nutrition: false, tracker: false }))
  }, [])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    router.push("/")
  }

  const initials = access?.email ? access.email[0].toUpperCase() : "·"
  const ownedCourses = access ? COURSES.filter((c) => access[c.id]) : []
  const lockedCourses = access ? COURSES.filter((c) => !access[c.id]) : []
  const showTracker = !!access?.tracker
  const showTrackerUpsell = !access?.tracker && (access?.training || access?.nutrition)
  const hasOwned = ownedCourses.length > 0 || showTracker
  const hasLocked = lockedCourses.length > 0 || showTrackerUpsell

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <style>{`
        .ad-icon-btn:hover { background: rgba(201,169,110,0.18) !important; border-color: rgba(201,169,110,0.4) !important; }
        .ad-course-row:hover { background: rgba(201,169,110,0.07) !important; }
        .ad-locked-row:hover { background: rgba(201,169,110,0.07) !important; }
        .ad-signout:hover { color: #888 !important; }
      `}</style>

      {/* Profile icon */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account"
        className="ad-icon-btn"
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: open ? "rgba(201,169,110,0.18)" : "rgba(201,169,110,0.1)",
          border: `1px solid ${open ? "rgba(201,169,110,0.45)" : "rgba(201,169,110,0.2)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.6rem",
          fontWeight: 700,
          color: gold,
          letterSpacing: "0.04em",
          transition: "background 0.15s, border-color 0.15s",
          flexShrink: 0,
        }}
      >
        {initials}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 248,
            background: "#111111",
            border: "1px solid #2a2a2a",
            zIndex: 300,
            boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
          }}
        >
          {/* Email */}
          <div style={{ padding: "0.85rem 1.1rem 0.8rem", borderBottom: "1px solid #1a1a1a" }}>
            <p style={{
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.45rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#2e2e2e",
              marginBottom: 5,
            }}>
              Signed in as
            </p>
            <p style={{
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.65rem",
              color: "#555",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              {access?.email ?? ""}
            </p>
          </div>

          {/* Owned courses */}
          {hasOwned && (
            <div style={{ borderBottom: "1px solid #1a1a1a" }}>
              <p style={{
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.43rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#2e2e2e",
                padding: "0.65rem 1.1rem 0.25rem",
              }}>
                Your Courses
              </p>
              {ownedCourses.map((course) => (
                <Link
                  key={course.id}
                  href={course.href}
                  onClick={() => { setOpen(false); onNavigate?.() }}
                  className="ad-course-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    padding: "0.55rem 1.1rem",
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(201,169,110,0.4)", flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", color: "rgba(201,169,110,0.7)", letterSpacing: "0.02em" }}>
                    {course.label}
                  </span>
                </Link>
              ))}
              {showTracker && (
                <Link
                  href="/my-tracker"
                  onClick={() => { setOpen(false); onNavigate?.() }}
                  className="ad-course-row"
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "0.55rem 1.1rem", textDecoration: "none", transition: "background 0.15s" }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(201,169,110,0.4)", flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", color: "rgba(201,169,110,0.7)", letterSpacing: "0.02em" }}>
                    Progress Tracker
                  </span>
                </Link>
              )}
            </div>
          )}

          {/* Add-ons (locked) */}
          {hasLocked && (
            <div style={{ borderBottom: "1px solid #1a1a1a" }}>
              <p style={{
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.43rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#666",
                padding: "0.65rem 1.1rem 0.25rem",
              }}>
                Add to Your Account
              </p>
              {lockedCourses.map((course) => (
                <Link
                  key={course.id}
                  href={course.upgradeHref}
                  onClick={() => { setOpen(false); onNavigate?.() }}
                  className="ad-locked-row"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0.55rem 1.1rem", textDecoration: "none", transition: "background 0.15s" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <svg width="9" height="11" viewBox="0 0 9 11" fill="none" style={{ flexShrink: 0 }}>
                      <rect x="0.5" y="4.5" width="8" height="6" rx="0.5" stroke={gold} strokeWidth="1" opacity="0.7"/>
                      <path d="M2.5 4.5V3A2 2 0 0 1 6.5 3v1.5" stroke={gold} strokeWidth="1" opacity="0.7"/>
                    </svg>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", color: "rgba(240,230,211,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{course.label}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: gold, flexShrink: 0 }}>→</span>
                </Link>
              ))}
              {showTrackerUpsell && (
                <Link
                  href="/account/courses/tracker"
                  onClick={() => { setOpen(false); onNavigate?.() }}
                  className="ad-locked-row"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "0.55rem 1.1rem", textDecoration: "none", transition: "background 0.15s" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                    <svg width="9" height="11" viewBox="0 0 9 11" fill="none" style={{ flexShrink: 0 }}>
                      <rect x="0.5" y="4.5" width="8" height="6" rx="0.5" stroke={gold} strokeWidth="1" opacity="0.7"/>
                      <path d="M2.5 4.5V3A2 2 0 0 1 6.5 3v1.5" stroke={gold} strokeWidth="1" opacity="0.7"/>
                    </svg>
                    <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", color: "rgba(240,230,211,0.8)" }}>Progress Tracker</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", color: gold, flexShrink: 0 }}>→</span>
                </Link>
              )}
            </div>
          )}

          {/* Sign out */}
          <div style={{ padding: "0.65rem 1.1rem" }}>
            <button
              onClick={handleSignOut}
              className="ad-signout"
              style={{
                background: "none",
                border: "none",
                color: "#3a3a3a",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.52rem",
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: "pointer",
                padding: 0,
                transition: "color 0.15s",
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
