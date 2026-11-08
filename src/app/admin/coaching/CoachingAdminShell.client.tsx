"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { signOut } from "aws-amplify/auth"
import type { CoachingOverview } from "@/lib/coachingOverview"
import { useAdminFetch } from "@/components/coaching/admin/useAdminFetch"
import { OVERVIEW_PATH, isNativeScreen } from "@/components/coaching/admin/paths"
import "./coachingAdmin.css"

const icon = (d: React.ReactNode) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
)
const ICONS = {
  today: icon(<path d="M3 11l9-8 9 8v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z" />),
  clients: icon(<><circle cx="9" cy="8" r="4" /><path d="M2 21c0-4 3.5-7 7-7s7 3 7 7" /><circle cx="17" cy="9" r="3" /><path d="M15 21c0-3 2-5 5-5" /></>),
  checkins: icon(<><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M4 11h16M9 15l2 2 4-4" /></>),
  messages: icon(<path d="M4 5h16a1 1 0 011 1v11a1 1 0 01-1 1H8l-4 4V6a1 1 0 011-1z" />),
  more: icon(<path d="M4 7h16M4 12h16M4 17h16" />),
  back: icon(<path d="M15 6l-6 6 6 6" />),
  close: icon(<path d="M6 6l12 12M18 6L6 18" />),
}

type NavItem = { href: string; label: string; icon: React.ReactNode; exact?: boolean; badge?: "reply" | "checkins" }
const primaryNav: NavItem[] = [
  { href: "/admin/coaching", label: "Today", icon: ICONS.today, exact: true },
  { href: "/admin/coaching/clients", label: "Clients", icon: ICONS.clients },
  { href: "/admin/coaching/check-ins", label: "Check-ins", icon: ICONS.checkins, badge: "checkins" },
  { href: "/admin/coaching/messages", label: "Messages", icon: ICONS.messages, badge: "reply" },
]

const libraryNav = [
  { href: "/admin/coaching/programs", label: "Programs" },
  { href: "/admin/coaching/workouts", label: "Workouts" },
  { href: "/admin/coaching/exercises", label: "Exercises" },
  { href: "/admin/coaching/warmups", label: "Warm-ups" },
  { href: "/admin/coaching/applications", label: "Applications" },
  { href: "/admin/coaching/tasks", label: "Tasks" },
]

const drawerLinks = [
  { section: "Coaching", items: [
    { href: "/admin/coaching/applications", label: "Applications" },
    { href: "/admin/coaching/programs", label: "Programs" },
    { href: "/admin/coaching/warmups", label: "Warm-up Review" },
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
  if (pathname === "/admin/coaching") return "Today"
  const segments = pathname.split("/").filter(Boolean)
  const last = segments[segments.length - 1]
  const parent = segments[segments.length - 2]
  if (parent === "clients" && last !== "new") return "Client"
  const titleMap: Record<string, string> = {
    clients: "Clients", "check-ins": "Check-ins", messages: "Messages", applications: "Applications", programs: "Programs",
    workouts: "Workouts", exercises: "Exercises", tasks: "Tasks", settings: "Settings", warmups: "Warm-ups",
    new: parent === "clients" ? "Add Client" : parent === "programs" ? "New Program" : "New",
    program: "Program", progress: "Progress", notes: "Notes", nutrition: "Nutrition",
  }
  return titleMap[last] || titleMap[parent] || "Coaching"
}

function parentPath(pathname: string) {
  const segs = pathname.split("/").filter(Boolean)
  if (segs.length <= 3) return "/admin/coaching"
  if (segs[2] === "clients" && segs.length === 4) return "/admin/coaching/clients"
  return "/" + segs.slice(0, -1).join("/")
}

function isActive(item: { href: string; exact?: boolean }, pathname: string) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")
}

export default function CoachingAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { data } = useAdminFetch<CoachingOverview>(OVERVIEW_PATH)
  const badge = (b?: NavItem["badge"]) => (!data || !b ? 0 : b === "reply" ? data.counts.needsReply : data.counts.pendingCheckIns)

  const isTop = primaryNav.some((n) => n.href === pathname)
  const native = isNativeScreen(pathname)
  const title = pageTitle(pathname)

  useEffect(() => { setDrawerOpen(false) }, [pathname])
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [drawerOpen])

  function goBack() {
    if (window.history.length > 1) router.back()
    else router.push(parentPath(pathname))
  }

  async function handleSignOut() {
    await signOut()
    router.push("/admin/login")
  }

  return (
    <div className="ca">
      <style>{`
        @media (max-width: 768px) {
          [data-parent="admin-shell"] { background: #faf8f5 !important; color: #1a1a1a !important; }
          [data-parent="admin-shell"] > header { display: none !important; }
          [data-parent="admin-shell"] main { padding: 0 !important; max-width: none !important; background: #faf8f5 !important; }
          .ca-topbar, .ca-bottomnav { display: flex !important; }
          .ca-scroll { padding: 16px 16px calc(88px + env(safe-area-inset-bottom)); background: var(--ca-bg); min-height: calc(100dvh - 52px); }
          .ca-head .ca-title { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
          .ca-head .ca-sub { margin-top: 0; }
          /* Screens not yet rebuilt keep their dark styles; on phones they are
             shown light through this filter, as before. Rebuilt screens use
             real light colours and skip it. */
          .ca-legacy { filter: invert(1) hue-rotate(180deg); background: #05070a; isolation: isolate; margin: -16px; padding: 16px; min-height: calc(100dvh - 52px); }
          .ca-legacy img, .ca-legacy video, .ca-legacy iframe, .ca-legacy .no-invert { filter: invert(1) hue-rotate(180deg); }
        }
        .h-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; flex-wrap: nowrap !important; }
        .h-scroll::-webkit-scrollbar { display: none; }
        .ca-topbar { display: none; position: sticky; top: 0; z-index: 90; height: 52px; padding: 0 6px; align-items: center; justify-content: space-between; background: var(--ca-surface); border-bottom: 1px solid var(--ca-line); }
        .ca-topbar button { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; background: none; border: 0; color: var(--ca-text); cursor: pointer; border-radius: 8px; }
        .ca-topbar-title { font-family: var(--ca-serif); font-size: 1.25rem; font-weight: 500; letter-spacing: 0.02em; color: var(--ca-text); }
        .ca-bottomnav { display: none; position: fixed; left: 0; right: 0; bottom: 0; z-index: 90; background: var(--ca-surface); border-top: 1px solid var(--ca-line); padding: 4px 4px env(safe-area-inset-bottom); box-shadow: 0 -2px 12px rgba(0,0,0,0.04); }
        .ca-bottomnav a, .ca-bottomnav button { flex: 1; min-height: 56px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; text-decoration: none; background: none; border: 0; cursor: pointer; color: var(--ca-muted); font: 600 0.75rem/1 var(--ca-sans); letter-spacing: 0.02em; position: relative; -webkit-tap-highlight-color: transparent; }
        .ca-bottomnav [aria-current="page"] { color: var(--ca-text); }
        .ca-bottomnav [aria-current="page"]::before { content: ""; position: absolute; top: 0; left: 30%; right: 30%; height: 2px; border-radius: 2px; background: var(--ca-accent-mark); }
        .ca-navbadge { position: absolute; top: 6px; left: calc(50% + 6px); min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: var(--ca-accent); color: var(--ca-on-accent); font-size: 0.6875rem; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
        .ca-drawer { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; justify-content: flex-end; }
        .ca-drawer-panel { width: min(320px, 86vw); height: 100%; background: var(--ca-surface); border-left: 1px solid var(--ca-line); overflow-y: auto; padding: 12px 20px calc(16px + env(safe-area-inset-bottom)); display: flex; flex-direction: column; }
        .ca-drawer-panel a { display: flex; align-items: center; min-height: 48px; font-size: 1rem; color: var(--ca-text); text-decoration: none; border-bottom: 1px solid var(--ca-line-soft); }
      `}</style>

      <div className="ca-topbar">
        {isTop ? <span style={{ width: 44 }} /> : <button type="button" onClick={goBack} aria-label="Back">{ICONS.back}</button>}
        <span className="ca-topbar-title">{title}</span>
        <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open menu" aria-expanded={drawerOpen}>{ICONS.more}</button>
      </div>

      <div className="ca-scroll">
        <nav className="ca-desknav" aria-label="Coaching">
          {primaryNav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n, pathname) ? "page" : undefined}>
              {n.label}{badge(n.badge) > 0 && <span className="ca-badge" style={{ height: 20, minWidth: 20, fontSize: "0.6875rem" }}>{badge(n.badge)}</span>}
            </Link>
          ))}
          <span className="ca-spacer" />
          {libraryNav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n, pathname) ? "page" : undefined}>{n.label}</Link>
          ))}
        </nav>
        {native ? children : <div className="ca-legacy">{children}</div>}
      </div>

      <nav className="ca-bottomnav" aria-label="Coaching">
        {primaryNav.map((n) => {
          const count = badge(n.badge)
          return (
            <Link key={n.href} href={n.href} aria-current={isActive(n, pathname) ? "page" : undefined}>
              {n.icon}
              <span>{n.label}</span>
              {count > 0 && <span className="ca-navbadge" aria-label={`${count} waiting`}>{count > 9 ? "9+" : count}</span>}
            </Link>
          )
        })}
        <button type="button" onClick={() => setDrawerOpen(true)} aria-expanded={drawerOpen}>{ICONS.more}<span>More</span></button>
      </nav>

      {drawerOpen && (
        <div className="ca-drawer" onClick={() => setDrawerOpen(false)}>
          <div className="ca-drawer-panel" role="dialog" aria-modal="true" aria-label="Menu" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 48, marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--ca-serif)", fontSize: "1.25rem", color: "var(--ca-text)" }}>LFM Admin</span>
              <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close menu" style={{ width: 44, height: 44, background: "none", border: 0, color: "var(--ca-text)", cursor: "pointer" }}>{ICONS.close}</button>
            </div>
            {drawerLinks.map((section) => (
              <div key={section.section} style={{ marginBottom: 20 }}>
                <p className="ca-label" style={{ margin: "0 0 4px" }}>{section.section}</p>
                {section.items.map((it) => <Link key={it.href} href={it.href}>{it.label}</Link>)}
              </div>
            ))}
            <button type="button" onClick={handleSignOut} className="ca-btn" style={{ marginTop: "auto", color: "var(--ca-danger)" }}>Sign out</button>
          </div>
        </div>
      )}
    </div>
  )
}
