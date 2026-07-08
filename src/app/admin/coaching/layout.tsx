"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { fetchAuthSession, signOut } from "aws-amplify/auth"

const gold = "#c9a96e"
const border = "#2a2a2a"
const dark = "#111"
const bg = "#0a0a0a"
const cream = "#f0e6d3"
const muted = "#888"

function IconHome({ active }: { active: boolean }) {
  const c = active ? gold : muted
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z" />
    </svg>
  )
}
function IconClients({ active }: { active: boolean }) {
  const c = active ? gold : muted
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3.5-7 7-7s7 3 7 7" /><circle cx="17" cy="9" r="3" /><path d="M15 21c0-3 2-5 5-5" />
    </svg>
  )
}
function IconCheckIn({ active }: { active: boolean }) {
  const c = active ? gold : muted
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M4 11h16M9 15l2 2 4-4" />
    </svg>
  )
}
function IconMessages({ active, count }: { active: boolean; count: number }) {
  const c = active ? gold : muted
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h16a1 1 0 011 1v11a1 1 0 01-1 1H8l-4 4V6a1 1 0 011-1z" />
      </svg>
      {count > 0 && (
        <span style={{ position: "absolute", top: -4, right: -6, background: "#c14646", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 8, minWidth: 14, textAlign: "center", lineHeight: 1.4 }}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </div>
  )
}
function IconMore({ active }: { active: boolean }) {
  const c = active ? gold : muted
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  )
}
function IconBack() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cream} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  )
}
function IconClose() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={cream} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

const bottomNav = [
  { href: "/admin/coaching", label: "Home", icon: IconHome, matchExact: true },
  { href: "/admin/coaching/clients", label: "Clients", icon: IconClients },
  { href: "/admin/coaching/check-ins", label: "Check-ins", icon: IconCheckIn },
  { href: "/admin/coaching/messages", label: "Messages", icon: IconMessages },
] as const

const drawerLinks = [
  { section: "Coaching", items: [
    { href: "/admin/coaching/applications", label: "Applications" },
    { href: "/admin/coaching/programs", label: "Programs" },
    { href: "/admin/coaching/workouts", label: "Workout Library" },
    { href: "/admin/coaching/exercises", label: "Exercise Library" },
    { href: "/admin/coaching/tasks", label: "Tasks" },
    { href: "/admin/coaching/settings", label: "Coaching Settings" },
  ]},
  { section: "Admin", items: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/customers", label: "Customers" },
    { href: "/admin/masterclass", label: "Masterclass" },
    { href: "/admin/videos", label: "Videos" },
    { href: "/admin/photos", label: "Photos" },
    { href: "/admin/design", label: "Design" },
    { href: "/admin/blog", label: "Blog" },
    { href: "/admin/promo-codes", label: "Promo Codes" },
    { href: "/admin/leads", label: "Leads" },
  ]},
]

function pageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length <= 2) return "Coaching"
  const last = segments[segments.length - 1]
  const parent = segments[segments.length - 2]
  const titleMap: Record<string, string> = {
    clients: "Clients",
    "check-ins": "Check-ins",
    messages: "Messages",
    applications: "Applications",
    programs: "Programs",
    workouts: "Workouts",
    exercises: "Exercises",
    tasks: "Tasks",
    settings: "Settings",
    new: parent === "clients" ? "Add Client" : parent === "programs" ? "New Program" : "New",
    program: "Program",
    progress: "Progress",
    notes: "Notes",
  }
  return titleMap[last] || titleMap[parent] || "Coaching"
}

