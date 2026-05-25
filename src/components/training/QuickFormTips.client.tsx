"use client"

import { useState } from "react"

const gold = "#c9a96e"
const muted = "#888"

export default function QuickFormTips({ tips }: { tips: string[] }) {
  const [open, setOpen] = useState(false)
  if (!tips || tips.length === 0) return null

  return (
    <div style={{ margin: "-8px 0 20px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "5px 0",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.55rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: open ? gold : muted,
          transition: "color 0.2s",
        }}
      >
        <span
          style={{
            display: "inline-block",
            transition: "transform 0.2s",
            transform: open ? "rotate(90deg)" : "none",
            color: open ? gold : "#555",
            fontSize: "0.75rem",
            lineHeight: 1,
            fontFamily: "sans-serif",
          }}
        >
          ›
        </span>
        Quick Form Tips
      </button>

      <div
        style={{
          maxHeight: open ? `${tips.length * 30 + 20}px` : "0",
          overflow: "hidden",
          transition: "max-height 0.25s ease",
        }}
      >
        <div
          style={{
            padding: "8px 0 4px 14px",
            borderLeft: "2px solid rgba(201,169,110,0.25)",
            marginLeft: 2,
          }}
        >
          {tips.map((tip, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "3px 0" }}
            >
              <span style={{ color: gold, fontSize: "0.4rem", marginTop: "0.4em", flexShrink: 0 }}>●</span>
              <span
                style={{
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.72rem",
                  color: "#aaa",
                  lineHeight: 1.45,
                }}
              >
                {tip}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
