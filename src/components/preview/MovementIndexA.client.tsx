"use client"

import { useState } from "react"
import MovementVideo from "./MovementVideo.client"
import { useIsNarrow } from "./useIsNarrow.client"
import { Reveal } from "./Reveal.client"
import type { MovementSlot } from "./previewContent"

// DIRECTION A — "The Index"
//
// The course showcase as a magazine index: a numbered list of the movement
// patterns, set in display serif, with a single sticky plate to the right
// that plays the real course footage for whichever line the reader is on.
//
// The interaction is the argument. Nothing says "50+ exercise videos" as
// convincingly as the videos themselves answering to the cursor.
export default function MovementIndexA({
  movements,
  urls,
}: {
  movements: MovementSlot[]
  urls: Record<string, string>
}) {
  const available = movements.filter((m) => urls[m.slot])
  const [active, setActive] = useState(0)
  const [openMobile, setOpenMobile] = useState<number | null>(0)
  const narrow = useIsNarrow()

  if (available.length === 0) return null

  if (narrow) {
    return (
      <div style={{ borderTop: "1px solid rgba(18,17,16,0.12)" }}>
        {available.map((m, i) => {
          const open = openMobile === i
          return (
            <div key={m.slot} style={{ borderBottom: "1px solid rgba(18,17,16,0.12)" }}>
              <button
                type="button"
                onClick={() => setOpenMobile(open ? null : i)}
                aria-expanded={open}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "baseline",
                  gap: 14,
                  padding: "20px 0",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                <span style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", color: "#a8895e", flexShrink: 0 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontFamily: "var(--font-playfair), serif", fontSize: "clamp(1.35rem, 6vw, 1.75rem)", fontWeight: 500, color: "#121110", lineHeight: 1.15 }}>
                    {m.name}
                  </span>
                  <span style={{ display: "block", marginTop: 6, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(18,17,16,0.4)" }}>
                    {m.pattern}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: "var(--font-dm-sans), sans-serif",
                    fontSize: 18,
                    color: "#a8895e",
                    transform: open ? "rotate(45deg)" : "none",
                    transition: "transform 420ms cubic-bezier(0.16, 1, 0.3, 1)",
                    lineHeight: 1,
                  }}
                >
                  +
                </span>
              </button>
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: open ? "1fr" : "0fr",
                  transition: "grid-template-rows 620ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div style={{ overflow: "hidden" }}>
                  <div style={{ position: "relative", aspectRatio: "4 / 5", background: "#121110", marginBottom: 18 }}>
                    <MovementVideo src={urls[m.slot]} mounted={open} active={open} label={m.name} />
                    <span style={{ position: "absolute", left: 14, bottom: 12, fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(240,230,211,0.78)", mixBlendMode: "difference" }}>
                      {m.module} · Course footage
                    </span>
                  </div>
                  <p style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontSize: 14, lineHeight: 1.7, color: "rgba(18,17,16,0.62)", paddingBottom: 24 }}>
                    {m.note}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="pv-a-index">
      <style>{`
        .pv-a-index { display: grid; grid-template-columns: 1fr 0.78fr; gap: clamp(40px, 6vw, 96px); align-items: start; }
        .pv-a-index-row { display: grid; grid-template-columns: 44px 1fr; gap: 18px; padding: clamp(18px, 1.9vw, 26px) 0; border-bottom: 1px solid rgba(18,17,16,0.12); cursor: default; }
        .pv-a-index-row:first-child { border-top: 1px solid rgba(18,17,16,0.12); }
        .pv-a-index-name { font-family: var(--font-playfair), serif; font-size: clamp(1.5rem, 2.5vw, 2.4rem); font-weight: 500; line-height: 1.05; color: rgba(18,17,16,0.34); transition: color 560ms cubic-bezier(0.16,1,0.3,1), transform 560ms cubic-bezier(0.16,1,0.3,1); transform-origin: left center; }
        .pv-a-index-row[data-on="true"] .pv-a-index-name { color: #121110; transform: translateX(10px); }
        .pv-a-index-note { font-family: var(--font-dm-sans), sans-serif; font-size: 0.875rem; line-height: 1.7; color: rgba(18,17,16,0.55); max-width: 46ch; overflow: hidden; }
        .pv-a-index-plate { position: sticky; top: 96px; }
      `}</style>

      <div>
        {available.map((m, i) => (
          <div
            key={m.slot}
            className="pv-a-index-row"
            data-on={active === i}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            tabIndex={0}
            role="button"
            aria-pressed={active === i}
            aria-label={`Preview ${m.name}`}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.18em",
                color: active === i ? "#a8895e" : "rgba(18,17,16,0.28)",
                paddingTop: 10,
                transition: "color 500ms ease",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <span className="pv-a-index-name" style={{ display: "block" }}>
                {m.name}
              </span>
              <div
                style={{
                  display: "grid",
                  gridTemplateRows: active === i ? "1fr" : "0fr",
                  transition: "grid-template-rows 620ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <p className="pv-a-index-note">
                  <span style={{ display: "block", paddingTop: 12 }}>
                    <span style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#a8895e", marginRight: 12 }}>
                      {m.pattern}
                    </span>
                    {m.note}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Reveal variant="fade" duration={1200}>
        <div className="pv-a-index-plate">
          <div style={{ position: "relative", aspectRatio: "3 / 4", background: "#121110", overflow: "hidden" }}>
            {available.map((m, i) => (
              <div
                key={m.slot}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: active === i ? 1 : 0,
                  transition: "opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                {/* Mount the neighbours too, so moving down the list never
                    shows an empty plate while a clip negotiates its first
                    bytes. Anything further away stays unmounted. */}
                <MovementVideo
                  src={urls[m.slot]}
                  mounted={Math.abs(active - i) <= 1}
                  active={active === i}
                  label={m.name}
                />
              </div>
            ))}
            <span
              style={{
                position: "absolute",
                left: 18,
                bottom: 16,
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(240,230,211,0.8)",
              }}
            >
              {available[active].module} · Actual course footage
            </span>
          </div>
          <p
            style={{
              marginTop: 14,
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 11,
              letterSpacing: "0.04em",
              color: "rgba(18,17,16,0.38)",
              lineHeight: 1.6,
            }}
          >
            Every movement in the program is filmed from the angles that matter. Hover the index to watch.
          </p>
        </div>
      </Reveal>
    </div>
  )
}
