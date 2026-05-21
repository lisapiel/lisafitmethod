"use client"

import { signOut } from "aws-amplify/auth"
import { useRouter } from "next/navigation"

interface CourseHeaderProps {
  onMenuToggle: () => void
}

export default function CourseHeader({ onMenuToggle }: CourseHeaderProps) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/")
  }

  return (
    <header
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
            .header-subtitle { display: none !important; }
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
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div
          className="header-subtitle"
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#888888",
            fontFamily: "var(--font-montserrat), sans-serif",
          }}
        >
          Training Foundations
        </div>
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
