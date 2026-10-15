"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

// Floating review control, fixed to the bottom of both direction pages.
//
// Only exists on /preview routes. It is the one piece of chrome that is not
// part of either design — it's the harness Lisa reviews through, so it stays
// visually neutral and collapses out of the way on scroll-down.
type Direction = "a" | "b" | "c"

const LABELS: Record<Direction, string> = {
  a: "A \u00b7 Atelier",
  b: "B \u00b7 Nocturne",
  c: "C \u00b7 Combined",
}

export default function PreviewBar({
  current,
  tone = "dark",
}: {
  current: Direction
  tone?: "dark" | "light"
}) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    let frame = 0

    const measure = () => {
      frame = 0
      const y = window.scrollY
      // Hide while scrolling down through the page, reappear on any scroll
      // up — the same behaviour as a reading app's chrome.
      if (y > lastY + 6 && y > 300) setHidden(true)
      else if (y < lastY - 6) setHidden(false)
      lastY = y
    }

    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }

    window.addEventListener("scroll", schedule, { passive: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
    }
  }, [])

  const isDark = tone === "dark"
  const others = (["a", "b", "c"] as Direction[]).filter((d) => d !== current)

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9000,
        display: "flex",
        justifyContent: "center",
        padding: "0 12px 16px",
        pointerEvents: "none",
        transform: hidden ? "translateY(140%)" : "translateY(0)",
        transition: "transform 520ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: 4,
          borderRadius: 999,
          background: isDark ? "rgba(10,10,10,0.82)" : "rgba(18,17,16,0.88)",
          border: "1px solid rgba(200,169,126,0.26)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
          maxWidth: "100%",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(200,169,126,0.75)",
            padding: "0 10px 0 14px",
            whiteSpace: "nowrap",
          }}
        >
          Prototype
        </span>
        {others.map((d) => (
          <Link
            key={d}
            href={`/preview/${d}`}
            style={{
              fontFamily: "var(--font-dm-sans), sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#0a0a0a",
              background: "#c9a96e",
              textDecoration: "none",
              padding: "9px 14px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {LABELS[d]}
          </Link>
        ))}
        <Link
          href="/preview"
          style={{
            fontFamily: "var(--font-dm-sans), sans-serif",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(240,230,211,0.72)",
            textDecoration: "none",
            padding: "9px 16px 9px 12px",
            whiteSpace: "nowrap",
          }}
        >
          Console
        </Link>
      </div>
    </div>
  )
}
