"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import MemberNav from "@/components/MemberNav.client"

const NAV = [
  { label: "Introduction", href: "/nutrition-foundations" },
  { label: "Module 1: Understanding Your Body", href: "/nutrition-foundations/module1" },
  { label: "Module 2: Your Nutrition Blueprint", href: "/nutrition-foundations/module2" },
  { label: "Module 3: Your 4-Week Meal Plan", href: "/nutrition-foundations/module3" },
  { label: "Module 4: Making It Stick", href: "/nutrition-foundations/module4" },
  { label: "References & Resources", href: "/nutrition-foundations/resources" },
]

const gold = "#c9a96e"
const dim = "#888888"

export default function NutritionSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()

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
        className="nutrition-sidebar"
      >
        <style>{`
          @media (max-width: 768px) {
            .nutrition-sidebar {
              position: fixed !important;
              top: 0; left: 0; bottom: 0;
              z-index: 150;
              transform: translateX(-100%);
              width: 280px !important;
            }
          }
          .sidebar-nav-scroll { overflow-y: auto; scrollbar-width: thin; }
          .sidebar-nav-scroll::-webkit-scrollbar { width: 4px; }
          .sidebar-nav-scroll::-webkit-scrollbar-thumb { background: #2a2a2a; }
          .nb-item:hover { color: #c9a96e !important; }
        `}</style>

        {/* Member nav — account, courses, add-ons, sign out */}
        <MemberNav currentCourse="nutrition" onClose={onClose} />

        {/* Course label */}
        <div style={{ flexShrink: 0, padding: "0.75rem 1.25rem 0.5rem" }}>
          <p style={{
            fontSize: "0.48rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#2e2e2e",
            fontFamily: "var(--font-montserrat), sans-serif",
          }}>
            Nutrition Foundations
          </p>
        </div>

        {/* Module nav */}
        <div className="sidebar-nav-scroll" style={{ flex: 1, padding: "0 0 1.5rem" }}>
          {NAV.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="nb-item"
                style={{
                  display: "block",
                  padding: "0.65rem 1.25rem",
                  fontSize: "0.7rem",
                  color: isActive ? gold : dim,
                  textDecoration: "none",
                  lineHeight: 1.4,
                  fontFamily: "var(--font-montserrat), sans-serif",
                  transition: "color 0.15s",
                  borderLeft: isActive ? `2px solid ${gold}` : "2px solid transparent",
                  background: isActive ? "rgba(201,169,110,0.08)" : "transparent",
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
