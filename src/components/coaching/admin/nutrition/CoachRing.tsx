"use client"

import ProgressRing from "@/components/portal/ProgressRing"

type Tone = "calories" | "protein" | "carbs" | "fat"

export function CoachRing({ value, target, tone, size, title, caption, center, sub, label }: {
  value: number | null
  target: number
  tone: Tone
  size: number
  title: string
  caption: string
  center?: string
  sub?: string
  label: string
}) {
  return (
    <div className="can-ring">
      <ProgressRing
        value={value}
        target={target}
        tone={tone}
        size={size}
        stroke={size >= 120 ? 11 : 7}
        state={value == null ? "unknown" : "logged"}
        center={center}
        sub={sub}
        label={label}
        trackColor="var(--can-track)"
        textColor="var(--ca-text)"
        mutedColor="var(--ca-muted)"
        overColor="var(--can-over)"
      />
      <b>{title}</b>
      <span>{caption}</span>
    </div>
  )
}
