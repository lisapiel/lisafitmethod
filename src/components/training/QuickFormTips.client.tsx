"use client"

import { useState } from "react"

const gold = "#c9a96e"

export default function QuickFormTips({ tips }: { tips: string[] }) {
  const [open, setOpen] = useState(false)
  if (!tips || tips.length === 0) return null

  return (
    <div style={{ margin: "0 0 10px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          background: open ? "rgba(201,169,110,0.1)" : "rgba(201,169,110,0.05)",
          border: `1px solid ${open ? "rgba(201,169,110,0.35)" : "rgba(201,169,110,0.2)"}`,
          cursor: "pointer",
          padding: "0.55rem 0.875rem",
          fontFamily: "var(--font-montserrat), sans-serif",
          fontSize: "0.65rem",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: gold,
          transition: "background 0.2s, border-color 0.2s",
          textAlign: "left",
        }}
      >
        <span
          style={{
            display: "inline-block",
            transition: "transform 0.2s",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            fontSize: "1rem",
            lineHeight: 1,
            color: gold,
            flexShrink: 0,
          }}
        >
          ›
        </span>
        Quick Form Tips
      </button>

      <div
        style={{
          maxHeight: open ? `${tips.length * 38 + 28}px` : "0",
          overflow: "hidden",
          transition: "max-height 0.25s ease",
        }}
      >
        <div
          style={{
            padding: "10px 14px 12px 16px",
            background: "rgba(201,169,110,0.04)",
            borderLeft: "2px solid rgba(201,169,110,0.3)",
            borderRight: "1px solid rgba(201,169,110,0.12)",
            borderBottom: "1px solid rgba(201,169,110,0.12)",
          }}
        >
          {tips.map((tip, i) => (
            <div
              key={i}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "4px 0" }}
            >
              <span style={{ color: gold, fontSize: "0.35rem", marginTop: "0.45em", flexShrink: 0 }}>●</span>
              <span
                style={{
                  fontFamily: "var(--font-montserrat), sans-serif",
                  fontSize: "0.75rem",
                  color: "#bcbcbc",
                  lineHeight: 1.5,
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
