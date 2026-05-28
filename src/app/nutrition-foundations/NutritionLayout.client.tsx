"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { signOut } from "aws-amplify/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import NutritionSidebar from "@/components/nutrition/NutritionSidebar"
import CourseSwitcher from "@/components/CourseSwitcher.client"

function NutritionHeader({ onMenuToggle }: { onMenuToggle: () => void }) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push("/")
  }

  return (
    <header
      className="nutrition-header-bar"
      style={{
        borderBottom: "1px solid #2a2a2a",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(10,10,10,0.98)",
        backdropFilter: "blur(10px)",
        zIndex: 200,
        flexShrink: 0,
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .nutrition-mobile-btn { display: block !important; }
          .nutrition-switcher-wrap { display: none !important; }
        }
        @media (max-width: 768px) {
          .nutrition-header-bar {
            position: fixed !important;
            top: 0; left: 0; right: 0; z-index: 200;
          }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={onMenuToggle}
          className="nutrition-mobile-btn"
          style={{
            display: "none",
            background: "none",
            border: "1px solid #2a2a2a",
            color: "#f0e6d3",
            padding: "0.5rem 0.75rem",
            fontSize: "0.65rem",
            fontWeight: 500,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "var(--font-montserrat), sans-serif",
          }}
        >
          ☰ Menu
        </button>
        <Link href="/nutrition-foundations" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1.15rem", fontWeight: 600, color: "#f0e6d3", letterSpacing: "0.04em" }}>
            Lisa <span style={{ color: "#c9a96e" }}>Fit Method</span>
          </span>
        </Link>
        <span style={{ width: 1, height: 16, background: "#2a2a2a", flexShrink: 0 }} className="nutrition-switcher-wrap" />
        <div className="nutrition-switcher-wrap">
          <CourseSwitcher currentCourse="nutrition" />
        </div>
      </div>

      <button
        onClick={handleSignOut}
        style={{
          background: "none",
          border: "none",
          color: "#555",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.6rem",
          fontWeight: 500,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        Sign Out
      </button>
    </header>
  )
}

export default function NutritionClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const el = document.querySelector(".nutrition-scroll-area")
    if (el) el.scrollTop = 0
  }, [pathname])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        overflow: "hidden",
        background: "#0a0a0a",
        color: "#f0e6d3",
        fontFamily: "var(--font-montserrat), sans-serif",
        fontWeight: 300,
        lineHeight: 1.35,
      }}
    >
      <NutritionHeader onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <NutritionSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div
          style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin" }}
          className="nutrition-scroll-area"
        >
          <style>{`
            .nutrition-scroll-area::-webkit-scrollbar { width: 4px; }
            .nutrition-scroll-area::-webkit-scrollbar-thumb { background: #2a2a2a; }
            .nutrition-scroll-area [id] { scroll-margin-top: 1rem; }
            @media (max-width: 768px) {
              .nutrition-scroll-area { padding-top: 3.5rem; }
              .nutrition-scroll-area [id] { scroll-margin-top: 4.5rem; }
            }
          `}</style>
          {children}
        </div>
      </div>
    </div>
  )
}
