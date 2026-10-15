"use client"

import { useEffect, useState } from "react"

// Layout branch for components that must not render both a desktop and a
// mobile variant at once — anything containing media, because a CSS-hidden
// <video> still downloads.
//
// Starts false and corrects after mount. Server output therefore matches the
// desktop branch; the first client paint fixes narrow viewports before any
// media in the mobile branch is mounted, since mounting is gated on an
// interaction or an IntersectionObserver hit in every caller.
export function useIsNarrow(query = "(max-width: 900px)"): boolean {
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(query)
    setNarrow(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [query])

  return narrow
}
