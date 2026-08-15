"use client"

import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import AccountDropdown from "./AccountDropdown.client"
import MemberDrawer from "./MemberDrawer.client"

const HIDDEN_PREFIXES = [
  "/admin",
  "/training-foundations",
  "/nutrition-foundations",
  "/masterclass",
  "/my-tracker",
  "/my-coaching",
  "/my-plan",
  "/account",
  "/login",
  "/forgot-password",
  "/set-password",
  "/purchase-success",
  "/tracker-checkout",
  "/checkout",
]

interface AccessState {
  email: string | null
}

export default function SiteHeader() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [access, setAccess] = useState<AccessState | null>(null)

  useEffect(() => {
    fetch("/api/member/access")
      .then((r) => r.json())
      .then((d) => setAccess({ email: d.email ?? null }))
      .catch(() => setAccess({ email: null }))
  }, [])

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  const close = () => setMenuOpen(false)

  const navLinks = [
    { href: "/about", label: "About" },
    { href: "/courses", label: "Courses" },
    { href: "/coaching", label: "Coaching" },
    { href: "/blog", label: "Blog" },
    { href: "/faq", label: "FAQ" },
  ]

  return (
    <>
      <style>{`
        .site-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          background: rgba(10, 10, 10, 0.96);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          height: 64px;
          display: flex;
          align-items: center;
          padding: 0 48px;
          justify-content: space-between;
        }
        .site-header-wordmark {
          font-family: var(--font-playfair), serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #f0e6d3;
          text-decoration: none;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .site-header-nav {
          display: flex;
          align-items: center;
          gap: 36px;
        }
        .site-header-nav a {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(240, 230, 211, 0.65);
          text-decoration: none;
          transition: color 0.2s;
        }
        .site-header-nav a:hover { color: #c8a97e; }
        .site-header-cta {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #0a0a0a;
          background: #c8a97e;
          text-decoration: none;
          padding: 10px 22px;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .site-header-cta:hover { background: #b8996e; }
        .site-header-login {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(240, 230, 211, 0.55);
          text-decoration: none;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .site-header-login:hover { color: #c8a97e; }
        .site-header-desktop-auth {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .site-header-hamburger {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 10px 8px;
          flex-direction: column;
          gap: 5px;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .site-header-hamburger span {
          display: block;
          width: 22px;
          height: 1.5px;
          background: #f0e6d3;
          transition: all 0.25s;
        }
        @media (max-width: 1024px) {
          .site-header { padding: 0 20px; }
          .site-header-nav { display: none; }
          .site-header-desktop-auth { display: none; }
          .site-header-hamburger { display: flex; }
        }
      `}</style>

      <header className="site-header">
        <Link href="/" className="site-header-wordmark">Lisa Fit Method</Link>

        <nav className="site-header-nav">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="site-header-desktop-auth">
            {access?.email ? (
              <AccountDropdown />
            ) : access !== null ? (
              <>
                <Link href="/login" className="site-header-login">Log In</Link>
                <Link href="/coaching#apply" className="site-header-cta">Apply for Coaching</Link>
              </>
            ) : null}
          </div>
          <button
            className="site-header-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="lfm-mobile-drawer"
          >
            <span style={{ transform: menuOpen ? "rotate(45deg) translate(4px, 5px)" : "none" }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? "rotate(-45deg) translate(4px, -5px)" : "none" }} />
          </button>
        </div>
      </header>

      <MemberDrawer open={menuOpen} onClose={close} />

      <div style={{ height: 64 }} />
    </>
  )
}
