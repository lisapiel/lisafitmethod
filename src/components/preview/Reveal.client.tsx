"use client"

import { useEffect, useRef, useState } from "react"

// Scroll-triggered reveal primitive for the redesign prototype.
//
// Deliberately built on IntersectionObserver + CSS transitions rather than an
// animation library: the prototype must not add a dependency to package.json,
// because that would change the production dependency surface of a repo whose
// live site is mid-review.
//
// Motion is one-shot. Elements that animate every time they re-enter the
// viewport read as a gimmick on a long editorial page; a single reveal reads
// as print coming into focus.

export type RevealVariant = "up" | "fade" | "mask" | "scale" | "left"

const TRANSFORMS: Record<RevealVariant, string> = {
  up: "translate3d(0, 28px, 0)",
  fade: "none",
  mask: "translate3d(0, 105%, 0)",
  scale: "scale(1.06)",
  left: "translate3d(-24px, 0, 0)",
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return reduced
}

export function useInView<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // No IntersectionObserver (very old browser, or a prerender pass that
    // somehow reaches this) — show the content rather than hiding it forever.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

export function Reveal({
  children,
  variant = "up",
  delay = 0,
  duration = 1000,
  threshold = 0.18,
  as: Tag = "div",
  className,
  style,
}: {
  children: React.ReactNode
  variant?: RevealVariant
  delay?: number
  duration?: number
  threshold?: number
  as?: "div" | "span" | "section" | "li" | "p" | "figure"
  className?: string
  style?: React.CSSProperties
}) {
  const reduced = usePrefersReducedMotion()
  const { ref, inView } = useInView<HTMLElement>(threshold)
  const show = inView || reduced

  return (
    <Tag
      // @ts-expect-error polymorphic ref — HTMLElement is safe for all Tag variants
      ref={ref}
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "none" : TRANSFORMS[variant],
        transition: reduced
          ? "none"
          : `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: show ? "auto" : "opacity, transform",
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}

// A headline that wipes in line by line from behind its own baseline. Each
// line needs its own clipping box, so the caller passes the lines as an array
// rather than a single string with <br />.
export function RevealLines({
  lines,
  delay = 0,
  stagger = 90,
  className,
  style,
  lineStyle,
}: {
  lines: React.ReactNode[]
  delay?: number
  stagger?: number
  className?: string
  style?: React.CSSProperties
  lineStyle?: React.CSSProperties
}) {
  const reduced = usePrefersReducedMotion()
  const { ref, inView } = useInView<HTMLSpanElement>(0.25)
  const show = inView || reduced

  return (
    <span ref={ref} className={className} style={{ display: "block", ...style }}>
      {lines.map((line, i) => (
        <span key={i} style={{ display: "block", overflow: "hidden", ...lineStyle }}>
          <span
            style={{
              display: "block",
              transform: show ? "none" : "translate3d(0, 105%, 0)",
              opacity: show ? 1 : 0,
              transition: reduced
                ? "none"
                : `transform 1100ms cubic-bezier(0.16, 1, 0.3, 1) ${delay + i * stagger}ms, opacity 900ms ease ${delay + i * stagger}ms`,
            }}
          >
            {line}
          </span>
        </span>
      ))}
    </span>
  )
}

// A hairline rule that draws itself across when it enters view. The single
// most useful editorial motion device on the page — it paces the eye down a
// long article without moving any content.
export function DrawRule({
  color = "rgba(18, 17, 16, 0.14)",
  delay = 0,
  duration = 1400,
  origin = "left",
  style,
}: {
  color?: string
  delay?: number
  duration?: number
  origin?: "left" | "center"
  style?: React.CSSProperties
}) {
  const reduced = usePrefersReducedMotion()
  const { ref, inView } = useInView<HTMLDivElement>(0.5)
  const show = inView || reduced

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        height: 1,
        width: "100%",
        background: color,
        transformOrigin: origin,
        transform: show ? "scaleX(1)" : "scaleX(0)",
        transition: reduced ? "none" : `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        ...style,
      }}
    />
  )
}
