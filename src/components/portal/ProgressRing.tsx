"use client"

import { useId } from "react"

// One ring for calories or a macro. Above 100% the ring stays full and a thin
// outer arc shows how far over, in a calm amber. "unknown" draws a dotted
// track so a missing value never looks like zero.
export type RingState = "logged" | "estimate" | "unknown"

const TONES = {
  calories: { solid: "#a8895e", light: "#ecdcc0", dark: "#b8955f" },
  protein: { solid: "#557a5a", light: "#d3e0d3", dark: "#557a5a" },
  carbs: { solid: "#b8904f", light: "#efdfc4", dark: "#a5803f" },
  fat: { solid: "#a46a52", light: "#ecd5cb", dark: "#94604a" },
  training: { solid: "#557a5a", light: "#d3e0d3", dark: "#557a5a" },
} as const

export default function ProgressRing({
  value, target, size = 80, stroke = 8, tone = "calories", state = "logged", center, sub, label,
  trackColor, textColor, mutedColor, overColor,
}: {
  value: number | null
  target: number
  size?: number
  stroke?: number
  tone?: keyof typeof TONES
  state?: RingState
  center?: string
  sub?: string
  label: string
  // Optional overrides (CSS colours or var()) for surfaces with their own palette.
  trackColor?: string
  textColor?: string
  mutedColor?: string
  overColor?: string
}) {
  const id = useId().replace(/:/g, "")
  const c = size / 2
  const r = c - stroke / 2 - Math.max(5, stroke * 0.5)
  const r2 = r + stroke / 2 + Math.max(3, stroke * 0.3)
  const C = 2 * Math.PI * r
  const C2 = 2 * Math.PI * r2
  const t = TONES[tone]
  const unknown = state === "unknown" || value == null || target <= 0
  const p = unknown ? 0 : Math.max(0, value / target)
  const main = Math.min(p, 1) * C
  const over = Math.max(p - 1, 0) * C2
  const big = size >= 120
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      {state === "estimate" && (
        <defs>
          <pattern id={`est-${id}`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" fill={t.light} />
            <rect width="2.5" height="5" fill={t.dark} />
          </pattern>
        </defs>
      )}
      {unknown ? (
        <circle cx={c} cy={c} r={r} fill="none" stroke="#c9c1b6" strokeWidth={Math.max(2, stroke / 3)} strokeDasharray="1.5 4" strokeLinecap="round" style={mutedColor ? { stroke: mutedColor } : undefined} />
      ) : (
        <>
          <circle cx={c} cy={c} r={r} fill="none" stroke="#efe9e1" strokeWidth={stroke} style={trackColor ? { stroke: trackColor } : undefined} />
          <circle
            cx={c} cy={c} r={r} fill="none"
            stroke={state === "estimate" ? `url(#est-${id})` : t.solid}
            strokeWidth={stroke}
            strokeLinecap={p > 0 && p < 1 ? "round" : "butt"}
            strokeDasharray={`${main} ${C}`}
            transform={`rotate(-90 ${c} ${c})`}
          />
          {over > 0 && (
            <circle cx={c} cy={c} r={r2} fill="none" stroke="#7a4f14" strokeWidth={Math.max(2.5, stroke / 3)} strokeLinecap="round" strokeDasharray={`${over} ${C2}`} transform={`rotate(-90 ${c} ${c})`} style={overColor ? { stroke: overColor } : undefined} />
          )}
        </>
      )}
      {center && (
        <text x={c} y={sub ? c + (big ? 2 : 1) : c + (big ? 10 : 5)} textAnchor="middle" fontSize={big ? size * 0.16 : size * 0.19} fontWeight="700" fill={unknown ? "#6b6560" : "#1a1a1a"} fontFamily="DM Sans, sans-serif" style={(unknown ? mutedColor : textColor) ? { fill: unknown ? mutedColor : textColor } : undefined}>{center}</text>
      )}
      {sub && (
        <text x={c} y={c + (big ? size * 0.12 : size * 0.16)} textAnchor="middle" fontSize={big ? 13 : 10} fill="#6b6560" fontFamily="DM Sans, sans-serif" style={mutedColor ? { fill: mutedColor } : undefined}>{sub}</text>
      )}
    </svg>
  )
}
