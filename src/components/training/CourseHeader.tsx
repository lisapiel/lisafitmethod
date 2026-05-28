"use client"

import Link from "next/link"
import { useCourseProgress } from "./CourseProgressContext"
import AccountDropdown from "@/components/AccountDropdown.client"

interface CourseHeaderProps {
  onMenuToggle: () => void
}

export default function CourseHeader({ onMenuToggle }: CourseHeaderProps) {
  const { ready, currentPosition } = useCourseProgress()

  return (
    <header
      className="course-header-bar"
      style={{
        borderBottom: "1px solid #2a2a2a",
        padding: "0 1.5rem",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(10,10,10,0.98)",
        backdropFilter: "blur(10px)",
        zIndex: 200,
        flexShrink: 0,
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .header-progress-badge { display: none !important; }
          .course-header-bar {
            position: fixed !important;
            top: 0; left: 0; right: 0; z-index: 200;
          }
        }
      `}</style>

      {/* Left: hamburger (mobile) + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
        <button
          onClick={onMenuToggle}
          className="mobile-menu-btn"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "1px solid #2a2a2a",
            color: "#f0e6d3",
            width: 36,
            height: 36,
            cursor: "pointer",
            flexShrink: 0,
          }}
          aria-label="Open menu"
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <rect y="0" width="14" height="1.5" fill="currentColor"/>
            <rect y="4.25" width="14" height="1.5" fill="currentColor"/>
            <rect y="8.5" width="14" height="1.5" fill="currentColor"/>
          </svg>
        </button>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "1rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "#f0e6d3",
          }}>
            Lisa <span style={{ color: "#c9a96e" }}>Fit Method</span>
          </span>
        </Link>
      </div>

      {/* Right: progress badge (desktop) + account icon */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {ready && currentPosition.totalSessions > 0 && (
          <Link
            href="/training-foundations/tracker"
            className="header-progress-badge"
            style={{
              fontSize: "0.55rem",
              letterSpacing: "0.12em",
              color: "#c9a96e",
              textDecoration: "none",
              fontFamily: "var(--font-montserrat), sans-serif",
              padding: "0.3rem 0.65rem",
              border: "1px solid rgba(201,169,110,0.25)",
            }}
          >
            W{currentPosition.week} · {currentPosition.totalSessions} sessions
          </Link>
        )}
        <AccountDropdown />
      </div>
    </header>
  )
}
