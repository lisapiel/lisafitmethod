"use client"

import { useEffect, useRef, useState, type RefObject } from "react"

// True once we can say the video is not going to start on its own.
//
// Two stages, because "blocked" and "still downloading" look identical from
// the outside and we do not want to pull a second copy of the footage down
// over a slow connection that was about to play anyway:
//
//   3s — stalled only if the element already holds enough data to play
//        (readyState >= HAVE_FUTURE_DATA) and is nevertheless paused. That is
//        a refusal, not a network problem.
//   8s — stalled regardless. Whatever the reason, the visitor has been
//        looking at a frozen frame long enough.
//
// A video that has played even once is never stalled again. Browsers pause
// muted autoplaying video that scrolls out of view, and that pause is not a
// refusal — without this latch the hero fetched its animation on the way down
// the page, on a device that was playing the MP4 perfectly well.
const READY_CHECK_MS = 3000
const GIVE_UP_MS = 8000

export function useAutoplayStalled(
  videoRef: RefObject<HTMLVideoElement | null>,
  armed: boolean,
  playing: boolean,
): boolean {
  const [stalled, setStalled] = useState(false)
  const everPlayed = useRef(false)

  useEffect(() => {
    if (!armed) return
    if (playing) {
      everPlayed.current = true
      setStalled(false)
      return
    }
    if (everPlayed.current) return

    const check = (final: boolean) => {
      const el = videoRef.current
      if (!el || !el.paused) return
      if (final || el.readyState >= 3 /* HAVE_FUTURE_DATA */) setStalled(true)
    }

    const ready = window.setTimeout(() => check(false), READY_CHECK_MS)
    const giveUp = window.setTimeout(() => check(true), GIVE_UP_MS)
    return () => {
      window.clearTimeout(ready)
      window.clearTimeout(giveUp)
    }
  }, [videoRef, armed, playing])

  return stalled
}
