"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"

const HIDDEN_PREFIXES = ["/admin", "/training-foundations"]

export default function SiteHeader() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [coursesOpen, setCoursesOpen] = useState(false)
  const coursesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!coursesOpen) return
    const handleClick = (e: MouseEvent) => {
      if (coursesRef.current && !coursesRef.current.contains(e.target as Node)) {
        setCoursesOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [coursesOpen])

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  const navLinks = [
    { href: "/about", label: "About" },
    { href: "/courses", label: "Courses" },
    { href: "/coaching", label: "Coaching" },
    { href: "/blog", label: "Blog" },
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
          padding: 4px;
          flex-direction: column;
          gap: 5px;
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
        .nav-courses-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .nav-courses-btn {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(240, 230, 211, 0.65);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
          line-height: 1;
        }
        .nav-courses-btn:hover, .nav-courses-btn.open { color: #c8a97e; }
        .nav-courses-dropdown {
          position: absolute;
          top: 100%;
          left: -16px;
          margin-top: 16px;
          background: rgba(10, 10, 10, 0.98);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 6px 0;
          min-width: 220px;
          z-index: 200;
        }
        .nav-courses-dropdown a {
          display: block;
          padding: 10px 18px;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(240, 230, 211, 0.7) !important;
          text-decoration: none;
          white-space: nowrap;
          font-family: var(--font-dm-sans), sans-serif;
          font-weight: 500;
          transition: color 0.2s, background 0.15s;
        }
        .nav-courses-dropdown a:hover { color: #c8a97e !important; background: rgba(200,169,126,0.06); }
        .nav-free-badge {
          margin-left: 8px;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: #c8a97e;
          border: 1px solid rgba(200,169,126,0.35);
          padding: 2px 6px;
          vertical-align: middle;
          text-transform: uppercase;
        }
        .mobile-sub-link {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(240, 230, 211, 0.4);
          text-decoration: none;
          display: block;
          padding-left: 14px;
          border-left: 1px solid rgba(255,255,255,0.08);
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
          {navLinks.map((l) => {
            if (l.href === "/courses") {
              return (
                <div key={l.href} ref={coursesRef} className="nav-courses-wrap">
                  <button
                    className={`nav-courses-btn${coursesOpen ? " open" : ""}`}
                    onClick={() => setCoursesOpen((o) => !o)}
                    aria-expanded={coursesOpen}
                  >
                    Courses
                  </button>
                  {coursesOpen && (
                    <div className="nav-courses-dropdown">
                      <Link href="/courses" onClick={() => setCoursesOpen(false)}>
                        Courses &amp; Programs
                      </Link>
                      <Link href="/free-guide" onClick={() => setCoursesOpen(false)}>
                        Free Foundation Guide <span className="nav-free-badge">Free</span>
                      </Link>
                    </div>
                  )}
                </div>
              )
            }
            return <Link key={l.href} href={l.href}>{l.label}</Link>
          })}
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
        {navLinks.map((l) => {
          if (l.href === "/courses") {
            return (
              <div key={l.href} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Link href="/courses" onClick={() => setMenuOpen(false)}>Courses</Link>
                <Link href="/free-guide" className="mobile-sub-link" onClick={() => setMenuOpen(false)}>
                  Free Foundation Guide
                </Link>
              </div>
            )
          }
          return <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</Link>
        })}
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
