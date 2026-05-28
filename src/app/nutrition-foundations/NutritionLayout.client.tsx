"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import NutritionSidebar from "@/components/nutrition/NutritionSidebar"
import AccountDropdown from "@/components/AccountDropdown.client"

function NutritionHeader({ onMenuToggle }: { onMenuToggle: () => void }) {
  return (
    <header
      className="nutrition-header-bar"
      style={{
        borderBottom: "1px solid #2a2a2a",
        padding: "0 1.5rem",
        height: 52,
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
          .nutrition-mobile-btn { display: flex !important; }
          .nutrition-header-bar {
            position: fixed !important;
            top: 0; left: 0; right: 0; z-index: 200;
          }
        }
      `}</style>

      {/* Left: hamburger (mobile) + wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
        <button
          onClick={onMenuToggle}
          className="nutrition-mobile-btn"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "1px solid #2a2a2a",
            color: "#f0e6d3",
            width: 36,
            height: 36,
            cursor: "pointer",
            flexShrink: 0,
          }}
          aria-label="Open menu"
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <rect y="0" width="14" height="1.5" fill="currentColor"/>
            <rect y="4.25" width="14" height="1.5" fill="currentColor"/>
            <rect y="8.5" width="14" height="1.5" fill="currentColor"/>
          </svg>
        </button>

        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "1rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "#f0e6d3",
          }}>
            Lisa <span style={{ color: "#c9a96e" }}>Fit Method</span>
          </span>
        </Link>
      </div>

      {/* Right: account icon */}
      <AccountDropdown />
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
