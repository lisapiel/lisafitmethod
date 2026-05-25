"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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

// ─── Anchors tracked for scroll-based active state ────────────────────────────

const MODULE3_ANCHORS = [
  "daya-warmup", "daya-tracker", "daya-cooldown",
  "dayb-warmup", "dayb-tracker", "dayb-cooldown",
  "dayc-warmup", "dayc-tracker", "dayc-cooldown",
  "w34",
]

// ─── Nav data ─────────────────────────────────────────────────────────────────

const nav: NavSection[] = [
  {
    label: "Introduction",
    items: [{ href: "/training-foundations", label: "Why this guide exists" }],
  },
  {
    label: "Module 1: Foundation Movements",
    items: [
      { href: "/training-foundations/module1", label: "E1: Hip Hinge" },
      { href: "/training-foundations/module1#e2", label: "E2: Squat Pattern" },
      { href: "/training-foundations/module1#e3", label: "E3: Push Pattern" },
      { href: "/training-foundations/module1#e4", label: "E4: Pull Pattern" },
      { href: "/training-foundations/module1#e5", label: "E5: Brace & Carry" },
    ],
  },
  {
    label: "Module 2: Core & Glute Priority",
    items: [
      { href: "/training-foundations/module2", label: "E1: Dead Bug" },
      { href: "/training-foundations/module2#e2", label: "E2: Bird Dog" },
      { href: "/training-foundations/module2#e3", label: "E3: Glute Bridge" },
      { href: "/training-foundations/module2#e4", label: "E4: Glute Medius" },
      { href: "/training-foundations/module2#e5", label: "E5: Hip Thrust" },
      { href: "/training-foundations/module2#e6", label: "E6: Romanian Deadlift" },
      { href: "/training-foundations/module2#e7", label: "E7: Pallof Press" },
      { href: "/training-foundations/module2#e8", label: "E8: Farmer's Carry" },
    ],
  },
  {
    label: "Module 3: The Program",
    items: [
      {
        href: "/training-foundations/module3",
        label: "Day A: Lower Body",
        dayKey: "a",
        subsections: [
          { href: "/training-foundations/module3#daya-warmup",   label: "Warm-Up",     anchor: "daya-warmup" },
          { href: "/training-foundations/module3#daya-tracker",  label: "Main Workout", anchor: "daya-tracker" },
          { href: "/training-foundations/module3#daya-cooldown", label: "Cool-Down",   anchor: "daya-cooldown" },
        ],
      },
      {
        href: "/training-foundations/module3#dayb",
        label: "Day B: Upper Body",
        dayKey: "b",
        subsections: [
          { href: "/training-foundations/module3#dayb-warmup",   label: "Warm-Up",     anchor: "dayb-warmup" },
          { href: "/training-foundations/module3#dayb-tracker",  label: "Main Workout", anchor: "dayb-tracker" },
          { href: "/training-foundations/module3#dayb-cooldown", label: "Cool-Down",   anchor: "dayb-cooldown" },
        ],
      },
      {
        href: "/training-foundations/module3#dayc",
        label: "Day C: Integration",
        dayKey: "c",
        subsections: [
          { href: "/training-foundations/module3#dayc-warmup",   label: "Warm-Up",     anchor: "dayc-warmup" },
          { href: "/training-foundations/module3#dayc-tracker",  label: "Main Workout", anchor: "dayc-tracker" },
          { href: "/training-foundations/module3#dayc-cooldown", label: "Cool-Down",   anchor: "dayc-cooldown" },
        ],
      },
      { href: "/training-foundations/module3#w34", label: "Weeks 3 & 4" },
    ],
  },
  {
    label: "Module 4: Nutrition",
    items: [{ href: "/training-foundations/module4", label: "5 Nutrition Principles" }],
  },
  {
    label: "What's Next",
    items: [
      { href: "/training-foundations/module4#next", label: "Your next steps" },
      { href: "/training-foundations/log", label: "Weekly Log" },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function baseMatch(pathname: string, href: string) {
  return pathname === href.split("#")[0]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CourseSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const { ready, currentPosition, getSessionFor } = useCourseProgress()

  // Which top-level accordion is open
  const currentSectionIdx = nav.findIndex((s) =>
    s.items.some((item) => baseMatch(pathname, item.href))
  )
  const [openSection, setOpenSection] = useState<number | null>(() =>
    currentSectionIdx >= 0 ? currentSectionIdx : null
  )

  // Which day items within Module 3 have subsections expanded
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => new Set())

  // Scroll-tracked active anchor (module3 only)
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null)
  const rafRef = useRef<number | undefined>(undefined)

  const updateActive = useCallback(() => {
    const threshold = window.innerHeight * 0.45
    let found: string | null = null
    for (const id of MODULE3_ANCHORS) {
      const el = document.getElementById(id)
      if (el && el.getBoundingClientRect().top <= threshold) found = id
    }
    setActiveAnchor(found)
  }, [])

  // Attach/detach scroll listener when on module3 page
  useEffect(() => {
    if (pathname !== "/training-foundations/module3") {
      setActiveAnchor(null)
      return
    }
    function onScroll() {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateActive)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    updateActive()
    return () => {
      window.removeEventListener("scroll", onScroll)
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
  }, [pathname, updateActive])

  // Auto-expand the day whose subsection is active
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

  function toggleSection(i: number) {
    setOpenSection((prev) => (prev === i ? null : i))
  }

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
  const dim = "#888888"

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
          .sb-item { transition: color 0.15s; }
          .sb-item:hover { color: #c9a96e !important; }
          .sb-sub { transition: color 0.15s; }
          .sb-sub:hover { color: #c9a96e !important; }
        `}</style>

        {/* My Progress pill */}
        <div style={{ flexShrink: 0, padding: "1rem 1.25rem 0.75rem" }}>
          <Link
            href="/training-foundations/tracker"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.6rem 0.75rem",
              background: pathname === "/training-foundations/tracker" ? "rgba(201,169,110,0.12)" : "rgba(201,169,110,0.06)",
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
                  onClick={() => toggleSection(i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.75rem 1.25rem",
                    cursor: "pointer",
                    userSelect: "none",
                    marginBottom: "0.1rem",
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
                </div>

                {/* Items */}
                {isOpen_ && (
                  <div style={{ marginBottom: "0.25rem" }}>
                    {section.items.map((item) => {
                      const hasSubs = !!item.subsections?.length
                      const dayExpanded = expandedDays.has(item.href)

                      // Active state: for items with subsections, use scroll anchor; otherwise use pathname
                      const subsActive = hasSubs && item.subsections!.some((s) => s.anchor === activeAnchor)
                      const pathActive = !hasSubs && baseMatch(pathname, item.href)
                      const itemActive = hasSubs ? subsActive : pathActive

                      const dayDone = ready && item.dayKey
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
                              background: itemActive ? "rgba(201,169,110,0.05)" : "transparent",
                              transition: "background 0.15s, border-color 0.15s",
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
                              }}
                            >
                              {item.label}
                            </Link>

                            {/* Done dot for non-expandable items */}
                            {dayDone && !hasSubs && (
                              <span style={{ color: gold, fontSize: "0.45rem", paddingRight: "1rem", flexShrink: 0 }}>●</span>
                            )}

                            {/* Expand arrow for day items with subsections */}
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
                                  transition: "color 0.15s",
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
                                      fontFamily: "var(--font-montserrat), sans-serif",
                                      letterSpacing: "0.03em",
                                      transition: "color 0.15s, border-color 0.15s",
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
                  <div style={{ height: 1, background: "#2a2a2a", margin: "0.5rem 1.25rem 0.5rem", opacity: 0.35 }} />
                )}
              </div>
            )
          })}
        </div>
      </nav>
    </>
  )
}
