"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useCourseProgress } from "./CourseProgressContext"

const dayForHref: Record<string, "a" | "b" | "c"> = {
  "/training-foundations/module3": "a",
  "/training-foundations/module3#dayb": "b",
  "/training-foundations/module3#dayc": "c",
  "/training-foundations/module3#daya-tracker": "a",
  "/training-foundations/module3#dayb-tracker": "b",
  "/training-foundations/module3#dayc-tracker": "c",
}

const nav = [
  {
    label: "Introduction",
    items: [{ href: "/training-foundations", label: "Why this guide exists" }],
  },
  {
    label: "Module 1 — Foundation Movements",
    items: [
      { href: "/training-foundations/module1", label: "E1 — Hip Hinge" },
      { href: "/training-foundations/module1#e2", label: "E2 — Squat Pattern" },
      { href: "/training-foundations/module1#e3", label: "E3 — Push Pattern" },
      { href: "/training-foundations/module1#e4", label: "E4 — Pull Pattern" },
      { href: "/training-foundations/module1#e5", label: "E5 — Brace & Carry" },
    ],
  },
  {
    label: "Module 2 — Core & Glute Priority",
    items: [
      { href: "/training-foundations/module2", label: "E1 — Dead Bug" },
      { href: "/training-foundations/module2#e2", label: "E2 — Bird Dog" },
      { href: "/training-foundations/module2#e3", label: "E3 — Glute Bridge" },
      { href: "/training-foundations/module2#e4", label: "E4 — Glute Medius" },
      { href: "/training-foundations/module2#e5", label: "E5 — Hip Thrust" },
      { href: "/training-foundations/module2#e6", label: "E6 — Romanian Deadlift" },
      { href: "/training-foundations/module2#e7", label: "E7 — Pallof Press" },
      { href: "/training-foundations/module2#e8", label: "E8 — Farmer's Carry" },
    ],
  },
  {
    label: "Module 3 — The Program",
    items: [
      { href: "/training-foundations/module3", label: "Day A — Lower Body" },
      { href: "/training-foundations/module3#dayb", label: "Day B — Upper Body" },
      { href: "/training-foundations/module3#dayc", label: "Day C — Integration" },
      { href: "/training-foundations/module3#w34", label: "Weeks 3 & 4" },
    ],
  },
  {
    label: "Workout Tracker",
    items: [
      { href: "/training-foundations/module3#daya-tracker", label: "Track Day A" },
      { href: "/training-foundations/module3#dayb-tracker", label: "Track Day B" },
      { href: "/training-foundations/module3#dayc-tracker", label: "Track Day C" },
    ],
  },
  {
    label: "Module 4 — Nutrition",
    items: [{ href: "/training-foundations/module4", label: "5 Nutrition Principles" }],
  },
  {
    label: "What's Next",
    items: [{ href: "/training-foundations/module4#next", label: "Your next steps" }],
  },
]

function isActive(pathname: string, href: string) {
  const base = href.split("#")[0]
  return pathname === base
}

export default function CourseSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const { ready, currentPosition, getSessionFor } = useCourseProgress()
  const [openSections, setOpenSections] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {}
    nav.forEach((section, i) => {
      if (section.items.some((item) => isActive(pathname, item.href))) {
        initial[i] = true
      }
    })
    return initial
  })

  function toggleSection(i: number) {
    setOpenSections((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            display: "block",
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 149,
          }}
        />
      )}

      <nav
        style={{
          width: 260,
          flexShrink: 0,
          background: "#111111",
          borderRight: "1px solid #2a2a2a",
          overflowY: "auto",
          padding: "1.5rem 0",
          scrollbarWidth: "thin",
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
          .course-sidebar::-webkit-scrollbar { width: 4px; }
          .course-sidebar::-webkit-scrollbar-thumb { background: #2a2a2a; }
          @media (max-width: 768px) {
            .course-sidebar { position: fixed !important; top: 0; left: 0; bottom: 0; z-index: 150; transform: translateX(-100%); padding-top: 4rem; width: 280px !important; }
          }
        `}</style>

        {/* My Progress link + week pill */}
        <div style={{ padding: "0 1.25rem 1rem" }}>
          <Link
            href="/training-foundations/tracker"
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
              color: "#c9a96e",
            }}
          >
            <span>My Progress</span>
            {ready && currentPosition.totalSessions > 0 && (
              <span style={{ fontSize: "0.55rem", fontWeight: 400, color: "#888", letterSpacing: "0.05em", textTransform: "none" }}>
                W{currentPosition.week} · R{currentPosition.round}
              </span>
            )}
          </Link>
        </div>
        <div style={{ height: 1, background: "#2a2a2a", margin: "0 1.25rem 0.75rem", opacity: 0.4 }} />

        {nav.map((section, i) => {
          const isCurrent = section.items.some((item) => isActive(pathname, item.href))
          const isOpen_ = openSections[i] ?? false

          return (
            <div key={i}>
              <div style={{ marginBottom: "0.25rem" }}>
                <div
                  onClick={() => toggleSection(i)}
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
                      color: isCurrent ? "#c9a96e" : "#888888",
                      fontFamily: "var(--font-montserrat), sans-serif",
                      transition: "color 0.2s",
                    }}
                  >
                    {section.label}
                  </span>
                  <span
                    style={{
                      fontSize: "0.55rem",
                      color: "#888888",
                      transition: "transform 0.2s",
                      transform: isOpen_ ? "rotate(90deg)" : "none",
                      display: "inline-block",
                    }}
                  >
                    ▶
                  </span>
                </div>

                {isOpen_ && (
                  <div>
                    {section.items.map((item) => {
                      const active = isActive(pathname, item.href)
                      const dayKey = dayForHref[item.href]
                      const dayDone = ready && dayKey
                        ? !!getSessionFor(currentPosition.round, currentPosition.week, dayKey)
                        : false
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.45rem 1.25rem 0.45rem 2rem",
                            fontSize: "0.7rem",
                            color: active ? "#c9a96e" : "#888888",
                            textDecoration: "none",
                            transition: "color 0.15s, background 0.15s",
                            lineHeight: 1.4,
                            borderLeft: active ? "2px solid #c9a96e" : "2px solid transparent",
                            background: active ? "rgba(201,169,110,0.06)" : "transparent",
                            fontFamily: "var(--font-montserrat), sans-serif",
                          }}
                        >
                          <span>{item.label}</span>
                          {dayDone && <span style={{ color: "#c9a96e", fontSize: "0.5rem", flexShrink: 0 }}>●</span>}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
              {i < nav.length - 1 && (
                <div style={{ height: 1, background: "#2a2a2a", margin: "0.75rem 1.25rem", opacity: 0.4 }} />
              )}
            </div>
          )
        })}
      </nav>
    </>
  )
}
