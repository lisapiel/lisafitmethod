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
}

interface CourseEntry {
  id: "training" | "nutrition"
  label: string
  href: string
  upgradeHref: string
  memberPrice: string
}

const COURSES: CourseEntry[] = [
  {
    id: "training",
    label: "Training Foundations",
    href: "/training-foundations",
    upgradeHref: "/account/courses/training",
    memberPrice: "$97",
  },
  {
    id: "nutrition",
    label: "Nutrition Foundations",
    href: "/nutrition-foundations",
    upgradeHref: "/account/courses/nutrition",
    memberPrice: "$77",
  },
]

interface Props {
  currentCourse: "training" | "nutrition"
  onClose?: () => void
}

export default function MemberNav({ currentCourse, onClose }: Props) {
  const [access, setAccess] = useState<AccessState | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/member/access")
      .then((r) => r.json())
      .then((d) => setAccess({ email: d.email ?? null, training: !!d.training, nutrition: !!d.nutrition, tracker: !!d.tracker }))
      .catch(() => setAccess({ email: null, training: false, nutrition: false, tracker: false }))
  }, [])

  async function handleSignOut() {
    await signOut()
    router.push("/")
  }

  const initials = access?.email ? access.email[0].toUpperCase() : ""

  return (
    <div style={{ flexShrink: 0, borderBottom: "1px solid #1e1e1e" }}>
      <style>{`
        .mn-owned-row:hover { background: rgba(201,169,110,0.06) !important; }
        .mn-locked-row:hover .mn-locked-label { color: #666 !important; }
        .mn-locked-row:hover .mn-locked-price { color: #666 !important; }
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
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(201,169,110,0.12)",
          border: "1px solid rgba(201,169,110,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.55rem",
          fontWeight: 700,
          color: gold,
          letterSpacing: "0.05em",
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            fontSize: "0.48rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#3a3a3a",
            marginBottom: 3,
            fontFamily: "var(--font-montserrat), sans-serif",
          }}>
            My Account
          </p>
          <p
            className="mn-account-email"
            style={{
              fontSize: "0.62rem",
              color: "#555",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-montserrat), sans-serif",
              transition: "color 0.15s",
            }}
          >
            {access?.email ?? ""}
          </p>
        </div>
        <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ flexShrink: 0, opacity: 0.3 }}>
          <path d="M1 1l4 4-4 4" stroke="#f0e6d3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>

      {/* Courses */}
      <div style={{ padding: "0.5rem 0" }}>

        {/* Owned courses label */}
        {access && (access.training || access.nutrition || access.tracker) && (
          <p style={{
            fontSize: "0.45rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#2e2e2e",
            padding: "0.25rem 1.25rem 0.35rem",
            fontFamily: "var(--font-montserrat), sans-serif",
          }}>
            Your Courses
          </p>
        )}

        {/* Owned courses */}
        {access && COURSES.filter((c) => access[c.id]).map((course) => {
          const isCurrent = course.id === currentCourse
          return (
            <Link
              key={course.id}
              href={course.href}
              onClick={onClose}
              className="mn-owned-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "0.6rem 1.25rem",
                textDecoration: "none",
                background: isCurrent ? "rgba(201,169,110,0.1)" : "transparent",
                borderLeft: isCurrent ? `2px solid ${gold}` : "2px solid transparent",
                transition: "background 0.15s",
              }}
            >
              <span style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                flexShrink: 0,
                background: isCurrent ? gold : "rgba(201,169,110,0.35)",
              }} />
              <span style={{
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.68rem",
                fontWeight: isCurrent ? 600 : 500,
                color: isCurrent ? gold : "rgba(201,169,110,0.55)",
                letterSpacing: "0.02em",
              }}>
                {course.label}
              </span>
            </Link>
          )
        })}

        {/* Progress Tracker (owned) */}
        {access?.tracker && (
          <Link
            href="/my-tracker"
            onClick={onClose}
            className="mn-owned-row"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "0.6rem 1.25rem",
              textDecoration: "none",
              borderLeft: "2px solid transparent",
              transition: "background 0.15s",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: "rgba(201,169,110,0.35)" }} />
            <span style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", fontWeight: 500, color: "rgba(201,169,110,0.55)", letterSpacing: "0.02em" }}>
              Progress Tracker
            </span>
          </Link>
        )}

        {/* Add-ons label — only show if there's something locked */}
        {access && (
          COURSES.some((c) => !access[c.id]) || (!access.tracker && (access.training || access.nutrition))
        ) && (
          <p style={{
            fontSize: "0.45rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#2e2e2e",
            padding: "0.6rem 1.25rem 0.35rem",
            fontFamily: "var(--font-montserrat), sans-serif",
            borderTop: "1px solid #1a1a1a",
            marginTop: "0.25rem",
          }}>
            Add to Your Account
          </p>
        )}

        {/* Locked courses */}
        {access && COURSES.filter((c) => !access[c.id]).map((course) => (
          <Link
            key={course.id}
            href={course.upgradeHref}
            onClick={onClose}
            className="mn-locked-row"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "0.55rem 1.25rem",
              textDecoration: "none",
              borderLeft: "2px solid transparent",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <svg width="9" height="11" viewBox="0 0 9 11" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                <rect x="0.5" y="4.5" width="8" height="6" rx="0.5" stroke="#888" strokeWidth="1"/>
                <path d="M2.5 4.5V3A2 2 0 0 1 6.5 3v1.5" stroke="#888" strokeWidth="1"/>
              </svg>
              <span
                className="mn-locked-label"
                style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", fontWeight: 500, color: "#444", letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", transition: "color 0.15s" }}
              >
                {course.label}
              </span>
            </div>
            <span
              className="mn-locked-price"
              style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.58rem", fontWeight: 700, color: "#383838", letterSpacing: "0.05em", flexShrink: 0, transition: "color 0.15s" }}
            >
              {course.memberPrice}
            </span>
          </Link>
        ))}

        {/* Progress Tracker (locked) */}
        {access && !access.tracker && (access.training || access.nutrition) && (
          <Link
            href="/account/courses/tracker"
            onClick={onClose}
            className="mn-locked-row"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              padding: "0.55rem 1.25rem",
              textDecoration: "none",
              borderLeft: "2px solid transparent",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <svg width="9" height="11" viewBox="0 0 9 11" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
                <rect x="0.5" y="4.5" width="8" height="6" rx="0.5" stroke="#888" strokeWidth="1"/>
                <path d="M2.5 4.5V3A2 2 0 0 1 6.5 3v1.5" stroke="#888" strokeWidth="1"/>
              </svg>
              <span className="mn-locked-label" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.68rem", fontWeight: 500, color: "#444", letterSpacing: "0.02em", transition: "color 0.15s" }}>
                Progress Tracker
              </span>
            </div>
            <span className="mn-locked-price" style={{ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.58rem", fontWeight: 700, color: "#383838", letterSpacing: "0.05em", flexShrink: 0, transition: "color 0.15s" }}>
              $27
            </span>
          </Link>
        )}
      </div>

      {/* Sign out */}
      <div style={{ padding: "0.5rem 1.25rem 0.75rem", borderTop: "1px solid #1a1a1a" }}>
        <button
          onClick={handleSignOut}
          className="mn-signout"
          style={{
            background: "none",
            border: "none",
            color: "#333",
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
  )
}
