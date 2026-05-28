"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "aws-amplify/auth"
import { useRouter } from "next/navigation"

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
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/")
  }

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
              padding-top: 3.5rem;
            }
          }
          .sidebar-nav-scroll { overflow-y: auto; scrollbar-width: thin; }
          .sidebar-nav-scroll::-webkit-scrollbar { width: 4px; }
          .sidebar-nav-scroll::-webkit-scrollbar-thumb { background: #2a2a2a; }
          .nb-item:hover { color: #c9a96e !important; }
        `}</style>

        <div style={{ flexShrink: 0, padding: "1rem 1.25rem 0.75rem" }}>
          <Link
            href="/nutrition-foundations"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.6rem 0.75rem",
              background: "rgba(201,169,110,0.06)",
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
            Nutrition Foundations
          </Link>
        </div>
        <div style={{ height: 1, background: "#2a2a2a", margin: "0 1.25rem 0.5rem", opacity: 0.4, flexShrink: 0 }} />

        <div className="sidebar-nav-scroll" style={{ flex: 1, padding: "0.5rem 0 1.5rem" }}>
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
                  padding: "0.7rem 1.25rem",
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

        <div style={{ flexShrink: 0, padding: "0.75rem 1.25rem", borderTop: "1px solid #2a2a2a" }}>
          <button
            onClick={handleSignOut}
            style={{
              background: "none",
              border: "none",
              color: "#555",
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.6rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>
    </>
  )
}
