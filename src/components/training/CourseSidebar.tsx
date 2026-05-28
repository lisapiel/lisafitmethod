"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useRef, useCallback } from "react"
import { useCourseProgress } from "./CourseProgressContext"

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavSubsection {
  href: string
  label: string
  anchor: string
}

interface NavItem {
  href: string
  label: string
  dayKey?: "a" | "b" | "c"
  subsections?: NavSubsection[]
}

interface NavSection {
  label: string
  items: NavItem[]
}

// ─── Nav data ─────────────────────────────────────────────────────────────────

const nav: NavSection[] = [
  {
    label: "Introduction",
    items: [{ href: "/training-foundations", label: "Why this guide exists" }],
  },
  {
    label: "Module 1: Foundation Movements",
    items: [
      { href: "/training-foundations/module1",     label: "E1: Hip Hinge" },
      { href: "/training-foundations/module1#e2",  label: "E2: Squat Pattern" },
      { href: "/training-foundations/module1#e3",  label: "E3: Push Pattern" },
      { href: "/training-foundations/module1#e4",  label: "E4: Pull Pattern" },
      { href: "/training-foundations/module1#e5",  label: "E5: Brace & Carry" },
    ],
  },
  {
    label: "Module 2: Core & Glute Priority",
    items: [
      { href: "/training-foundations/module2",     label: "E1: Dead Bug" },
      { href: "/training-foundations/module2#e2",  label: "E2: Bird Dog" },
      { href: "/training-foundations/module2#e3",  label: "E3: Glute Bridge" },
      { href: "/training-foundations/module2#e4",  label: "E4: Glute Medius" },
      { href: "/training-foundations/module2#e5",  label: "E5: Hip Thrust" },
      { href: "/training-foundations/module2#e6",  label: "E6: Romanian Deadlift" },
      { href: "/training-foundations/module2#e7",  label: "E7: Pallof Press" },
      { href: "/training-foundations/module2#e8",  label: "E8: Farmer's Carry" },
    ],
  },
  {
    label: "Module 3: The Program",
    items: [
      {
        href: "/training-foundations/module3#daya",
        label: "Day A: Lower Body",
        dayKey: "a",
        subsections: [
          { href: "/training-foundations/module3#daya-warmup",   label: "Warm-Up",      anchor: "daya-warmup" },
          { href: "/training-foundations/module3#daya-tracker",  label: "Main Workout", anchor: "daya-tracker" },
          { href: "/training-foundations/module3#daya-cooldown", label: "Cool-Down",    anchor: "daya-cooldown" },
        ],
      },
      {
        href: "/training-foundations/module3#dayb",
        label: "Day B: Upper Body",
        dayKey: "b",
        subsections: [
          { href: "/training-foundations/module3#dayb-warmup",   label: "Warm-Up",      anchor: "dayb-warmup" },
          { href: "/training-foundations/module3#dayb-tracker",  label: "Main Workout", anchor: "dayb-tracker" },
          { href: "/training-foundations/module3#dayb-cooldown", label: "Cool-Down",    anchor: "dayb-cooldown" },
        ],
      },
      {
        href: "/training-foundations/module3#dayc",
        label: "Day C: Integration",
        dayKey: "c",
        subsections: [
          { href: "/training-foundations/module3#dayc-warmup",   label: "Warm-Up",      anchor: "dayc-warmup" },
          { href: "/training-foundations/module3#dayc-tracker",  label: "Main Workout", anchor: "dayc-tracker" },
          { href: "/training-foundations/module3#dayc-cooldown", label: "Cool-Down",    anchor: "dayc-cooldown" },
        ],
      },
      { href: "/training-foundations/module3#w34", label: "Weeks 3 & 4" },
    ],
  },
  {
    label: "Workout Tracker",
    items: [
      { href: "/training-foundations/module3#daya-log", label: "Track Day A: Lower Body",  dayKey: "a" },
      { href: "/training-foundations/module3#dayb-log", label: "Track Day B: Upper Body",  dayKey: "b" },
      { href: "/training-foundations/module3#dayc-log", label: "Track Day C: Integration", dayKey: "c" },
      { href: "/training-foundations/log",                  label: "Weekly Log" },
    ],
  },
  {
    label: "Module 4: Nutrition",
    items: [
      { href: "/training-foundations/module4#protein",     label: "Protein Is Your Priority" },
      { href: "/training-foundations/module4#fuel",        label: "Eat Enough To Train" },
      { href: "/training-foundations/module4#consistency", label: "Consistency Beats Perfection" },
      { href: "/training-foundations/module4#hydration",   label: "Hydration Affects Everything" },
      { href: "/training-foundations/module4#basics",      label: "Don't Complicate It" },
    ],
  },
  {
    label: "What's Next",
    items: [{ href: "/training-foundations/module4#next", label: "Your next steps" }],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function baseOf(href: string) {
  return href.split("#")[0]
}

function hashOf(href: string) {
  return href.split("#")[1] ?? null
}

// Build the ordered list of anchor IDs to track for the current pathname.
// Document order matters: we always pick the deepest anchor whose top is
// above the scroll threshold, so the list must match page order.
function getPageAnchors(pathname: string): string[] {
  const seen = new Set<string>()
  const anchors: string[] = []

  function push(id: string) {
    if (!seen.has(id)) { seen.add(id); anchors.push(id) }
  }

  for (const section of nav) {
    for (const item of section.items) {
      if (baseOf(item.href) !== pathname) continue
      if (item.subsections) {
        item.subsections.forEach((s) => push(s.anchor))
      } else {
        const h = hashOf(item.href)
        if (h) push(h)
      }
    }
  }
  return anchors
}

// Determine whether a nav item should be highlighted given the current state.
function isItemActive(item: NavItem, pathname: string, activeAnchor: string | null): boolean {
  if (baseOf(item.href) !== pathname) return false

  if (item.subsections) {
    // Day items: active when any of their subsections is the active anchor
    return item.subsections.some((s) => s.anchor === activeAnchor)
  }

  const h = hashOf(item.href)
  if (h) {
    // Hash item: active when that specific anchor is active
    return activeAnchor === h
  }

  // No-hash item (e.g. E1 which is the page root): active when no anchor
  // has been reached yet (user is near the top of the page)
  return activeAnchor === null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CourseSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { ready, currentPosition, getSessionFor } = useCourseProgress()

  // Which top-level section accordion is open
  const currentSectionIdx = nav.findIndex((s) =>
    s.items.some((item) => baseOf(item.href) === pathname)
  )
  const [openSection, setOpenSection] = useState<number | null>(() =>
    currentSectionIdx >= 0 ? currentSectionIdx : null
  )

  // Keep the open accordion in sync as the user navigates between pages
  useEffect(() => {
    setOpenSection(currentSectionIdx >= 0 ? currentSectionIdx : null)
  }, [currentSectionIdx])

  // Which Module 3 day items have their subsections expanded
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => new Set())

  // The anchor ID that is currently "in view" based on scroll position
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null)
  const rafRef = useRef<number | undefined>(undefined)

  const updateActive = useCallback((anchors: string[]) => {
    const threshold = window.innerHeight * 0.45
    let found: string | null = null
    for (const id of anchors) {
      const el = document.getElementById(id)
      if (el && el.getBoundingClientRect().top <= threshold) found = id
    }
    setActiveAnchor(found)
  }, [])

  // Attach scroll listener whenever the pathname changes.
  // The scrollable container is .course-scroll-area (not window) — must target it directly.
  useEffect(() => {
    const anchors = getPageAnchors(pathname)
    if (anchors.length === 0) {
      setActiveAnchor(null)
      return
    }

    const scrollEl: Element | Window = document.querySelector(".course-scroll-area") ?? window

    function onScroll() {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => updateActive(anchors))
    }

    scrollEl.addEventListener("scroll", onScroll, { passive: true })
    updateActive(anchors)

    return () => {
      scrollEl.removeEventListener("scroll", onScroll)
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
  }, [pathname, updateActive])

  // Auto-expand the Module 3 day whose subsection just became active
  useEffect(() => {
    if (!activeAnchor) return
    const m3 = nav.find((s) => s.label === "Module 3: The Program")
    if (!m3) return
    for (const item of m3.items) {
      if (item.subsections?.some((s) => s.anchor === activeAnchor)) {
        setExpandedDays((prev) => {
          if (prev.has(item.href)) return prev
          const next = new Set(prev)
          next.add(item.href)
          return next
        })
        break
      }
    }
  }, [activeAnchor])

  function toggleDay(href: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setExpandedDays((prev) => {
      const next = new Set(prev)
      if (next.has(href)) next.delete(href)
      else next.add(href)
      return next
    })
  }

  const gold = "#c9a96e"
  const dim  = "#888888"

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{ display: "block", position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 149 }}
        />
      )}

      <nav
        style={{
          width: 260,
          flexShrink: 0,
          background: "#111111",
          borderRight: "1px solid #2a2a2a",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.3s ease",
          position: isOpen ? "fixed" : undefined,
          top: isOpen ? 0 : undefined,
          left: isOpen ? 0 : undefined,
          bottom: isOpen ? 0 : undefined,
          zIndex: isOpen ? 150 : undefined,
          transform: isOpen ? "translateX(0)" : undefined,
        }}
        className="course-sidebar"
      >
        <style>{`
          @media (max-width: 768px) {
            .course-sidebar {
              position: fixed !important;
              top: 0; left: 0; bottom: 0;
              z-index: 150;
              transform: translateX(-100%);
              width: 280px !important;
              padding-top: 3.5rem;
            }
          }
          .sidebar-nav-scroll { overflow-y: auto; scrollbar-width: thin; }
          .sidebar-nav-scroll::-webkit-scrollbar { width: 4px; }
          .sidebar-nav-scroll::-webkit-scrollbar-thumb { background: #2a2a2a; }
          .sb-item:hover { color: #c9a96e !important; }
          .sb-sub:hover  { color: #c9a96e !important; }
        `}</style>

        {/* My Progress pill */}
        <div style={{ flexShrink: 0, padding: "0.75rem 1.25rem 0.6rem" }}>
          <Link
            href="/training-foundations/tracker"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.6rem 0.75rem",
              background: pathname === "/training-foundations/tracker"
                ? "rgba(201,169,110,0.12)"
                : "rgba(201,169,110,0.06)",
              border: "1px solid rgba(201,169,110,0.3)",
              textDecoration: "none",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.6rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: gold,
            }}
          >
            <span>My Progress</span>
            {ready && currentPosition.totalSessions > 0 && (
              <span style={{ fontSize: "0.55rem", fontWeight: 400, color: dim, letterSpacing: "0.05em", textTransform: "none" }}>
                W{currentPosition.week} · R{currentPosition.round}
              </span>
            )}
          </Link>
        </div>
        <div style={{ height: 1, background: "#2a2a2a", margin: "0 1.25rem 0.5rem", opacity: 0.4, flexShrink: 0 }} />

        {/* Scrollable nav */}
        <div className="sidebar-nav-scroll" style={{ flex: 1, padding: "0.5rem 0 1.5rem" }}>
          {nav.map((section, i) => {
            const isCurrent = i === currentSectionIdx
            const isOpen_ = openSection === i

            return (
              <div key={i}>
                {/* Section header */}
                <div
                  onClick={() => {
                    const dest = section.items.length === 1
                      ? section.items[0].href
                      : baseOf(section.items[0].href)
                    router.push(dest)
                    setOpenSection(i)
                    onClose()
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1.25rem",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: isCurrent ? gold : dim,
                      fontFamily: "var(--font-montserrat), sans-serif",
                      transition: "color 0.2s",
                    }}
                  >
                    {section.label}
                  </span>
                  {section.items.length > 1 && (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: isOpen_ ? gold : "#444",
                        transition: "transform 0.2s, color 0.2s",
                        transform: isOpen_ ? "rotate(90deg)" : "none",
                        display: "inline-block",
                        lineHeight: 1,
                        fontFamily: "sans-serif",
                      }}
                    >
                      ›
                    </span>
                  )}
                </div>

                {/* Items */}
                {isOpen_ && (
                  <div style={{ marginBottom: "0.25rem" }}>
                    {section.items.map((item) => {
                      const hasSubs    = !!item.subsections?.length
                      const dayExpanded = expandedDays.has(item.href)
                      const itemActive  = isItemActive(item, pathname, activeAnchor)
                      const dayDone     = ready && item.dayKey
                        ? !!getSessionFor(currentPosition.round, currentPosition.week, item.dayKey)
                        : false

                      return (
                        <div key={item.href}>
                          {/* Item row */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              borderLeft: itemActive ? `2px solid ${gold}` : "2px solid transparent",
                              background: itemActive ? "rgba(201,169,110,0.14)" : "transparent",
                              transition: "background 0.2s, border-color 0.2s",
                            }}
                          >
                            <Link
                              href={item.href}
                              onClick={onClose}
                              className="sb-item"
                              style={{
                                flex: 1,
                                padding: "0.45rem 0.4rem 0.45rem 2rem",
                                fontSize: "0.7rem",
                                color: itemActive ? gold : dim,
                                textDecoration: "none",
                                lineHeight: 1.4,
                                fontFamily: "var(--font-montserrat), sans-serif",
                                transition: "color 0.15s",
                              }}
                            >
                              {item.label}
                            </Link>

                            {dayDone && !hasSubs && (
                              <span style={{ color: gold, fontSize: "0.45rem", paddingRight: "1rem", flexShrink: 0 }}>●</span>
                            )}

                            {hasSubs && (
                              <button
                                onClick={(e) => toggleDay(item.href, e)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: dayExpanded ? gold : "#555",
                                  cursor: "pointer",
                                  fontSize: "0.7rem",
                                  padding: "0.45rem 0.9rem 0.45rem 0.2rem",
                                  lineHeight: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  flexShrink: 0,
                                  transition: "color 0.15s, transform 0.2s",
                                  transform: dayExpanded ? "rotate(90deg)" : "none",
                                  transformOrigin: "center",
                                  fontFamily: "sans-serif",
                                }}
                                title={dayExpanded ? "Collapse" : "Expand"}
                              >
                                ›
                              </button>
                            )}
                          </div>

                          {/* Subsections */}
                          {hasSubs && dayExpanded && (
                            <div>
                              {item.subsections!.map((sub) => {
                                const subActive = sub.anchor === activeAnchor
                                return (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    onClick={onClose}
                                    className="sb-sub"
                                    style={{
                                      display: "block",
                                      padding: "0.32rem 1.25rem 0.32rem 3rem",
                                      fontSize: "0.62rem",
                                      color: subActive ? gold : "#5a5a5a",
                                      textDecoration: "none",
                                      lineHeight: 1.4,
                                      borderLeft: subActive ? `2px solid ${gold}` : "2px solid transparent",
                                      background: subActive ? "rgba(201,169,110,0.10)" : "transparent",
                                      fontFamily: "var(--font-montserrat), sans-serif",
                                      letterSpacing: "0.03em",
                                      transition: "color 0.15s, border-color 0.15s, background 0.2s",
                                    }}
                                  >
                                    {sub.label}
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {i < nav.length - 1 && (
                  <div style={{ height: 1, background: "#2a2a2a", margin: "0.5rem 1.25rem", opacity: 0.35 }} />
                )}
              </div>
            )
          })}
        </div>
      </nav>
    </>
  )
}
