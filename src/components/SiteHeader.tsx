"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { signOut } from "aws-amplify/auth"
import AccountDropdown from "./AccountDropdown.client"

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

type ProductId = "training" | "nutrition" | "tracker" | "coaching" | "masterclass"

interface AccessState {
  email: string | null
  training: boolean
  nutrition: boolean
  tracker: boolean
  coaching: boolean
  masterclass: boolean
  isAdmin: boolean
}

const PUBLIC_NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Me" },
  { href: "/courses", label: "Courses" },
  { href: "/coaching", label: "1:1 Coaching" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
]

const EXPLORE_NAV = [
  { href: "/courses", label: "Courses" },
  { href: "/coaching", label: "1:1 Coaching" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About Me" },
  { href: "/faq", label: "FAQ" },
]

const PORTALS: Array<{ id: ProductId; label: string; href: string }> = [
  { id: "training", label: "Training Foundations", href: "/training-foundations" },
  { id: "nutrition", label: "Nutrition Foundations", href: "/nutrition-foundations" },
  { id: "tracker", label: "Progress Tracker", href: "/my-tracker" },
  { id: "masterclass", label: "Masterclass", href: "/masterclass" },
  { id: "coaching", label: "1:1 Coaching", href: "/my-coaching" },
]

export default function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [access, setAccess] = useState<AccessState | null>(null)

  useEffect(() => {
    fetch("/api/member/access")
      .then((r) => r.json())
      .then((d) =>
        setAccess({
          email: d.email ?? null,
          training: !!d.training,
          nutrition: !!d.nutrition,
          tracker: !!d.tracker,
          coaching: !!d.coaching,
          masterclass: !!d.masterclass,
          isAdmin: !!d.isAdmin,
        })
      )
      .catch(() =>
        setAccess({
          email: null,
          training: false,
          nutrition: false,
          tracker: false,
          coaching: false,
          masterclass: false,
          isAdmin: false,
        })
      )
  }, [])

  // Body scroll lock while drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [menuOpen])

  // Escape key closes drawer
  useEffect(() => {
    if (!menuOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [menuOpen])

  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null

  const close = () => setMenuOpen(false)
  const loggedIn = access?.email != null
  const ownedPortals = access ? PORTALS.filter((p) => access[p.id]) : []

  async function handleSignOut() {
    close()
    await signOut()
    router.push("/")
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href)
  }

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
        /* Mobile drawer */
        .lfm-drawer {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 200;
          background: #0a0a0a;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
          padding-top: env(safe-area-inset-top, 0px);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .lfm-drawer--open {
          transform: translateX(0);
        }
        .lfm-drawer-header {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px 0 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .lfm-drawer-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .lfm-drawer-body {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 32px 28px 48px;
          display: flex;
          flex-direction: column;
        }
        .lfm-drawer-nav {
          display: flex;
          flex-direction: column;
        }
        .lfm-drawer-link {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 1rem;
          font-weight: 500;
          color: rgba(240, 230, 211, 0.75);
          text-decoration: none;
          padding: 13px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: color 0.15s;
          display: block;
        }
        .lfm-drawer-link:hover { color: #c8a97e; }
        .lfm-drawer-link--active { color: #c8a97e; }
        .lfm-drawer-link--sm {
          font-size: 0.875rem;
          color: rgba(240, 230, 211, 0.5);
        }
        .lfm-drawer-link--sm:hover { color: rgba(240, 230, 211, 0.8); }
        .lfm-drawer-sep {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 24px 0;
        }
        .lfm-drawer-auth {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 4px;
        }
        .lfm-drawer-login-link {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(240, 230, 211, 0.5);
          text-decoration: none;
          padding: 10px 0;
          transition: color 0.15s;
          display: block;
        }
        .lfm-drawer-login-link:hover { color: rgba(240, 230, 211, 0.85); }
        .lfm-drawer-cta {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #0a0a0a;
          background: #c8a97e;
          text-decoration: none;
          padding: 16px 24px;
          text-align: center;
          display: block;
          transition: background 0.2s;
        }
        .lfm-drawer-cta:hover { background: #b8996e; }
        .lfm-drawer-identity {
          margin-bottom: 28px;
        }
        .lfm-drawer-identity-heading {
          font-family: var(--font-playfair), serif;
          font-size: 1.2rem;
          color: #f0e6d3;
          margin: 0 0 5px;
        }
        .lfm-drawer-identity-email {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem;
          color: rgba(240, 230, 211, 0.35);
          margin: 0;
          word-break: break-all;
        }
        .lfm-drawer-section {
          margin-bottom: 20px;
        }
        .lfm-drawer-section-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.57rem;
          font-weight: 600;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(200, 169, 126, 0.45);
          margin: 0 0 4px;
        }
        .lfm-drawer-signout {
          background: none;
          border: none;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(240, 230, 211, 0.28);
          cursor: pointer;
          padding: 8px 0;
          text-align: left;
          transition: color 0.15s;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .lfm-drawer-signout:hover { color: rgba(240, 230, 211, 0.6); }
        @media (max-width: 1024px) {
          .site-header { padding: 0 20px; }
          .site-header-nav { display: none; }
          .site-header-desktop-auth { display: none; }
          .site-header-hamburger { display: flex; }
          .lfm-drawer { display: flex; }
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

      {/* Mobile slide-out drawer */}
      <div
        id="lfm-mobile-drawer"
        className={`lfm-drawer${menuOpen ? " lfm-drawer--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="lfm-drawer-header">
          <Link href="/" className="site-header-wordmark" onClick={close}>
            Lisa Fit Method
          </Link>
          <button className="lfm-drawer-close" onClick={close} aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M1.5 1.5l15 15M16.5 1.5l-15 15" stroke="#f0e6d3" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="lfm-drawer-body">
          {!loggedIn ? (
            <>
              <nav className="lfm-drawer-nav" aria-label="Main navigation">
                {PUBLIC_NAV.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`lfm-drawer-link${isActive(l.href) ? " lfm-drawer-link--active" : ""}`}
                    onClick={close}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <div className="lfm-drawer-sep" />
              <div className="lfm-drawer-auth">
                <Link href="/login" className="lfm-drawer-login-link" onClick={close}>
                  Log In
                </Link>
                <Link href="/coaching#apply" className="lfm-drawer-cta" onClick={close}>
                  Apply for Coaching
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="lfm-drawer-identity">
                <p className="lfm-drawer-identity-heading">My Lisa Fit Method</p>
                <p className="lfm-drawer-identity-email">{access?.email}</p>
              </div>

              <div className="lfm-drawer-section">
                <p className="lfm-drawer-section-label">My Account</p>
                <Link
                  href="/account"
                  className={`lfm-drawer-link${isActive("/account") ? " lfm-drawer-link--active" : ""}`}
                  onClick={close}
                >
                  Account &amp; Profile
                </Link>
              </div>

              {ownedPortals.length > 0 && (
                <div className="lfm-drawer-section">
                  <p className="lfm-drawer-section-label">My Products</p>
                  {ownedPortals.map((p) => (
                    <Link
                      key={p.id}
                      href={p.href}
                      className={`lfm-drawer-link${isActive(p.href) ? " lfm-drawer-link--active" : ""}`}
                      onClick={close}
                    >
                      {p.label}
                    </Link>
                  ))}
                </div>
              )}

              <div className="lfm-drawer-section">
                <p className="lfm-drawer-section-label">Explore</p>
                {EXPLORE_NAV.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`lfm-drawer-link lfm-drawer-link--sm${isActive(l.href) ? " lfm-drawer-link--active" : ""}`}
                    onClick={close}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>

              {access?.isAdmin && (
                <div className="lfm-drawer-section">
                  <p className="lfm-drawer-section-label">Admin</p>
                  <Link
                    href="/admin"
                    className={`lfm-drawer-link${isActive("/admin") ? " lfm-drawer-link--active" : ""}`}
                    onClick={close}
                  >
                    Admin Dashboard
                  </Link>
                </div>
              )}

              <div className="lfm-drawer-sep" />
              <button className="lfm-drawer-signout" onClick={handleSignOut}>
                Log Out
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ height: 64 }} />
    </>
  )
}
