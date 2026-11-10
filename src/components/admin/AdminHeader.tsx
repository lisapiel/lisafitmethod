"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "aws-amplify/auth"

const gold = "#c9a96e"
const border = "#2a2a2a"

export default function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { setMenuOpen(false) }, [pathname])
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [menuOpen])

  async function handleSignOut() {
    await signOut()
    router.push("/admin/login")
  }

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/coaching", label: "Coaching" },
    { href: "/admin/customers", label: "Customers" },
    { href: "/admin/testimonials", label: "Testimonials" },
    { href: "/admin/videos", label: "Videos" },
    { href: "/admin/photos", label: "Photos" },
    { href: "/admin/design", label: "Design" },
    { href: "/admin/blog", label: "Blog" },
    { href: "/admin/promo-codes", label: "Promo Codes" },
    { href: "/admin/leads", label: "Leads" },
    { href: "/admin/masterclass", label: "Masterclass" },
    { href: "/admin/security", label: "Security" },
  ]

  return (
    <header
      className="lfm-admin-header"
      style={{
        background: "#111111",
        borderBottom: `1px solid ${border}`,
        padding: "0 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "2.5rem" }}>
        <span
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "1.1rem",
            color: gold,
            letterSpacing: "0.05em",
          }}
        >
          LFM Admin
        </span>
        <nav className="lfm-admin-nav" aria-label="Admin sections" style={{ display: "flex", gap: "1.5rem" }}>
          {navItems.map((item) => {
            const isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.7rem",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  color: isActive ? gold : "#888888",
                  borderBottom: isActive ? `1px solid ${gold}` : "1px solid transparent",
                  paddingBottom: 2,
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <button
        type="button"
        className="lfm-admin-menu-btn"
        aria-expanded={menuOpen}
        aria-controls="lfm-admin-menu"
        onClick={() => setMenuOpen((v) => !v)}
        style={{
          background: "none",
          border: `1px solid ${border}`,
          color: menuOpen ? gold : "#888888",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.65rem",
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          padding: "0.5rem 1rem",
          minHeight: 40,
          cursor: "pointer",
        }}
      >
        {menuOpen ? "Close" : "Menu"}
      </button>
      {menuOpen && (
        <nav
          id="lfm-admin-menu"
          className="lfm-admin-menu"
          aria-label="Admin sections"
          style={{
            position: "absolute",
            top: 60,
            left: 0,
            right: 0,
            background: "#111111",
            borderBottom: `1px solid ${border}`,
            padding: "0.5rem max(1rem, env(safe-area-inset-right, 0px)) 1rem max(1rem, env(safe-area-inset-left, 0px))",
            maxHeight: "calc(100dvh - 60px)",
            overflowY: "auto",
          }}
        >
          {navItems.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                style={{
                  display: "block",
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  color: isActive ? gold : "#888888",
                  borderLeft: isActive ? `2px solid ${gold}` : "2px solid transparent",
                  padding: "0.85rem 0.75rem",
                }}
              >
                {item.label}
              </Link>
            )
          })}
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              marginTop: "0.5rem",
              background: "none",
              border: `1px solid ${border}`,
              color: "#888888",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.65rem",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "0.6rem 1rem",
              minHeight: 40,
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </nav>
      )}
      <style>{`
        .lfm-admin-menu-btn { display: none; }
        .lfm-admin-signout, .lfm-admin-menu-btn { white-space: nowrap; flex-shrink: 0; }
        @media (max-width: 1499px) {
          .lfm-admin-nav, .lfm-admin-signout { display: none !important; }
          .lfm-admin-menu-btn { display: inline-block; }
          .lfm-admin-header { padding: 0 max(1rem, env(safe-area-inset-right, 0px)) 0 max(1rem, env(safe-area-inset-left, 0px)) !important; }
        }
        @media (min-width: 1500px) { .lfm-admin-menu { display: none; } }
      `}</style>
      <button
        onClick={handleSignOut}
        className="lfm-admin-signout"
        style={{
          background: "none",
          border: `1px solid ${border}`,
          color: "#888888",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.65rem",
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          padding: "0.4rem 1rem",
          cursor: "pointer",
        }}
      >
        Sign Out
      </button>
    </header>
  )
}
