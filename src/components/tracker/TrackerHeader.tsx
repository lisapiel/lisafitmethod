"use client"

interface TrackerHeaderProps {
  title: string
  showBack: boolean
  onBack: () => void
  onSettings: () => void
  showSettings: boolean
}

export function TrackerHeader({ title, showBack, onBack, onSettings, showSettings }: TrackerHeaderProps) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      height: 56,
      borderBottom: "1px solid #1a1a1a",
      flexShrink: 0,
      background: "#0a0a0a",
    }}>
      {/* Left */}
      <div style={{ width: 44, display: "flex", alignItems: "center" }}>
        {showBack && (
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", color: "#c9a96e", cursor: "pointer", padding: "8px 4px 8px 0", display: "flex", alignItems: "center", gap: 4 }}
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Center */}
      <div style={{ flex: 1, textAlign: "center" }}>
        {title === "My Tracker" ? (
          <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 18, fontWeight: 600, color: "#f0e6d3", letterSpacing: "0.04em" }}>
            Lisa <span style={{ color: "#c9a96e" }}>Fit Method</span>
          </span>
        ) : (
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.25em", textTransform: "uppercase", color: "#888" }}>
            {title}
          </span>
        )}
      </div>

      {/* Right */}
      <div style={{ width: 44, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        {showSettings && (
          <button
            onClick={onSettings}
            style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "8px 0 8px 4px", display: "flex", alignItems: "center" }}
            aria-label="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="2.5" stroke="#555" strokeWidth="1.3" />
              <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.41 1.41M13.37 13.37l1.41 1.41M14.78 3.22l-1.41 1.41M4.63 13.37l-1.41 1.41" stroke="#555" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
