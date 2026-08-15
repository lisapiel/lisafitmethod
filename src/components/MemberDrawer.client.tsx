"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { signOut } from "aws-amplify/auth"

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

// Full-screen slide-out drawer shown from a hamburger control. Fetches its own
// access state and handles body scroll lock + Escape close. Rendered inside
// both SiteHeader (marketing pages) and CoachingClientLayout (portal pages)
// so the entire ecosystem shares one navigation surface.
export default function MemberDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
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

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const loggedIn = access?.email != null
  const ownedPortals = access ? PORTALS.filter((p) => access[p.id]) : []

  async function handleSignOut() {
    onClose()
    await signOut()
    router.push("/")
  }

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href)
  }

  return (
    <>
      <style>{`
        .lfm-drawer {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
          padding-top: env(safe-area-inset-top, 0px);
          padding-bottom: env(safe-area-inset-bottom, 0px);
          visibility: hidden;
        }
        .lfm-drawer--open { transform: translateX(0); visibility: visible; }
        .lfm-drawer-header {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .lfm-drawer-wordmark {
          font-family: var(--font-playfair), serif;
          font-size: 1.1rem;
          font-weight: 700;
          color: #f0e6d3;
          text-decoration: none;
          letter-spacing: 0.02em;
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
        .lfm-drawer-nav { display: flex; flex-direction: column; }
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
        .lfm-drawer-identity { margin-bottom: 28px; }
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
        .lfm-drawer-section { margin-bottom: 20px; }
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
      `}</style>

      <div
        id="lfm-mobile-drawer"
        className={`lfm-drawer${open ? " lfm-drawer--open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label="Navigation menu"
      >
        <div className="lfm-drawer-header">
          <Link href="/" className="lfm-drawer-wordmark" onClick={onClose}>
            Lisa Fit Method
          </Link>
          <button className="lfm-drawer-close" onClick={onClose} aria-label="Close menu">
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
                    onClick={onClose}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <div className="lfm-drawer-sep" />
              <div className="lfm-drawer-auth">
                <Link href="/login" className="lfm-drawer-login-link" onClick={onClose}>
                  Log In
                </Link>
                <Link href="/coaching#apply" className="lfm-drawer-cta" onClick={onClose}>
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
                  onClick={onClose}
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
                      onClick={onClose}
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
                    onClick={onClose}
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
                    onClick={onClose}
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
    </>
  )
}
