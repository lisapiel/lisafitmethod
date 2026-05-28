"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { signOut } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"

function MasterclassHeader({ onMenuToggle }: { onMenuToggle: () => void }) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/")
  }

  return (
    <header
      className="mc-header-bar"
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
      <style>{`
        @media (max-width: 768px) {
          .mc-mobile-btn { display: block !important; }
          .mc-header-sub { display: none !important; }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={onMenuToggle}
          className="mc-mobile-btn"
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
        <Link href="/masterclass" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.15rem", fontWeight: 600, color: "#f0e6d3", letterSpacing: "0.04em" }}>
            Lisa <span style={{ color: "#c9a96e" }}>Fit Method</span>
          </span>
        </Link>
        <span
          className="mc-header-sub"
          style={{
            fontSize: "0.6rem",
            fontWeight: 500,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#444",
            fontFamily: "var(--font-montserrat), sans-serif",
            paddingLeft: "1rem",
            borderLeft: "1px solid #2a2a2a",
          }}
        >
          Masterclass
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <Link
          href="/masterclass/progress"
          style={{
            fontSize: "0.6rem",
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#555",
            fontFamily: "var(--font-montserrat), sans-serif",
            textDecoration: "none",
          }}
        >
          Progress
        </Link>
        <button
          onClick={handleSignOut}
          style={{
            background: "none",
            border: "none",
            color: "#555",
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.6rem",
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}

export default function MasterclassClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const el = document.querySelector(".mc-scroll-area")
    if (el) (el as HTMLElement).scrollTop = 0
  }, [pathname])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
        background: "#0a0a0a",
        color: "#f0e6d3",
        fontFamily: "var(--font-montserrat), sans-serif",
        fontWeight: 300,
        lineHeight: 1.35,
      }}
    >
      <MasterclassHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar placeholder — full sidebar added in Phase 5 */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 150,
            }}
          />
        )}
        <div
          className="mc-scroll-area"
          style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin" }}
        >
          <style>{`
            .mc-scroll-area::-webkit-scrollbar { width: 4px; }
            .mc-scroll-area::-webkit-scrollbar-thumb { background: #2a2a2a; }
            .mc-scroll-area [id] { scroll-margin-top: 1rem; }
          `}</style>
          {children}
        </div>
      </div>
    </div>
  )
}
