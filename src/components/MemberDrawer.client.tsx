"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { signOut } from "aws-amplify/auth"

// Customer-facing product IDs shown in the My Products section. Masterclass
// is intentionally omitted from this catalog until it's ready to promote —
// existing Masterclass code, routes, and entitlement records are untouched.
type ProductId = "training" | "nutrition" | "tracker" | "coaching"

interface AccessState {
  email: string | null
  isAdmin: boolean
  // True ownership only — no admin bypass. Drives Active vs. Available-to-add.
  // Sourced from /api/member/access `owns` object.
  owns: {
    training: boolean
    nutrition: boolean
    tracker: boolean
    coaching: boolean
  }
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

// Product catalog. `portalHref` = where the user goes when they own it.
// `salesHref` = existing public sales/info page for buyers to learn more +
// purchase — we intentionally reuse existing sales pages rather than build
// new landing surfaces. `offerEligibleForCoachingClient` marks products that
// can display the "Coaching client offer" badge when the viewer has active
// coaching. The badge is visual only in this task — the actual promotional
// price is set on the individual sales page.
const PRODUCTS: Array<{
  id: ProductId
  label: string
  description: string
  portalHref: string
  salesHref: string
  offerEligibleForCoachingClient?: boolean
}> = [
  {
    id: "training",
    label: "Training Foundations",
    description: "4-week beginner strength program.",
    portalHref: "/training-foundations",
    salesHref: "/courses#training",
    offerEligibleForCoachingClient: true,
  },
  {
    id: "nutrition",
    label: "Nutrition Foundations",
    description: "Complete self-guided nutrition course.",
    portalHref: "/nutrition-foundations",
    salesHref: "/nutrition",
    offerEligibleForCoachingClient: true,
  },
  {
    id: "tracker",
    label: "Progress Tracker",
    description: "Build any program, log every lift.",
    portalHref: "/my-tracker",
    salesHref: "/tracker-checkout",
    offerEligibleForCoachingClient: true,
  },
  {
    id: "coaching",
    label: "1:1 Coaching",
    description: "Personalized program, weekly check-ins, direct messaging.",
    portalHref: "/my-coaching",
    salesHref: "/coaching",
  },
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
          isAdmin: !!d.isAdmin,
          owns: {
            training: !!d.owns?.training,
            nutrition: !!d.owns?.nutrition,
            tracker: !!d.owns?.tracker,
            coaching: !!d.owns?.coaching,
          },
        })
      )
      .catch(() =>
        setAccess({
          email: null,
          isAdmin: false,
          owns: { training: false, nutrition: false, tracker: false, coaching: false },
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
  const activeProducts = access ? PRODUCTS.filter((p) => access.owns[p.id]) : []
  const availableProducts = access ? PRODUCTS.filter((p) => !access.owns[p.id]) : []
  // A coaching client viewing an unowned product gets a subtle offer badge on
  // the products that support it. Badge only — the actual promotional price
  // is set on each product's sales page.
  const showCoachingOffer = access?.owns.coaching === true

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
        .lfm-drawer-subgroup-label {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.52rem;
          font-weight: 600;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: rgba(240, 230, 211, 0.32);
          margin: 4px 0 2px;
        }
        /* My Products rows. Active variant reads as "already yours" (cream
           label, gold "Open →"). Available variant is dimmer, with a short
           description under the label + a subtle "Add →" so it never masquerades
           as owned. */
        .lfm-drawer-product {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          text-decoration: none;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .lfm-drawer-product-name {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          color: rgba(240, 230, 211, 0.85);
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .lfm-drawer-product-desc {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.7rem;
          font-weight: 400;
          color: rgba(240, 230, 211, 0.4);
          line-height: 1.4;
        }
        .lfm-drawer-product-action {
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.62rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #c8a97e;
          flex-shrink: 0;
          padding-top: 4px;
          white-space: nowrap;
        }
        .lfm-drawer-product--current .lfm-drawer-product-name { color: #c8a97e; }
        .lfm-drawer-product--available .lfm-drawer-product-name {
          color: rgba(240, 230, 211, 0.6);
          font-weight: 400;
        }
        .lfm-drawer-product-action--available {
          color: rgba(200, 169, 126, 0.55);
          font-weight: 500;
        }
        .lfm-drawer-product:hover { background: rgba(255,255,255,0.02); }
        .lfm-drawer-product:hover .lfm-drawer-product-name { color: #c8a97e; }
        .lfm-drawer-product:hover .lfm-drawer-product-action { color: #e8c98a; }
        /* Coaching-client offer chip — small, understated, not a sales popup. */
        .lfm-drawer-offer-badge {
          display: inline-block;
          font-family: var(--font-dm-sans), sans-serif;
          font-size: 0.53rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0a0a0a;
          background: rgba(200, 169, 126, 0.9);
          padding: 2px 8px;
          border-radius: 999px;
          margin-top: 4px;
          align-self: flex-start;
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

              {(activeProducts.length > 0 || availableProducts.length > 0) && (
                <div className="lfm-drawer-section">
                  <p className="lfm-drawer-section-label">My Products</p>

                  {activeProducts.length > 0 && (
                    <>
                      <p className="lfm-drawer-subgroup-label">Active</p>
                      {activeProducts.map((p) => (
                        <Link
                          key={p.id}
                          href={p.portalHref}
                          className={`lfm-drawer-product${isActive(p.portalHref) ? " lfm-drawer-product--current" : ""}`}
                          onClick={onClose}
                        >
                          <span className="lfm-drawer-product-name">{p.label}</span>
                          <span className="lfm-drawer-product-action">Open →</span>
                        </Link>
                      ))}
                    </>
                  )}

                  {availableProducts.length > 0 && (
                    <>
                      <p
                        className="lfm-drawer-subgroup-label"
                        style={{ marginTop: activeProducts.length > 0 ? 18 : 0 }}
                      >
                        Available to add
                      </p>
                      {availableProducts.map((p) => {
                        const showOffer = showCoachingOffer && p.offerEligibleForCoachingClient
                        return (
                          <Link
                            key={p.id}
                            href={p.salesHref}
                            className="lfm-drawer-product lfm-drawer-product--available"
                            onClick={onClose}
                          >
                            <span className="lfm-drawer-product-name">
                              {p.label}
                              {showOffer && (
                                <span className="lfm-drawer-offer-badge">Coaching client offer</span>
                              )}
                              <span className="lfm-drawer-product-desc">{p.description}</span>
                            </span>
                            <span className="lfm-drawer-product-action lfm-drawer-product-action--available">Add →</span>
                          </Link>
                        )
                      })}
                    </>
                  )}
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
