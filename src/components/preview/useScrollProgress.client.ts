"use client"

import { useEffect, useRef, useState } from "react"

// Returns how far an element has travelled through the viewport, 0 → 1.
//
//   0 = the element's top edge is at the bottom of the viewport (entering)
//   1 = the element's bottom edge is at the top of the viewport (left)
//
// Reads layout inside a requestAnimationFrame tick driven by passive scroll
// and resize listeners, so a page with several of these still only measures
// once per frame per element and never blocks the scroll thread.
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let frame = 0

    const measure = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const span = rect.height + vh
      if (span <= 0) return
      const travelled = vh - rect.top
      const next = travelled / span
      setProgress(next < 0 ? 0 : next > 1 ? 1 : next)
    }

    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [])

  return { ref, progress }
}

// Progress of the window's own scroll position from the very top, 0 → 1 over
// `distance` pixels. Used for the hero, which has no useful "exit" edge to
// measure against while it still fills the screen.
export function useTopScroll(distance = 800): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    const measure = () => {
      frame = 0
      const y = window.scrollY || 0
      const next = y / distance
      setProgress(next < 0 ? 0 : next > 1 ? 1 : next)
    }

    const schedule = () => {
      if (frame) return
      frame = window.requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [distance])

  return progress
}
