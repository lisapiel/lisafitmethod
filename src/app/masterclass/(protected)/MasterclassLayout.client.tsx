"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { signOut } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"

const gold = "#c9a96e"
const border = "#2a2a2a"

function MasterclassSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()

  const navLinks = [
    { href: "/masterclass", label: "Current Block", exact: true },
    { href: "/masterclass/library", label: "Block Library" },
    { href: "/masterclass/qa", label: "Q&A" },
    { href: "/masterclass/progress", label: "My Progress" },
  ]

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 150 }}
        />
      )}
      <nav style={{
        width: 220,
        flexShrink: 0,
        borderRight: `1px solid ${border}`,
        overflowY: "auto",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 160,
      }}>
        <style>{`
          @media (max-width: 768px) {
            .mc-sidebar { position: fixed !important; top: 0; left: 0; height: 100dvh; transform: translateX(-100%); transition: transform 0.2s; z-index: 160; }
            .mc-sidebar.open { transform: translateX(0); }
          }
        `}</style>
        <div className={`mc-sidebar${open ? " open" : ""}`} style={{ padding: "1.5rem 0", height: "100%" }}>
          <p style={{
            fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.55rem",
            fontWeight: 600,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#444",
            padding: "0 1.5rem",
            marginBottom: "1rem",
          }}>
            Masterclass
          </p>
          {navLinks.map(({ href, label, exact }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              style={{
                display: "block",
                padding: "10px 1.5rem",
                fontFamily: "var(--font-montserrat), sans-serif",
                fontSize: "0.7rem",
                fontWeight: isActive(href, exact) ? 600 : 400,
                color: isActive(href, exact) ? gold : "#888",
                textDecoration: "none",
                borderLeft: isActive(href, exact) ? `2px solid ${gold}` : "2px solid transparent",
                background: isActive(href, exact) ? "rgba(201,169,110,0.05)" : "none",
                transition: "all 0.12s",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}

function MasterclassHeader({ onMenuToggle }: { onMenuToggle: () => void }) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/")
  }

  return (
    <header style={{
      borderBottom: `1px solid ${border}`,
      padding: "1rem 1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "rgba(10,10,10,0.98)",
      backdropFilter: "blur(10px)",
      zIndex: 200,
      flexShrink: 0,
    }}>
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
            border: `1px solid ${border}`,
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
            Lisa <span style={{ color: gold }}>Fit Method</span>
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
            borderLeft: `1px solid ${border}`,
          }}
        >
          Masterclass
        </span>
      </div>

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
    </header>
  )
}

export default function MasterclassClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const el = document.querySelector(".mc-scroll-area")
    if (el) (el as HTMLElement).scrollTop = 0
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      overflow: "hidden",
      background: "#0a0a0a",
      color: "#f0e6d3",
      fontFamily: "var(--font-montserrat), sans-serif",
      fontWeight: 300,
      lineHeight: 1.35,
    }}>
      <MasterclassHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <style>{`@media (max-width: 768px) { .mc-desktop-sidebar { display: none !important; } }`}</style>
        <div className="mc-desktop-sidebar">
          <MasterclassSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
        {sidebarOpen && (
          <MasterclassSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
