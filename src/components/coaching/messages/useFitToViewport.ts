"use client"

import { useLayoutEffect, useRef, useState } from "react"

// The coach's thread sits under the client header, whose height varies by
// client and screen. Sizing the panel to what's left of the screen keeps the
// composer visible without scrolling the page.
const MIN = 260
const MAX = 760
const GAP = 12

export function useFitToViewport(ready: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const top = el.getBoundingClientRect().top + window.scrollY
      const nav = document.querySelector<HTMLElement>(".ca-bottomnav")
      const navH = nav && getComputedStyle(nav).display !== "none" ? nav.getBoundingClientRect().height : 0
      setHeight(Math.min(MAX, Math.max(MIN, Math.floor(window.innerHeight - top - navH - GAP))))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    window.addEventListener("resize", measure)
    return () => { ro.disconnect(); window.removeEventListener("resize", measure) }
  }, [ready])

  return { ref, height }
}
