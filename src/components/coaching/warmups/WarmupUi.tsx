"use client"

import type { ReactNode } from "react"

export const wu = {
  gold: "#c9a96e",
  cream: "#f0e6d3",
  muted: "#a39e96",
  line: "#2a2a2a",
  card: "#161616",
  warn: "#d97460",
  ok: "#5c9e6a",
  font: "var(--font-montserrat), sans-serif",
}

// One stylesheet for the warm-up controls so buttons get real hover and
// keyboard focus states, which inline styles cannot express.
export function WarmupStyles() {
  return (
    <style>{`
      .wu-btn { min-height: 44px; padding: 0 16px; font-family: ${wu.font}; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; border-radius: 4px; transition: background-color 160ms ease-out, color 160ms ease-out, border-color 160ms ease-out; }
      .wu-btn-primary { background: ${wu.gold}; color: #0a0a0a; border: 1px solid ${wu.gold}; }
      .wu-btn-primary:hover { background: #e8c98a; border-color: #e8c98a; }
      .wu-btn-quiet { background: transparent; color: ${wu.cream}; border: 1px solid #3a3a3a; }
      .wu-btn-quiet:hover { border-color: ${wu.gold}; color: ${wu.gold}; }
      .wu-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .wu-btn:focus-visible, .wu-toggle input:focus-visible + .wu-switch { outline: 2px solid ${wu.gold}; outline-offset: 2px; }
      .wu-toggle { display: flex; align-items: flex-start; gap: 12px; min-height: 44px; padding: 10px 0; cursor: pointer; }
      .wu-toggle input { position: absolute; opacity: 0; width: 1px; height: 1px; }
      .wu-switch { flex: none; width: 38px; height: 22px; border-radius: 999px; background: #333; position: relative; margin-top: 1px; transition: background-color 160ms ease-out; }
      .wu-switch::after { content: ""; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: ${wu.cream}; transition: transform 160ms ease-out; }
      .wu-toggle input:checked + .wu-switch { background: ${wu.gold}; }
      .wu-toggle input:checked + .wu-switch::after { transform: translateX(16px); background: #0a0a0a; }
      @media (prefers-reduced-motion: reduce) { .wu-btn, .wu-switch, .wu-switch::after { transition: none; } }
    `}</style>
  )
}

export function Flags({ flags }: { flags: string[] }) {
  if (flags.length === 0) return null
  return (
    <ul style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "grid", gap: 4 }}>
      {flags.map((f) => (
        <li key={f} style={{ display: "flex", gap: 8, fontFamily: wu.font, fontSize: "0.8125rem", lineHeight: 1.5, color: wu.warn }}>
          <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" style={{ flex: "none", marginTop: 3 }}>
            <path d="M8 1.5 15 14H1L8 1.5Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <path d="M8 6v3.5M8 11.6v.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span>{f}</span>
        </li>
      ))}
    </ul>
  )
}

export function Bar({ children, tone = "neutral", role }: { children: ReactNode; tone?: "neutral" | "attention"; role?: "status" }) {
  return (
    <div role={role} style={{
      display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 16px",
      background: tone === "attention" ? "rgba(201,169,110,0.08)" : "#111",
      border: `1px solid ${tone === "attention" ? "rgba(201,169,110,0.45)" : wu.line}`,
      borderRadius: 8, padding: "12px 16px", marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

export function BarText({ children }: { children: ReactNode }) {
  return <p style={{ flex: "1 1 280px", margin: 0, fontFamily: wu.font, fontSize: "0.875rem", lineHeight: 1.55, color: wu.cream }}>{children}</p>
}
