"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

const gold = "#c9a96e"

interface CourseEntry {
  id: "training" | "nutrition"
  label: string
  shortLabel: string
  href: string
  checkoutHref: string
  desc: string
}

const COURSES: CourseEntry[] = [
  {
    id: "training",
    label: "Training Foundations",
    shortLabel: "Training",
    href: "/training-foundations",
    checkoutHref: "/checkout?member=1",
    desc: "4-week beginner strength program — 5 movements, progressive overload.",
  },
  {
    id: "nutrition",
    label: "Nutrition Foundations",
    shortLabel: "Nutrition",
    href: "/nutrition-foundations",
    checkoutHref: "/checkout?product=nutrition&member=1",
    desc: "4-week nutrition course — TDEE calculator, meal plan, real recipes.",
  },
]

interface Props {
  currentCourse: "training" | "nutrition"
}

export default function CourseSwitcher({ currentCourse }: Props) {
  const [access, setAccess] = useState<{ training: boolean; nutrition: boolean } | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/member/access")
      .then((r) => r.json())
      .then((d) => setAccess({ training: !!d.training, nutrition: !!d.nutrition }))
      .catch(() => setAccess({ training: false, nutrition: false }))
  }, [])

  if (!access) return null

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {COURSES.map((course) => {
        const isActive = course.id === currentCourse
        const isOwned = access[course.id]
        const isHovered = hovered === course.id

        if (isOwned) {
          return (
            <Link
              key={course.id}
              href={course.href}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                fontSize: "0.55rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                textDecoration: "none",
                fontFamily: "var(--font-montserrat), sans-serif",
                transition: "all 0.15s",
                background: isActive ? gold : "transparent",
                color: isActive ? "#0a0a0a" : "rgba(201,169,110,0.7)",
                border: isActive ? "none" : "1px solid rgba(201,169,110,0.25)",
              }}
            >
              {course.shortLabel}
              {isActive && (
                <span style={{ opacity: 0.7, fontSize: "0.5rem" }}>●</span>
              )}
            </Link>
          )
        }

        // Unowned — locked state with hover tooltip
        return (
          <div
            key={course.id}
            style={{ position: "relative" }}
            onMouseEnter={() => setHovered(course.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <Link
              href={course.checkoutHref}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                fontSize: "0.55rem",
                fontWeight: 600,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                textDecoration: "none",
                fontFamily: "var(--font-montserrat), sans-serif",
                color: "#444",
                border: "1px solid #2a2a2a",
                transition: "all 0.15s",
                ...(isHovered ? { color: "#888", borderColor: "#444" } : {}),
              }}
            >
              <svg width="8" height="9" viewBox="0 0 8 9" fill="none" style={{ flexShrink: 0 }}>
                <rect x="1" y="4" width="6" height="5" rx="0.5" stroke="currentColor" strokeWidth="1"/>
                <path d="M2.5 4V3a1.5 1.5 0 0 1 3 0v1" stroke="currentColor" strokeWidth="1"/>
              </svg>
              {course.shortLabel}
            </Link>

            {isHovered && (
              <div
                ref={tooltipRef}
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 200,
                  background: "#161616",
                  border: "1px solid #2a2a2a",
                  borderTop: `2px solid ${gold}`,
                  padding: "12px 14px",
                  zIndex: 300,
                  pointerEvents: "none",
                }}
              >
                <p style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: gold, marginBottom: 6 }}>
                  {course.label}
                </p>
                <p style={{ fontSize: "0.65rem", color: "#888", lineHeight: 1.6, marginBottom: 10 }}>
                  {course.desc}
                </p>
                <p style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: gold }}>
                  Add now — 10% member discount →
                </p>
              </div>
            )}
          </div>
        )
      })}

      <Link
        href="/account"
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 8px",
          fontSize: "0.55rem",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textDecoration: "none",
          fontFamily: "var(--font-montserrat), sans-serif",
          color: "#444",
          transition: "color 0.15s",
        }}
        title="My Account"
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1"/>
          <path d="M1.5 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      </Link>
    </div>
  )
}
