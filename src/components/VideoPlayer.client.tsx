"use client"
import { useRef, useEffect } from "react"

export default function VideoPlayer({
  src,
  style,
}: {
  src: string
  style?: React.CSSProperties
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // iOS Safari requires muted to be set directly on the DOM node (not just the attribute)
    video.muted = true
    // defaultMuted ensures muted state survives re-renders
    video.defaultMuted = true

    const attemptPlay = () => {
      video.play().catch(() => {})
    }

    // Try immediately, and again whenever the browser has enough data
    attemptPlay()
    video.addEventListener("loadeddata", attemptPlay)
    video.addEventListener("canplay", attemptPlay)

    // Re-play when tab becomes visible again (iOS suspends video in background)
    const onVisible = () => { if (document.visibilityState === "visible") attemptPlay() }
    document.addEventListener("visibilitychange", onVisible)

    // Intersection Observer: re-trigger play when the video scrolls into view
    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) attemptPlay()
          })
        },
        { threshold: 0.1 }
      )
      observer.observe(video)
    }

    return () => {
      video.removeEventListener("loadeddata", attemptPlay)
      video.removeEventListener("canplay", attemptPlay)
      document.removeEventListener("visibilitychange", onVisible)
      observer?.disconnect()
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      style={{ ...style, pointerEvents: "none", cursor: "default" }}
    />
  )
}
