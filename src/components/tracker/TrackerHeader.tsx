"use client"
import Link from "next/link"

const gold = "#c9a96e"
const muted = "#555"

export type TrackerTab = "workout" | "progress" | "courses"

interface TrackerHeaderProps {
  activeTab: TrackerTab
  onTabChange: (tab: TrackerTab) => void
  onSettings: () => void
}

export function TrackerHeader({ activeTab, onTabChange, onSettings }: TrackerHeaderProps) {
  return (
    <div style={{ flexShrink: 0, background: "#0a0a0a", borderBottom: "1px solid #1a1a1a" }}>
      {/* Top row: wordmark + settings */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 48 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 18, fontWeight: 600, color: "#f0e6d3", letterSpacing: "0.04em" }}>
            Lisa <span style={{ color: gold }}>Fit Method</span>
          </span>
        </Link>
        <button
          onClick={onSettings}
          style={{ background: "none", border: "none", color: muted, cursor: "pointer", padding: "8px 0 8px 8px", display: "flex", alignItems: "center" }}
          aria-label="Settings"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="2.5" stroke={muted} strokeWidth="1.3" />
            <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.41 1.41M13.37 13.37l1.41 1.41M14.78 3.22l-1.41 1.41M4.63 13.37l-1.41 1.41" stroke={muted} strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Tab row */}
      <div style={{ display: "flex", padding: "0 4px" }}>
        {(["workout", "progress", "courses"] as TrackerTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? `2px solid ${gold}` : "2px solid transparent",
              color: activeTab === tab ? gold : muted,
              fontFamily: "var(--font-montserrat), sans-serif",
              fontSize: "0.58rem",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              padding: "10px 14px",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {tab === "workout" ? "Workout" : tab === "progress" ? "Progress" : "Courses"}
          </button>
        ))}
      </div>
    </div>
  )
}