export default function CoachingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activity, setActivity] = useState<{ pendingCheckIns: number; unreadMessages: number }>({ pendingCheckIns: 0, unreadMessages: 0 })

  // Show back button whenever we're deeper than the top-level sections
  const topSections = new Set(bottomNav.map((n) => n.href))
  const showBack = !topSections.has(pathname)
  const title = pageTitle(pathname)

  const loadActivity = useCallback(async () => {
    try {
      const session = await fetchAuthSession()
      const token = session.tokens?.accessToken?.toString()
      if (!token) return
      const res = await fetch("/api/admin/coaching/clients-activity", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json() as { activity: Array<{ pendingCheckIns: number; unreadMessageCount: number }> }
      const pendingCheckIns = data.activity.reduce((s, r) => s + r.pendingCheckIns, 0)
      const unreadMessages = data.activity.reduce((s, r) => s + r.unreadMessageCount, 0)
      setActivity({ pendingCheckIns, unreadMessages })
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { loadActivity() }, [loadActivity])

  async function handleSignOut() {
    await signOut()
    router.push("/admin/login")
  }

  return (
    <>
      <style>{`
        /* On mobile, hide the parent admin header (rendered by /admin/layout.tsx) — this coaching layout provides its own top+bottom nav */
        @media (max-width: 768px) {
          [data-parent="admin-shell"] header { display: none !important; }
          [data-parent="admin-shell"] main { padding: 0 !important; max-width: none !important; }
        }
        /* Horizontal-scroll strip helper */
        .h-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex-wrap: nowrap !important; }
        .h-scroll::-webkit-scrollbar { display: none; }
        /* Mobile shell scroll container */
        .coaching-mobile-scroll {
          padding: 1rem 1rem calc(80px + env(safe-area-inset-bottom));
        }
        @media (min-width: 769px) {
          .coaching-mobile-topbar, .coaching-mobile-bottomnav { display: none !important; }
          .coaching-mobile-scroll { padding: 0 !important; }
        }
      `}</style>

      {/* Mobile top bar */}
      <div
        className="coaching-mobile-topbar"
        style={{
          position: "sticky", top: 0, zIndex: 90,
          background: dark, borderBottom: `1px solid ${border}`,
          padding: "0 12px", height: 52,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        {showBack ? (
          <button
            onClick={() => router.back()}
            aria-label="Back"
            style={{ background: "none", border: "none", padding: 6, cursor: "pointer", display: "flex", alignItems: "center" }}
          >
            <IconBack />
          </button>
        ) : (
          <span style={{ width: 34 }} />
        )}
        <span style={{
          fontFamily: "var(--font-cormorant), serif", fontSize: "1.15rem", color: cream,
          letterSpacing: "0.04em", fontWeight: 500,
        }}>
          {title}
        </span>
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="More"
          style={{ background: "none", border: "none", padding: 6, cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <IconMore active={false} />
        </button>
      </div>

      {/* Main content (mobile-scoped padding) */}
      <div className="coaching-mobile-scroll">
        {children}
      </div>

      {/* Bottom nav (mobile only) */}
      <nav
        className="coaching-mobile-bottomnav"
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 90,
          background: dark, borderTop: `1px solid ${border}`,
          display: "flex", justifyContent: "space-around",
          padding: `8px 4px calc(8px + env(safe-area-inset-bottom))`,
        }}
      >
        {bottomNav.map((item) => {
          const active = item.matchExact ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          const count = item.href.endsWith("/messages") ? activity.unreadMessages : item.href.endsWith("/check-ins") ? activity.pendingCheckIns : 0
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1, textDecoration: "none", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3, color: active ? gold : muted,
                fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem",
                fontWeight: active ? 700 : 500, letterSpacing: "0.08em",
              }}
            >
              {item.href.endsWith("/messages") ? (
                <IconMessages active={active} count={count} />
              ) : item.href.endsWith("/check-ins") ? (
                <div style={{ position: "relative", display: "inline-flex" }}>
                  <Icon active={active} />
                  {count > 0 && (
                    <span style={{ position: "absolute", top: -4, right: -6, background: gold, color: "#0a0a0a", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 8, minWidth: 14, textAlign: "center", lineHeight: 1.4 }}>
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </div>
              ) : (
                <Icon active={active} />
              )}
              <span style={{ textTransform: "uppercase" }}>{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            color: muted, fontFamily: "var(--font-montserrat), sans-serif",
            fontSize: "0.55rem", fontWeight: 500, letterSpacing: "0.08em",
            textTransform: "uppercase", padding: 0,
          }}
        >
          <IconMore active={false} />
          <span>More</span>
        </button>
      </nav>

      {/* Drawer */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200,
            display: "flex", justifyContent: "flex-end",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(320px, 85vw)", height: "100%", background: bg,
              borderLeft: `1px solid ${border}`, overflowY: "auto",
              padding: "1rem 1.25rem calc(1rem + env(safe-area-inset-bottom))",
              display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.15rem", color: gold, letterSpacing: "0.04em" }}>
                LFM Admin
              </span>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
                <IconClose />
              </button>
            </div>

            {drawerLinks.map((section) => (
              <div key={section.section} style={{ marginBottom: "1.5rem" }}>
                <p style={{
                  fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.55rem",
                  fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
                  color: muted, margin: "0 0 10px",
                }}>
                  {section.section}
                </p>
                {section.items.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setDrawerOpen(false)}
                    style={{
                      display: "block", padding: "10px 4px",
                      fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.85rem",
                      color: cream, textDecoration: "none",
                      borderBottom: `1px solid ${border}`,
                    }}
                  >
                    {it.label}
                  </Link>
                ))}
              </div>
            ))}

            <button
              onClick={handleSignOut}
              style={{
                marginTop: "auto", background: "none", border: `1px solid ${border}`,
                color: "#c14646", padding: "10px 14px",
                fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem",
                fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </>
  )
}
