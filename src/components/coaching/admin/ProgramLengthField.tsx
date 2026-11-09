"use client"

import { DEFAULT_PHASE_WEEKS } from "@/lib/programExpansion"

const label = { fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#888", display: "block", marginBottom: 6 }
const help = { fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.7rem", color: "#888", margin: 0, lineHeight: 1.55 }
const chip = (on: boolean) => ({ fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.75rem", fontWeight: 600, padding: "8px 14px", minHeight: 36, borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? "#c9a96e" : "#2a2a2a"}`, background: on ? "#c9a96e" : "transparent", color: on ? "#111" : "#f0e6d3" })

export default function ProgramLengthField({ value, onChange, storedWeeks, intro, onIntro }: {
  value: string
  onChange: (v: string) => void
  storedWeeks: number
  intro: string
  onIntro: (v: string) => void
}) {
  const n = Number(value)
  const effective = value.trim() && Number.isInteger(n) && n > storedWeeks ? n : storedWeeks
  return (
    <div style={{ background: "#161616", border: "1px solid #2a2a2a", padding: "16px 24px", marginBottom: "1.5rem", display: "grid", gap: 14 }}>
      <div>
        <span style={label} id="program-length-label">Program length</span>
        <div role="group" aria-labelledby="program-length-label" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {[DEFAULT_PHASE_WEEKS, 8].map((w) => (
            <button key={w} type="button" style={chip(value === String(w))} aria-pressed={value === String(w)} onClick={() => onChange(String(w))}>{w} weeks</button>
          ))}
          <label style={{ ...help, display: "flex", alignItems: "center", gap: 6 }}>
            Other
            <input type="text" inputMode="numeric" aria-label="Program length in weeks" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))} placeholder={String(storedWeeks)}
              style={{ width: 64, background: "#111", border: "1px solid #2a2a2a", color: "#f0e6d3", padding: "8px 10px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", outline: "none" }} />
            weeks
          </label>
        </div>
      </div>
      <p style={help}>
        Clients see {effective} week{effective === 1 ? "" : "s"}. The {storedWeeks === 1 ? "week" : `${storedWeeks} weeks`} you write below repeat{storedWeeks === 1 ? "s" : ""} in order, so they keep building on the same exercises. Each week keeps its own completed workouts, and making the program longer later never resets them.
      </p>
      {effective < DEFAULT_PHASE_WEEKS && (
        <p role="note" style={{ ...help, color: "#e8c98a" }}>This program ends after {effective} week{effective === 1 ? "" : "s"}. Clients will see Program complete after that.</p>
      )}
      <div>
        <label htmlFor="program-intro" style={label}>Program introduction (optional)</label>
        <textarea id="program-intro" value={intro} onChange={(e) => onIntro(e.target.value)} rows={4} maxLength={1500}
          placeholder="Shown once, with the notes for Week 1, Day 1. A good place to explain how to progress through the phase."
          style={{ width: "100%", boxSizing: "border-box", background: "#111", border: "1px solid #2a2a2a", color: "#f0e6d3", padding: "10px 12px", fontFamily: "var(--font-montserrat), sans-serif", fontSize: "0.8rem", lineHeight: 1.5, outline: "none", resize: "vertical" }} />
      </div>
    </div>
  )
}
