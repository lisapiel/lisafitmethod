"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState } from "react"

const HIDDEN_PREFIXES = [
  "/admin",
  "/training-foundations",
  "/nutrition-foundations",
  "/masterclass",
  "/my-tracker",
  "/my-plan",
  "/account",
  "/login",
  "/forgot-password",
  "/set-password",
  "/purchase-success",
  "/tracker-checkout",
  "/checkout",
]

export default function SiteHeader() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

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
          top: 0;
          left: 0;
          right: 0;
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
        .site-header-mobile-menu {
          display: none;
          position: fixed;
          top: 64px;
          left: 0;
          right: 0;
          background: #0a0a0a;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 24px 32px;
          flex-direction: column;
          gap: 24px;
          z-index: 99;
        }
        .site-header-mobile-menu.open { display: flex; }
        .site-header-mobile-menu a {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(240, 230, 211, 0.75);
          text-decoration: none;
        }
        @media (max-width: 768px) {
          .site-header { padding: 0 24px; }
          .site-header-nav { display: none; }
          .site-header-hamburger { display: flex; }
        }
        @media (min-width: 769px) {
          .site-header-mobile-menu { display: none !important; }
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
          <Link href="/checkout" className="site-header-cta">Get The Course</Link>
          <button
            className="site-header-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span style={{ transform: menuOpen ? "rotate(45deg) translate(4px, 5px)" : "none" }} />
            <span style={{ opacity: menuOpen ? 0 : 1 }} />
            <span style={{ transform: menuOpen ? "rotate(-45deg) translate(4px, -5px)" : "none" }} />
          </button>
        </div>
      </header>

      <div className={`site-header-mobile-menu${menuOpen ? " open" : ""}`}>
        {navLinks.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</Link>
        ))}
        <Link
          href="/checkout"
          onClick={() => setMenuOpen(false)}
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#0a0a0a",
            background: "#c8a97e",
            textDecoration: "none",
            padding: "12px 20px",
            textAlign: "center",
            marginTop: 8,
          }}
        >
          Get The Course
        </Link>
      </div>

      {/* Spacer so content doesn't sit under fixed header */}
      <div style={{ height: 64 }} />
    </>
  )
}
