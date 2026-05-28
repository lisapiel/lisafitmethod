"use client"

import Link from "next/link"
import { signOut } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import { useCourseProgress } from "./CourseProgressContext"
import CourseSwitcher from "@/components/CourseSwitcher.client"

interface CourseHeaderProps {
  onMenuToggle: () => void
}

export default function CourseHeader({ onMenuToggle }: CourseHeaderProps) {
  const router = useRouter()
  const { ready, currentPosition } = useCourseProgress()

  async function handleSignOut() {
    await signOut()
    router.push("/")
  }

  return (
    <header
      className="course-header-bar"
      style={{
        borderBottom: "1px solid #2a2a2a",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(10,10,10,0.98)",
        backdropFilter: "blur(10px)",
        zIndex: 200,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={onMenuToggle}
          className="mobile-menu-btn"
          style={{
            display: "none",
            background: "none",
            border: "1px solid #2a2a2a",
            color: "#f0e6d3",
            padding: "0.5rem 0.75rem",
            fontSize: "0.65rem",
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "var(--font-montserrat), sans-serif",
          }}
        >
          ☰ Menu
        </button>
        <style>{`
          @media (max-width: 768px) {
            .mobile-menu-btn { display: block !important; }
            .course-switcher-wrap { display: none !important; }
            .header-progress-badge { display: none !important; }
            .course-header-bar {
              position: fixed !important;
              top: 0;
              left: 0;
              right: 0;
              z-index: 200;
            }
          }
        `}</style>
        <div
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "0.9rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#c9a96e",
          }}
        >
          Lisa Fit Method
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div className="course-switcher-wrap">
          <CourseSwitcher currentCourse="training" />
        </div>
        {ready && currentPosition.totalSessions > 0 && (
          <Link
            href="/training-foundations/tracker"
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.1em",
              color: "#c9a96e",
              textDecoration: "none",
              fontFamily: "var(--font-montserrat), sans-serif",
              padding: "0.3rem 0.6rem",
              border: "1px solid rgba(201,169,110,0.3)",
            }}
            className="header-progress-badge"
          >
            W{currentPosition.week} · {currentPosition.totalSessions} sessions
          </Link>
        )}
        <button
          onClick={handleSignOut}
          style={{
            background: "none",
            border: "none",
            color: "#555",
            fontSize: "0.65rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "var(--font-montserrat), sans-serif",
            padding: 0,
          }}
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
